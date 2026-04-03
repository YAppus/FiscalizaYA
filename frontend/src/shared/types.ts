export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
};

export type FilterOperator = "eq" | "like";

export type FilterCondition = {
  field: string;
  operator: FilterOperator;
  value: string;
};
