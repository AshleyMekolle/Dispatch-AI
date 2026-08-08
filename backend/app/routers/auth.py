"""Registration, login, token refresh, logout, and the current user."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.db import get_db
from app.core.security import get_current_user
from app.models.enums import OrgRole
from app.models.organization import Membership, Organization
from app.models.user import User
from app.repositories.organization_repository import MembershipRepository, OrganizationRepository
from app.services.auth_service import (
    AuthService,
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)
    workspace_name: str = Field(min_length=1, max_length=200)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class TokenFields(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_expires_in: int


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    organization_id: uuid.UUID
    organization_name: str
    role: OrgRole


class AuthResponse(TokenFields):
    user: UserOut


def _user_out(user: User, organization: Organization, membership: Membership) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        organization_id=organization.id,
        organization_name=organization.name,
        role=membership.role,
    )


def get_auth_service(
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthService:
    return AuthService(session, settings)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest, service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    try:
        user, organization, membership, tokens = await service.register(
            email=body.email,
            password=body.password,
            full_name=body.full_name,
            workspace_name=body.workspace_name,
        )
    except EmailAlreadyRegisteredError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email is already registered") from None
    return AuthResponse(**tokens.__dict__, user=_user_out(user, organization, membership))


@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest, service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    try:
        user, organization, membership, tokens = await service.login(
            email=body.email, password=body.password
        )
    except InvalidCredentialsError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password") from None
    return AuthResponse(**tokens.__dict__, user=_user_out(user, organization, membership))


@router.post("/refresh", response_model=TokenFields)
async def refresh(
    body: RefreshRequest, service: AuthService = Depends(get_auth_service)
) -> TokenFields:
    try:
        tokens = await service.refresh(body.refresh_token)
    except InvalidRefreshTokenError:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token"
        ) from None
    return TokenFields(**tokens.__dict__)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(body: LogoutRequest, service: AuthService = Depends(get_auth_service)) -> None:
    await service.logout(body.refresh_token)


@router.get("/me", response_model=UserOut)
async def me(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> UserOut:
    membership = await MembershipRepository(session).get_for_user(user.id)
    organization = (
        await OrganizationRepository(session).get_by_id(membership.organization_id)
        if membership
        else None
    )
    if membership is None or organization is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No organization membership found")
    return _user_out(user, organization, membership)
