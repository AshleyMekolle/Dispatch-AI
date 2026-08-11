"""Maps an ``action_type`` to a real ``ActionExecutor``, if one exists.

``WorkflowService.execute()`` calls ``get_action_executor`` for every step;
a ``None`` result means "no real integration is wired up yet" and it falls
back to the existing simulated execution — this is what keeps Calendar and
Notion actions working unchanged while only Gmail actions run for real.
"""

from __future__ import annotations

from collections.abc import Callable

from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.action_executor import ActionExecutor
from app.integrations.gmail.executor import GmailSendBulkEmailExecutor, GmailSendEmailExecutor

_EXECUTOR_FACTORIES: dict[str, Callable[[AsyncSession], ActionExecutor]] = {
    "send_email": GmailSendEmailExecutor,
    "send_bulk_email": GmailSendBulkEmailExecutor,
}


def get_action_executor(action_type: str, session: AsyncSession) -> ActionExecutor | None:
    factory = _EXECUTOR_FACTORIES.get(action_type)
    return factory(session) if factory is not None else None
