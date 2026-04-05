from datetime import UTC, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_current_user
from app.models.category import Category
from app.models.occurrence import Occurrence, OccurrenceStatus
from app.schemas.dashboard import (
    DashboardOverviewResponse,
    DashboardSolicitationPeriod,
    DashboardStatusCount,
    DashboardStatusSlice,
)


router = APIRouter(prefix="/dashboard", tags=["dashboard"], dependencies=[Depends(require_current_user)])


@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(session: AsyncSession = Depends(get_db)):
    counts = await _build_status_counts(session)
    solicitation_periods = await _build_solicitation_periods(session)
    return DashboardOverviewResponse(counts=counts, solicitation_periods=solicitation_periods)


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


async def _build_solicitation_periods(session: AsyncSession) -> list[DashboardSolicitationPeriod]:
    category_result = await session.execute(select(Category.id).where(Category.name == "Solicitacao"))
    solicitation_category_id = category_result.scalar_one_or_none()
    if solicitation_category_id is None:
        return [_build_empty_period("weekly", "Semanal"), _build_empty_period("monthly", "Mensal"), _build_empty_period("yearly", "Anual")]

    now = datetime.now(UTC)
    return [
        await _build_period(session, solicitation_category_id, "weekly", "Semanal", now - timedelta(days=7)),
        await _build_period(session, solicitation_category_id, "monthly", "Mensal", now - timedelta(days=30)),
        await _build_period(session, solicitation_category_id, "yearly", "Anual", now - timedelta(days=365)),
    ]


async def _build_period(
    session: AsyncSession,
    category_id: int,
    key: Literal["weekly", "monthly", "yearly"],
    label: str,
    threshold: datetime,
) -> DashboardSolicitationPeriod:
    total_result = await session.execute(
        select(func.count(Occurrence.id)).where(
            Occurrence.category_id == category_id,
            Occurrence.opened_at >= threshold,
        )
    )
    total = total_result.scalar_one()

    grouped_result = await session.execute(
        select(Occurrence.status, func.count(Occurrence.id))
        .where(
            Occurrence.category_id == category_id,
            Occurrence.opened_at >= threshold,
        )
        .group_by(Occurrence.status)
    )
    totals_by_status = {status: count for status, count in grouped_result.all()}

    slices = []
    for status in OccurrenceStatus:
        count = totals_by_status.get(status.value, 0)
        percentage = round((count / total) * 100, 1) if total else 0
        slices.append(DashboardStatusSlice(status=status.value, total=count, percentage=percentage))

    return DashboardSolicitationPeriod(key=key, label=label, total=total, slices=slices)


def _build_empty_period(key: Literal["weekly", "monthly", "yearly"], label: str) -> DashboardSolicitationPeriod:
    return DashboardSolicitationPeriod(
        key=key,
        label=label,
        total=0,
        slices=[DashboardStatusSlice(status=status.value, total=0, percentage=0) for status in OccurrenceStatus],
    )
