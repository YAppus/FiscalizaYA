import { Box, Card, CardContent, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useMemo, useState } from "react";

import type { DashboardPeriodKey, DashboardSolicitationPeriod, DashboardStatusSlice } from "./types";


const statusColors: Record<string, string> = {
  Aberta: "#9AA5B1",
  "Em Analise": "#4BA3FF",
  "Em Andamento": "#16367A",
  Resolvida: "#D8C84A",
  Fechada: "#39A96B",
  Cancelada: "#E25555"
};


export function DashboardCharts({ periods }: { periods: DashboardSolicitationPeriod[] }) {
  const [activePeriod, setActivePeriod] = useState<DashboardPeriodKey>("weekly");
  const period = periods.find((item) => item.key === activePeriod) ?? periods[0] ?? {
    key: "weekly" as const,
    label: "Semanal",
    total: 0,
    slices: []
  };
  const pieBackground = useMemo(() => buildConicGradient(period?.slices ?? []), [period]);

  return (
    <Card elevation={0} sx={{ borderRadius: 4, height: "100%" }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5">Solicitacoes por periodo</Typography>
              <Typography color="text.secondary">
                Visao percentual dos status atuais em recortes semanal, mensal e anual.
              </Typography>
            </Box>
            <Tabs
              value={activePeriod}
              onChange={(_event, value: DashboardPeriodKey) => setActivePeriod(value)}
              variant="fullWidth"
              sx={{ minWidth: { xs: "100%", sm: 280 } }}
            >
              {periods.map((item) => (
                <Tab key={item.key} label={item.label} value={item.key} />
              ))}
            </Tabs>
          </Stack>

          <Typography variant="subtitle1" sx={{ textAlign: "center", fontWeight: 700 }}>
            Grafico de ocorrencias
          </Typography>

          <Stack direction={{ xs: "column", lg: "row" }} spacing={3} alignItems={{ xs: "stretch", lg: "flex-start" }}>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ minHeight: 220 }}>
                {period.slices.map((slice) => (
                  <Stack key={slice.status} spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary">
                      {slice.percentage.toFixed(1)}%
                    </Typography>
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: 56,
                        minHeight: 14,
                        height: `${Math.max(slice.percentage * 1.6, 14)}px`,
                        borderRadius: "16px 16px 6px 6px",
                        background: statusColors[slice.status] ?? "#9AA5B1",
                        transition: "height 220ms ease"
                      }}
                    />
                    <Typography variant="caption" sx={{ textAlign: "center" }}>
                      {slice.status}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box sx={{ width: { xs: "100%", lg: 320 } }}>
              <Stack spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 210,
                    height: 210,
                    borderRadius: "50%",
                    background: pieBackground,
                    position: "relative"
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 28,
                      borderRadius: "50%",
                      bgcolor: "background.paper",
                      display: "grid",
                      placeItems: "center",
                      textAlign: "center",
                      px: 2
                    }}
                  >
                    <Box>
                      <Typography variant="h4">{period.total}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        solicitacoes
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Stack spacing={1.25} sx={{ width: "100%" }}>
                  {period.slices.map((slice) => (
                    <LegendItem key={slice.status} slice={slice} />
                  ))}
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}


function LegendItem({ slice }: { slice: DashboardStatusSlice }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            bgcolor: statusColors[slice.status] ?? "#9AA5B1"
          }}
        />
        <Typography variant="body2">{slice.status}</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {slice.total} | {slice.percentage.toFixed(1)}%
      </Typography>
    </Stack>
  );
}


function buildConicGradient(slices: DashboardStatusSlice[]) {
  const nonZeroSlices = slices.filter((slice) => slice.percentage > 0);
  if (!nonZeroSlices.length) {
    return "conic-gradient(#E7EDF5 0 100%)";
  }

  let current = 0;
  const stops = nonZeroSlices.map((slice) => {
    const next = current + slice.percentage;
    const stop = `${statusColors[slice.status] ?? "#9AA5B1"} ${current}% ${next}%`;
    current = next;
    return stop;
  });

  if (current < 100) {
    stops.push(`#E7EDF5 ${current}% 100%`);
  }

  return `conic-gradient(${stops.join(", ")})`;
}
