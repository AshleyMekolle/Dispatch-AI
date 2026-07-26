"""Import every model module so they all register on ``Base.metadata`` and in
the shared declarative registry before any mapper is configured or any
Alembic autogenerate diff runs. Cross-module relationships (e.g.
``Membership.user`` -> ``User``) rely on every class having been imported by
the time SQLAlchemy resolves them — this module is what guarantees that.
"""

from app.models.base import Base, CreatedAtMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.connection import Connection
from app.models.enums import (
    ExecutionStatus,
    IntegrationProvider,
    OrgRole,
    StepStatus,
    WorkflowEventType,
    WorkflowVersionStatus,
)
from app.models.event import WorkflowEvent
from app.models.execution import Execution, ExecutionMetrics, ExecutionStep
from app.models.organization import Membership, Organization
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.models.workflow import Workflow, WorkflowStep, WorkflowVersion

__all__ = [
    "Base",
    "Connection",
    "CreatedAtMixin",
    "Execution",
    "ExecutionMetrics",
    "ExecutionStatus",
    "ExecutionStep",
    "IntegrationProvider",
    "Membership",
    "OrgRole",
    "Organization",
    "RefreshToken",
    "StepStatus",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    "User",
    "Workflow",
    "WorkflowEvent",
    "WorkflowEventType",
    "WorkflowStep",
    "WorkflowVersion",
    "WorkflowVersionStatus",
]
