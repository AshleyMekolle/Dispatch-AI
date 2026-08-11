"""``ActionExecutor`` implementations that send real email through Gmail.

These two classes are the only things in this package ``WorkflowService``
ever reaches, indirectly, through ``app.integrations.registry`` — everything
else here composes connection resolution, the API client, and template
rendering behind the generic ``ActionExecutor`` protocol.
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.action_executor import ActionExecutionResult
from app.integrations.gmail.client import GmailClient
from app.integrations.gmail.connection_service import GmailConnectionService
from app.integrations.gmail.errors import GmailError, GmailRateLimitError
from app.integrations.gmail.templating import MissingTemplateVariablesError, render_template
from app.services.action_registry import RecipientIn, SendBulkEmailParams, SendEmailParams


class GmailSendEmailExecutor:
    def __init__(self, session: AsyncSession) -> None:
        self._connections = GmailConnectionService(session)
        self._client = GmailClient()

    async def execute(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        params: dict,
        previous_result: dict | None,
    ) -> ActionExecutionResult:
        parsed = SendEmailParams.model_validate(params)
        try:
            access_token = await self._connections.get_valid_access_token(
                organization_id=organization_id, user_id=user_id
            )
            sent = await self._client.send_message(
                access_token=access_token,
                to=parsed.to,
                subject=parsed.subject,
                body=parsed.body,
            )
        except GmailError as exc:
            return ActionExecutionResult(
                succeeded=False,
                result={"to": parsed.to, "sent": False},
                error_message=str(exc),
            )
        return ActionExecutionResult(
            succeeded=True,
            result={"to": parsed.to, "sent": True, "provider_message_id": sent.message_id},
        )


class GmailSendBulkEmailExecutor:
    def __init__(self, session: AsyncSession) -> None:
        self._connections = GmailConnectionService(session)
        self._client = GmailClient()

    async def execute(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        params: dict,
        previous_result: dict | None,
    ) -> ActionExecutionResult:
        parsed = SendBulkEmailParams.model_validate(params)

        # Idempotency: carry forward every recipient a prior attempt already
        # sent to (so a retried step never double-sends); recipients that
        # previously failed are retried fresh below rather than kept stale.
        results: list[dict] = [
            entry
            for entry in (previous_result or {}).get("results", [])
            if entry.get("status") == "sent"
        ]
        already_sent = {entry["email"] for entry in results}

        try:
            access_token = await self._connections.get_valid_access_token(
                organization_id=organization_id, user_id=user_id
            )
        except GmailError as exc:
            return ActionExecutionResult(
                succeeded=False,
                result=_summarize(parsed.recipients, results),
                error_message=str(exc),
            )

        for recipient in parsed.recipients:
            if recipient.email in already_sent:
                continue

            variables = _template_variables(recipient)
            try:
                subject = render_template(parsed.subject, variables)
                body = render_template(parsed.body, variables)
            except MissingTemplateVariablesError as exc:
                results.append({"email": recipient.email, "status": "failed", "error": str(exc)})
                continue

            try:
                sent = await self._client.send_message(
                    access_token=access_token, to=recipient.email, subject=subject, body=body
                )
            except GmailRateLimitError as exc:
                # Stop the whole batch rather than hammering an
                # already-rate-limited API. Everything from here on is left
                # untouched in ``results`` (not recorded as failed), so a
                # future retry — which feeds this step's ``result`` back in
                # as ``previous_result`` — resumes instead of restarting.
                results.append({"email": recipient.email, "status": "failed", "error": str(exc)})
                break
            except GmailError as exc:
                results.append({"email": recipient.email, "status": "failed", "error": str(exc)})
                continue
            else:
                results.append(
                    {
                        "email": recipient.email,
                        "status": "sent",
                        "provider_message_id": sent.message_id,
                    }
                )

        # The step itself succeeds as long as it ran and produced a
        # structured per-recipient outcome — a handful of bad addresses
        # among hundreds of good ones is not a step failure, it's data in
        # ``results`` for the caller to inspect.
        return ActionExecutionResult(succeeded=True, result=_summarize(parsed.recipients, results))


def _template_variables(recipient: RecipientIn) -> dict[str, str]:
    extra = recipient.model_extra or {}
    return {"email": recipient.email, **{key: str(value) for key, value in extra.items()}}


def _summarize(recipients: list[RecipientIn], results: list[dict]) -> dict:
    succeeded = sum(1 for entry in results if entry["status"] == "sent")
    return {
        "total": len(recipients),
        "succeeded": succeeded,
        "failed": len(results) - succeeded,
        "results": results,
    }
