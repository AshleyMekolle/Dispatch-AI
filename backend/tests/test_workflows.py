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
    access_token = response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


async def test_create_send_email_workflow(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    response = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "send_email",
            "params": {"to": "lead@example.com", "subject": "Hi", "body": "Following up."},
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "DRAFT"
    assert len(body["steps"]) == 1
    assert body["steps"][0]["provider"] == "GMAIL"


async def test_create_calendar_event_workflow(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    response = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "create_calendar_event",
            "params": {
                "title": "Kickoff",
                "start_time": "2026-09-01T10:00:00Z",
                "attendees": ["a@example.com"],
            },
        },
    )
    assert response.status_code == 201
    assert response.json()["steps"][0]["provider"] == "GOOGLE_CALENDAR"


async def test_create_notion_page_workflow(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    response = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "create_notion_page",
            "params": {"title": "Notes", "content": "Some content."},
        },
    )
    assert response.status_code == 201
    assert response.json()["steps"][0]["provider"] == "NOTION"


async def test_create_unknown_action_type(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    response = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={"action_type": "launch_missiles", "params": {}},
    )
    assert response.status_code == 400


async def test_create_invalid_params(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    response = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={"action_type": "send_email", "params": {"subject": "Hi"}},
    )
    assert response.status_code == 400


async def test_list_workflows(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "send_email",
            "params": {"to": "lead@example.com", "subject": "Hi", "body": "Following up."},
        },
    )
    response = await client.get("/api/v1/workflows", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_approve_then_reapprove_conflicts(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    create = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "send_email",
            "params": {"to": "lead@example.com", "subject": "Hi", "body": "Following up."},
        },
    )
    workflow_id = create.json()["id"]

    approve = await client.post(f"/api/v1/workflows/{workflow_id}/approve", headers=headers)
    assert approve.status_code == 200
    assert approve.json()["status"] == "APPROVED"

    reapprove = await client.post(f"/api/v1/workflows/{workflow_id}/approve", headers=headers)
    assert reapprove.status_code == 409


async def test_execute_before_approval_conflicts(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    create = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "send_email",
            "params": {"to": "lead@example.com", "subject": "Hi", "body": "Following up."},
        },
    )
    workflow_id = create.json()["id"]

    response = await client.post(f"/api/v1/workflows/{workflow_id}/executions", headers=headers)
    assert response.status_code == 409


async def test_execute_after_approval_succeeds(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    create = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "send_email",
            "params": {"to": "lead@example.com", "subject": "Hi", "body": "Following up."},
        },
    )
    workflow_id = create.json()["id"]
    await client.post(f"/api/v1/workflows/{workflow_id}/approve", headers=headers)

    response = await client.post(f"/api/v1/workflows/{workflow_id}/executions", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "SUCCESS"
    assert len(body["steps"]) == 1
    assert body["steps"][0]["status"] == "SUCCESS"
    assert body["steps"][0]["result"]["simulated"] is True


async def test_list_workflows_includes_status_and_action(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "create_notion_page",
            "params": {"title": "Notes", "content": "Some content."},
        },
    )
    response = await client.get("/api/v1/workflows", headers=headers)
    assert response.status_code == 200
    summary = response.json()[0]
    assert summary["status"] == "DRAFT"
    assert summary["action_type"] == "create_notion_page"
    assert summary["provider"] == "NOTION"


async def test_list_executions_empty_before_any_run(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    response = await client.get("/api/v1/workflows/executions", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


async def test_list_executions_after_run(client: AsyncClient) -> None:
    headers = await _auth_headers(client)
    create = await client.post(
        "/api/v1/workflows",
        headers=headers,
        json={
            "action_type": "send_email",
            "params": {"to": "lead@example.com", "subject": "Hi", "body": "Following up."},
        },
    )
    workflow_id = create.json()["id"]
    await client.post(f"/api/v1/workflows/{workflow_id}/approve", headers=headers)
    await client.post(f"/api/v1/workflows/{workflow_id}/executions", headers=headers)

    response = await client.get("/api/v1/workflows/executions", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["workflow_id"] == workflow_id
    assert body[0]["status"] == "SUCCESS"
