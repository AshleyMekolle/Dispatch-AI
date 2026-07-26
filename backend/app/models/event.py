"""Append-only audit trail for the whole workflow lifecycle.

One table, not two, because the history page wants a single chronological feed
per workflow — workflow-level events (created, approved) and execution-level
events (step transitions) share it via nullable scoping columns rather than
requiring a UNION of two tables. No ``relationship()`` attributes: this table
is queried directly by (execution_id | workflow_id | organization_id) + created_at,
never traversed as part of another aggregate's object graph — the same
direct-query pattern used for ``connections`` and ``refresh_tokens``.
"""

from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin
from app.models.enums import WorkflowEventType
from app.models.types import JSONVariant, pg_enum


class WorkflowEvent(Base, UUIDPrimaryKeyMixin, CreatedAtMixin):
    __tablename__ = "workflow_events"
    __table_args__ = (
        Index("ix_workflow_events_execution_created", "execution_id", "created_at"),
        Index("ix_workflow_events_workflow_created", "workflow_id", "created_at"),
        Index("ix_workflow_events_org_created", "organization_id", "created_at"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE")
    )
    workflow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workflows.id", ondelete="CASCADE"))
    workflow_version_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("workflow_versions.id", ondelete="SET NULL")
    )
    execution_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("executions.id", ondelete="CASCADE")
    )
    execution_step_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("execution_steps.id", ondelete="CASCADE")
    )
    # SET NULL: an audit entry must outlive the user who triggered it — it just
    # loses attribution instead of disappearing.
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    event_type: Mapped[WorkflowEventType] = mapped_column(
        pg_enum(WorkflowEventType, "workflow_event_type")
    )
    message: Mapped[str | None] = mapped_column(String(2000))
    # Named event_metadata, not metadata: `metadata` is reserved on SQLAlchemy's
    # declarative Base (the schema-reflection object) and would shadow it.
    event_metadata: Mapped[dict | None] = mapped_column(JSONVariant)
