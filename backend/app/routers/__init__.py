"""HTTP layer. Routers translate HTTP <-> domain and contain no business logic.

Every router is mounted under ``/api/v1`` by the aggregate ``api_router`` so
the API can evolve behind a version boundary without breaking clients.
"""

from fastapi import APIRouter

from app.routers import auth, connections, health, recipients, workflows

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(workflows.router)
api_router.include_router(connections.router)
api_router.include_router(recipients.router)
