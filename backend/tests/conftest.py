"""Shared test fixtures.

Tests construct the app through the factory with explicit test settings —
they never read the developer's real environment or ``.env`` file, which is
what makes the suite deterministic on any machine (and in CI).
"""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import Settings
from app.core.db import build_session_factory, get_db
from app.main import create_app

# Imported for their side effect of registering tables on Base.metadata —
# create_all below needs every model class to have been imported at least
# once, and relying on transitive imports through the app is fragile.
from app.models import organization, refresh_token, user  # noqa: F401
from app.models.base import Base


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

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = build_session_factory(engine)

    async def override_get_db() -> AsyncIterator[AsyncSession]:
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    await engine.dispose()
