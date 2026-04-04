export type Category = {
  id: number;
  name: string;
  description: string | null;
};

export type Priority = {
  id: number;
  name: string;
  level: number;
  description: string | null;
};

export type HistoryEntry = {
  id: number;
  occurrence_id: number;
  previous_status: string | null;
  new_status: string;
  note: string | null;
  changed_by_user_id: string | null;
  changed_at: string;
};

export type Occurrence = {
  id: number;
  cpf: string;
  status: string;
  description: string;
  opened_at: string;
  closed_at: string | null;
  category: Category;
  priority: Priority;
  history_entries: HistoryEntry[];
};

export type OccurrencePayload = {
  cpf: string;
  category_id: number;
  priority_id: number;
  status: string;
  description: string;
  status_reason?: string | null;
  opened_at?: string | null;
  closed_at?: string | null;
};

export const occurrenceStatuses = [
  "Aberta",
  "Em Analise",
  "Em Andamento",
  "Resolvida",
  "Fechada",
  "Cancelada"
] as const;

export type OccurrenceStatus = (typeof occurrenceStatuses)[number];
