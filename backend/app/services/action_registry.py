"""Action type definitions: the params schema and provider for every
``action_type`` a workflow step can have.

Lives apart from ``workflow_service.py`` so provider-specific integration
modules (``app.integrations.gmail``) can import these Pydantic models without
importing the workflow service itself — ``workflow_service`` depends on
``app.integrations`` (to look up an executor at run time), so the reverse
dependency would be circular.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import IntegrationProvider

# Direct-JSON bulk sends (not routed through the CSV/XLSX ingestion endpoint)
# are capped here — a business sending to more recipients should go through
# file upload, which is where real-world list sizes belong.
_MAX_BULK_RECIPIENTS = 500


class SendEmailParams(BaseModel):
    to: EmailStr
    subject: str = Field(min_length=1, max_length=300)
    body: str = Field(min_length=1, max_length=10000)


class CreateCalendarEventParams(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    start_time: datetime
    attendees: list[EmailStr] = Field(default_factory=list)


class CreateNotionPageParams(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    content: str = Field(min_length=1, max_length=10000)


class RecipientIn(BaseModel):
    """One bulk-send recipient. Any column beyond ``email`` (name, company,
    ...) is kept as-is and becomes a ``{{variable}}`` available when
    rendering that recipient's subject/body.
    """

    model_config = ConfigDict(extra="allow")

    email: EmailStr


class SendBulkEmailParams(BaseModel):
    recipients: list[RecipientIn] = Field(min_length=1, max_length=_MAX_BULK_RECIPIENTS)
    subject: str = Field(min_length=1, max_length=300)
    body: str = Field(min_length=1, max_length=10000)

    @field_validator("recipients")
    @classmethod
    def _reject_duplicate_emails(cls, recipients: list[RecipientIn]) -> list[RecipientIn]:
        seen: set[str] = set()
        duplicates: set[str] = set()
        for recipient in recipients:
            normalized = recipient.email.lower()
            if normalized in seen:
                duplicates.add(normalized)
            seen.add(normalized)
        if duplicates:
            raise ValueError(f"Duplicate recipient email(s): {', '.join(sorted(duplicates))}")
        return recipients


@dataclass(frozen=True)
class ActionSpec:
    label: str
    provider: IntegrationProvider
    params_model: type[BaseModel]


ACTION_REGISTRY: dict[str, ActionSpec] = {
    "send_email": ActionSpec(
        "Send an email",
        IntegrationProvider.GMAIL,
        SendEmailParams,
    ),
    "send_bulk_email": ActionSpec(
        "Send a bulk email",
        IntegrationProvider.GMAIL,
        SendBulkEmailParams,
    ),
    "create_calendar_event": ActionSpec(
        "Create a calendar event",
        IntegrationProvider.GOOGLE_CALENDAR,
        CreateCalendarEventParams,
    ),
    "create_notion_page": ActionSpec(
        "Create a Notion page",
        IntegrationProvider.NOTION,
        CreateNotionPageParams,
    ),
}
