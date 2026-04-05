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
  statusDistribution: DashboardStatusSlice[];
  categoryDistribution: DashboardCategorySlice[];
  mttrByCategory: DashboardMttrCategory[];
};
