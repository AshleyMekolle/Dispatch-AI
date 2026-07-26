"""Persistence for organizations and their memberships.

Every repository in this package follows the same transaction convention:
methods ``add()`` and ``flush()`` (which assigns generated ids/timestamps and
makes the row visible to later statements in the same transaction) but never
``commit()``. Committing is the request boundary's job — see
``app.core.db.get_db`` — so several repository calls within one request
compose into a single atomic transaction instead of each silently
committing its own.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import OrgRole
from app.models.organization import Membership, Organization


class OrganizationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, *, name: str, slug: str) -> Organization:
        organization = Organization(name=name, slug=slug)
        self._session.add(organization)
        await self._session.flush()
        return organization

    async def get_by_id(self, organization_id: uuid.UUID) -> Organization | None:
        return await self._session.get(Organization, organization_id)

    async def get_by_slug(self, slug: str) -> Organization | None:
        result = await self._session.execute(
            select(Organization).where(Organization.slug == slug)
        )
        return result.scalar_one_or_none()


class MembershipRepository:
    """Separate from ``OrganizationRepository`` because its natural lookup key
    (``user_id``) belongs to a different aggregate — callers resolving "what
    org is this user in" shouldn't need an ``Organization`` in hand first.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add_member(
        self, *, organization_id: uuid.UUID, user_id: uuid.UUID, role: OrgRole = OrgRole.MEMBER
    ) -> Membership:
        membership = Membership(organization_id=organization_id, user_id=user_id, role=role)
        self._session.add(membership)
        await self._session.flush()
        return membership

    async def get_for_user(self, user_id: uuid.UUID) -> Membership | None:
        result = await self._session.execute(
            select(Membership).where(Membership.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_for_organization(self, organization_id: uuid.UUID) -> list[Membership]:
        result = await self._session.execute(
            select(Membership).where(Membership.organization_id == organization_id)
        )
        return list(result.scalars().all())
