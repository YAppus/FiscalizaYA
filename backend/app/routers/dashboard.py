from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_current_user
from app.models.category import Category
from app.models.occurrence import Occurrence, OccurrenceStatus
from app.schemas.dashboard import (
    DashboardCategorySlice,
    DashboardMttrCategory,
    DashboardOverviewResponse,
    DashboardStatusCount,
    DashboardStatusSlice,
)


router = APIRouter(prefix="/dashboard", tags=["dashboard"], dependencies=[Depends(require_current_user)])


@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(session: AsyncSession = Depends(get_db)):
    counts = await _build_status_counts(session)
    status_distribution = _build_status_distribution(counts)
    category_distribution = await _build_category_distribution(session)
    mttr_by_category = await _build_mttr_by_category(session)
    return DashboardOverviewResponse(
        counts=counts,
        status_distribution=status_distribution,
        category_distribution=category_distribution,
        mttr_by_category=mttr_by_category,
    )


async def _build_status_counts(session: AsyncSession) -> list[DashboardStatusCount]:
    result = await session.execute(
        select(Occurrence.status, func.count(Occurrence.id))
        .group_by(Occurrence.status)
    )
    totals_by_status = {status: total for status, total in result.all()}
    return [
        DashboardStatusCount(status=status.value, total=totals_by_status.get(status.value, 0))
        for status in OccurrenceStatus
    ]


def _build_status_distribution(counts: list[DashboardStatusCount]) -> list[DashboardStatusSlice]:
    total = sum(item.total for item in counts)
    return [
        DashboardStatusSlice(
            status=item.status,
            total=item.total,
            percentage=round((item.total / total) * 100, 1) if total else 0,
        )
        for item in counts
    ]


async def _build_category_distribution(session: AsyncSession) -> list[DashboardCategorySlice]:
    categories = await _get_dashboard_categories(session)
    if not categories:
        return []

    result = await session.execute(
        select(Category.name, func.count(Occurrence.id))
        .join(Occurrence, Occurrence.category_id == Category.id)
        .where(Category.name.in_(categories))
        .group_by(Category.name)
    )
    totals_by_category = {name: total for name, total in result.all()}
    total_occurrences = sum(totals_by_category.values())

    return [
        DashboardCategorySlice(
            category=_to_category_label(name),
            total=totals_by_category.get(name, 0),
            percentage=round((totals_by_category.get(name, 0) / total_occurrences) * 100, 1) if total_occurrences else 0,
        )
        for name in categories
    ]


async def _build_mttr_by_category(session: AsyncSession) -> list[DashboardMttrCategory]:
    categories = await _get_dashboard_categories(session)
    if not categories:
        return []

    result = await session.execute(
        select(Category.name, Occurrence.opened_at, Occurrence.closed_at)
        .join(Occurrence, Occurrence.category_id == Category.id)
        .where(
            Category.name.in_(categories),
            Occurrence.closed_at.is_not(None),
            Occurrence.status == OccurrenceStatus.FECHADA.value,
        )
    )
    durations_by_category: dict[str, list[float]] = defaultdict(list)
    for category_name, opened_at, closed_at in result.all():
        if closed_at is None:
            continue
        durations_by_category[category_name].append((closed_at - opened_at).total_seconds() / 3600)

    return [
        DashboardMttrCategory(
            category=_to_category_label(name),
            average_resolution_hours=round(sum(durations_by_category.get(name, [])) / len(durations_by_category.get(name, [])), 2)
            if durations_by_category.get(name)
            else 0,
        )
        for name in categories
    ]


async def _get_dashboard_categories(session: AsyncSession) -> list[str]:
    ordered_names = ["Denuncia", "Solicitacao", "Reclamacao"]
    result = await session.execute(select(Category.name).where(Category.name.in_(ordered_names)))
    available = set(result.scalars().all())
    return [name for name in ordered_names if name in available]


def _to_category_label(name: str) -> str:
    return {
        "Denuncia": "Denuncia",
        "Solicitacao": "Solicitacao",
        "Reclamacao": "Reclamacao",
    }.get(name, name)
