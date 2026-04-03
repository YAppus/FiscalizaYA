from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_current_user
from app.core.filters import apply_filters, paginate, parse_filters
from app.core.pagination import PaginatedResponse
from app.models.priority import Priority
from app.models.user import User
from app.schemas.priority import PriorityCreate, PriorityResponse, PriorityUpdate
from app.services.crud import create_priority, delete_entity, get_or_404, update_priority


router = APIRouter(prefix="/priorities", tags=["priorities"], dependencies=[Depends(require_current_user)])


@router.get("", response_model=PaginatedResponse[PriorityResponse])
async def list_priorities(
    session: AsyncSession = Depends(get_db),
    filters: list[tuple[str, str, str]] = Depends(parse_filters),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    query = select(Priority).order_by(Priority.level, Priority.id)
    query = apply_filters(
        query,
        filters,
        {"id": Priority.id, "name": Priority.name, "level": Priority.level, "description": Priority.description},
    )
    items, total = await paginate(session, query, page, page_size)
    return PaginatedResponse(
        items=[PriorityResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("", response_model=PriorityResponse, status_code=status.HTTP_201_CREATED)
async def create_priority_endpoint(
    payload: PriorityCreate,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_current_user),
):
    return PriorityResponse.model_validate(await create_priority(session, payload))


@router.get("/{entity_id}", response_model=PriorityResponse)
async def get_priority(entity_id: int, session: AsyncSession = Depends(get_db)):
    return PriorityResponse.model_validate(await get_or_404(session, Priority, entity_id))


@router.put("/{entity_id}", response_model=PriorityResponse)
async def update_priority_endpoint(
    entity_id: int,
    payload: PriorityUpdate,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_current_user),
):
    entity = await get_or_404(session, Priority, entity_id)
    return PriorityResponse.model_validate(await update_priority(session, entity, payload))


@router.delete("/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_priority(entity_id: int, session: AsyncSession = Depends(get_db), _: User = Depends(require_current_user)):
    entity = await get_or_404(session, Priority, entity_id)
    await delete_entity(session, entity)
