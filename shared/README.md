# shared/

Cross-runtime artifacts. The source of truth for the API contract is the
backend's OpenAPI schema; Milestone 6 adds a script that generates TypeScript
types from it into this folder, so the frontend can never silently drift from
the backend contract. Nothing here is hand-written.
