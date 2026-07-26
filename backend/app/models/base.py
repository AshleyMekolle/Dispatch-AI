"""Declarative base and shared column mixins.

Every table gets a UUID primary key (never a serial int — UUIDs can be
generated client-side before a row is inserted, which matters once the AI
layer needs to reference a workflow's id before committing it) and, except
for the append-only ``workflow_events`` table, a created/updated timestamp
pair.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Uuid, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Shared metadata object — every model's table is registered here.

    Alembic's ``env.py`` autogenerates migrations by diffing against
    ``Base.metadata``, so every model must import from this module.
    """


class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)


class CreatedAtMixin:
    """``created_at`` only — for tables whose rows are never updated after insert
    (``workflow_versions``, ``workflow_steps``, ``workflow_events``). The absence
    of ``updated_at`` is itself documentation: a log row that can be updated
    isn't a log.
    """

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TimestampMixin(CreatedAtMixin):
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
