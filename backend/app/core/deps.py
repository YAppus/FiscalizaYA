from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_refresh_token
from app.models.user import User
from app.services.auth import get_current_user, get_user_by_id
import jwt


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token bearer ausente")
    return authorization.removeprefix("Bearer ").strip()


async def require_current_user(
    authorization: Annotated[str | None, Header()] = None,
    session: AsyncSession = Depends(get_db),
) -> User:
    token = extract_bearer_token(authorization)
    return await get_current_user(session, token)


async def require_refresh_user(
    authorization: Annotated[str | None, Header()] = None,
    session: AsyncSession = Depends(get_db),
) -> User:
    token = extract_bearer_token(authorization)
    try:
        payload = decode_refresh_token(token)
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Falha na autenticacao") from exc

    user = await get_user_by_id(session, payload.get("sub"))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Falha na autenticacao")
    return user
