"""Health + middleware behavior tests."""

from __future__ import annotations

from httpx import AsyncClient


async def test_liveness_returns_alive(client: AsyncClient) -> None:
    response = await client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}


async def test_versioned_health_reports_metadata(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["environment"] == "test"
    assert body["version"]


async def test_every_response_carries_a_request_id(client: AsyncClient) -> None:
    response = await client.get("/healthz")
    assert response.headers.get("X-Request-ID")


async def test_inbound_request_id_is_honored(client: AsyncClient) -> None:
    response = await client.get("/healthz", headers={"X-Request-ID": "trace-me-123"})
    assert response.headers["X-Request-ID"] == "trace-me-123"
