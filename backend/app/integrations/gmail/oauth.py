"""Google OAuth 2.0: authorization URL construction and the token endpoint.

Talks to Google over plain REST via ``httpx`` rather than pulling in
``google-auth``/``google-auth-oauthlib`` — the flow this app needs is three
HTTP calls (build a URL, exchange a code, refresh a token), not a general
credential-management framework.

Never log a response body from the token endpoint: it carries the access
token and (on exchange) the refresh token in plaintext JSON.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

import httpx

from app.core.config import Settings
from app.integrations.gmail.errors import GmailAuthError

_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo"


@dataclass(frozen=True)
class GoogleTokenResponse:
    access_token: str
    refresh_token: str | None
    expires_at: datetime
    scopes: list[str]


class GoogleOAuthClient:
    def __init__(self, settings: Settings) -> None:
        self._client_id = settings.google_oauth_client_id
        self._client_secret = settings.google_oauth_client_secret
        self._redirect_uri = settings.google_oauth_redirect_uri

    def authorization_url(self, *, state: str, scopes: list[str]) -> str:
        params = {
            "client_id": self._client_id,
            "redirect_uri": self._redirect_uri,
            "response_type": "code",
            "scope": " ".join(scopes),
            "access_type": "offline",
            # Force the consent screen every time so Google reliably issues a
            # refresh_token — without it, reconnecting the same Google
            # account silently omits refresh_token from the response.
            "prompt": "consent",
            "state": state,
        }
        return f"{_AUTHORIZATION_ENDPOINT}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> GoogleTokenResponse:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                _TOKEN_ENDPOINT,
                data={
                    "code": code,
                    "client_id": self._client_id,
                    "client_secret": self._client_secret,
                    "redirect_uri": self._redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
        return _parse_token_response(response, require_refresh_token=True)

    async def refresh_access_token(self, refresh_token: str) -> GoogleTokenResponse:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                _TOKEN_ENDPOINT,
                data={
                    "refresh_token": refresh_token,
                    "client_id": self._client_id,
                    "client_secret": self._client_secret,
                    "grant_type": "refresh_token",
                },
            )
        return _parse_token_response(response, require_refresh_token=False)

    async def fetch_user_email(self, access_token: str) -> str | None:
        """Best-effort lookup of the Google account's email for display
        purposes (``Connection.external_account_email``). Never raises —
        a failure here shouldn't block completing the connection.
        """
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                _USERINFO_ENDPOINT,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if response.status_code != 200:
            return None
        return response.json().get("email")


def _parse_token_response(
    response: httpx.Response, *, require_refresh_token: bool
) -> GoogleTokenResponse:
    if response.status_code != 200:
        raise GmailAuthError(f"Google token endpoint returned {response.status_code}")

    body = response.json()
    access_token = body.get("access_token")
    if not access_token:
        raise GmailAuthError("Google token endpoint response had no access_token")

    refresh_token = body.get("refresh_token")
    if require_refresh_token and refresh_token is None:
        raise GmailAuthError("Google did not return a refresh_token — retry the consent screen")

    expires_in = int(body.get("expires_in", 3600))
    scope_string = body.get("scope", "")
    scopes = scope_string.split() if scope_string else []

    return GoogleTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=datetime.now(UTC).replace(tzinfo=None) + timedelta(seconds=expires_in),
        scopes=scopes,
    )
