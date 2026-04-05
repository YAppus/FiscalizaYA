import { ChangeEvent, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Stack, TextField } from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import type { Category, Occurrence, Priority } from "./types";
import { occurrenceStatuses } from "./types";

const MAX_PDF_ATTACHMENT_SIZE_BYTES = 1024 * 1024;

const schema = z.object({
  cpf: z.string().min(11, "Informe um CPF valido"),
  category_id: z.coerce.number().int().positive("Selecione a categoria"),
  priority_id: z.coerce.number().int().positive("Selecione a prioridade"),
  status: z.enum(occurrenceStatuses),
  description: z.string().min(5, "Descreva a ocorrencia"),
  status_reason: z.string().optional().or(z.literal("")),
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
  onSubmit: (values: FormValues, attachments: { opening: File | null; closing: File | null }) => Promise<void>;
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
  const [openingAttachment, setOpeningAttachment] = useState<File | null>(null);
  const [closingAttachment, setClosingAttachment] = useState<File | null>(null);
  const [openingAttachmentError, setOpeningAttachmentError] = useState<string | null>(null);
  const [closingAttachmentError, setClosingAttachmentError] = useState<string | null>(null);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cpf: occurrence?.cpf ?? "",
      category_id: occurrence?.category.id ?? 0,
      priority_id: occurrence?.priority.id ?? 0,
      status: (occurrence?.status as FormValues["status"]) ?? "Aberta",
      description: occurrence?.description ?? "",
      status_reason: "",
      opened_at: occurrence ? toInputDateTime(occurrence.opened_at) : getCurrentLocalDateTime(),
      closed_at: occurrence?.closed_at ? toInputDateTime(occurrence.closed_at) : ""
    }
  });

  const occurrenceId = occurrence?.id;
  const availableStatuses = occurrence ? occurrenceStatuses : ["Aberta"];
  const watchedStatus = useWatch({ control, name: "status" });
  const requiresStatusReason = Boolean(
    occurrence &&
    watchedStatus &&
    watchedStatus !== occurrence.status &&
    ["Fechada", "Cancelada"].includes(watchedStatus)
  );
  const openingAttachmentName = occurrence?.attachments.find((item) => item.phase === "opening")?.original_filename;
  const closingAttachmentName = occurrence?.attachments.find((item) => item.phase === "closing")?.original_filename;

  useEffect(() => {
    setOpeningAttachment(null);
    setClosingAttachment(null);
    setOpeningAttachmentError(null);
    setClosingAttachmentError(null);
    reset({
      cpf: occurrence?.cpf ?? "",
      category_id: occurrence?.category.id ?? 0,
      priority_id: occurrence?.priority.id ?? 0,
      status: (occurrence?.status as FormValues["status"]) ?? "Aberta",
      description: occurrence?.description ?? "",
      status_reason: "",
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
            {!occurrence ? (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  type="file"
                  label="PDF da abertura"
                  error={!!openingAttachmentError}
                  helperText={openingAttachmentError ?? openingAttachment?.name ?? "Opcional. Envie no maximo um PDF na abertura (ate 1 MB)."}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ accept: "application/pdf,.pdf" }}
                  onChange={(event) => handleAttachmentChange(event, setOpeningAttachment, setOpeningAttachmentError)}
                />
              </Grid>
            ) : openingAttachmentName ? (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info">PDF de abertura anexado: {openingAttachmentName}</Alert>
              </Grid>
            ) : null}
            {requiresStatusReason ? (
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="status_reason"
                  control={control}
                  rules={{
                    validate: (value) => !requiresStatusReason || Boolean(value?.trim()) || "Informe o motivo da alteracao de status"
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      minRows={3}
                      label="Motivo da alteracao"
                      error={!!errors.status_reason}
                      helperText={errors.status_reason?.message}
                    />
                  )}
                />
              </Grid>
            ) : null}
            {requiresStatusReason ? (
              <Grid size={{ xs: 12 }}>
                {closingAttachmentName ? (
                  <Alert severity="info" sx={{ mb: 1.5 }}>
                    PDF de encerramento anexado: {closingAttachmentName}
                  </Alert>
                ) : null}
                <TextField
                  fullWidth
                  type="file"
                  label="PDF do encerramento"
                  error={!!closingAttachmentError}
                  helperText={closingAttachmentError ?? closingAttachment?.name ?? "Opcional. Envie no maximo um PDF ao fechar ou cancelar (ate 1 MB)."}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ accept: "application/pdf,.pdf" }}
                  onChange={(event) => handleAttachmentChange(event, setClosingAttachment, setClosingAttachmentError)}
                />
              </Grid>
            ) : null}
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit((values) => onSubmit(values, { opening: openingAttachment, closing: closingAttachment }))}
          disabled={loading}
        >
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

function handleAttachmentChange(
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setAttachment: (file: File | null) => void,
  setAttachmentError: (message: string | null) => void,
) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  setAttachmentError(null);

  if (file && file.size > MAX_PDF_ATTACHMENT_SIZE_BYTES) {
    setAttachment(null);
    setAttachmentError("O arquivo PDF deve ter no maximo 1 MB");
    input.value = "";
    return;
  }

  if (file && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    setAttachment(null);
    setAttachmentError("Apenas arquivos PDF sao permitidos");
    input.value = "";
    return;
  }
  setAttachment(file);
}
