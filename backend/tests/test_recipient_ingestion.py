"""CSV/XLSX recipient parsing and validation, and the /recipients/parse endpoint."""

from __future__ import annotations

import io

import pytest
from httpx import AsyncClient
from openpyxl import Workbook

from app.services.recipient_ingestion import RecipientFileError, parse_recipient_file


def _csv_bytes(text: str) -> bytes:
    return text.encode("utf-8")


def _xlsx_bytes(rows: list[list[str]]) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    for row in rows:
        sheet.append(row)
    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


async def _auth_headers(client: AsyncClient, email: str = "amara@halcyon.co") -> dict[str, str]:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "correct-horse-battery",
            "full_name": "Amara Cole",
            "workspace_name": "Halcyon Partners",
        },
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_parse_csv_valid_recipients() -> None:
    content = _csv_bytes(
        "email,name,company\njohn@example.com,John,Acme\nmary@example.com,Mary,Example Ltd\n"
    )
    result = parse_recipient_file(filename="list.csv", content=content)
    assert [r.email for r in result.recipients] == ["john@example.com", "mary@example.com"]
    assert result.issues == []
    assert result.recipients[0].variables == {"name": "John", "company": "Acme"}


def test_parse_csv_missing_email_column_raises() -> None:
    content = _csv_bytes("name,company\nJohn,Acme\n")
    with pytest.raises(RecipientFileError, match="email column"):
        parse_recipient_file(filename="list.csv", content=content)


def test_parse_csv_malformed_email_is_a_row_issue_not_a_crash() -> None:
    content = _csv_bytes("email,name\nnot-an-email,John\ngood@example.com,Mary\n")
    result = parse_recipient_file(filename="list.csv", content=content)
    assert [r.email for r in result.recipients] == ["good@example.com"]
    assert len(result.issues) == 1
    assert "invalid email" in result.issues[0].reason


def test_parse_csv_empty_rows_are_skipped() -> None:
    content = _csv_bytes("email,name\njohn@example.com,John\n,\n")
    result = parse_recipient_file(filename="list.csv", content=content)
    assert len(result.recipients) == 1
    assert result.issues[0].reason == "empty row"


def test_parse_csv_duplicate_emails_keep_only_first() -> None:
    content = _csv_bytes("email,name\njohn@example.com,John\nJOHN@EXAMPLE.COM,Johnny\n")
    result = parse_recipient_file(filename="list.csv", content=content)
    assert len(result.recipients) == 1
    assert result.recipients[0].variables["name"] == "John"
    assert result.issues[0].reason == "duplicate email"


def test_parse_xlsx_valid_recipients() -> None:
    content = _xlsx_bytes(
        [
            ["email", "name", "company"],
            ["john@example.com", "John", "Acme"],
            ["mary@example.com", "Mary", "Example Ltd"],
        ]
    )
    result = parse_recipient_file(filename="list.xlsx", content=content)
    assert len(result.recipients) == 2
    assert result.recipients[1].variables == {"name": "Mary", "company": "Example Ltd"}


def test_parse_xlsx_with_missing_email_column_raises() -> None:
    content = _xlsx_bytes([["name"], ["John"]])
    with pytest.raises(RecipientFileError, match="email column"):
        parse_recipient_file(filename="list.xlsx", content=content)


def test_unsupported_file_type_rejected() -> None:
    with pytest.raises(RecipientFileError, match="Unsupported file type"):
        parse_recipient_file(filename="list.txt", content=b"whatever")


def test_empty_file_rejected() -> None:
    with pytest.raises(RecipientFileError):
        parse_recipient_file(filename="list.csv", content=b"")


def test_oversized_file_rejected() -> None:
    content = b"email,name\n" + b"#" * (5 * 1024 * 1024 + 1)
    with pytest.raises(RecipientFileError, match="exceeds"):
        parse_recipient_file(filename="list.csv", content=content)


async def test_recipients_parse_endpoint_returns_normalized_rows(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    content = _csv_bytes("email,name\njohn@example.com,John\nbad-email,X\n")
    response = await client.post(
        "/api/v1/recipients/parse",
        headers=headers,
        files={"file": ("list.csv", content, "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total_rows"] == 2
    assert body["valid_count"] == 1
    assert body["issue_count"] == 1
    assert body["recipients"][0]["email"] == "john@example.com"


async def test_recipients_parse_requires_auth(client: AsyncClient) -> None:
    content = _csv_bytes("email\njohn@example.com\n")
    response = await client.post(
        "/api/v1/recipients/parse", files={"file": ("list.csv", content, "text/csv")}
    )
    assert response.status_code == 401


async def test_recipients_parse_rejects_unsupported_type(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    response = await client.post(
        "/api/v1/recipients/parse",
        headers=headers,
        files={"file": ("list.pdf", b"whatever", "application/pdf")},
    )
    assert response.status_code == 400
