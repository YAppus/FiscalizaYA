import { api } from "../../api/client";
import type {
  DashboardCategorySlice,
  DashboardMttrCategory,
  DashboardOverview,
  DashboardPeriodKey,
  DashboardStatusSlice,
  StatusCount
} from "./types";

type DashboardOverviewApiResponse = {
  counts: StatusCount[];
  periods: Record<string, {
    status_distribution: DashboardStatusSlice[];
    category_distribution: DashboardCategorySlice[];
    mttr_by_category: Array<{
      category: string;
      average_resolution_hours: number;
    }>;
  }>;
};


export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const response = await api.get<DashboardOverviewApiResponse>("/dashboard/overview");
  return {
    counts: response.data.counts,
    periods: mapPeriods(response.data.periods)
  };
}


function mapPeriods(periods: DashboardOverviewApiResponse["periods"]): DashboardOverview["periods"] {
  const periodKeys: DashboardPeriodKey[] = ["week", "month", "year"];

  return periodKeys.reduce((acc, key) => {
    const data = periods[key];
    acc[key] = {
      statusDistribution: data?.status_distribution ?? [],
      categoryDistribution: data?.category_distribution ?? [],
      mttrByCategory: (data?.mttr_by_category ?? []).map((item): DashboardMttrCategory => ({
        category: item.category,
        averageResolutionHours: item.average_resolution_hours
      }))
    };
    return acc;
  }, {} as DashboardOverview["periods"]);
}
