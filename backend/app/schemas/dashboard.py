from typing import Literal

from pydantic import BaseModel


class DashboardStatusCount(BaseModel):
    status: str
    total: int


class DashboardStatusSlice(BaseModel):
    status: str
    total: int
    percentage: float


class DashboardSolicitationPeriod(BaseModel):
    key: Literal["weekly", "monthly", "yearly"]
    label: str
    total: int
    slices: list[DashboardStatusSlice]


class DashboardOverviewResponse(BaseModel):
    counts: list[DashboardStatusCount]
    solicitation_periods: list[DashboardSolicitationPeriod]
