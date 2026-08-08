"""Domain enums, backed by native Postgres ``ENUM`` types.

Each Python enum's member *value* equals its *name* (``OWNER = "OWNER"``) so the
same enum can be reused directly as a Pydantic field later without a second
value mapping. On SQLAlchemy dialects without native enum support (SQLite, used
in the fast unit-test suite) these fall back automatically to
``VARCHAR`` + ``CHECK`` constraint — no special-casing required.
"""

from __future__ import annotations

import enum


class OrgRole(enum.StrEnum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"


class IntegrationProvider(enum.StrEnum):
    GOOGLE_DRIVE = "GOOGLE_DRIVE"
    GMAIL = "GMAIL"
    SLACK = "SLACK"
    GOOGLE_CALENDAR = "GOOGLE_CALENDAR"
    NOTION = "NOTION"


class WorkflowVersionStatus(enum.StrEnum):
    DRAFT = "DRAFT"
    APPROVED = "APPROVED"


class ExecutionStatus(enum.StrEnum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class StepStatus(enum.StrEnum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"
    CANCELLED = "CANCELLED"


class WorkflowEventType(enum.StrEnum):
    WORKFLOW_CREATED = "WORKFLOW_CREATED"
    WORKFLOW_VERSION_CREATED = "WORKFLOW_VERSION_CREATED"
    WORKFLOW_APPROVED = "WORKFLOW_APPROVED"
    EXECUTION_STARTED = "EXECUTION_STARTED"
    STEP_STARTED = "STEP_STARTED"
    STEP_COMPLETED = "STEP_COMPLETED"
    STEP_FAILED = "STEP_FAILED"
    EXECUTION_COMPLETED = "EXECUTION_COMPLETED"
    EXECUTION_CANCELLED = "EXECUTION_CANCELLED"
