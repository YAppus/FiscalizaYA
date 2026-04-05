import type { GridPaginationModel } from "@mui/x-data-grid";
import { useCallback, useState } from "react";

import { extractErrorMessage } from "../app/utils";
import {
  createOccurrence,
  deleteOccurrence,
  fetchCategories,
  fetchOccurrence,
  fetchOccurrences,
  fetchPriorities,
  updateOccurrence,
  uploadOccurrenceAttachment
} from "./api";
import type { Category, Occurrence, OccurrencePayload, Priority } from "./types";
import type { FilterCondition } from "../../shared/types";


const initialFilter: FilterCondition = { field: "status", operator: "eq", value: "" };

type OccurrenceFormValues = {
  cpf: string;
  category_id: number;
  priority_id: number;
  status: string;
  description: string;
  status_reason?: string;
  opened_at: string;
  closed_at?: string;
};

type AttachmentDraft = {
  opening: File | null;
  closing: File | null;
};

type ControllerOptions = {
  onDataChanged: () => Promise<void>;
};

export function useOccurrencesController({ onDataChanged }: ControllerOptions) {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [occurrenceError, setOccurrenceError] = useState<string | null>(null);
  const [occurrenceMessage, setOccurrenceMessage] = useState<string | null>(null);
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [historyOccurrence, setHistoryOccurrence] = useState<Occurrence | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<FilterCondition>(initialFilter);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);

  const loadBootstrapData = useCallback(async () => {
    try {
      const [nextCategories, nextPriorities] = await Promise.all([fetchCategories(), fetchPriorities()]);
      setCategories(nextCategories);
      setPriorities(nextPriorities);
      return null;
    } catch (nextError) {
      const message = extractErrorMessage(nextError, "Nao foi possivel carregar categorias e prioridades.");
      setOccurrenceError(message);
      return message;
    }
  }, []);

  const loadOccurrences = useCallback(async () => {
    setGridLoading(true);
    try {
      const data = await fetchOccurrences(paginationModel.page + 1, paginationModel.pageSize, activeFilters);
      setOccurrences(data.items);
      setRowCount(data.total);
      return null;
    } catch (nextError) {
      const message = extractErrorMessage(nextError, "Nao foi possivel carregar as ocorrencias.");
      setOccurrenceError(message);
      return message;
    } finally {
      setGridLoading(false);
    }
  }, [activeFilters, paginationModel.page, paginationModel.pageSize]);

  const handleEdit = useCallback(async (id: number) => {
    try {
      const data = await fetchOccurrence(id);
      setSelectedOccurrence(data);
      setDialogOpen(true);
    } catch (nextError) {
      setOccurrenceError(extractErrorMessage(nextError, "Nao foi possivel carregar a ocorrencia."));
    }
  }, []);

  const handleOpenHistory = useCallback(async (id: number) => {
    try {
      const data = await fetchOccurrence(id);
      setHistoryOccurrence(data);
      setHistoryOpen(true);
    } catch (nextError) {
      setOccurrenceError(extractErrorMessage(nextError, "Nao foi possivel carregar o historico."));
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta ocorrencia?")) {
      return;
    }

    try {
      await deleteOccurrence(id);
      setOccurrenceMessage("Ocorrencia removida com sucesso.");
      await onDataChanged();
    } catch (nextError) {
      setOccurrenceError(extractErrorMessage(nextError, "Nao foi possivel excluir a ocorrencia."));
    }
  }, [onDataChanged]);

  const submitOccurrence = useCallback(async (
    values: OccurrenceFormValues,
    attachments: AttachmentDraft
  ) => {
    setDialogLoading(true);
    try {
      const basePayload = {
        ...values,
        opened_at: new Date(values.opened_at).toISOString(),
        closed_at: values.closed_at ? new Date(values.closed_at).toISOString() : null
      };

      const payload: Partial<OccurrencePayload> = { ...basePayload };

      if (selectedOccurrence) {
        if (toInputDateTime(selectedOccurrence.opened_at) === values.opened_at) {
          delete payload.opened_at;
        }

        const currentClosedAt = selectedOccurrence.closed_at ? toInputDateTime(selectedOccurrence.closed_at) : "";
        if (currentClosedAt === (values.closed_at ?? "")) {
          delete payload.closed_at;
        }
      }

      if (selectedOccurrence) {
        const updatedOccurrence = await updateOccurrence(selectedOccurrence.id, payload);
        if (attachments.closing) {
          await uploadOccurrenceAttachment(updatedOccurrence.id, "closing", attachments.closing);
        }
        setOccurrenceMessage("Ocorrencia atualizada com sucesso.");
      } else {
        const createdOccurrence = await createOccurrence(basePayload);
        if (attachments.opening) {
          await uploadOccurrenceAttachment(createdOccurrence.id, "opening", attachments.opening);
        }
        setOccurrenceMessage("Ocorrencia criada com sucesso.");
      }

      setDialogOpen(false);
      setSelectedOccurrence(null);
      setOccurrenceError(null);
      await onDataChanged();
    } catch (nextError) {
      setOccurrenceError(extractErrorMessage(nextError, "Nao foi possivel salvar a ocorrencia."));
    } finally {
      setDialogLoading(false);
    }
  }, [onDataChanged, selectedOccurrence]);

  const applyFilters = useCallback(() => {
    setActiveFilters(filterDraft.value.trim() ? [filterDraft] : []);
    setPaginationModel((current) => ({ ...current, page: 0 }));
  }, [filterDraft]);

  const clearFilters = useCallback(() => {
    setFilterDraft(initialFilter);
    setActiveFilters([]);
    setPaginationModel((current) => ({ ...current, page: 0 }));
  }, []);

  const focusOccurrencesByStatus = useCallback((status: string) => {
    const nextFilter: FilterCondition = {
      field: "status",
      operator: "eq",
      value: status
    };
    setFilterDraft(nextFilter);
    setActiveFilters([nextFilter]);
    setPaginationModel((current) => ({ ...current, page: 0 }));
  }, []);

  const openCreateDialog = useCallback(() => {
    setSelectedOccurrence(null);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedOccurrence(null);
  }, []);

  const closeHistory = useCallback(() => setHistoryOpen(false), []);

  const clearOccurrenceFeedback = useCallback(() => {
    setOccurrenceError(null);
    setOccurrenceMessage(null);
  }, []);

  return {
    categories,
    priorities,
    occurrences,
    gridLoading,
    dialogLoading,
    occurrenceError,
    occurrenceMessage,
    selectedOccurrence,
    historyOccurrence,
    historyOpen,
    dialogOpen,
    filterDraft,
    activeFilters,
    paginationModel,
    rowCount,
    setFilterDraft,
    setPaginationModel,
    loadBootstrapData,
    loadOccurrences,
    handleEdit,
    handleOpenHistory,
    handleDelete,
    submitOccurrence,
    applyFilters,
    clearFilters,
    focusOccurrencesByStatus,
    openCreateDialog,
    closeDialog,
    closeHistory,
    clearOccurrenceFeedback
  };
}


function toInputDateTime(value: string) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}
