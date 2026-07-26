from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import OrgRole
from app.models.types import pg_enum

if TYPE_CHECKING:
    from app.models.user import User


class Organization(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)

    memberships: Mapped[list[Membership]] = relationship(back_populates="organization")


class Membership(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Join table between users and organizations.

    ``unique(user_id)`` intentionally limits each user to one organization
    today — the shape supports many-to-many, but the constraint pins it to
    one-to-many until multi-org membership is an actual product need.
    Removing this one constraint is the entire migration required to lift
    that limit. See docs/adr/0006-multi-tenant-organizations.md.
    """

    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("user_id", name="uq_memberships_user_id"),)

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[OrgRole] = mapped_column(pg_enum(OrgRole, "org_role"), default=OrgRole.MEMBER)

    organization: Mapped[Organization] = relationship(back_populates="memberships")
    user: Mapped[User] = relationship(back_populates="membership")
