"""Async database engine, session factory, and the request-scoped session dependency.

Why a single module owns all three: the engine must be created exactly once per
process (it owns a connection pool), the sessionmaker must be bound to that engine,
and every request needs a *fresh* session that is guaranteed to close. Splitting
these across files invites a second engine getting created by accident.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings


@lru_cache
def get_engine() -> AsyncEngine:
    """Return the process-wide async engine.

    ``lru_cache`` mirrors ``get_settings``: a lazily-built singleton. Tests
    never call this — they build their own engine against SQLite and construct
    a session factory directly, bypassing the process-wide cache entirely.
    """
    settings = get_settings()
    return create_async_engine(settings.database_url, pool_pre_ping=True)


def build_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    """Build a sessionmaker bound to a given engine.

    Exposed separately from ``get_db`` so tests can point a sessionmaker at an
    in-memory SQLite engine without touching the production engine cache.
    """
    return async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency yielding one session per request.

    Commits on clean exit, rolls back on exception, always closes — a route or
    service that raises never leaves a half-written transaction behind.
    """
    session_factory = build_session_factory(get_engine())
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
