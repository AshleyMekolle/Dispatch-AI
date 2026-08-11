"""Connecting and disconnecting third-party accounts.

Gmail is the only provider wired up today, but the shape (authorize -> Google
consent -> callback -> stored ``Connection``) is the same one Calendar and
Notion will use, so the URL structure is namespaced per-provider
(``/connections/gmail/...``) up front rather than assuming Gmail forever.

Never returns ``access_token``/``refresh_token`` in a response — ``ConnectionOut``
simply has no field for them, which is the same "encrypted at rest, absent
from schemas" pattern used everywhere else credentials are stored.
"""

from __future__ import annotations

import uuid
from datetime import datetime

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.db import get_db
from app.core.security import create_oauth_state_token, decode_oauth_state_token, get_current_user
from app.integrations.gmail.connection_service import GmailConnectionService
from app.integrations.gmail.errors import GmailAuthError
from app.integrations.gmail.oauth import GoogleOAuthClient
from app.models.connection import Connection
from app.models.enums import IntegrationProvider
from app.models.organization import Membership
from app.models.user import User
from app.repositories.connection_repository import ConnectionRepository
from app.repositories.organization_repository import MembershipRepository

router = APIRouter(prefix="/connections", tags=["connections"])


class AuthorizeUrlOut(BaseModel):
    url: str


class ConnectionOut(BaseModel):
    id: uuid.UUID
    provider: IntegrationProvider
    external_account_email: str | None
    connected_at: datetime


def _connection_out(connection: Connection) -> ConnectionOut:
    return ConnectionOut(
        id=connection.id,
        provider=connection.provider,
        external_account_email=connection.external_account_email,
        connected_at=connection.created_at,
    )


async def _membership_or_404(session: AsyncSession, user_id: uuid.UUID) -> Membership:
    membership = await MembershipRepository(session).get_for_user(user_id)
    if membership is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No organization membership found")
    return membership


@router.get("", response_model=list[ConnectionOut])
async def list_connections(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[ConnectionOut]:
    membership = await _membership_or_404(session, user.id)
    connections = await ConnectionRepository(session).list_for_organization(
        membership.organization_id
    )
    return [_connection_out(connection) for connection in connections]


@router.get("/gmail/authorize", response_model=AuthorizeUrlOut)
async def authorize_gmail(
    user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> AuthorizeUrlOut:
    if not settings.google_oauth_client_id:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Gmail integration is not configured"
        )
    state = create_oauth_state_token(user.id, settings)
    oauth_client = GoogleOAuthClient(settings)
    url = oauth_client.authorization_url(state=state, scopes=settings.google_oauth_gmail_scopes)
    return AuthorizeUrlOut(url=url)


def _frontend_redirect(settings: Settings, query: str) -> RedirectResponse:
    return RedirectResponse(
        url=f"{settings.frontend_base_url}/integrations?{query}",
        status_code=status.HTTP_302_FOUND,
    )


@router.get("/gmail/callback", include_in_schema=False)
async def gmail_callback(
    code: str,
    state: str,
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    """Google redirects the browser here directly (not through the frontend),
    so on both success and failure this ends in a redirect back to the
    frontend rather than a JSON response — there is no client-side JS on this
    page able to read a JSON body.
    """
    try:
        user_id = decode_oauth_state_token(state, settings)
    except jwt.InvalidTokenError:
        return _frontend_redirect(settings, "connection_error=invalid_state")

    membership = await MembershipRepository(session).get_for_user(user_id)
    if membership is None:
        return _frontend_redirect(settings, "connection_error=no_membership")

    oauth_client = GoogleOAuthClient(settings)
    try:
        token = await oauth_client.exchange_code(code)
    except GmailAuthError:
        return _frontend_redirect(settings, "connection_error=google_rejected")

    external_account_email = await oauth_client.fetch_user_email(token.access_token)

    await GmailConnectionService(session, oauth_client=oauth_client).store_connection(
        organization_id=membership.organization_id,
        user_id=user_id,
        token=token,
        external_account_email=external_account_email,
    )
    return _frontend_redirect(settings, "connected=gmail")


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(
    connection_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    membership = await _membership_or_404(session, user.id)
    connections = ConnectionRepository(session)
    connection = await connections.get_by_id(connection_id)
    if connection is None or connection.organization_id != membership.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Connection not found")
    await connections.delete(connection)
