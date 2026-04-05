import { useCallback, useState } from "react";

import { extractErrorMessage } from "../app/utils";
import { fetchDashboardOverview } from "./api";
import type { DashboardOverview } from "./types";


export function useDashboardOverview() {
  const [dashboardCounts, setDashboardCounts] = useState<{ status: string; total: number }[]>([]);
  const [periods, setPeriods] = useState<DashboardOverview["periods"]>({
    week: { statusDistribution: [], categoryDistribution: [], mttrByCategory: [] },
    month: { statusDistribution: [], categoryDistribution: [], mttrByCategory: [] },
    year: { statusDistribution: [], categoryDistribution: [], mttrByCategory: [] }
  });

  const loadDashboard = useCallback(async () => {
    try {
      const overview = await fetchDashboardOverview();
      setDashboardCounts(overview.counts);
      setPeriods(overview.periods);
      return null;
    } catch (nextError) {
      return extractErrorMessage(nextError, "Nao foi possivel carregar o dashboard.");
    }
  }, []);

  return {
    dashboardCounts,
    periods,
    loadDashboard
  };
}
