# Multi-stage build: the builder stage compiles wheels once; the runtime stage
# stays slim and contains no compilers or build caches.
FROM python:3.13-slim AS builder

WORKDIR /build
COPY pyproject.toml ./
COPY app ./app

RUN pip install --no-cache-dir build && python -m build --wheel


FROM python:3.13-slim AS runtime

# Run as a non-root user: containers that run as root turn any app compromise
# into a host-adjacent problem.
RUN useradd --create-home --uid 1000 dispatch
USER dispatch
WORKDIR /srv

COPY --from=builder /build/dist/*.whl /tmp/
RUN pip install --no-cache-dir --user /tmp/*.whl && rm /tmp/*.whl
COPY --chown=dispatch:dispatch alembic.ini ./alembic.ini
COPY --chown=dispatch:dispatch alembic ./alembic

ENV PATH="/home/dispatch/.local/bin:${PATH}"

EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000"]
