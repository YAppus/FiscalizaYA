import { Chip } from "@mui/material";

const stylesMap: Record<string, { color?: "default" | "info" | "warning" | "success" | "error"; sx?: object }> = {
  Aberta: { color: "default" },
  "Em Analise": { color: "info" },
  "Em Andamento": {
    sx: {
      color: "#16367A",
      borderColor: "#16367A",
      bgcolor: "rgba(22,54,122,0.08)"
    }
  },
  Resolvida: { color: "warning" },
  Fechada: { color: "success" },
  Cancelada: { color: "error" }
};


export function TxStatusBadge({ status }: { status: string }) {
  const config = stylesMap[status] ?? { color: "default" as const };
  return <Chip label={status} color={config.color ?? "default"} size="small" variant="outlined" sx={config.sx} />;
}
