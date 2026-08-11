"""The seam between workflow execution and provider integrations.

``WorkflowService`` only ever depends on ``ActionExecutor`` and
``ActionExecutionResult`` from this module — never on a concrete provider
like Gmail. Wiring a new provider means implementing this protocol and
registering it in ``app.integrations.registry``; nothing in the execution
loop changes.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class ActionExecutionResult:
    """What an executor hands back to ``WorkflowService`` for one step.

    ``succeeded`` drives the ``ExecutionStep`` status transition;  ``result``
    is stored verbatim as the step's structured result (must contain no
    secrets); ``error_message`` is only meaningful when ``succeeded`` is
    ``False``.
    """

    succeeded: bool
    result: dict
    error_message: str | None = None


class ActionExecutor(Protocol):
    async def execute(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        params: dict,
        previous_result: dict | None,
    ) -> ActionExecutionResult:
        """Run one workflow step for real.

        ``previous_result`` is the ``ExecutionStep.result`` from the attempt
        being retried (``None`` on a first attempt) — executors that support
        partial completion (bulk sends) use it to avoid repeating work that
        already succeeded.
        """
        ...
