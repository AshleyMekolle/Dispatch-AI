"""Executing send_email / send_bulk_email workflows through the Gmail
integration: successful sends, provider failures, per-recipient partial
failure, missing template variables, retry idempotency, and organization
isolation of connections.

Only the network boundary is mocked: ``GoogleOAuthClient.exchange_code`` /
``fetch_user_email`` (connecting) and ``GmailClient.send_message`` (sending).
Everything else — Connection storage/encryption, token resolution, template
rendering, workflow/execution persistence — runs for real against an
in-memory SQLite database, same as the rest of the suite.
"""

from __future__ import annotations

import uuid
from collections import Counter
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import Settings
from app.core.db import build_session_factory, get_db
from app.core.security import create_oauth_state_token
from app.integrations.gmail.client import GmailClient, GmailSendResult
from app.integrations.gmail.errors import GmailAPIError, GmailRateLimitError
from app.integrations.gmail.executor import GmailSendBulkEmailExecutor
from app.integrations.gmail.oauth import GoogleOAuthClient, GoogleTokenResponse
from app.main import create_app
from app.models.base import Base


def _settings() -> Settings:
    return Settings(
        environment="test", secret_key="test-secret-key-not-for-production", _env_file=None
    )


@asynccontextmanager
async def running_app(settings: Settings):
    app = create_app(settings)
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = build_session_factory(engine)

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, session_factory
    await engine.dispose()


async def _register(client: AsyncClient, email: str) -> tuple[dict[str, str], uuid.UUID, uuid.UUID]:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "correct-horse-battery",
            "full_name": "Amara Cole",
            "workspace_name": f"Workspace for {email}",
        },
    )
    body = response.json()
    headers = {"Authorization": f"Bearer {body['access_token']}"}
    return headers, uuid.UUID(body["user"]["id"]), uuid.UUID(body["user"]["organization_id"])


def _mock_oauth(monkeypatch: pytest.MonkeyPatch, *, access_token: str = "at-1") -> None:
    async def fake_exchange_code(self: GoogleOAuthClient, code: str) -> GoogleTokenResponse:
        return GoogleTokenResponse(
            access_token=access_token,
            refresh_token="refresh-1",
            expires_at=datetime.now(UTC).replace(tzinfo=None) + timedelta(hours=1),
            scopes=["https://www.googleapis.com/auth/gmail.send"],
        )

    async def fake_fetch_user_email(self: GoogleOAuthClient, access_token: str) -> str:
        return "sender@halcyon.co"

    monkeypatch.setattr(GoogleOAuthClient, "exchange_code", fake_exchange_code)
    monkeypatch.setattr(GoogleOAuthClient, "fetch_user_email", fake_fetch_user_email)


async def _connect_gmail(
    client: AsyncClient,
    settings: Settings,
    user_id: uuid.UUID,
    *,
    monkeypatch,
    access_token: str = "at-1",
) -> None:
    _mock_oauth(monkeypatch, access_token=access_token)
    state = create_oauth_state_token(user_id, settings)
    response = await client.get(f"/api/v1/connections/gmail/callback?code=fake&state={state}")
    assert response.status_code == 302, response.text
    assert "connected=gmail" in response.headers["location"]


async def _create_approve_execute(
    client: AsyncClient, headers: dict[str, str], *, action_type: str, params: dict
) -> dict:
    create = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={"action_type": action_type, "params": params},
    )
    assert create.status_code == 201, create.text
    workflow_id = create.json()["id"]
    approve = await client.post(f"/api/v1/workflows/{workflow_id}/approve", headers=headers)
    assert approve.status_code == 200, approve.text
    execute = await client.post(f"/api/v1/workflows/{workflow_id}/executions", headers=headers)
    assert execute.status_code == 200, execute.text
    return execute.json()


async def test_send_email_success(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = _settings()
    async with running_app(settings) as (client, _session_factory):
        headers, user_id, _org_id = await _register(client, "amara@halcyon.co")
        await _connect_gmail(client, settings, user_id, monkeypatch=monkeypatch)

        async def fake_send(self, *, access_token, to, subject, body):
            assert access_token == "at-1"
            return GmailSendResult(message_id="msg-123")

        monkeypatch.setattr(GmailClient, "send_message", fake_send)

        execution = await _create_approve_execute(
            client,
            headers,
            action_type="send_email",
            params={"to": "lead@example.com", "subject": "Hi", "body": "Following up."},
        )
        assert execution["status"] == "SUCCESS"
        step = execution["steps"][0]
        assert step["status"] == "SUCCESS"
        assert step["result"]["sent"] is True
        assert step["result"]["provider_message_id"] == "msg-123"


async def test_send_email_without_connection_fails_cleanly() -> None:
    settings = _settings()
    async with running_app(settings) as (client, _session_factory):
        headers, _user_id, _org_id = await _register(client, "amara@halcyon.co")

        execution = await _create_approve_execute(
            client,
            headers,
            action_type="send_email",
            params={"to": "lead@example.com", "subject": "Hi", "body": "Following up."},
        )
        assert execution["status"] == "FAILED"
        step = execution["steps"][0]
        assert step["status"] == "FAILED"
        assert step["result"]["sent"] is False


async def test_send_email_gmail_api_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = _settings()
    async with running_app(settings) as (client, _session_factory):
        headers, user_id, _org_id = await _register(client, "amara@halcyon.co")
        await _connect_gmail(client, settings, user_id, monkeypatch=monkeypatch)

        async def fake_send(self, *, access_token, to, subject, body):
            raise GmailAPIError("Gmail API request failed with status 500", status_code=500)

        monkeypatch.setattr(GmailClient, "send_message", fake_send)

        execution = await _create_approve_execute(
            client,
            headers,
            action_type="send_email",
            params={"to": "lead@example.com", "subject": "Hi", "body": "Following up."},
        )
        assert execution["status"] == "FAILED"
        assert execution["steps"][0]["status"] == "FAILED"


async def test_send_bulk_email_success_with_personalization(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = _settings()
    async with running_app(settings) as (client, _session_factory):
        headers, user_id, _org_id = await _register(client, "amara@halcyon.co")
        await _connect_gmail(client, settings, user_id, monkeypatch=monkeypatch)

        sent = []

        async def fake_send(self, *, access_token, to, subject, body):
            sent.append((to, subject, body))
            return GmailSendResult(message_id=f"msg-{to}")

        monkeypatch.setattr(GmailClient, "send_message", fake_send)

        execution = await _create_approve_execute(
            client,
            headers,
            action_type="send_bulk_email",
            params={
                "recipients": [
                    {"email": "john@example.com", "name": "John", "company": "Acme"},
                    {"email": "mary@example.com", "name": "Mary", "company": "Example Ltd"},
                ],
                "subject": "Welcome {{name}}",
                "body": "Hi {{name}} from {{company}}, welcome to Dispatch.",
            },
        )
        assert execution["status"] == "SUCCESS"
        result = execution["steps"][0]["result"]
        assert result == {
            "total": 2,
            "succeeded": 2,
            "failed": 0,
            "results": [
                {
                    "email": "john@example.com",
                    "status": "sent",
                    "provider_message_id": "msg-john@example.com",
                },
                {
                    "email": "mary@example.com",
                    "status": "sent",
                    "provider_message_id": "msg-mary@example.com",
                },
            ],
        }
        assert (
            "john@example.com",
            "Welcome John",
            "Hi John from Acme, welcome to Dispatch.",
        ) in sent


async def test_send_bulk_email_partial_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = _settings()
    async with running_app(settings) as (client, _session_factory):
        headers, user_id, _org_id = await _register(client, "amara@halcyon.co")
        await _connect_gmail(client, settings, user_id, monkeypatch=monkeypatch)

        async def fake_send(self, *, access_token, to, subject, body):
            if to == "bad@example.com":
                raise GmailAPIError("Gmail API request failed with status 400", status_code=400)
            return GmailSendResult(message_id=f"msg-{to}")

        monkeypatch.setattr(GmailClient, "send_message", fake_send)

        execution = await _create_approve_execute(
            client,
            headers,
            action_type="send_bulk_email",
            params={
                "recipients": [
                    {"email": "good@example.com", "name": "Good"},
                    {"email": "bad@example.com", "name": "Bad"},
                ],
                "subject": "Hi {{name}}",
                "body": "Hello {{name}}",
            },
        )
        # The step itself succeeds — per-recipient failures are data, not a
        # step-level failure.
        assert execution["status"] == "SUCCESS"
        result = execution["steps"][0]["result"]
        assert result["total"] == 2
        assert result["succeeded"] == 1
        assert result["failed"] == 1
        by_email = {r["email"]: r for r in result["results"]}
        assert by_email["good@example.com"]["status"] == "sent"
        assert by_email["bad@example.com"]["status"] == "failed"


async def test_send_bulk_email_missing_template_variable_fails_only_that_recipient(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = _settings()
    async with running_app(settings) as (client, _session_factory):
        headers, user_id, _org_id = await _register(client, "amara@halcyon.co")
        await _connect_gmail(client, settings, user_id, monkeypatch=monkeypatch)

        async def fake_send(self, *, access_token, to, subject, body):
            return GmailSendResult(message_id=f"msg-{to}")

        monkeypatch.setattr(GmailClient, "send_message", fake_send)

        execution = await _create_approve_execute(
            client,
            headers,
            action_type="send_bulk_email",
            params={
                "recipients": [
                    {"email": "has-name@example.com", "name": "Has Name"},
                    {"email": "no-name@example.com"},
                ],
                "subject": "Hi {{name}}",
                "body": "Hello {{name}}",
            },
        )
        result = execution["steps"][0]["result"]
        assert result["succeeded"] == 1
        assert result["failed"] == 1
        by_email = {r["email"]: r for r in result["results"]}
        assert by_email["has-name@example.com"]["status"] == "sent"
        assert by_email["no-name@example.com"]["status"] == "failed"
        assert "name" in by_email["no-name@example.com"]["error"]


async def test_bulk_send_retry_does_not_resend_already_succeeded_recipients(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No retry endpoint exists yet, so this drives the executor directly —
    the same seam a future retry endpoint would call with the prior step's
    ``result`` as ``previous_result``.
    """
    settings = _settings()
    async with running_app(settings) as (client, session_factory):
        _headers, user_id, organization_id = await _register(client, "amara@halcyon.co")
        await _connect_gmail(client, settings, user_id, monkeypatch=monkeypatch)

        calls: Counter[str] = Counter()
        state = {"fail_b": True}

        async def fake_send(self, *, access_token, to, subject, body):
            calls[to] += 1
            if to == "b@example.com" and state["fail_b"]:
                raise GmailRateLimitError("rate limited")
            return GmailSendResult(message_id=f"id-{to}-{calls[to]}")

        monkeypatch.setattr(GmailClient, "send_message", fake_send)

        params = {
            "recipients": [
                {"email": "a@example.com", "name": "A"},
                {"email": "b@example.com", "name": "B"},
                {"email": "c@example.com", "name": "C"},
            ],
            "subject": "Hi {{name}}",
            "body": "Hello {{name}}",
        }

        async with session_factory() as session:
            first = await GmailSendBulkEmailExecutor(session).execute(
                organization_id=organization_id,
                user_id=user_id,
                params=params,
                previous_result=None,
            )

        # a@ sent; b@ rate-limited; c@ never attempted (batch stopped early).
        assert first.result["succeeded"] == 1
        assert calls["a@example.com"] == 1
        assert calls["b@example.com"] == 1
        assert calls["c@example.com"] == 0

        state["fail_b"] = False  # Gmail is no longer rate-limiting

        async with session_factory() as session:
            second = await GmailSendBulkEmailExecutor(session).execute(
                organization_id=organization_id,
                user_id=user_id,
                params=params,
                previous_result=first.result,
            )

        assert second.result["succeeded"] == 3
        assert second.result["failed"] == 0
        # a@ was never re-sent; b@ and c@ were each attempted exactly once more.
        assert calls["a@example.com"] == 1
        assert calls["b@example.com"] == 2
        assert calls["c@example.com"] == 1


async def test_execution_uses_the_executing_organizations_connection_only(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = _settings()
    async with running_app(settings) as (client, _session_factory):
        headers_a, user_a, _org_a = await _register(client, "amara@halcyon.co")
        await _connect_gmail(
            client, settings, user_a, monkeypatch=monkeypatch, access_token="token-org-a"
        )

        _headers_b, user_b, _org_b = await _register(client, "someone@otherco.com")
        await _connect_gmail(
            client, settings, user_b, monkeypatch=monkeypatch, access_token="token-org-b"
        )

        used_tokens = []

        async def fake_send(self, *, access_token, to, subject, body):
            used_tokens.append(access_token)
            return GmailSendResult(message_id="msg-1")

        monkeypatch.setattr(GmailClient, "send_message", fake_send)

        execution = await _create_approve_execute(
            client,
            headers_a,
            action_type="send_email",
            params={"to": "lead@example.com", "subject": "Hi", "body": "Following up."},
        )
        assert execution["status"] == "SUCCESS"
        assert used_tokens == ["token-org-a"]
