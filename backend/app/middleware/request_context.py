"""Request correlation middleware.

Every request gets a request ID (honoring an inbound ``X-Request-ID`` from a
trusted proxy, else generating one). The ID is:

1. bound into structlog's contextvars, so *every* log line emitted while
   handling the request carries ``request_id`` automatically, and
2. echoed back on the response, so a user-reported failure can be traced to
   the exact server-side log lines.

We also emit exactly one access-log event per request with method, path,
status and duration — structured, so it is queryable, unlike uvicorn's
default access log line.
"""

from __future__ import annotations

import time
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import get_logger

REQUEST_ID_HEADER = "X-Request-ID"

logger = get_logger("dispatch.request")


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Binds a correlation ID to the logging context for the request's lifetime."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER) or uuid.uuid4().hex

        # clear_contextvars prevents context leaking between requests that are
        # served by the same event-loop task.
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        started = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - started) * 1000, 2)

        response.headers[REQUEST_ID_HEADER] = request_id
        logger.info(
            "request.completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
        )
        return response
