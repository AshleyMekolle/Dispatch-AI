"""Structured logging setup built on structlog.

Design decisions (interview talking points):

* **structlog over stdlib logging formatting** — log events are key/value
  pairs, not interpolated strings. That makes them machine-searchable
  ("show me all events where execution_id=X") which is a hard requirement
  for the execution history feature.
* **contextvars binding** — request/execution identifiers are bound once
  (by middleware or the worker) and automatically appear on every log line
  emitted anywhere below that point in the call stack. No "pass the logger
  down" plumbing.
* **Renderer switches on environment** — pretty console output for humans in
  development, single-line JSON in production so a log shipper can ingest it.
"""

from __future__ import annotations

import logging
import sys

import structlog

from app.core.config import Settings


def configure_logging(settings: Settings) -> None:
    """Configure stdlib + structlog once at application startup.

    Idempotent: calling it twice (e.g. app factory in tests) simply
    reconfigures with the same result.
    """
    shared_processors: list[structlog.typing.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    renderer: structlog.typing.Processor
    if settings.logs_as_json:
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelNamesMapping().get(settings.log_level.upper(), logging.INFO)
        ),
        logger_factory=structlog.PrintLoggerFactory(sys.stdout),
        cache_logger_on_first_use=True,
    )

    # Route stdlib loggers (uvicorn, sqlalchemy, ...) through a plain handler at
    # the same level so third-party logs are not silently dropped.
    logging.basicConfig(
        level=settings.log_level.upper(),
        format="%(message)s",
        stream=sys.stdout,
        force=True,
    )


def get_logger(name: str) -> structlog.typing.FilteringBoundLogger:
    """Project-standard way to obtain a logger; keeps call sites uniform.

    The name is bound as a ``logger`` field (rather than relying on stdlib
    logger plumbing) so it appears in JSON output like any other key.
    """
    return structlog.get_logger().bind(logger=name)
