import SearchIcon from "@mui/icons-material/Search";
import { Button, Grid, MenuItem, Paper, Stack, TextField } from "@mui/material";

import type { FilterCondition, FilterOption } from "../types";


type FieldOption = {
  label: string;
  value: string;
};

type TxFilterBarProps = {
  fields: FieldOption[];
  filter: FilterCondition;
  priorityOptions: FilterOption[];
  categoryOptions: FilterOption[];
  statusOptions: FilterOption[];
  onChange: (filter: FilterCondition) => void;
  onApply: () => void;
  onClear: () => void;
};


export function TxFilterBar({ fields, filter, priorityOptions, categoryOptions, statusOptions, onChange, onApply, onClear }: TxFilterBarProps) {
  const isSpecialSelectField = ["priority_id", "category_id", "status"].includes(filter.field);
  const isLikeOnlyField = ["cpf", "description"].includes(filter.field);
  const selectOptions = filter.field === "priority_id"
    ? priorityOptions
    : filter.field === "category_id"
      ? categoryOptions
      : filter.field === "status"
        ? statusOptions
        : [];
  const operatorOptions = isSpecialSelectField
    ? [{ label: "Igual", value: "eq" }]
    : isLikeOnlyField
      ? [{ label: "Contem", value: "like" }]
      : [
          { label: "Igual", value: "eq" },
          { label: "Contem", value: "like" }
        ];

  return (
    <Paper sx={{ p: 2.5, borderRadius: 4 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            fullWidth
            label="Campo"
            value={filter.field}
            onChange={(event) => {
              const nextField = event.target.value;
              const isNextSpecialField = ["priority_id", "category_id", "status"].includes(nextField);
              const isNextLikeOnlyField = ["cpf", "description"].includes(nextField);
              const nextFilter: FilterCondition = {
                ...filter,
                field: nextField,
                operator: isNextSpecialField ? "eq" : isNextLikeOnlyField ? "like" : filter.operator,
                value: isNextSpecialField ? "" : filter.value
              };

              if (["priority_id", "category_id", "status"].includes(filter.field) && !isNextSpecialField) {
                nextFilter.operator = isNextLikeOnlyField ? "like" : "eq";
                nextFilter.value = "";
              }

              onChange(nextFilter);
            }}
          >
            {fields.map((field) => (
              <MenuItem key={field.value} value={field.value}>
                {field.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            select
            fullWidth
            label="Operador"
            value={filter.operator}
            disabled={isSpecialSelectField || isLikeOnlyField}
            onChange={(event) => onChange({ ...filter, operator: event.target.value as FilterCondition["operator"] })}
          >
            {operatorOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            {isSpecialSelectField ? (
              <TextField
                select
                fullWidth
                label="Valor"
                value={filter.value}
                onChange={(event) => onChange({ ...filter, operator: "eq", value: event.target.value })}
              >
                <MenuItem value="">Selecione</MenuItem>
                {selectOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                fullWidth
                label="Valor"
                value={filter.value}
                onChange={(event) => onChange({ ...filter, value: event.target.value })}
              />
            )}
            <Button variant="contained" startIcon={<SearchIcon />} onClick={onApply}>
              Filtrar
            </Button>
            <Button variant="text" onClick={onClear}>
              Limpar
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
}
