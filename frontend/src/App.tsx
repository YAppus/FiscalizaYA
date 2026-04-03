import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography
} from "@mui/material";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { useAuth } from "./modules/auth/AuthContext";
import { fetchDashboardCounts } from "./modules/dashboard/api";
import { DashboardCards } from "./modules/dashboard/DashboardCards";
import { createOccurrence, deleteOccurrence, fetchCategories, fetchOccurrence, fetchOccurrences, fetchPriorities, updateOccurrence } from "./modules/occurrences/api";
import { OccurrenceDialog } from "./modules/occurrences/OccurrenceDialog";
import { OccurrenceHistory } from "./modules/occurrences/OccurrenceHistory";
import type { Category, Occurrence, Priority } from "./modules/occurrences/types";
import { TxFilterBar } from "./shared/components/TxFilterBar";
import { TxStatusBadge } from "./shared/components/TxStatusBadge";
import type { FilterCondition } from "./shared/types";


const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres")
});

type LoginValues = z.infer<typeof loginSchema>;
type AppTab = "dashboard" | "occurrences";

const initialFilter: FilterCondition = { field: "status", operator: "eq", value: "" };


export default function App() {
  const { user, loading, error, message, login, logout, clearFeedback } = useAuth();
  const [tab, setTab] = useState<AppTab>("dashboard");
  const [dashboardCounts, setDashboardCounts] = useState<{ status: string; total: number }[]>([]);
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

  const columns = useMemo<GridColDef<Occurrence>[]>(() => [
    { field: "id", headerName: "ID", width: 90 },
    { field: "cpf", headerName: "CPF", minWidth: 150, flex: 0.9 },
    {
      field: "status",
      headerName: "Status",
      minWidth: 160,
      flex: 1,
      renderCell: (params) => <TxStatusBadge status={String(params.value)} />
    },
    { field: "category", headerName: "Categoria", minWidth: 160, flex: 1, valueGetter: (_value, row) => row.category.name },
    { field: "priority", headerName: "Prioridade", minWidth: 160, flex: 1, valueGetter: (_value, row) => row.priority.name },
    { field: "opened_at", headerName: "Abertura", minWidth: 180, flex: 1, valueGetter: (_value, row) => formatDate(row.opened_at) },
    { field: "closed_at", headerName: "Encerramento", minWidth: 180, flex: 1, valueGetter: (_value, row) => row.closed_at ? formatDate(row.closed_at) : "-" },
    {
      field: "actions",
      headerName: "Acoes",
      sortable: false,
      filterable: false,
      minWidth: 160,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={() => void handleEdit(row.id)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => void handleOpenHistory(row.id)}>
            <HistoryRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => void handleDelete(row.id)}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      )
    }
  ], []);

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
    void loadDashboard();
    void loadOccurrences();
  }, [user, paginationModel.page, paginationModel.pageSize, activeFilters]);

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
      setDashboardCounts(await fetchDashboardCounts());
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

  async function submitOccurrence(values: {
    cpf: string;
    category_id: number;
    priority_id: number;
    status: string;
    description: string;
    opened_at: string;
    closed_at?: string;
  }) {
    setDialogLoading(true);
    try {
      const payload = {
        ...values,
        opened_at: new Date(values.opened_at).toISOString(),
        closed_at: values.closed_at ? new Date(values.closed_at).toISOString() : null
      };
      if (selectedOccurrence) {
        await updateOccurrence(selectedOccurrence.id, payload);
        setOccurrenceMessage("Ocorrencia atualizada com sucesso.");
      } else {
        await createOccurrence(payload);
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
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, #f4f7fb 0%, #eef4ff 100%)" }}>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(11,95,255,0.12)" }}>
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ width: "100%" }} spacing={1.5}>
            <Box>
              <Typography variant="h5">FiscaTeste</Typography>
              <Typography color="text.secondary">Painel de ocorrencias e acompanhamento por status</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => { void loadDashboard(); void loadOccurrences(); }}>
                Atualizar
              </Button>
              <Button variant="contained" color="secondary" onClick={() => void logout()}>
                Sair
              </Button>
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Card elevation={0} sx={{ borderRadius: 5, background: "linear-gradient(135deg, #0b5fff 0%, #16367a 100%)", color: "white" }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="h4">Bem-vindo, {user.full_name}</Typography>
                  <Typography sx={{ opacity: 0.88, mt: 1.2 }}>
                    Use o dashboard para acompanhar o fluxo e a grade para operar o CRUD com filtros, paginacao e historico.
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Tabs
                    value={tab}
                    onChange={(_, value: AppTab) => setTab(value)}
                    textColor="inherit"
                    indicatorColor="secondary"
                    variant="fullWidth"
                    sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: 3 }}
                  >
                    <Tab label="Dashboard" value="dashboard" />
                    <Tab label="Ocorrencias" value="occurrences" />
                  </Tabs>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {tab === "dashboard" ? (
            <DashboardCards counts={dashboardCounts} />
          ) : (
            <Stack spacing={2}>
              <TxFilterBar
                fields={[
                  { label: "Status", value: "status" },
                  { label: "CPF", value: "cpf" },
                  { label: "Descricao", value: "description" },
                  { label: "Categoria", value: "category_id" },
                  { label: "Prioridade", value: "priority_id" }
                ]}
                filter={filterDraft}
                onChange={setFilterDraft}
                onApply={applyFilters}
                onClear={clearFilters}
              />

              <Card elevation={0} sx={{ borderRadius: 4 }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h5">CRUD de ocorrencias</Typography>
                      <Typography color="text.secondary">Paginação server-side, filtros por coluna e acesso ao histórico.</Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<AddRoundedIcon />}
                      onClick={() => {
                        setSelectedOccurrence(null);
                        setDialogOpen(true);
                      }}
                    >
                      Nova ocorrencia
                    </Button>
                  </Stack>

                  {!categories.length || !priorities.length ? (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Cadastre categorias e prioridades no backend para operar o formulario de ocorrencias.
                    </Alert>
                  ) : null}

                  <Box sx={{ width: "100%", overflow: "hidden" }}>
                    <DataGrid
                      autoHeight
                      rows={occurrences}
                      columns={columns}
                      loading={gridLoading}
                      rowCount={rowCount}
                      paginationMode="server"
                      paginationModel={paginationModel}
                      onPaginationModelChange={setPaginationModel}
                      pageSizeOptions={[5, 10, 20, 50]}
                      disableRowSelectionOnClick
                      sx={{ border: 0 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          )}
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

      <Snackbar open={!!message || !!occurrenceMessage} autoHideDuration={3500} onClose={clearAllFeedback}>
        <Alert severity="success" onClose={clearAllFeedback} variant="filled">
          {message ?? occurrenceMessage}
        </Alert>
      </Snackbar>

      <Snackbar open={!!error || !!occurrenceError} autoHideDuration={4500} onClose={clearAllFeedback}>
        <Alert severity="error" onClose={clearAllFeedback} variant="filled">
          {error ?? occurrenceError}
        </Alert>
      </Snackbar>
    </Box>
  );
}


function LoginScreen({
  control,
  errors,
  loading,
  error,
  onSubmit
}: {
  control: ReturnType<typeof useForm<LoginValues>>["control"];
  errors: ReturnType<typeof useForm<LoginValues>>["formState"]["errors"];
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(11,95,255,0.22), transparent 35%), linear-gradient(180deg, #f8fbff 0%, #eef3fb 100%)", py: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card elevation={0} sx={{ borderRadius: 5, height: "100%", color: "white", background: "linear-gradient(145deg, #081f5c 0%, #0b5fff 58%, #4ba3ff 100%)" }}>
              <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                <Typography variant="h3" gutterBottom>Controle de ocorrencias</Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 560 }}>
                  Login JWT, dashboard por status, DataGrid paginado e histórico completo da evolução de cada atendimento.
                </Typography>
                <Stack spacing={2.5} sx={{ mt: 4 }}>
                  <Feature label="Dashboard operacional" description="Acompanhe rapidamente quantas ocorrencias estao em cada etapa do fluxo." />
                  <Feature label="CRUD responsivo" description="Trabalhe com filtros, paginação server-side e formulários validados." />
                  <Feature label="Histórico auditável" description="Veja a linha do tempo de mudanças de status sem expor HTML dinâmico." />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card elevation={0} sx={{ borderRadius: 5 }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h4" gutterBottom>Entrar</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>Use suas credenciais para acessar as rotas protegidas.</Typography>
                {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
                <Stack spacing={2.5}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Email" type="email" error={!!errors.email} helperText={errors.email?.message} />
                    )}
                  />
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Senha" type="password" error={!!errors.password} helperText={errors.password?.message} />
                    )}
                  />
                  <Button variant="contained" size="large" onClick={onSubmit} disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    O frontend valida antes do envio, mas a API continua responsável pela validação final e pela segurança.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}


function Feature({ label, description }: { label: string; description: string }) {
  return (
    <Box>
      <Typography variant="h6">{label}</Typography>
      <Typography sx={{ opacity: 0.82 }}>{description}</Typography>
    </Box>
  );
}


function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}


function extractErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    return response?.data?.detail ?? fallback;
  }
  return fallback;
}
