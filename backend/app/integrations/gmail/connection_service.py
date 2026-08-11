"""Resolves a usable Gmail access token for (organization, user), refreshing
and persisting it through ``ConnectionRepository`` when it's expired or close
to it. This is the only place that decides *when* to refresh — the OAuth
client only knows *how*.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.integrations.gmail.errors import GmailNotConnectedError
from app.integrations.gmail.oauth import GoogleOAuthClient, GoogleTokenResponse
from app.models.connection import Connection
from app.models.enums import IntegrationProvider
from app.repositories.connection_repository import ConnectionRepository

# Refresh proactively rather than waiting for a 401 mid-send: a bulk send of
# a few hundred recipients can easily outlast a short-lived access token.
_EXPIRY_SAFETY_MARGIN = timedelta(minutes=5)


class GmailConnectionService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        oauth_client: GoogleOAuthClient | None = None,
    ) -> None:
        self._connections = ConnectionRepository(session)
        self._oauth_client = oauth_client or GoogleOAuthClient(get_settings())

    async def get_valid_access_token(
        self, *, organization_id: uuid.UUID, user_id: uuid.UUID
    ) -> str:
        connection = await self._connections.get_for_user_provider(
            organization_id=organization_id,
            user_id=user_id,
            provider=IntegrationProvider.GMAIL,
        )
        if connection is None:
            raise GmailNotConnectedError("No Gmail account is connected for this organization.")

        now = datetime.now(UTC).replace(tzinfo=None)
        if (
            connection.expires_at is not None
            and connection.expires_at - _EXPIRY_SAFETY_MARGIN > now
        ):
            return connection.access_token

        if connection.refresh_token is None:
            raise GmailNotConnectedError(
                "The connected Gmail account has no refresh token; reconnect it."
            )

        token = await self._oauth_client.refresh_access_token(connection.refresh_token)
        await self._connections.update_tokens(
            connection.id,
            access_token=token.access_token,
            refresh_token=token.refresh_token,
            expires_at=token.expires_at,
        )
        return token.access_token

    async def store_connection(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        token: GoogleTokenResponse,
        external_account_email: str | None,
    ) -> Connection:
        """Create or update the (org, user, GMAIL) connection after a
        successful OAuth exchange. Updates in place rather than
        delete-and-recreate so a reconnect doesn't change the connection's id.
        """
        existing = await self._connections.get_for_user_provider(
            organization_id=organization_id, user_id=user_id, provider=IntegrationProvider.GMAIL
        )
        if existing is None:
            return await self._connections.create(
                organization_id=organization_id,
                user_id=user_id,
                provider=IntegrationProvider.GMAIL,
                access_token=token.access_token,
                refresh_token=token.refresh_token,
                expires_at=token.expires_at,
                scopes=token.scopes,
                external_account_email=external_account_email,
            )
        await self._connections.update_tokens(
            existing.id,
            access_token=token.access_token,
            refresh_token=token.refresh_token,
            expires_at=token.expires_at,
        )
        return await self._connections.update_profile(
            existing.id, external_account_email=external_account_email, scopes=token.scopes
        )
