import { fetchOccurrences } from "../occurrences/api";
import type { Category, Occurrence } from "../occurrences/types";
import { occurrenceStatuses } from "../occurrences/types";
import type { DashboardSolicitationPeriod, StatusCount } from "./types";


export async function fetchDashboardCounts(): Promise<StatusCount[]> {
  const results = await Promise.all(
    occurrenceStatuses.map(async (status) => {
      const data = await fetchOccurrences(1, 1, [{ field: "status", operator: "eq", value: status }]);
      return { status, total: data.total };
    })
  );

  return results;
}


export async function fetchDashboardSolicitationPeriods(categories: Category[]): Promise<DashboardSolicitationPeriod[]> {
  const solicitationCategory = categories.find((category) => category.name === "Solicitacao");
  if (!solicitationCategory) {
    return buildEmptyPeriods();
  }

  const solicitationOccurrences = await fetchAllOccurrencesByCategory(String(solicitationCategory.id));
  const now = new Date();

  return [
    buildPeriod("weekly", "Semanal", solicitationOccurrences, subtractDays(now, 7)),
    buildPeriod("monthly", "Mensal", solicitationOccurrences, subtractDays(now, 30)),
    buildPeriod("yearly", "Anual", solicitationOccurrences, subtractDays(now, 365))
  ];
}


async function fetchAllOccurrencesByCategory(categoryId: string): Promise<Occurrence[]> {
  const items: Occurrence[] = [];
  let page = 1;
  let total = 0;

  do {
    const response = await fetchOccurrences(page, 100, [{ field: "category_id", operator: "eq", value: categoryId }]);
    items.push(...response.items);
    total = response.total;
    page += 1;
  } while (items.length < total);

  return items;
}


function buildPeriod(
  key: DashboardSolicitationPeriod["key"],
  label: string,
  occurrences: Occurrence[],
  threshold: Date,
): DashboardSolicitationPeriod {
  const filtered = occurrences.filter((item) => new Date(item.opened_at) >= threshold);
  const total = filtered.length;
  const slices = occurrenceStatuses.map((status) => {
    const count = filtered.filter((item) => item.status === status).length;
    const percentage = total === 0 ? 0 : Number(((count / total) * 100).toFixed(1));
    return {
      status,
      total: count,
      percentage
    };
  });

  return {
    key,
    label,
    total,
    slices
  };
}


function buildEmptyPeriods(): DashboardSolicitationPeriod[] {
  return [
    buildPeriod("weekly", "Semanal", [], new Date()),
    buildPeriod("monthly", "Mensal", [], new Date()),
    buildPeriod("yearly", "Anual", [], new Date())
  ];
}


function subtractDays(value: Date, days: number) {
  const copy = new Date(value);
  copy.setDate(copy.getDate() - days);
  return copy;
}
