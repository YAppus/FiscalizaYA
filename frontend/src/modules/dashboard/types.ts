export type StatusCount = {
  status: string;
  total: number;
};

export type DashboardPeriodKey = "weekly" | "monthly" | "yearly";

export type DashboardStatusSlice = {
  status: string;
  total: number;
  percentage: number;
};

export type DashboardSolicitationPeriod = {
  key: DashboardPeriodKey;
  label: string;
  total: number;
  slices: DashboardStatusSlice[];
};
