from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_current_user, require_refresh_user
from app.core.rate_limit import auth_rate_limit
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RefreshRequest, RegisterRequest, TokenPair, UserResponse
from app.services.auth import (
    authenticate_user,
    build_auth_response,
    create_user,
    revoke_refresh_token,
    refresh_user_tokens,
)


router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_current_user),
) -> AuthResponse:
    user = await create_user(session, payload)
    return await build_auth_response(session, user)


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_db),
    _: None = Depends(auth_rate_limit),
) -> AuthResponse:
    user = await authenticate_user(session, payload)
    return await build_auth_response(session, user)


@router.post("/refresh", response_model=TokenPair)
async def refresh(
    payload: RefreshRequest,
    session: AsyncSession = Depends(get_db),
    _: None = Depends(auth_rate_limit),
    current_user: User = Depends(require_refresh_user),
) -> TokenPair:
    return await refresh_user_tokens(session, payload.refresh_token, current_user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    payload: RefreshRequest,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_current_user),
) -> None:
    await revoke_refresh_token(session, payload.refresh_token)


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(require_current_user)) -> UserResponse:
    return UserResponse.model_validate(user)
