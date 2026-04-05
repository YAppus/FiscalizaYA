export type StatusCount = {
  status: string;
  total: number;
};

export type DashboardStatusSlice = {
  status: string;
  total: number;
  percentage: number;
};

export type DashboardCategorySlice = {
  category: string;
  total: number;
  percentage: number;
};

export type DashboardMttrCategory = {
  category: string;
  averageResolutionHours: number;
};

export type DashboardOverview = {
  counts: StatusCount[];
  periods: Record<DashboardPeriodKey, DashboardPeriodMetrics>;
};

export type DashboardPeriodKey = "week" | "month" | "year";

export type DashboardPeriodMetrics = {
  statusDistribution: DashboardStatusSlice[];
  categoryDistribution: DashboardCategorySlice[];
  mttrByCategory: DashboardMttrCategory[];
};
