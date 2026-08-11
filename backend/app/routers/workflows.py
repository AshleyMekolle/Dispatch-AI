"""Creating, reviewing, approving, and (simulated) running workflows."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user
from app.models.enums import ExecutionStatus, IntegrationProvider, StepStatus, WorkflowVersionStatus
from app.models.execution import ExecutionStep
from app.models.user import User
from app.models.workflow import Workflow, WorkflowStep, WorkflowVersion
from app.repositories.workflow_repository import VersionAlreadyApprovedError
from app.services.workflow_service import (
    InvalidActionParamsError,
    UnknownActionTypeError,
    WorkflowNotApprovedError,
    WorkflowNotFoundError,
    WorkflowService,
)

router = APIRouter(prefix="/workflows", tags=["workflows"])


class CreateWorkflowRequest(BaseModel):
    action_type: str
    params: dict[str, Any]


class StepOut(BaseModel):
    id: uuid.UUID
    step_order: int
    action_type: str
    provider: IntegrationProvider
    params: dict[str, Any]


class WorkflowOut(BaseModel):
    id: uuid.UUID
    title: str
    status: WorkflowVersionStatus
    version_id: uuid.UUID
    created_at: datetime
    steps: list[StepOut]


class WorkflowSummary(BaseModel):
    id: uuid.UUID
    title: str
    status: WorkflowVersionStatus
    action_type: str
    provider: IntegrationProvider
    created_at: datetime


class ExecutionSummary(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    workflow_title: str
    action_type: str
    provider: IntegrationProvider
    status: ExecutionStatus
    started_at: datetime | None
    completed_at: datetime | None


class ExecutionStepOut(BaseModel):
    id: uuid.UUID
    action_type: str
    provider: IntegrationProvider
    status: StepStatus
    result: dict[str, Any] | None


class ExecutionOut(BaseModel):
    id: uuid.UUID
    status: ExecutionStatus
    started_at: datetime | None
    completed_at: datetime | None
    steps: list[ExecutionStepOut]


def _step_out(step: WorkflowStep) -> StepOut:
    return StepOut(
        id=step.id,
        step_order=step.step_order,
        action_type=step.action_type,
        provider=step.provider,
        params=step.params,
    )


def _workflow_out(
    workflow: Workflow, version: WorkflowVersion, steps: list[WorkflowStep]
) -> WorkflowOut:
    return WorkflowOut(
        id=workflow.id,
        title=workflow.title,
        status=version.status,
        version_id=version.id,
        created_at=workflow.created_at,
        steps=[_step_out(step) for step in steps],
    )


def _execution_step_out(exec_step: ExecutionStep, workflow_step: WorkflowStep) -> ExecutionStepOut:
    return ExecutionStepOut(
        id=exec_step.id,
        action_type=workflow_step.action_type,
        provider=workflow_step.provider,
        status=exec_step.status,
        result=exec_step.result,
    )


def get_workflow_service(session: AsyncSession = Depends(get_db)) -> WorkflowService:
    return WorkflowService(session)


@router.post("", response_model=WorkflowOut, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    body: CreateWorkflowRequest,
    user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
) -> WorkflowOut:
    try:
        workflow, version, steps = await service.create(
            user, action_type=body.action_type, raw_params=body.params
        )
    except UnknownActionTypeError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown action type") from None
    except InvalidActionParamsError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, exc.errors) from None
    return _workflow_out(workflow, version, steps)


@router.get("", response_model=list[WorkflowSummary])
async def list_workflows(
    user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
) -> list[WorkflowSummary]:
    pairs = await service.list_for_user(user)
    summaries = []
    for workflow, version in pairs:
        step = version.steps[0] if version.steps else None
        summaries.append(
            WorkflowSummary(
                id=workflow.id,
                title=workflow.title,
                status=version.status,
                action_type=step.action_type if step else "",
                provider=step.provider if step else IntegrationProvider.GMAIL,
                created_at=workflow.created_at,
            )
        )
    return summaries


@router.get("/executions", response_model=list[ExecutionSummary])
async def list_executions(
    user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
) -> list[ExecutionSummary]:
    triples = await service.list_recent_executions_for_user(user)
    summaries = []
    for execution, workflow, version in triples:
        step = version.steps[0] if version.steps else None
        summaries.append(
            ExecutionSummary(
                id=execution.id,
                workflow_id=workflow.id,
                workflow_title=workflow.title,
                action_type=step.action_type if step else "",
                provider=step.provider if step else IntegrationProvider.GMAIL,
                status=execution.status,
                started_at=execution.started_at,
                completed_at=execution.completed_at,
            )
        )
    return summaries


@router.get("/{workflow_id}", response_model=WorkflowOut)
async def get_workflow(
    workflow_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
) -> WorkflowOut:
    try:
        workflow, version = await service.get_for_user(user, workflow_id)
    except WorkflowNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workflow not found") from None
    return _workflow_out(workflow, version, version.steps)


@router.post("/{workflow_id}/approve", response_model=WorkflowOut)
async def approve_workflow(
    workflow_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
) -> WorkflowOut:
    try:
        workflow, version = await service.approve(user, workflow_id)
    except WorkflowNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workflow not found") from None
    except VersionAlreadyApprovedError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Workflow is already approved") from None
    return _workflow_out(workflow, version, version.steps)


@router.post("/{workflow_id}/executions", response_model=ExecutionOut)
async def execute_workflow(
    workflow_id: uuid.UUID,
    user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
) -> ExecutionOut:
    try:
        execution, workflow_steps = await service.execute(user, workflow_id)
    except WorkflowNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workflow not found") from None
    except WorkflowNotApprovedError:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Workflow must be approved before it can run"
        ) from None
    steps_by_id = {step.id: step for step in workflow_steps}
    return ExecutionOut(
        id=execution.id,
        status=execution.status,
        started_at=execution.started_at,
        completed_at=execution.completed_at,
        steps=[
            _execution_step_out(exec_step, steps_by_id[exec_step.workflow_step_id])
            for exec_step in execution.steps
        ],
    )
