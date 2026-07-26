"""Workflow, its immutable versions, and the ordered steps within each version.

See docs/adr/0007-workflow-versioning.md for why the plan lives on an
immutable ``WorkflowVersion`` rather than as a mutable column on ``Workflow``.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import IntegrationProvider, WorkflowVersionStatus
from app.models.types import JSONVariant, pg_enum


class Workflow(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "workflows"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    # SET NULL, not CASCADE or RESTRICT: a departing user shouldn't take the
    # org's automation down with them, and an org shouldn't be unable to
    # offboard a user because they once created a workflow.
    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    # Convenience pointer to the latest version (of any status), maintained by
    # the service layer — not derived by `ORDER BY version_number DESC LIMIT 1`
    # on every read. Plain FK column, deliberately without a relationship():
    # workflow_versions.workflow_id already gives Workflow->WorkflowVersion a
    # foreign key, so a second relationship traversing this column would create
    # an ambiguous multi-path join between the same two tables. Repository code
    # resolves it with one extra lookup when needed.
    current_version_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("workflow_versions.id", ondelete="RESTRICT")
    )
    title: Mapped[str] = mapped_column(String(300))
    archived_at: Mapped[datetime | None]

    versions: Mapped[list[WorkflowVersion]] = relationship(
        back_populates="workflow",
        foreign_keys="WorkflowVersion.workflow_id",
        order_by="WorkflowVersion.version_number",
    )


class WorkflowVersion(Base, UUIDPrimaryKeyMixin, CreatedAtMixin):
    """An immutable snapshot of a workflow's plan.

    No ``updated_at``: rows are never updated after creation. Approving a
    version sets ``status``/``approved_at`` exactly once, through the
    repository's single write path — there is no update method for editing an
    already-approved version's plan.
    """

    __tablename__ = "workflow_versions"
    __table_args__ = (
        UniqueConstraint("workflow_id", "version_number", name="uq_workflow_versions_number"),
    )

    workflow_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workflows.id", ondelete="CASCADE"), index=True
    )
    version_number: Mapped[int]
    prompt: Mapped[str] = mapped_column(String(4000))
    plan: Mapped[dict] = mapped_column(JSONVariant)
    plan_hash: Mapped[str] = mapped_column(String(64))
    status: Mapped[WorkflowVersionStatus] = mapped_column(
        pg_enum(WorkflowVersionStatus, "workflow_version_status"),
        default=WorkflowVersionStatus.DRAFT,
    )
    approved_at: Mapped[datetime | None]
    approved_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )

    workflow: Mapped[Workflow] = relationship(back_populates="versions", foreign_keys=[workflow_id])
    steps: Mapped[list[WorkflowStep]] = relationship(
        back_populates="workflow_version", order_by="WorkflowStep.step_order"
    )


class WorkflowStep(Base, UUIDPrimaryKeyMixin, CreatedAtMixin):
    """One ordered step within a workflow version's plan. Immutable, like its parent."""

    __tablename__ = "workflow_steps"
    __table_args__ = (
        UniqueConstraint("workflow_version_id", "step_order", name="uq_workflow_steps_order"),
    )

    workflow_version_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workflow_versions.id", ondelete="CASCADE"), index=True
    )
    step_order: Mapped[int]
    action_type: Mapped[str] = mapped_column(String(100))
    provider: Mapped[IntegrationProvider] = mapped_column(
        pg_enum(IntegrationProvider, "integration_provider")
    )
    params: Mapped[dict] = mapped_column(JSONVariant)

    workflow_version: Mapped[WorkflowVersion] = relationship(back_populates="steps")
