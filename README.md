# Dispatch

AI-assisted workflow automation. Describe business work in plain English —
Dispatch generates a structured plan, waits for your approval, executes each
step across your business apps, and records every state transition.

**The AI only writes the plan. The workflow engine is the product**: approval
gates, a persisted step lifecycle, retries, cancellation, and a searchable
execution history are all deterministic engineering.

## Repository layout

```
dispatch/
├── frontend/   Next.js 15 + React 19 + Tailwind v4 (product UI)
├── backend/    FastAPI + SQLAlchemy + Pydantic v2 (API + domain)
├── worker/     Background execution entrypoint (ARQ) — Milestone 5
├── shared/     Cross-runtime artifacts (generated API types)
├── docs/       Architecture, ADRs, ERD, sequence diagrams
├── scripts/    Developer tooling
└── .github/    CI (lint, format, types, tests, build)
```

## Quickstart

Prerequisites: Node 22+, Python 3.13+, Docker.

```bash
# Infrastructure (PostgreSQL 17 + Redis 8)
docker compose up -d postgres redis

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # .venv\Scripts\activate on Windows
pip install -e . --group dev
cp .env.example .env
uvicorn app.main:create_app --factory --reload                        # http://localhost:8000/docs

# Frontend
cd frontend
npm install
npm run dev                                          # http://localhost:3000
```

## Development commands

| Task            | Backend (`backend/`)      | Frontend (`frontend/`) |
| --------------- | ------------------------- | ---------------------- |
| Run dev server  | `uvicorn app.main:create_app --factory --reload` | `npm run dev`    |
| Tests           | `pytest`                  | `npm test` *(M7)*      |
| Lint            | `ruff check .`            | `npm run lint`         |
| Format          | `ruff format .`           | `npx prettier -w .`    |

## Documentation

- [Architecture & decision records](docs/architecture.md)
- API reference: interactive OpenAPI docs at `/docs` when the backend runs

## Status

Built milestone-by-milestone; each milestone lands green (lint + tests + build).

- [x] **M1** — Monorepo, FastAPI foundation (config validation, structured logging, request correlation, health probes), Docker Compose, CI
- [ ] **M2** — Data layer: SQLAlchemy models, Alembic migrations, repositories
- [ ] **M3** — Auth: JWT + rotating refresh tokens, rate limiting
- [ ] **M4** — AI plan generation (strict Pydantic validation) + workflow API
- [ ] **M5** — Execution engine: ARQ worker, step lifecycle, integration adapters (Drive, Gmail, Slack)
- [ ] **M6** — Frontend integration: React Query, real APIs end-to-end
- [ ] **M7** — Test hardening (80%+ backend coverage, Playwright E2E), full docs
