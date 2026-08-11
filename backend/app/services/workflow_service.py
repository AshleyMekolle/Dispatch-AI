from __future__ import annotations

import hashlib
import json
import uuid
from datetime import UTC, datetime

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.registry import get_action_executor
from app.models.enums import (
    ExecutionStatus,
    StepStatus,
    WorkflowEventType,
    WorkflowVersionStatus,
)
from app.models.execution import Execution
from app.models.user import User
from app.models.workflow import Workflow, WorkflowStep, WorkflowVersion
from app.repositories.execution_repository import ExecutionRepository
from app.repositories.organization_repository import MembershipRepository
from app.repositories.workflow_event_repository import WorkflowEventRepository
from app.repositories.workflow_repository import WorkflowRepository
from app.services.action_registry import ACTION_REGISTRY


class UnknownActionTypeError(Exception):
    pass


class InvalidActionParamsError(Exception):
    def __init__(self, errors: list[dict]) -> None:
        self.errors = errors


class WorkflowNotFoundError(Exception):
    pass


class WorkflowNotApprovedError(Exception):
    pass


class WorkflowService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._workflows = WorkflowRepository(session)
        self._executions = ExecutionRepository(session)
        self._events = WorkflowEventRepository(session)
        self._memberships = MembershipRepository(session)

    @staticmethod
    def _utc_now() -> datetime:
        return datetime.now(UTC).replace(tzinfo=None)

    async def create(
        self,
        user: User,
        *,
        action_type: str,
        raw_params: dict,
    ) -> tuple[Workflow, WorkflowVersion, list[WorkflowStep]]:
        spec = ACTION_REGISTRY.get(action_type)

        if spec is None:
            raise UnknownActionTypeError(action_type)

        try:
            params = spec.params_model.model_validate(raw_params)
        except ValidationError as exc:
            # include_context=False: a custom validator's raised ValueError
            # (e.g. the duplicate-recipient check) otherwise ends up as a raw
            # exception object inside ctx.error, which the JSON response
            # encoder can't serialize — turning a 400 into a 500.
            raise InvalidActionParamsError(exc.errors(include_context=False)) from exc

        organization_id = await self._organization_id_for(user)
        params_dict = params.model_dump(mode="json")

        plan = {
            "steps": [
                {
                    "action_type": action_type,
                    "provider": spec.provider.value,
                    "params": params_dict,
                }
            ]
        }

        plan_hash = hashlib.sha256(json.dumps(plan, sort_keys=True).encode("utf-8")).hexdigest()

        workflow = await self._workflows.create_workflow(
            organization_id=organization_id,
            owner_user_id=user.id,
            title=spec.label,
        )

        version = await self._workflows.create_version(
            workflow_id=workflow.id,
            prompt=spec.label,
            plan=plan,
            plan_hash=plan_hash,
            steps=[
                {
                    "action_type": action_type,
                    "provider": spec.provider,
                    "params": params_dict,
                }
            ],
        )

        await self._events.record(
            organization_id=organization_id,
            workflow_id=workflow.id,
            event_type=WorkflowEventType.WORKFLOW_CREATED,
            actor_user_id=user.id,
        )

        await self._events.record(
            organization_id=organization_id,
            workflow_id=workflow.id,
            workflow_version_id=version.id,
            event_type=WorkflowEventType.WORKFLOW_VERSION_CREATED,
            actor_user_id=user.id,
        )

        return workflow, version, version.steps

    async def list_for_user(self, user: User) -> list[tuple[Workflow, WorkflowVersion]]:
        organization_id = await self._organization_id_for(user)
        workflows, _ = await self._workflows.list_for_organization(organization_id)
        pairs: list[tuple[Workflow, WorkflowVersion]] = []
        for workflow in workflows:
            if workflow.current_version_id is None:
                continue
            version = await self._workflows.get_version(workflow.current_version_id)
            if version is not None:
                pairs.append((workflow, version))
        return pairs

    async def list_recent_executions_for_user(
        self, user: User, *, limit: int = 10
    ) -> list[tuple[Execution, Workflow, WorkflowVersion]]:
        organization_id = await self._organization_id_for(user)
        executions, _ = await self._executions.list_for_organization(organization_id, limit=limit)
        workflows: dict[uuid.UUID, Workflow] = {}
        versions: dict[uuid.UUID, WorkflowVersion] = {}
        triples: list[tuple[Execution, Workflow, WorkflowVersion]] = []
        for execution in executions:
            workflow = workflows.get(execution.workflow_id)
            if workflow is None:
                workflow = await self._workflows.get_by_id(execution.workflow_id)
                if workflow is None:
                    continue
                workflows[execution.workflow_id] = workflow

            version = versions.get(execution.workflow_version_id)
            if version is None:
                version = await self._workflows.get_version(execution.workflow_version_id)
                if version is None:
                    continue
                versions[execution.workflow_version_id] = version

            triples.append((execution, workflow, version))
        return triples

    async def get_for_user(
        self,
        user: User,
        workflow_id: uuid.UUID,
    ) -> tuple[Workflow, WorkflowVersion]:
        organization_id = await self._organization_id_for(user)

        workflow = await self._workflows.get_by_id(workflow_id)

        if (
            workflow is None
            or workflow.organization_id != organization_id
            or workflow.current_version_id is None
        ):
            raise WorkflowNotFoundError(workflow_id)

        version = await self._workflows.get_version(workflow.current_version_id)

        if version is None:
            raise WorkflowNotFoundError(workflow_id)

        return workflow, version

    async def approve(
        self,
        user: User,
        workflow_id: uuid.UUID,
    ) -> tuple[Workflow, WorkflowVersion]:
        workflow, version = await self.get_for_user(user, workflow_id)

        version = await self._workflows.approve_version(
            version.id,
            approved_by_user_id=user.id,
        )

        await self._events.record(
            organization_id=workflow.organization_id,
            workflow_id=workflow.id,
            workflow_version_id=version.id,
            event_type=WorkflowEventType.WORKFLOW_APPROVED,
            actor_user_id=user.id,
        )

        return workflow, version

    async def execute(
        self,
        user: User,
        workflow_id: uuid.UUID,
    ) -> tuple[Execution, list[WorkflowStep]]:
        workflow, version = await self.get_for_user(user, workflow_id)

        if version.status != WorkflowVersionStatus.APPROVED:
            raise WorkflowNotApprovedError(workflow_id)

        execution = await self._executions.create_execution(
            organization_id=workflow.organization_id,
            workflow_id=workflow.id,
            workflow_version_id=version.id,
            triggered_by_user_id=user.id,
            workflow_step_ids=[step.id for step in version.steps],
        )

        started_at = self._utc_now()

        await self._events.record(
            organization_id=workflow.organization_id,
            workflow_id=workflow.id,
            execution_id=execution.id,
            event_type=WorkflowEventType.EXECUTION_STARTED,
            actor_user_id=user.id,
        )

        await self._executions.update_status(
            execution.id,
            ExecutionStatus.RUNNING,
            started_at=started_at,
        )

        succeeded_count = 0
        failed_count = 0

        for exec_step, workflow_step in zip(
            execution.steps,
            version.steps,
            strict=True,
        ):
            spec = ACTION_REGISTRY[workflow_step.action_type]

            await self._events.record(
                organization_id=workflow.organization_id,
                workflow_id=workflow.id,
                execution_id=execution.id,
                execution_step_id=exec_step.id,
                event_type=WorkflowEventType.STEP_STARTED,
                actor_user_id=user.id,
            )

            await self._executions.update_step(
                exec_step.id,
                status=StepStatus.RUNNING,
                started_at=self._utc_now(),
            )

            # A step whose action_type has a real ActionExecutor registered
            # (Gmail today) runs for real; everything else keeps the
            # existing simulated behavior unchanged.
            executor = get_action_executor(workflow_step.action_type, self._session)

            if executor is None:
                step_succeeded = True
                result = {
                    "simulated": True,
                    "message": (
                        f"{spec.label} completed (simulated — no real "
                        f"{spec.provider.value} connection yet)"
                    ),
                }
                error_message = None
            else:
                outcome = await executor.execute(
                    organization_id=workflow.organization_id,
                    user_id=user.id,
                    params=workflow_step.params,
                    previous_result=exec_step.result,
                )
                step_succeeded = outcome.succeeded
                result = outcome.result
                error_message = outcome.error_message

            await self._executions.update_step(
                exec_step.id,
                status=StepStatus.SUCCESS if step_succeeded else StepStatus.FAILED,
                result=result,
                error_message=error_message,
                completed_at=self._utc_now(),
            )

            await self._events.record(
                organization_id=workflow.organization_id,
                workflow_id=workflow.id,
                execution_id=execution.id,
                execution_step_id=exec_step.id,
                event_type=(
                    WorkflowEventType.STEP_COMPLETED
                    if step_succeeded
                    else WorkflowEventType.STEP_FAILED
                ),
                actor_user_id=user.id,
                message=None if step_succeeded else error_message,
            )

            if step_succeeded:
                succeeded_count += 1
            else:
                failed_count += 1

        completed_at = self._utc_now()
        final_status = ExecutionStatus.SUCCESS if failed_count == 0 else ExecutionStatus.FAILED

        await self._executions.update_status(
            execution.id,
            final_status,
            completed_at=completed_at,
        )

        await self._executions.record_metrics(
            execution.id,
            total_duration_ms=int((completed_at - started_at).total_seconds() * 1000),
            step_count=len(version.steps),
            succeeded_step_count=succeeded_count,
            failed_step_count=failed_count,
            skipped_step_count=0,
            retry_count=0,
        )

        await self._events.record(
            organization_id=workflow.organization_id,
            workflow_id=workflow.id,
            execution_id=execution.id,
            event_type=WorkflowEventType.EXECUTION_COMPLETED,
            actor_user_id=user.id,
        )

        refreshed = await self._executions.get_by_id(execution.id)

        assert refreshed is not None

        return refreshed, version.steps

    async def _organization_id_for(
        self,
        user: User,
    ) -> uuid.UUID:
        membership = await self._memberships.get_for_user(user.id)

        if membership is None:
            raise WorkflowNotFoundError(user.id)

        return membership.organization_id
