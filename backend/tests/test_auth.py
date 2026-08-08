from __future__ import annotations

from httpx import AsyncClient


def _register_payload(email: str = "amara@halcyon.co") -> dict[str, str]:
    return {
        "email": email,
        "password": "correct-horse-battery",
        "full_name": "Amara Cole",
        "workspace_name": "Halcyon Partners",
    }


async def test_register_creates_user_and_org(client: AsyncClient) -> None:
    response = await client.post("/api/v1/auth/register", json=_register_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "amara@halcyon.co"
    assert body["user"]["organization_name"] == "Halcyon Partners"
    assert body["user"]["role"] == "OWNER"
    assert body["access_token"]
    assert body["refresh_token"]


async def test_register_duplicate_email_conflict(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json=_register_payload())
    response = await client.post("/api/v1/auth/register", json=_register_payload())
    assert response.status_code == 409


async def test_login_success(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json=_register_payload())
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "amara@halcyon.co", "password": "correct-horse-battery"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "amara@halcyon.co"


async def test_login_wrong_password(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json=_register_payload())
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "amara@halcyon.co", "password": "wrong-password"},
    )
    assert response.status_code == 401


async def test_login_unknown_email(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@nowhere.com", "password": "whatever123"},
    )
    assert response.status_code == 401


async def test_refresh_rotates_token(client: AsyncClient) -> None:
    register = await client.post("/api/v1/auth/register", json=_register_payload())
    old_refresh = register.json()["refresh_token"]

    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert response.status_code == 200
    body = response.json()
    assert body["refresh_token"] != old_refresh
    assert body["access_token"]


async def test_refresh_reuse_of_rotated_token_revokes_all(client: AsyncClient) -> None:
    register = await client.post("/api/v1/auth/register", json=_register_payload())
    old_refresh = register.json()["refresh_token"]

    first = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    new_refresh = first.json()["refresh_token"]

    reuse = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert reuse.status_code == 401

    chained = await client.post("/api/v1/auth/refresh", json={"refresh_token": new_refresh})
    assert chained.status_code == 401


async def test_refresh_invalid_token(client: AsyncClient) -> None:
    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": "not-a-real-token"})
    assert response.status_code == 401


async def test_logout_revokes_token(client: AsyncClient) -> None:
    register = await client.post("/api/v1/auth/register", json=_register_payload())
    refresh_token = register.json()["refresh_token"]

    logout = await client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
    assert logout.status_code == 204

    reuse = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert reuse.status_code == 401


async def test_me_requires_valid_token(client: AsyncClient) -> None:
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401

    response = await client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer garbage-token"}
    )
    assert response.status_code == 401


async def test_me_returns_current_user(client: AsyncClient) -> None:
    register = await client.post("/api/v1/auth/register", json=_register_payload())
    access_token = register.json()["access_token"]

    response = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "amara@halcyon.co"
