"""Persistence for workflows and their immutable versions/steps.

``plan_hash`` computation and any "is this plan re-approvable" business logic
belong to the service layer (Milestone 4) — this repository only ever stores
exactly what it's given and enforces one invariant of its own: an already
approved version can never be approved again.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TypedDict

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import IntegrationProvider, WorkflowVersionStatus
from app.models.workflow import Workflow, WorkflowStep, WorkflowVersion


class StepInput(TypedDict):
    action_type: str
    provider: IntegrationProvider
    params: dict


class VersionAlreadyApprovedError(Exception):
    """Raised when approving a version whose status is already APPROVED."""


class WorkflowRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_workflow(
        self, *, organization_id: uuid.UUID, owner_user_id: uuid.UUID | None, title: str
    ) -> Workflow:
        workflow = Workflow(
            organization_id=organization_id, owner_user_id=owner_user_id, title=title
        )
        self._session.add(workflow)
        await self._session.flush()
        return workflow

    async def get_by_id(self, workflow_id: uuid.UUID) -> Workflow | None:
        return await self._session.get(Workflow, workflow_id)

    async def list_for_organization(
        self, organization_id: uuid.UUID, *, limit: int = 50, offset: int = 0
    ) -> tuple[list[Workflow], int]:
        items_result = await self._session.execute(
            select(Workflow)
            .where(Workflow.organization_id == organization_id)
            .order_by(Workflow.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        count_result = await self._session.execute(
            select(func.count())
            .select_from(Workflow)
            .where(Workflow.organization_id == organization_id)
        )
        return list(items_result.scalars().all()), count_result.scalar_one()

    async def create_version(
        self,
        *,
        workflow_id: uuid.UUID,
        prompt: str,
        plan: dict,
        plan_hash: str,
        steps: list[StepInput],
    ) -> WorkflowVersion:
        """Create a new immutable version (+ its steps) and point the parent
        workflow's ``current_version_id`` at it. The two writes happen in the
        same flush so a caller who commits right after never observes a
        workflow pointing at a version that doesn't exist yet.
        """
        next_number_result = await self._session.execute(
            select(func.coalesce(func.max(WorkflowVersion.version_number), 0)).where(
                WorkflowVersion.workflow_id == workflow_id
            )
        )
        version_number = next_number_result.scalar_one() + 1

        version = WorkflowVersion(
            workflow_id=workflow_id,
            version_number=version_number,
            prompt=prompt,
            plan=plan,
            plan_hash=plan_hash,
            status=WorkflowVersionStatus.DRAFT,
        )
        version.steps = [
            WorkflowStep(
                step_order=index,
                action_type=step["action_type"],
                provider=step["provider"],
                params=step["params"],
            )
            for index, step in enumerate(steps, start=1)
        ]
        self._session.add(version)
        await self._session.flush()

        workflow = await self._session.get(Workflow, workflow_id)
        assert workflow is not None  # FK guarantees the workflow exists
        workflow.current_version_id = version.id
        await self._session.flush()
        return version

    async def get_version(self, version_id: uuid.UUID) -> WorkflowVersion | None:
        result = await self._session.execute(
            select(WorkflowVersion)
            .where(WorkflowVersion.id == version_id)
            .options(selectinload(WorkflowVersion.steps))
        )
        return result.scalar_one_or_none()

    async def list_versions(self, workflow_id: uuid.UUID) -> list[WorkflowVersion]:
        result = await self._session.execute(
            select(WorkflowVersion)
            .where(WorkflowVersion.workflow_id == workflow_id)
            .order_by(WorkflowVersion.version_number)
        )
        return list(result.scalars().all())

    async def approve_version(
        self, version_id: uuid.UUID, *, approved_by_user_id: uuid.UUID
    ) -> WorkflowVersion:
        version = await self.get_version(version_id)
        if version is None:
            raise ValueError(f"WorkflowVersion {version_id} does not exist")
        if version.status == WorkflowVersionStatus.APPROVED:
            raise VersionAlreadyApprovedError(version_id)

        version.status = WorkflowVersionStatus.APPROVED
        version.approved_at = datetime.now(UTC).replace(tzinfo=None)
        version.approved_by_user_id = approved_by_user_id
        await self._session.flush()
        return version
