from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import require_current_user
from app.core.filters import apply_filters, paginate, parse_filters
from app.core.pagination import PaginatedResponse
from app.models.occurrence import Occurrence
from app.models.user import User
from app.schemas.occurrence import OccurrenceCreate, OccurrenceResponse, OccurrenceUpdate
from app.services.crud import create_occurrence, delete_entity, get_or_404, update_occurrence


router = APIRouter(prefix="/occurrences", tags=["occurrences"], dependencies=[Depends(require_current_user)])


@router.get("", response_model=PaginatedResponse[OccurrenceResponse])
async def list_occurrences(
    session: AsyncSession = Depends(get_db),
    filters: list[tuple[str, str, str]] = Depends(parse_filters),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    query = (
        select(Occurrence)
        .options(
            selectinload(Occurrence.category),
            selectinload(Occurrence.priority),
            selectinload(Occurrence.history_entries),
        )
        .order_by(Occurrence.opened_at.desc(), Occurrence.id.desc())
    )
    query = apply_filters(
        query,
        filters,
        {
            "id": Occurrence.id,
            "cpf": Occurrence.cpf,
            "category_id": Occurrence.category_id,
            "priority_id": Occurrence.priority_id,
            "status": Occurrence.status,
            "description": Occurrence.description,
            "opened_at": Occurrence.opened_at,
            "closed_at": Occurrence.closed_at,
        },
    )
    items, total = await paginate(session, query, page, page_size)
    return PaginatedResponse(
        items=[OccurrenceResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("", response_model=OccurrenceResponse, status_code=status.HTTP_201_CREATED)
async def create_occurrence_endpoint(
    payload: OccurrenceCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    entity = await create_occurrence(session, payload, current_user)
    result = await session.execute(
        select(Occurrence)
        .options(
            selectinload(Occurrence.category),
            selectinload(Occurrence.priority),
            selectinload(Occurrence.history_entries),
        )
        .where(Occurrence.id == entity.id)
    )
    return OccurrenceResponse.model_validate(result.scalar_one())


@router.get("/{entity_id}", response_model=OccurrenceResponse)
async def get_occurrence(entity_id: int, session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Occurrence)
        .options(
            selectinload(Occurrence.category),
            selectinload(Occurrence.priority),
            selectinload(Occurrence.history_entries),
        )
        .where(Occurrence.id == entity_id)
    )
    entity = result.scalar_one_or_none()
    if not entity:
        await get_or_404(session, Occurrence, entity_id)
    return OccurrenceResponse.model_validate(entity)


@router.put("/{entity_id}", response_model=OccurrenceResponse)
async def update_occurrence_endpoint(
    entity_id: int,
    payload: OccurrenceUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    entity = await get_or_404(session, Occurrence, entity_id)
    await update_occurrence(session, entity, payload, current_user)
    result = await session.execute(
        select(Occurrence)
        .options(
            selectinload(Occurrence.category),
            selectinload(Occurrence.priority),
            selectinload(Occurrence.history_entries),
        )
        .where(Occurrence.id == entity_id)
    )
    return OccurrenceResponse.model_validate(result.scalar_one())


@router.delete("/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_occurrence(entity_id: int, session: AsyncSession = Depends(get_db), _: User = Depends(require_current_user)):
    entity = await get_or_404(session, Occurrence, entity_id)
    await delete_entity(session, entity)
