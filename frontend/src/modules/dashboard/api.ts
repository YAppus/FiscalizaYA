import { api } from "../../api/client";
import type { DashboardCategorySlice, DashboardMttrCategory, DashboardOverview, DashboardStatusSlice, StatusCount } from "./types";

type DashboardOverviewApiResponse = {
  counts: StatusCount[];
  status_distribution: DashboardStatusSlice[];
  category_distribution: DashboardCategorySlice[];
  mttr_by_category: Array<{
    category: string;
    average_resolution_hours: number;
  }>;
};


export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const response = await api.get<DashboardOverviewApiResponse>("/dashboard/overview");
  return {
    counts: response.data.counts,
    statusDistribution: response.data.status_distribution,
    categoryDistribution: response.data.category_distribution,
    mttrByCategory: response.data.mttr_by_category.map((item): DashboardMttrCategory => ({
      category: item.category,
      averageResolutionHours: item.average_resolution_hours
    }))
  };
}
