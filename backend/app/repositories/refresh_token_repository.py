"""Persistence for rotating refresh tokens (Milestone 3 consumes this)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self, *, user_id: uuid.UUID, token_hash: str, expires_at: datetime
    ) -> RefreshToken:
        token = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self._session.add(token)
        await self._session.flush()
        return token

    async def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        result = await self._session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def rotate(
        self, token: RefreshToken, *, new_token_hash: str, expires_at: datetime
    ) -> RefreshToken:
        """Revoke ``token`` and issue its successor, linked via
        ``replaced_by_id`` — the chain that lets reuse of a revoked token be
        detected later.
        """
        replacement = await self.create(
            user_id=token.user_id, token_hash=new_token_hash, expires_at=expires_at
        )
        token.revoked_at = datetime.now(UTC)
        token.replaced_by_id = replacement.id
        await self._session.flush()
        return replacement

    async def revoke(self, token: RefreshToken) -> None:
        token.revoked_at = datetime.now(UTC)
        await self._session.flush()

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        result = await self._session.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None)
            )
        )
        now = datetime.now(UTC)
        for token in result.scalars().all():
            token.revoked_at = now
        await self._session.flush()
