"""Shared test fixtures.

Tests construct the app through the factory with explicit test settings —
they never read the developer's real environment or ``.env`` file, which is
what makes the suite deterministic on any machine (and in CI).
"""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def settings() -> Settings:
    return Settings(
        environment="test",
        secret_key="test-secret-key-not-for-production",
        _env_file=None,  # ensure a developer's local .env cannot leak into tests
    )


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[AsyncClient]:
    app = create_app(settings)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
