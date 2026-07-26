"""Health endpoints.

Two distinct endpoints because they answer two distinct operational questions:

* ``GET /healthz`` (mounted at the app root, unversioned) — *liveness*.
  "Is the process up?" Used by container orchestrators; must never touch
  external dependencies, so it cannot flap when the database blips.
* ``GET /api/v1/health`` — *readiness/info*. Returns service metadata and,
  in later milestones, dependency checks (database, redis). Versioned like
  every other API surface.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.config import Settings, get_settings

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    name: str
    version: str
    environment: str


@router.get("/health", response_model=HealthResponse)
async def read_health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Service metadata + readiness. Dependency checks land in Milestone 2."""
    return HealthResponse(
        status="ok",
        name=settings.app_name,
        version=settings.version,
        environment=settings.environment,
    )
