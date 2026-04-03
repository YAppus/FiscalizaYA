from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_current_user
from app.core.filters import apply_filters, paginate, parse_filters
from app.core.pagination import PaginatedResponse
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.crud import create_category, delete_entity, get_or_404, update_category


router = APIRouter(prefix="/categories", tags=["categories"], dependencies=[Depends(require_current_user)])


@router.get("", response_model=PaginatedResponse[CategoryResponse])
async def list_categories(
    session: AsyncSession = Depends(get_db),
    filters: list[tuple[str, str, str]] = Depends(parse_filters),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    query = select(Category).order_by(Category.id)
    query = apply_filters(query, filters, {"id": Category.id, "name": Category.name, "description": Category.description})
    items, total = await paginate(session, query, page, page_size)
    return PaginatedResponse(
        items=[CategoryResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category_endpoint(
    payload: CategoryCreate,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_current_user),
):
    return CategoryResponse.model_validate(await create_category(session, payload))


@router.get("/{entity_id}", response_model=CategoryResponse)
async def get_category(entity_id: int, session: AsyncSession = Depends(get_db)):
    return CategoryResponse.model_validate(await get_or_404(session, Category, entity_id))


@router.put("/{entity_id}", response_model=CategoryResponse)
async def update_category_endpoint(
    entity_id: int,
    payload: CategoryUpdate,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_current_user),
):
    entity = await get_or_404(session, Category, entity_id)
    return CategoryResponse.model_validate(await update_category(session, entity, payload))


@router.delete("/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(entity_id: int, session: AsyncSession = Depends(get_db), _: User = Depends(require_current_user)):
    entity = await get_or_404(session, Category, entity_id)
    await delete_entity(session, entity)
