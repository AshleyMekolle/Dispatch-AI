"""Redis client access.

One cached client per process, mirroring ``get_engine`` — Redis client instances
are safe to share across requests (they pool connections internally), so there is
no per-request equivalent of ``get_db`` needed here.
"""

from __future__ import annotations

from functools import lru_cache

from redis.asyncio import Redis

from app.core.config import get_settings


@lru_cache
def get_redis() -> Redis:
    settings = get_settings()
    return Redis.from_url(settings.redis_url)
