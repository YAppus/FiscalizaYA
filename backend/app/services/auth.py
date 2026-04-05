from datetime import UTC, datetime

import jwt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, TokenPair, UserResponse


def _auth_error(detail: str = "E-mail ou senha incorretos") -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def _normalize_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: str) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(session: AsyncSession, payload: RegisterRequest) -> User:
    existing = await get_user_by_email(session, payload.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nao foi possivel criar o usuario")

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def authenticate_user(session: AsyncSession, payload: LoginRequest) -> User:
    user = await get_user_by_email(session, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise _auth_error()
    return user


async def build_auth_response(session: AsyncSession, user: User) -> AuthResponse:
    access_token, _ = create_access_token(user.id)
    refresh_token, jti, expires_at = create_refresh_token(user.id)
    session.add(RefreshToken(user_id=user.id, jti=jti, expires_at=expires_at))
    await session.commit()

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


async def refresh_user_tokens(session: AsyncSession, token: str, current_user: User) -> TokenPair:
    try:
        payload = decode_refresh_token(token)
    except jwt.PyJWTError as exc:
        raise _auth_error() from exc

    if payload.get("sub") != current_user.id:
        raise _auth_error()

    token_result = await session.execute(select(RefreshToken).where(RefreshToken.jti == payload.get("jti")))
    refresh_record = token_result.scalar_one_or_none()
    now = datetime.now(UTC)

    if not refresh_record or refresh_record.revoked_at or _normalize_utc(refresh_record.expires_at) <= now:
        raise _auth_error()

    refresh_record.revoked_at = now
    access_token, _ = create_access_token(payload["sub"])
    new_refresh_token, new_jti, expires_at = create_refresh_token(payload["sub"])
    session.add(RefreshToken(user_id=payload["sub"], jti=new_jti, expires_at=expires_at))
    await session.commit()

    return TokenPair(access_token=access_token, refresh_token=new_refresh_token)


async def revoke_refresh_token(session: AsyncSession, token: str) -> None:
    try:
        payload = decode_refresh_token(token)
    except jwt.PyJWTError:
        return

    token_result = await session.execute(select(RefreshToken).where(RefreshToken.jti == payload.get("jti")))
    refresh_record = token_result.scalar_one_or_none()
    if refresh_record and not refresh_record.revoked_at:
        refresh_record.revoked_at = datetime.now(UTC)
        await session.commit()


async def get_current_user(session: AsyncSession, token: str) -> User:
    try:
        payload = decode_access_token(token)
    except jwt.PyJWTError as exc:
        raise _auth_error() from exc

    user = await get_user_by_id(session, payload.get("sub"))
    if not user:
        raise _auth_error()
    return user
