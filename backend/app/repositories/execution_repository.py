"""Persistence for execution runs, their per-step state, and precomputed metrics."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import ExecutionStatus, StepStatus
from app.models.execution import Execution, ExecutionMetrics, ExecutionStep


class ExecutionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_execution(
        self,
        *,
        organization_id: uuid.UUID,
        workflow_id: uuid.UUID,
        workflow_version_id: uuid.UUID,
        triggered_by_user_id: uuid.UUID | None,
        workflow_step_ids: list[uuid.UUID],
    ) -> Execution:
        """One ``ExecutionStep`` per step in the version being run, all
        ``PENDING`` — the worker (Milestone 5) transitions each as it runs.
        """
        execution = Execution(
            organization_id=organization_id,
            workflow_id=workflow_id,
            workflow_version_id=workflow_version_id,
            triggered_by_user_id=triggered_by_user_id,
            status=ExecutionStatus.PENDING,
        )
        execution.steps = [
            ExecutionStep(workflow_step_id=step_id, status=StepStatus.PENDING)
            for step_id in workflow_step_ids
        ]
        self._session.add(execution)
        await self._session.flush()
        return execution

    async def get_by_id(self, execution_id: uuid.UUID) -> Execution | None:
        result = await self._session.execute(
            select(Execution)
            .where(Execution.id == execution_id)
            .options(selectinload(Execution.steps), selectinload(Execution.metrics))
        )
        return result.scalar_one_or_none()

    async def list_for_organization(
        self, organization_id: uuid.UUID, *, limit: int = 50, offset: int = 0
    ) -> tuple[list[Execution], int]:
        items_result = await self._session.execute(
            select(Execution)
            .where(Execution.organization_id == organization_id)
            .order_by(Execution.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        count_result = await self._session.execute(
            select(func.count())
            .select_from(Execution)
            .where(Execution.organization_id == organization_id)
        )
        return list(items_result.scalars().all()), count_result.scalar_one()

    async def update_status(
        self,
        execution_id: uuid.UUID,
        status: ExecutionStatus,
        *,
        started_at: datetime | None = None,
        completed_at: datetime | None = None,
    ) -> Execution:
        execution = await self._session.get(Execution, execution_id)
        if execution is None:
            raise ValueError(f"Execution {execution_id} does not exist")
        execution.status = status
        if started_at is not None:
            execution.started_at = started_at
        if completed_at is not None:
            execution.completed_at = completed_at
        await self._session.flush()
        return execution

    async def update_step(
        self,
        execution_step_id: uuid.UUID,
        *,
        status: StepStatus | None = None,
        result: dict | None = None,
        error_message: str | None = None,
        started_at: datetime | None = None,
        completed_at: datetime | None = None,
        increment_attempt: bool = False,
    ) -> ExecutionStep:
        step = await self._session.get(ExecutionStep, execution_step_id)
        if step is None:
            raise ValueError(f"ExecutionStep {execution_step_id} does not exist")
        if status is not None:
            step.status = status
        if result is not None:
            step.result = result
        if error_message is not None:
            step.error_message = error_message
        if started_at is not None:
            step.started_at = started_at
        if completed_at is not None:
            step.completed_at = completed_at
        if increment_attempt:
            step.attempt += 1
        await self._session.flush()
        return step

    async def record_metrics(
        self, execution_id: uuid.UUID, **fields: int | None
    ) -> ExecutionMetrics:
        """Create-or-update, since metrics are 1:1 with an execution and
        written incrementally as steps complete, finalized once at the end.
        """
        result = await self._session.execute(
            select(ExecutionMetrics).where(ExecutionMetrics.execution_id == execution_id)
        )
        metrics = result.scalar_one_or_none()
        if metrics is None:
            metrics = ExecutionMetrics(execution_id=execution_id)
            self._session.add(metrics)
        for field, value in fields.items():
            setattr(metrics, field, value)
        await self._session.flush()
        return metrics
