"""Turns an uploaded CSV/XLSX recipient list into normalized, validated rows
a caller can pass straight into a ``send_bulk_email`` workflow's
``recipients`` param.

Parsing itself never touches the database or any provider — see
``app.services.recipient_ingestion`` for the actual parsing/validation logic;
this router only adapts it to HTTP (auth-gated, size-capped upload in,
structured JSON out).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.user import User
from app.services.recipient_ingestion import (
    RecipientFileError,
    RecipientParseResult,
    parse_recipient_file,
)

router = APIRouter(prefix="/recipients", tags=["recipients"])

_MAX_UPLOAD_BYTES = 5 * 1024 * 1024


class RecipientOut(BaseModel):
    email: str
    variables: dict[str, str]


class RecipientRowIssueOut(BaseModel):
    row_number: int
    reason: str
    email: str | None


class RecipientParseResponse(BaseModel):
    recipients: list[RecipientOut]
    issues: list[RecipientRowIssueOut]
    total_rows: int
    valid_count: int
    issue_count: int


def _response(result: RecipientParseResult) -> RecipientParseResponse:
    return RecipientParseResponse(
        recipients=[
            RecipientOut(email=recipient.email, variables=recipient.variables)
            for recipient in result.recipients
        ],
        issues=[
            RecipientRowIssueOut(
                row_number=issue.row_number, reason=issue.reason, email=issue.email
            )
            for issue in result.issues
        ],
        total_rows=result.total_rows,
        valid_count=len(result.recipients),
        issue_count=len(result.issues),
    )


@router.post("/parse", response_model=RecipientParseResponse)
async def parse_recipients(
    file: UploadFile,
    user: User = Depends(get_current_user),
) -> RecipientParseResponse:
    if file.size is not None and file.size > _MAX_UPLOAD_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File is too large.")

    content = await file.read()
    try:
        result = parse_recipient_file(filename=file.filename or "", content=content)
    except RecipientFileError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from None

    return _response(result)
