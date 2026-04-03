import { fetchOccurrences } from "../occurrences/api";
import { occurrenceStatuses } from "../occurrences/types";


export async function fetchDashboardCounts() {
  const results = await Promise.all(
    occurrenceStatuses.map(async (status) => {
      const data = await fetchOccurrences(1, 1, [{ field: "status", operator: "eq", value: status }]);
      return { status, total: data.total };
    })
  );

  return results;
}
