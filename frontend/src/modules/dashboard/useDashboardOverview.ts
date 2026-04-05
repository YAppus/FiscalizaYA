import { useCallback, useState } from "react";

import { extractErrorMessage } from "../app/utils";
import { fetchDashboardOverview } from "./api";
import type { DashboardCategorySlice, DashboardMttrCategory, DashboardStatusSlice } from "./types";


export function useDashboardOverview() {
  const [dashboardCounts, setDashboardCounts] = useState<{ status: string; total: number }[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<DashboardStatusSlice[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<DashboardCategorySlice[]>([]);
  const [mttrByCategory, setMttrByCategory] = useState<DashboardMttrCategory[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      const overview = await fetchDashboardOverview();
      setDashboardCounts(overview.counts);
      setStatusDistribution(overview.statusDistribution);
      setCategoryDistribution(overview.categoryDistribution);
      setMttrByCategory(overview.mttrByCategory);
      return null;
    } catch (nextError) {
      return extractErrorMessage(nextError, "Nao foi possivel carregar o dashboard.");
    }
  }, []);

  return {
    dashboardCounts,
    statusDistribution,
    categoryDistribution,
    mttrByCategory,
    loadDashboard
  };
}

