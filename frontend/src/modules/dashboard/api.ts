import { api } from "../../api/client";
import type { DashboardOverview, DashboardSolicitationPeriod, StatusCount } from "./types";

type DashboardOverviewApiResponse = {
  counts: StatusCount[];
  solicitation_periods: DashboardSolicitationPeriod[];
};


export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const response = await api.get<DashboardOverviewApiResponse>("/dashboard/overview");
  return {
    counts: response.data.counts,
    solicitationPeriods: response.data.solicitation_periods
  };
}
