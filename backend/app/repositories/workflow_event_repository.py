"""Append-only audit trail. Rows are written once and never updated — there is
deliberately no ``update`` method on this repository.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import WorkflowEventType
from app.models.event import WorkflowEvent


class WorkflowEventRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def record(
        self,
        *,
        organization_id: uuid.UUID,
        workflow_id: uuid.UUID,
        event_type: WorkflowEventType,
        workflow_version_id: uuid.UUID | None = None,
        execution_id: uuid.UUID | None = None,
        execution_step_id: uuid.UUID | None = None,
        actor_user_id: uuid.UUID | None = None,
        message: str | None = None,
        event_metadata: dict | None = None,
    ) -> WorkflowEvent:
        event = WorkflowEvent(
            organization_id=organization_id,
            workflow_id=workflow_id,
            workflow_version_id=workflow_version_id,
            execution_id=execution_id,
            execution_step_id=execution_step_id,
            actor_user_id=actor_user_id,
            event_type=event_type,
            message=message,
            event_metadata=event_metadata,
        )
        self._session.add(event)
        await self._session.flush()
        return event

    async def list_for_execution(self, execution_id: uuid.UUID) -> list[WorkflowEvent]:
        result = await self._session.execute(
            select(WorkflowEvent)
            .where(WorkflowEvent.execution_id == execution_id)
            .order_by(WorkflowEvent.created_at)
        )
        return list(result.scalars().all())

    async def list_for_workflow(self, workflow_id: uuid.UUID) -> list[WorkflowEvent]:
        result = await self._session.execute(
            select(WorkflowEvent)
            .where(WorkflowEvent.workflow_id == workflow_id)
            .order_by(WorkflowEvent.created_at)
        )
        return list(result.scalars().all())
