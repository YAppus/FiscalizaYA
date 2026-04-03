import SearchIcon from "@mui/icons-material/Search";
import { Button, Grid, MenuItem, Paper, Stack, TextField } from "@mui/material";

import type { FilterCondition } from "../types";


type FieldOption = {
  label: string;
  value: string;
};

type TxFilterBarProps = {
  fields: FieldOption[];
  filter: FilterCondition;
  onChange: (filter: FilterCondition) => void;
  onApply: () => void;
  onClear: () => void;
};


export function TxFilterBar({ fields, filter, onChange, onApply, onClear }: TxFilterBarProps) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 4 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            fullWidth
            label="Campo"
            value={filter.field}
            onChange={(event) => onChange({ ...filter, field: event.target.value })}
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
            onChange={(event) => onChange({ ...filter, operator: event.target.value as FilterCondition["operator"] })}
          >
            <MenuItem value="eq">Igual</MenuItem>
            <MenuItem value="like">Contem</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              fullWidth
              label="Valor"
              value={filter.value}
              onChange={(event) => onChange({ ...filter, value: event.target.value })}
            />
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
