from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.connection import Connection
from app.models.enums import IntegrationProvider


class ConnectionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        provider: IntegrationProvider,
        access_token: str,
        refresh_token: str | None = None,
        expires_at: datetime | None = None,
        scopes: list[str] | None = None,
        external_account_email: str | None = None,
    ) -> Connection:
        connection = Connection(
            organization_id=organization_id,
            user_id=user_id,
            provider=provider,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            scopes=scopes or [],
            external_account_email=external_account_email,
        )
        self._session.add(connection)
        await self._session.flush()
        return connection

    async def get_by_id(self, connection_id: uuid.UUID) -> Connection | None:
        return await self._session.get(Connection, connection_id)

    async def update_tokens(
        self,
        connection_id: uuid.UUID,
        *,
        access_token: str,
        refresh_token: str | None = None,
        expires_at: datetime | None = None,
    ) -> Connection:
        """Persist a refreshed access token (and, if Google rotated it, a new
        refresh token) after the integration layer calls the provider's token
        endpoint. ``refresh_token`` is only overwritten when the provider
        actually returned a new one — Google's refresh grant often omits it,
        and the existing stored value is still valid.
        """
        connection = await self._session.get(Connection, connection_id)
        if connection is None:
            raise ValueError(f"Connection {connection_id} does not exist")
        connection.access_token = access_token
        if refresh_token is not None:
            connection.refresh_token = refresh_token
        connection.expires_at = expires_at
        await self._session.flush()
        return connection

    async def update_profile(
        self,
        connection_id: uuid.UUID,
        *,
        external_account_email: str | None = None,
        scopes: list[str] | None = None,
    ) -> Connection:
        connection = await self._session.get(Connection, connection_id)
        if connection is None:
            raise ValueError(f"Connection {connection_id} does not exist")
        if external_account_email is not None:
            connection.external_account_email = external_account_email
        if scopes is not None:
            connection.scopes = scopes
        await self._session.flush()
        return connection

    async def get_for_user_provider(
        self, *, organization_id: uuid.UUID, user_id: uuid.UUID, provider: IntegrationProvider
    ) -> Connection | None:
        result = await self._session.execute(
            select(Connection).where(
                Connection.organization_id == organization_id,
                Connection.user_id == user_id,
                Connection.provider == provider,
            )
        )
        return result.scalar_one_or_none()

    async def list_for_organization(self, organization_id: uuid.UUID) -> list[Connection]:
        result = await self._session.execute(
            select(Connection).where(Connection.organization_id == organization_id)
        )
        return list(result.scalars().all())

    async def delete(self, connection: Connection) -> None:
        await self._session.delete(connection)
        await self._session.flush()
