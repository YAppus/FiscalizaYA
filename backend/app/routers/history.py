from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_current_user
from app.core.filters import apply_filters, paginate, parse_filters
from app.core.pagination import PaginatedResponse
from app.models.history import History
from app.models.user import User
from app.schemas.history import HistoryCreate, HistoryResponse, HistoryUpdate
from app.services.crud import create_history, delete_entity, get_or_404, update_history


router = APIRouter(prefix="/history", tags=["history"], dependencies=[Depends(require_current_user)])


@router.get("", response_model=PaginatedResponse[HistoryResponse])
async def list_history(
    session: AsyncSession = Depends(get_db),
    filters: list[tuple[str, str, str]] = Depends(parse_filters),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    query = select(History).order_by(History.changed_at.desc(), History.id.desc())
    query = apply_filters(
        query,
        filters,
        {
            "id": History.id,
            "occurrence_id": History.occurrence_id,
            "previous_status": History.previous_status,
            "new_status": History.new_status,
            "changed_by_user_id": History.changed_by_user_id,
            "note": History.note,
        },
    )
    items, total = await paginate(session, query, page, page_size)
    return PaginatedResponse(
        items=[HistoryResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("", response_model=HistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_history_endpoint(
    payload: HistoryCreate,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_current_user),
):
    return HistoryResponse.model_validate(await create_history(session, payload))


@router.get("/{entity_id}", response_model=HistoryResponse)
async def get_history(entity_id: int, session: AsyncSession = Depends(get_db)):
    return HistoryResponse.model_validate(await get_or_404(session, History, entity_id))


@router.put("/{entity_id}", response_model=HistoryResponse)
async def update_history_endpoint(
    entity_id: int,
    payload: HistoryUpdate,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_current_user),
):
    entity = await get_or_404(session, History, entity_id)
    return HistoryResponse.model_validate(await update_history(session, entity, payload))


@router.delete("/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history(entity_id: int, session: AsyncSession = Depends(get_db), _: User = Depends(require_current_user)):
    entity = await get_or_404(session, History, entity_id)
    await delete_entity(session, entity)
