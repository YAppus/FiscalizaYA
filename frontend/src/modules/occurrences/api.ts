import { api } from "../../api/client";
import type { FilterCondition } from "../../shared/types";
import type { PaginatedResponse } from "../../shared/types";
import type { Category, Occurrence, OccurrencePayload, Priority } from "./types";


function buildFilterParams(filters: FilterCondition[]) {
  const params = new URLSearchParams();
  filters
    .filter((item) => item.field && item.operator && item.value.trim())
    .forEach((item) => params.append("filtro", `${item.field}:${item.operator}:${item.value.trim()}`));
  return params;
}


export async function fetchOccurrences(page: number, pageSize: number, filters: FilterCondition[]) {
  const params = buildFilterParams(filters);
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  const response = await api.get<PaginatedResponse<Occurrence>>(`/occurrences?${params.toString()}`);
  return response.data;
}


export async function fetchOccurrence(id: number) {
  const response = await api.get<Occurrence>(`/occurrences/${id}`);
  return response.data;
}


export async function createOccurrence(payload: OccurrencePayload) {
  const response = await api.post<Occurrence>("/occurrences", payload);
  return response.data;
}


export async function updateOccurrence(id: number, payload: OccurrencePayload) {
  const response = await api.put<Occurrence>(`/occurrences/${id}`, payload);
  return response.data;
}


export async function deleteOccurrence(id: number) {
  await api.delete(`/occurrences/${id}`);
}


export async function fetchCategories() {
  const response = await api.get<PaginatedResponse<Category>>("/categories?page=1&page_size=100");
  return response.data.items;
}


export async function fetchPriorities() {
  const response = await api.get<PaginatedResponse<Priority>>("/priorities?page=1&page_size=100");
  return response.data.items;
}
