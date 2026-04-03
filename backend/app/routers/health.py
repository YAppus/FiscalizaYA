from fastapi import APIRouter, Depends

from app.core.deps import require_current_user


router = APIRouter(tags=["health"], dependencies=[Depends(require_current_user)])


@router.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
