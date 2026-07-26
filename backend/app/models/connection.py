"""OAuth credential storage for third-party integrations.

Tokens are never stored in plaintext — see app/core/crypto.py. This model
holds no ``relationship()`` to ``User``/``Organization``; it's referenced by
FK only and queried directly (by org, by user, by provider), the same
"direct-query, not object-graph" pattern used for the audit log.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.crypto import EncryptedString
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import IntegrationProvider
from app.models.types import JSONVariant, pg_enum


class Connection(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "connections"
    __table_args__ = (
        UniqueConstraint(
            "organization_id", "user_id", "provider", name="uq_connections_org_user_provider"
        ),
    )

    # Denormalized alongside user_id: every tenant-scoped query (e.g. "list this
    # org's connections") filters on organization_id directly instead of joining
    # through users -> memberships.
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    # CASCADE (not SET NULL): an OAuth credential with no owning user is a live
    # security liability, not a record worth preserving.
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    provider: Mapped[IntegrationProvider] = mapped_column(
        pg_enum(IntegrationProvider, "integration_provider")
    )

    access_token: Mapped[str] = mapped_column(EncryptedString(2048))
    refresh_token: Mapped[str | None] = mapped_column(EncryptedString(2048))
    expires_at: Mapped[datetime | None]
    scopes: Mapped[list[str]] = mapped_column(JSONVariant, default=list)
    external_account_email: Mapped[str | None] = mapped_column(String(320))
