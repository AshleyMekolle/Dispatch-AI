"""One run of a workflow version, its per-step results, and precomputed metrics."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import ExecutionStatus, StepStatus
from app.models.types import JSONVariant, pg_enum


class Execution(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "executions"
    __table_args__ = (
        Index("ix_executions_org_created", "organization_id", "created_at"),
        Index("ix_executions_workflow_created", "workflow_id", "created_at"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE")
    )
    # Denormalized alongside workflow_version_id so "all executions of this
    # workflow, across every version" doesn't need a join through
    # workflow_versions.
    workflow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workflows.id", ondelete="CASCADE"))
    # RESTRICT: this is the FK that makes the versioning guarantee real — a
    # workflow_version can never be deleted once it has been executed.
    workflow_version_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workflow_versions.id", ondelete="RESTRICT")
    )
    triggered_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    status: Mapped[ExecutionStatus] = mapped_column(
        pg_enum(ExecutionStatus, "execution_status"), default=ExecutionStatus.PENDING
    )
    started_at: Mapped[datetime | None]
    completed_at: Mapped[datetime | None]

    steps: Mapped[list[ExecutionStep]] = relationship(
        back_populates="execution", order_by="ExecutionStep.created_at"
    )
    metrics: Mapped[ExecutionMetrics | None] = relationship(
        back_populates="execution", uselist=False
    )


class ExecutionStep(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Per-step run state. Retries increment ``attempt`` on this same row — the
    history of each attempt (started/failed/retried) lives in ``workflow_events``,
    so there is no need for one row per attempt here.
    """

    __tablename__ = "execution_steps"
    __table_args__ = (
        UniqueConstraint("execution_id", "workflow_step_id", name="uq_execution_steps_step"),
    )

    execution_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("executions.id", ondelete="CASCADE"), index=True
    )
    # RESTRICT for the same reason as Execution.workflow_version_id: the exact
    # step definition that ran must remain resolvable forever.
    workflow_step_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workflow_steps.id", ondelete="RESTRICT")
    )
    status: Mapped[StepStatus] = mapped_column(
        pg_enum(StepStatus, "step_status"), default=StepStatus.PENDING
    )
    attempt: Mapped[int] = mapped_column(default=1)
    result: Mapped[dict | None] = mapped_column(JSONVariant)
    error_message: Mapped[str | None] = mapped_column(String(2000))
    started_at: Mapped[datetime | None]
    completed_at: Mapped[datetime | None]

    execution: Mapped[Execution] = relationship(back_populates="steps")


class ExecutionMetrics(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """One precomputed row per execution, written once by the worker at
    completion — avoids re-aggregating ``execution_steps`` with a ``GROUP BY``
    every time the Analytics dashboard loads. A small, deliberate CQRS-style
    read model, not a pattern applied generally across the schema.
    """

    __tablename__ = "execution_metrics"

    execution_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("executions.id", ondelete="CASCADE"), unique=True
    )
    total_duration_ms: Mapped[int | None]
    queue_wait_ms: Mapped[int | None]
    step_count: Mapped[int] = mapped_column(default=0)
    succeeded_step_count: Mapped[int] = mapped_column(default=0)
    failed_step_count: Mapped[int] = mapped_column(default=0)
    skipped_step_count: Mapped[int] = mapped_column(default=0)
    retry_count: Mapped[int] = mapped_column(default=0)

    execution: Mapped[Execution] = relationship(back_populates="metrics")
