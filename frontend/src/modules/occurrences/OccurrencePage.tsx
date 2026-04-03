import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import { Alert, Box, Button, Card, CardContent, IconButton, Stack, Typography } from "@mui/material";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import { useMemo } from "react";

import { TxFilterBar } from "../../shared/components/TxFilterBar";
import { TxStatusBadge } from "../../shared/components/TxStatusBadge";
import type { FilterCondition, FilterOption } from "../../shared/types";
import { occurrenceStatuses } from "./types";
import type { Category, Occurrence, Priority } from "./types";


type OccurrencePageProps = {
  categories: Category[];
  priorities: Priority[];
  rows: Occurrence[];
  loading: boolean;
  rowCount: number;
  filterDraft: FilterCondition;
  paginationModel: GridPaginationModel;
  onFilterChange: (filter: FilterCondition) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  onCreate: () => void;
  onEdit: (id: number) => void;
  onOpenHistory: (id: number) => void;
  onDelete: (id: number) => void;
};


export function OccurrencePage({
  categories,
  priorities,
  rows,
  loading,
  rowCount,
  filterDraft,
  paginationModel,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  onPaginationModelChange,
  onCreate,
  onEdit,
  onOpenHistory,
  onDelete
}: OccurrencePageProps) {
  const categoryFilterOptions: FilterOption[] = categories.map((category) => ({
    label: category.name,
    value: String(category.id)
  }));
  const priorityFilterOptions: FilterOption[] = priorities.map((priority) => ({
    label: priority.name,
    value: String(priority.id)
  }));
  const statusFilterOptions: FilterOption[] = occurrenceStatuses.map((status) => ({
    label: status,
    value: status
  }));

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
          <IconButton size="small" onClick={() => onEdit(row.id)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onOpenHistory(row.id)}>
            <HistoryRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(row.id)}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      )
    }
  ], [onDelete, onEdit, onOpenHistory]);

  return (
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
        categoryOptions={categoryFilterOptions}
        priorityOptions={priorityFilterOptions}
        statusOptions={statusFilterOptions}
        onChange={onFilterChange}
        onApply={onApplyFilters}
        onClear={onClearFilters}
      />

      <Card elevation={0} sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5">CRUD de ocorrencias</Typography>
              <Typography color="text.secondary">Paginacao server-side, filtros por coluna e acesso ao historico.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={onCreate}>
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
              rows={rows}
              columns={columns}
              loading={loading}
              rowCount={rowCount}
              paginationMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={onPaginationModelChange}
              pageSizeOptions={[5, 10, 20, 50]}
              disableRowSelectionOnClick
              sx={{ border: 0 }}
            />
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}


function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}
