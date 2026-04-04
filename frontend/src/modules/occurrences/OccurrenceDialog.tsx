import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Stack, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type { Category, Occurrence, Priority } from "./types";
import { occurrenceStatuses } from "./types";


const schema = z.object({
  cpf: z.string().min(11, "Informe um CPF valido"),
  category_id: z.coerce.number().int().positive("Selecione a categoria"),
  priority_id: z.coerce.number().int().positive("Selecione a prioridade"),
  status: z.enum(occurrenceStatuses),
  description: z.string().min(5, "Descreva a ocorrencia"),
  opened_at: z.string().min(1, "Informe a data de abertura"),
  closed_at: z.string().optional().or(z.literal(""))
}).superRefine((value, ctx) => {
  if (value.closed_at && value.opened_at && new Date(value.closed_at) < new Date(value.opened_at)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["closed_at"], message: "A data de encerramento deve ser posterior ou igual a abertura" });
  }
});

type FormValues = z.infer<typeof schema>;

type OccurrenceDialogProps = {
  open: boolean;
  occurrence: Occurrence | null;
  categories: Category[];
  priorities: Priority[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
};


export function OccurrenceDialog({
  open,
  occurrence,
  categories,
  priorities,
  loading,
  error,
  onClose,
  onSubmit
}: OccurrenceDialogProps) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cpf: occurrence?.cpf ?? "",
      category_id: occurrence?.category.id ?? 0,
      priority_id: occurrence?.priority.id ?? 0,
      status: (occurrence?.status as FormValues["status"]) ?? "Aberta",
      description: occurrence?.description ?? "",
      opened_at: occurrence ? toInputDateTime(occurrence.opened_at) : getCurrentLocalDateTime(),
      closed_at: occurrence?.closed_at ? toInputDateTime(occurrence.closed_at) : ""
    }
  });

  const occurrenceId = occurrence?.id;
  const availableStatuses = occurrence ? occurrenceStatuses : ["Aberta"];

  useEffect(() => {
    reset({
      cpf: occurrence?.cpf ?? "",
      category_id: occurrence?.category.id ?? 0,
      priority_id: occurrence?.priority.id ?? 0,
      status: (occurrence?.status as FormValues["status"]) ?? "Aberta",
      description: occurrence?.description ?? "",
      opened_at: occurrence ? toInputDateTime(occurrence.opened_at) : getCurrentLocalDateTime(),
      closed_at: occurrence?.closed_at ? toInputDateTime(occurrence.closed_at) : ""
    });
  }, [occurrenceId, occurrence, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{occurrence ? "Editar ocorrencia" : "Nova ocorrencia"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="cpf"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="CPF" error={!!errors.cpf} helperText={errors.cpf?.message} />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Status" error={!!errors.status} helperText={errors.status?.message}>
                    {availableStatuses.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Categoria" error={!!errors.category_id} helperText={errors.category_id?.message}>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="priority_id"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label="Prioridade" error={!!errors.priority_id} helperText={errors.priority_id?.message}>
                    {priorities.map((priority) => (
                      <MenuItem key={priority.id} value={priority.id}>{priority.name}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="opened_at"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="datetime-local" fullWidth label="Data de abertura" InputLabelProps={{ shrink: true }} error={!!errors.opened_at} helperText={errors.opened_at?.message} />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="closed_at"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="datetime-local" fullWidth label="Data de encerramento" InputLabelProps={{ shrink: true }} error={!!errors.closed_at} helperText={errors.closed_at?.message} />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth multiline minRows={4} label="Descricao" error={!!errors.description} helperText={errors.description?.message} />
                )}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


function toInputDateTime(value: string) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function getCurrentLocalDateTime() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}
