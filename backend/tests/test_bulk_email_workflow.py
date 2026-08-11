"""send_email / send_bulk_email workflow creation: schema validation,
duplicate recipients, and that a recipient's extra columns round-trip as
template variables. Execution against the real Gmail API is covered by
test_gmail_execution.py.
"""

from __future__ import annotations

from httpx import AsyncClient


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


async def test_create_send_email_rejects_invalid_address(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    response = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "send_email",
            "params": {"to": "not-an-email", "subject": "Hi", "body": "Hello"},
        },
    )
    assert response.status_code == 400


async def test_create_bulk_email_workflow(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    response = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "send_bulk_email",
            "params": {
                "recipients": [
                    {"email": "john@example.com", "name": "John", "company": "Acme"},
                    {"email": "mary@example.com", "name": "Mary", "company": "Example Ltd"},
                ],
                "subject": "Welcome {{name}}",
                "body": "Hi {{name}}, welcome to Dispatch.",
            },
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["steps"][0]["provider"] == "GMAIL"
    assert body["steps"][0]["action_type"] == "send_bulk_email"
    recipients = body["steps"][0]["params"]["recipients"]
    assert recipients[0]["email"] == "john@example.com"
    assert recipients[0]["company"] == "Acme"


async def test_create_bulk_email_rejects_duplicate_recipients(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    response = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "send_bulk_email",
            "params": {
                "recipients": [
                    {"email": "john@example.com", "name": "John"},
                    {"email": "JOHN@example.com", "name": "Duplicate"},
                ],
                "subject": "Hi {{name}}",
                "body": "Hello {{name}}",
            },
        },
    )
    assert response.status_code == 400


async def test_create_bulk_email_rejects_invalid_recipient_email(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    response = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "send_bulk_email",
            "params": {
                "recipients": [{"email": "not-an-email", "name": "John"}],
                "subject": "Hi",
                "body": "Hello",
            },
        },
    )
    assert response.status_code == 400


async def test_create_bulk_email_rejects_empty_recipients(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    response = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "send_bulk_email",
            "params": {"recipients": [], "subject": "Hi", "body": "Hello"},
        },
    )
    assert response.status_code == 400


async def test_create_bulk_email_rejects_missing_subject(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    response = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "send_bulk_email",
            "params": {
                "recipients": [{"email": "john@example.com"}],
                "body": "Hello",
            },
        },
    )
    assert response.status_code == 400


async def test_list_workflows_shows_bulk_email_action(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "send_bulk_email",
            "params": {
                "recipients": [{"email": "john@example.com", "name": "John"}],
                "subject": "Hi {{name}}",
                "body": "Hello {{name}}",
            },
        },
    )
    response = await client.get("/api/v1/workflows", headers=headers)
    assert response.status_code == 200
    summary = response.json()[0]
    assert summary["action_type"] == "send_bulk_email"
    assert summary["provider"] == "GMAIL"
