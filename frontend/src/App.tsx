import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Container, Stack } from "@mui/material";
import type { GridPaginationModel } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppHeader } from "./modules/app/AppHeader";
import { FeedbackSnackbars } from "./modules/app/FeedbackSnackbars";
import { useAuth } from "./modules/auth/AuthContext";
import { LoginScreen } from "./modules/auth/LoginScreen";
import { fetchDashboardOverview } from "./modules/dashboard/api";
import { DashboardPage } from "./modules/dashboard/DashboardPage";
import type { DashboardCategorySlice, DashboardMttrCategory, DashboardStatusSlice } from "./modules/dashboard/types";
import { createOccurrence, deleteOccurrence, fetchCategories, fetchOccurrence, fetchOccurrences, fetchPriorities, updateOccurrence, uploadOccurrenceAttachment } from "./modules/occurrences/api";
import { OccurrenceDialog } from "./modules/occurrences/OccurrenceDialog";
import { OccurrenceHistory } from "./modules/occurrences/OccurrenceHistory";
import { OccurrencePage } from "./modules/occurrences/OccurrencePage";
import type { Category, Occurrence, Priority } from "./modules/occurrences/types";
import type { FilterCondition } from "./shared/types";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres")
});

type LoginValues = z.infer<typeof loginSchema>;
type AppTab = "dashboard" | "occurrences";

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

const initialFilter: FilterCondition = { field: "status", operator: "eq", value: "" };

export default function App() {
  const { user, loading, error, message, login, logout, clearFeedback } = useAuth();
  const [tab, setTab] = useState<AppTab>("dashboard");
  const [dashboardCounts, setDashboardCounts] = useState<{ status: string; total: number }[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<DashboardStatusSlice[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<DashboardCategorySlice[]>([]);
  const [mttrByCategory, setMttrByCategory] = useState<DashboardMttrCategory[]>([]);
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

  const { control, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  useEffect(() => {
    if (!user) {
      setTab("dashboard");
      return;
    }

    setTab("dashboard");
    void loadBootstrapData();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadOccurrences();
  }, [user, paginationModel.page, paginationModel.pageSize, activeFilters]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadDashboard();
  }, [user]);

  async function loadBootstrapData() {
    try {
      const [nextCategories, nextPriorities] = await Promise.all([fetchCategories(), fetchPriorities()]);
      setCategories(nextCategories);
      setPriorities(nextPriorities);
    } catch (nextError) {
      setOccurrenceError(extractErrorMessage(nextError, "Nao foi possivel carregar categorias e prioridades."));
    }
  }

  async function loadDashboard() {
    try {
      const overview = await fetchDashboardOverview();
      setDashboardCounts(overview.counts);
      setStatusDistribution(overview.statusDistribution);
      setCategoryDistribution(overview.categoryDistribution);
      setMttrByCategory(overview.mttrByCategory);
    } catch (nextError) {
      setOccurrenceError(extractErrorMessage(nextError, "Nao foi possivel carregar o dashboard."));
    }
  }

  async function loadOccurrences() {
    setGridLoading(true);
    try {
      const data = await fetchOccurrences(paginationModel.page + 1, paginationModel.pageSize, activeFilters);
      setOccurrences(data.items);
      setRowCount(data.total);
    } catch (nextError) {
      setOccurrenceError(extractErrorMessage(nextError, "Nao foi possivel carregar as ocorrencias."));
    } finally {
      setGridLoading(false);
    }
  }

  async function handleEdit(id: number) {
    try {
      const data = await fetchOccurrence(id);
      setSelectedOccurrence(data);
      setDialogOpen(true);
    } catch (nextError) {
      setOccurrenceError(extractErrorMessage(nextError, "Nao foi possivel carregar a ocorrencia."));
    }
  }

  async function handleOpenHistory(id: number) {
    try {
      const data = await fetchOccurrence(id);
      setHistoryOccurrence(data);
      setHistoryOpen(true);
    } catch (nextError) {
      setOccurrenceError(extractErrorMessage(nextError, "Nao foi possivel carregar o historico."));
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Deseja realmente excluir esta ocorrencia?")) {
      return;
    }

    try {
      await deleteOccurrence(id);
      setOccurrenceMessage("Ocorrencia removida com sucesso.");
      await loadOccurrences();
      await loadDashboard();
    } catch (nextError) {
      setOccurrenceError(extractErrorMessage(nextError, "Nao foi possivel excluir a ocorrencia."));
    }
  }

  async function submitOccurrence(
    values: OccurrenceFormValues,
    attachments: { opening: File | null; closing: File | null },
  ) {
    setDialogLoading(true);
    try {
      const basePayload = {
        ...values,
        opened_at: new Date(values.opened_at).toISOString(),
        closed_at: values.closed_at ? new Date(values.closed_at).toISOString() : null
      };

      const payload: Partial<{
        cpf: string;
        category_id: number;
        priority_id: number;
        status: string;
        description: string;
        status_reason: string | null;
        opened_at: string | null;
        closed_at: string | null;
      }> = {
        ...basePayload
      };

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
      await loadOccurrences();
      await loadDashboard();
    } catch (nextError) {
      setOccurrenceError(extractErrorMessage(nextError, "Nao foi possivel salvar a ocorrencia."));
    } finally {
      setDialogLoading(false);
    }
  }

  function applyFilters() {
    setActiveFilters(filterDraft.value.trim() ? [filterDraft] : []);
    setPaginationModel((current) => ({ ...current, page: 0 }));
  }

  function clearFilters() {
    setFilterDraft(initialFilter);
    setActiveFilters([]);
    setPaginationModel((current) => ({ ...current, page: 0 }));
  }

  function focusOccurrencesByStatus(status: string) {
    const nextFilter: FilterCondition = {
      field: "status",
      operator: "eq",
      value: status
    };
    setTab("occurrences");
    setFilterDraft(nextFilter);
    setActiveFilters([nextFilter]);
    setPaginationModel((current) => ({ ...current, page: 0 }));
  }

  function clearAllFeedback() {
    clearFeedback();
    setOccurrenceError(null);
    setOccurrenceMessage(null);
  }

  if (!user) {
    return (
      <LoginScreen
        control={control}
        errors={errors}
        loading={loading}
        error={error}
        onSubmit={handleSubmit(async (values) => login(values))}
      />
    );
  }

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        background: theme.palette.mode === "dark"
          ? "radial-gradient(circle at top left, rgba(75,163,255,0.18), transparent 28%), linear-gradient(180deg, #08111f 0%, #0c1729 100%)"
          : "linear-gradient(180deg, #f4f7fb 0%, #eef4ff 100%)"
      })}
    >
      <AppHeader onRefresh={() => { void loadDashboard(); void loadOccurrences(); }} onLogout={() => void logout()} />

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <DashboardPage
            userName={user.full_name}
            tab={tab}
            counts={dashboardCounts}
            statusDistribution={statusDistribution}
            categoryDistribution={categoryDistribution}
            mttrByCategory={mttrByCategory}
            onSelectStatus={focusOccurrencesByStatus}
            onTabChange={setTab}
          >
            <OccurrencePage
              categories={categories}
              priorities={priorities}
              rows={occurrences}
              loading={gridLoading}
              rowCount={rowCount}
              filterDraft={filterDraft}
              paginationModel={paginationModel}
              onFilterChange={setFilterDraft}
              onApplyFilters={applyFilters}
              onClearFilters={clearFilters}
              onPaginationModelChange={setPaginationModel}
              onCreate={() => {
                setSelectedOccurrence(null);
                setDialogOpen(true);
              }}
              onEdit={(id) => void handleEdit(id)}
              onOpenHistory={(id) => void handleOpenHistory(id)}
              onDelete={(id) => void handleDelete(id)}
            />
          </DashboardPage>
        </Stack>
      </Container>

      <OccurrenceDialog
        open={dialogOpen}
        occurrence={selectedOccurrence}
        categories={categories}
        priorities={priorities}
        loading={dialogLoading}
        error={occurrenceError}
        onClose={() => {
          setDialogOpen(false);
          setSelectedOccurrence(null);
        }}
        onSubmit={submitOccurrence}
      />

      <OccurrenceHistory open={historyOpen} occurrence={historyOccurrence} onClose={() => setHistoryOpen(false)} />

      <FeedbackSnackbars successMessage={message ?? occurrenceMessage} errorMessage={error ?? occurrenceError} onClose={clearAllFeedback} />
    </Box>
  );
}

function toInputDateTime(value: string) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    return response?.data?.detail ?? fallback;
  }
  return fallback;
}
