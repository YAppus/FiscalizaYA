import { Chip } from "@mui/material";


const colorMap: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
  Aberta: "default",
  "Em Analise": "info",
  "Em Andamento": "warning",
  Resolvida: "warning",
  Fechada: "success",
  Cancelada: "error"
};


export function TxStatusBadge({ status }: { status: string }) {
  return <Chip label={status} color={colorMap[status] ?? "default"} size="small" variant="outlined" />;
}
