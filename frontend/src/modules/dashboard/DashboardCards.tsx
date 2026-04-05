import { Box, ButtonBase, Card, CardContent, Divider, Grid, Stack, Typography } from "@mui/material";

import { DashboardCharts } from "./DashboardCharts";
import type { DashboardSolicitationPeriod, StatusCount } from "./types";

const statusColors: Record<string, string> = {
  Aberta: "#9AA5B1",
  "Em Analise": "#4BA3FF",
  "Em Andamento": "#16367A",
  Resolvida: "#D8C84A",
  Fechada: "#39A96B",
  Cancelada: "#E25555"
};

export function DashboardCards({
  counts,
  solicitationPeriods,
  onSelectStatus
}: {
  counts: StatusCount[];
  solicitationPeriods: DashboardSolicitationPeriod[];
  onSelectStatus: (status: string) => void;
}) {
  return (
    <Grid container spacing={2.5} alignItems="stretch">
      <Grid size={{ xs: 12, lg: 6 }}>
        <Stack spacing={2}>
          <Box sx={{ pl: { xs: 0, md: 1 } }}>
            <Typography variant="h5">Dados demonstrativos</Typography>
            <Typography color="text.secondary">
              Totais atuais por status, alinhados para consulta rapida da operacao.
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {counts.map((item) => (
              <Grid key={item.status} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card elevation={0} sx={{ borderRadius: 2, height: "100%" }}>
                  <ButtonBase
                    onClick={() => onSelectStatus(item.status)}
                    sx={{
                      width: "100%",
                      height: "100%",
                      textAlign: "left",
                      borderRadius: 2,
                      alignItems: "stretch"
                    }}
                  >
                    <CardContent sx={{ width: "100%", minWidth: 0, px: 2.25, py: 1.75 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          textAlign: "center",
                          fontSize: "1.05rem",
                          mb: 1.25,
                          color: statusColors[item.status] ?? "text.primary"
                        }}
                      >
                        {item.status}
                      </Typography>
                      <Divider
                        sx={(theme) => ({
                          borderColor: theme.palette.mode === "dark" ? "rgba(0,0,0,0.9)" : "rgba(8,17,31,0.92)",
                          borderBottomWidth: 2.5,
                          mb: 2
                        })}
                      />
                      <Typography variant="h4" sx={{ mt: 0.5, mb: 0.5 }}>
                        {item.total}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{
                          maxWidth: 112,
                          lineHeight: 1.45,
                          overflowWrap: "anywhere",
                          wordBreak: "break-word"
                        }}
                      >
                        ocorrencias com status {item.status}
                      </Typography>
                    </CardContent>
                  </ButtonBase>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <DashboardCharts periods={solicitationPeriods} />
      </Grid>
    </Grid>
  );
}
