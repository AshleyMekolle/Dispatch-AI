"""Registration, login, token refresh, and logout.

Raises small local exceptions instead of HTTP errors — the router owns the
HTTP <-> domain translation, this module only knows about users, orgs, and
tokens.
"""

from __future__ import annotations

import re
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.enums import OrgRole
from app.models.organization import Membership, Organization
from app.models.user import User
from app.repositories.organization_repository import MembershipRepository, OrganizationRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository


class EmailAlreadyRegisteredError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class InvalidRefreshTokenError(Exception):
    pass


@dataclass
class IssuedTokens:
    access_token: str
    refresh_token: str
    expires_in: int
    refresh_expires_in: int


class AuthService:
    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self._session = session
        self._settings = settings
        self._users = UserRepository(session)
        self._orgs = OrganizationRepository(session)
        self._memberships = MembershipRepository(session)
        self._refresh_tokens = RefreshTokenRepository(session)

    async def register(
        self, *, email: str, password: str, full_name: str, workspace_name: str
    ) -> tuple[User, Organization, Membership, IssuedTokens]:
        if await self._users.get_by_email(email) is not None:
            raise EmailAlreadyRegisteredError(email)
        user = await self._users.create(
            email=email, hashed_password=hash_password(password), full_name=full_name
        )
        slug = await self._unique_slug(workspace_name)
        organization = await self._orgs.create(name=workspace_name, slug=slug)
        membership = await self._memberships.add_member(
            organization_id=organization.id, user_id=user.id, role=OrgRole.OWNER
        )
        tokens = await self._issue_tokens(user.id)
        return user, organization, membership, tokens

    async def login(
        self, *, email: str, password: str
    ) -> tuple[User, Organization, Membership, IssuedTokens]:
        user = await self._users.get_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError
        membership = await self._memberships.get_for_user(user.id)
        organization = (
            await self._orgs.get_by_id(membership.organization_id) if membership else None
        )
        if membership is None or organization is None:
            raise InvalidCredentialsError
        tokens = await self._issue_tokens(user.id)
        return user, organization, membership, tokens

    async def refresh(self, raw_refresh_token: str) -> IssuedTokens:
        token = await self._refresh_tokens.get_by_hash(hash_refresh_token(raw_refresh_token))
        if token is None:
            raise InvalidRefreshTokenError
        if token.revoked_at is not None:
            await self._refresh_tokens.revoke_all_for_user(token.user_id)
            await self._session.commit()
            raise InvalidRefreshTokenError
        current_expires_at = token.expires_at
        if current_expires_at.tzinfo is None:
            current_expires_at = current_expires_at.replace(tzinfo=UTC)
        if current_expires_at < datetime.now(UTC):
            raise InvalidRefreshTokenError
        new_raw, new_hash = generate_refresh_token()
        expires_at = datetime.now(UTC) + timedelta(seconds=self._settings.refresh_token_ttl_seconds)
        await self._refresh_tokens.rotate(token, new_token_hash=new_hash, expires_at=expires_at)
        access_token, expires_in = create_access_token(token.user_id, self._settings)
        return IssuedTokens(
            access_token=access_token,
            refresh_token=new_raw,
            expires_in=expires_in,
            refresh_expires_in=self._settings.refresh_token_ttl_seconds,
        )

    async def logout(self, raw_refresh_token: str) -> None:
        token = await self._refresh_tokens.get_by_hash(hash_refresh_token(raw_refresh_token))
        if token is not None and token.revoked_at is None:
            await self._refresh_tokens.revoke(token)

    async def _issue_tokens(self, user_id: uuid.UUID) -> IssuedTokens:
        access_token, expires_in = create_access_token(user_id, self._settings)
        raw_refresh, refresh_hash = generate_refresh_token()
        expires_at = datetime.now(UTC) + timedelta(seconds=self._settings.refresh_token_ttl_seconds)
        await self._refresh_tokens.create(
            user_id=user_id, token_hash=refresh_hash, expires_at=expires_at
        )
        return IssuedTokens(
            access_token=access_token,
            refresh_token=raw_refresh,
            expires_in=expires_in,
            refresh_expires_in=self._settings.refresh_token_ttl_seconds,
        )

    async def _unique_slug(self, name: str) -> str:
        base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "workspace"
        slug = base
        while await self._orgs.get_by_slug(slug) is not None:
            slug = f"{base}-{secrets.token_hex(2)}"
        return slug
