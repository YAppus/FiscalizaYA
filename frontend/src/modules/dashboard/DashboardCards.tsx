import { Box, ButtonBase, Card, CardContent, Grid, Stack, Typography } from "@mui/material";

import { TxStatusBadge } from "../../shared/components/TxStatusBadge";
import { DashboardCharts } from "./DashboardCharts";
import type { DashboardSolicitationPeriod, StatusCount } from "./types";

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
                <Card elevation={0} sx={{ borderRadius: 4, height: "100%" }}>
                  <ButtonBase
                    onClick={() => onSelectStatus(item.status)}
                    sx={{
                      width: "100%",
                      height: "100%",
                      textAlign: "left",
                      borderRadius: 4,
                      alignItems: "stretch"
                    }}
                  >
                    <CardContent sx={{ width: "100%" }}>
                      <TxStatusBadge status={item.status} />
                      <Typography variant="h4" sx={{ mt: 2, mb: 0.5 }}>
                        {item.total}
                      </Typography>
                      <Typography color="text.secondary">ocorrencias com status {item.status}</Typography>
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
