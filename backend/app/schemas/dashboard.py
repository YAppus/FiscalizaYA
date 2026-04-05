from pydantic import BaseModel


class DashboardStatusCount(BaseModel):
    status: str
    total: int


class DashboardStatusSlice(BaseModel):
    status: str
    total: int
    percentage: float


class DashboardCategorySlice(BaseModel):
    category: str
    total: int
    percentage: float


class DashboardMttrCategory(BaseModel):
    category: str
    average_resolution_hours: float


class DashboardPeriodMetrics(BaseModel):
    status_distribution: list[DashboardStatusSlice]
    category_distribution: list[DashboardCategorySlice]
    mttr_by_category: list[DashboardMttrCategory]


class DashboardOverviewResponse(BaseModel):
    counts: list[DashboardStatusCount]
    periods: dict[str, DashboardPeriodMetrics]
