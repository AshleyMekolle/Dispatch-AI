"""Application factory.

Why a factory instead of a module-level ``app = FastAPI()``:

* **Testability** — each test can build a fresh app with injected settings;
  no global state bleeds between tests.
* **No import-time side effects** — importing ``app.main`` never opens
  database connections or reads the environment; that happens only when
  ``create_app()`` is called.
* **Multiple entrypoints** — the API server and (later) the worker can share
  wiring code without one dragging in the other's runtime.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import Settings, get_settings
from app.core.logging import configure_logging, get_logger
from app.middleware.request_context import RequestContextMiddleware
from app.routers import api_router

logger = get_logger("dispatch.app")


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build and wire the FastAPI application.

    Args:
        settings: Optional explicit settings (used by tests). Falls back to
            environment-derived settings for normal runs.
    """
    explicit_settings = settings
    settings = settings or get_settings()
    configure_logging(settings)

    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        # Hide interactive docs in production; they are a dev/staging tool.
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url=None,
    )

    # Middleware order matters: CORS must wrap everything so even error
    # responses carry CORS headers; request context sits inside it so the
    # request_id is bound for all application code.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestContextMiddleware)

    # When settings are injected explicitly (tests), route dependencies that
    # ask for ``get_settings`` must receive the same instance — otherwise the
    # app would be configured one way and its routes another.
    if explicit_settings is not None:
        app.dependency_overrides[get_settings] = lambda: explicit_settings

    app.include_router(api_router)

    @app.get("/healthz", include_in_schema=False)
    async def healthz() -> dict[str, str]:
        """Liveness probe: process is up. Never checks dependencies."""
        return {"status": "alive"}

    logger.info("app.created", environment=settings.environment)
    return app


# No module-level ``app = create_app()`` on purpose: that would reintroduce the
# import-time side effects the factory exists to prevent (tests importing this
# module would boot a fully-configured app). Uvicorn supports factories natively:
#
#   uvicorn app.main:create_app --factory --reload
