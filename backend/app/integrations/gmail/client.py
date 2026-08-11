"""The Gmail API client/provider: one HTTP call to ``messages.send``.

Deliberately narrow — building the MIME message and calling the endpoint is
all that happens here. Recipient lists, templating, and OAuth token
management are the caller's job (``app.integrations.gmail.executor``).
"""

from __future__ import annotations

import base64
from dataclasses import dataclass
from email.mime.text import MIMEText

import httpx

from app.integrations.gmail.errors import GmailAPIError, GmailAuthError, GmailRateLimitError

_SEND_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"


@dataclass(frozen=True)
class GmailSendResult:
    message_id: str


class GmailClient:
    async def send_message(
        self, *, access_token: str, to: str, subject: str, body: str
    ) -> GmailSendResult:
        raw = _build_raw_message(to=to, subject=subject, body=body)
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                _SEND_ENDPOINT,
                headers={"Authorization": f"Bearer {access_token}"},
                json={"raw": raw},
            )
        return _parse_send_response(response)


def _build_raw_message(*, to: str, subject: str, body: str) -> str:
    message = MIMEText(body, "plain", "utf-8")
    message["To"] = to
    message["Subject"] = subject
    return base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")


def _parse_send_response(response: httpx.Response) -> GmailSendResult:
    if response.status_code == 200:
        message_id = response.json().get("id")
        if not message_id:
            raise GmailAPIError("Gmail API response had no message id", status_code=200)
        return GmailSendResult(message_id=message_id)

    if response.status_code in (401, 403):
        raise GmailAuthError(f"Gmail API rejected credentials ({response.status_code})")
    if response.status_code == 429:
        raise GmailRateLimitError("Gmail API rate limit exceeded")

    # Never include response.text: Gmail error bodies can echo request
    # content, and this message may end up in logs or in ExecutionStep.error_message.
    raise GmailAPIError(
        f"Gmail API request failed with status {response.status_code}",
        status_code=response.status_code,
    )
