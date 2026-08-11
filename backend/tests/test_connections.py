"""Gmail OAuth connect flow: authorize URL, callback, listing, deleting, and
organization isolation.

Google's token and userinfo endpoints are never called — only
``GoogleOAuthClient.exchange_code``/``fetch_user_email`` are monkeypatched,
which is the actual network boundary this integration owns.

Uses its own app/engine per test (rather than the shared ``client`` fixture)
because several tests need non-default ``Settings`` (Google OAuth client id
configured or not).
"""

from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import Settings
from app.core.db import build_session_factory, get_db
from app.core.security import create_oauth_state_token
from app.integrations.gmail.oauth import GoogleOAuthClient, GoogleTokenResponse
from app.main import create_app
from app.models.base import Base


def _settings(**overrides: object) -> Settings:
    return Settings(
        environment="test",
        secret_key="test-secret-key-not-for-production",
        _env_file=None,
        **overrides,
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
        yield client
    await engine.dispose()


async def _register(client: AsyncClient, email: str) -> tuple[dict[str, str], uuid.UUID]:
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
    return headers, uuid.UUID(body["user"]["id"])


def _mock_google(monkeypatch: pytest.MonkeyPatch, *, email: str = "sender@halcyon.co") -> None:
    async def fake_exchange_code(self: GoogleOAuthClient, code: str) -> GoogleTokenResponse:
        return GoogleTokenResponse(
            access_token="fake-access-token",
            refresh_token="fake-refresh-token",
            expires_at=datetime.now(UTC).replace(tzinfo=None) + timedelta(hours=1),
            scopes=["https://www.googleapis.com/auth/gmail.send"],
        )

    async def fake_fetch_user_email(self: GoogleOAuthClient, access_token: str) -> str:
        return email

    monkeypatch.setattr(GoogleOAuthClient, "exchange_code", fake_exchange_code)
    monkeypatch.setattr(GoogleOAuthClient, "fetch_user_email", fake_fetch_user_email)


async def test_authorize_requires_configuration() -> None:
    async with running_app(_settings()) as client:
        headers, _ = await _register(client, "amara@halcyon.co")
        response = await client.get("/api/v1/connections/gmail/authorize", headers=headers)
        assert response.status_code == 503


async def test_authorize_returns_google_consent_url() -> None:
    settings = _settings(google_oauth_client_id="test-client-id", google_oauth_client_secret="s")
    async with running_app(settings) as client:
        headers, _ = await _register(client, "amara@halcyon.co")
        response = await client.get("/api/v1/connections/gmail/authorize", headers=headers)
        assert response.status_code == 200
        url = response.json()["url"]
        assert url.startswith("https://accounts.google.com/o/oauth2/v2/auth?")
        assert "test-client-id" in url


async def test_authorize_requires_auth() -> None:
    settings = _settings(google_oauth_client_id="x", google_oauth_client_secret="y")
    async with running_app(settings) as client:
        response = await client.get("/api/v1/connections/gmail/authorize")
        assert response.status_code == 401


async def test_callback_rejects_invalid_state() -> None:
    async with running_app(_settings()) as client:
        response = await client.get(
            "/api/v1/connections/gmail/callback?code=fake&state=not-a-real-token"
        )
        assert response.status_code == 302
        assert "connection_error=invalid_state" in response.headers["location"]


async def test_callback_creates_connection_without_leaking_tokens(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Google redirects the browser here directly, so the callback itself
    # redirects on to the frontend rather than returning JSON — the created
    # connection is verified through the (separate, JSON) list endpoint.
    settings = _settings()
    async with running_app(settings) as client:
        headers, user_id = await _register(client, "amara@halcyon.co")
        _mock_google(monkeypatch)
        state = create_oauth_state_token(user_id, settings)

        response = await client.get(
            f"/api/v1/connections/gmail/callback?code=fake-code&state={state}"
        )
        assert response.status_code == 302
        assert "connected=gmail" in response.headers["location"]
        assert response.headers["location"].startswith(settings.frontend_base_url)

        listed = await client.get("/api/v1/connections", headers=headers)
        assert listed.status_code == 200
        connections = listed.json()
        assert len(connections) == 1
        assert connections[0]["provider"] == "GMAIL"
        assert connections[0]["external_account_email"] == "sender@halcyon.co"
        assert "access_token" not in connections[0]
        assert "refresh_token" not in connections[0]


async def test_callback_reconnect_updates_in_place(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = _settings()
    async with running_app(settings) as client:
        headers, user_id = await _register(client, "amara@halcyon.co")

        _mock_google(monkeypatch, email="first@halcyon.co")
        state1 = create_oauth_state_token(user_id, settings)
        await client.get(f"/api/v1/connections/gmail/callback?code=c1&state={state1}")
        first_id = (await client.get("/api/v1/connections", headers=headers)).json()[0]["id"]

        _mock_google(monkeypatch, email="second@halcyon.co")
        state2 = create_oauth_state_token(user_id, settings)
        await client.get(f"/api/v1/connections/gmail/callback?code=c2&state={state2}")

        listed = await client.get("/api/v1/connections", headers=headers)
        connections = listed.json()
        assert len(connections) == 1
        assert connections[0]["id"] == first_id
        assert connections[0]["external_account_email"] == "second@halcyon.co"


async def test_delete_connection_is_organization_scoped(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = _settings()
    async with running_app(settings) as client:
        headers_a, user_a = await _register(client, "amara@halcyon.co")
        _mock_google(monkeypatch)
        state = create_oauth_state_token(user_a, settings)
        await client.get(f"/api/v1/connections/gmail/callback?code=c&state={state}")
        connection_id = (await client.get("/api/v1/connections", headers=headers_a)).json()[0]["id"]

        headers_b, _ = await _register(client, "someone@otherco.com")

        forbidden = await client.delete(f"/api/v1/connections/{connection_id}", headers=headers_b)
        assert forbidden.status_code == 404

        allowed = await client.delete(f"/api/v1/connections/{connection_id}", headers=headers_a)
        assert allowed.status_code == 204
