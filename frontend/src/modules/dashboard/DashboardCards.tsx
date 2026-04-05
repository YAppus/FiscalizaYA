import { Box, ButtonBase, Card, CardContent, Divider, Grid, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useState } from "react";

import type { DashboardMttrCategory, DashboardOverview, DashboardPeriodKey, DashboardStatusSlice, StatusCount } from "./types";

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
  periods,
  onSelectStatus
}: {
  counts: StatusCount[];
  periods: DashboardOverview["periods"];
  onSelectStatus: (status: string) => void;
}) {
  const [statusPeriod, setStatusPeriod] = useState<DashboardPeriodKey>("month");
  const [mttrPeriod, setMttrPeriod] = useState<DashboardPeriodKey>("month");
  const [categoryPeriod, setCategoryPeriod] = useState<DashboardPeriodKey>("month");

  return (
    <Grid container spacing={1.5} alignItems="stretch">
      <Grid size={{ xs: 12, lg: 6 }}>
        <Stack spacing={1.25}>
          <Box>
            <Typography variant="h6" sx={{ textAlign: "center" }}>Dados demonstrativos</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ textAlign: "center" }}>
              Totais atuais por status, alinhados para consulta rapida da operacao.
            </Typography>
          </Box>

          <Grid container spacing={1.25}>
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
                    <CardContent sx={{ width: "100%", minWidth: 0, px: 1.5, py: 1.2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          textAlign: "center",
                          fontSize: "0.92rem",
                          mb: 0.8,
                          color: statusColors[item.status] ?? "text.primary"
                        }}
                      >
                        {item.status}
                      </Typography>
                      <Divider
                        sx={(theme) => ({
                          borderColor: theme.palette.mode === "dark" ? "rgba(0,0,0,0.9)" : "rgba(8,17,31,0.92)",
                          borderBottomWidth: 2,
                          mb: 1.1
                        })}
                      />
                      <Typography variant="h4" sx={{ mt: 0.25, mb: 0.25, fontSize: "2rem" }}>
                        {item.total}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 96,
                          lineHeight: 1.35,
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
        <Card elevation={0} sx={{ borderRadius: 4, height: "100%" }}>
          <CardContent sx={{ p: { xs: 1.5, md: 1.75 }, height: "100%" }}>
            <Stack spacing={1.25} sx={{ height: "100%" }}>
              <Box>
                <Typography variant="h6" sx={{ textAlign: "center" }}>Grafico de ocorrencias</Typography>
                <Typography color="text.secondary" variant="body2" sx={{ textAlign: "center" }}>
                  Distribuicao das ocorrencias por status.
                </Typography>
              </Box>
              <PeriodSelector value={statusPeriod} onChange={setStatusPeriod} />
              <Box sx={{ flex: 1, display: "grid", alignItems: "center" }}>
                <StatusPieChart slices={periods[statusPeriod].statusDistribution} />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <Card elevation={0} sx={{ borderRadius: 4, height: "100%" }}>
          <CardContent sx={{ p: { xs: 1.5, md: 1.75 }, height: "100%" }}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="h6" sx={{ textAlign: "center" }}>MTTR por categoria</Typography>
                <Typography color="text.secondary" variant="body2" sx={{ textAlign: "center" }}>
                  Tempo medio de resolucao das ocorrencias fechadas por denuncia, solicitacao e reclamacao.
                </Typography>
              </Box>
              <PeriodSelector value={mttrPeriod} onChange={setMttrPeriod} />

              <MttrColumnChart items={periods[mttrPeriod].mttrByCategory} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <Card elevation={0} sx={{ borderRadius: 4, height: "100%" }}>
          <CardContent sx={{ p: { xs: 1.5, md: 1.75 }, height: "100%" }}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="h6" sx={{ textAlign: "center" }}>Ocorrencias por categoria</Typography>
                <Typography color="text.secondary" variant="body2" sx={{ textAlign: "center" }}>
                  Relacao percentual entre denuncia, solicitacao e reclamacao.
                </Typography>
              </Box>
              <PeriodSelector value={categoryPeriod} onChange={setCategoryPeriod} />
              <Stack direction="row" spacing={1.25} alignItems="flex-end" sx={{ minHeight: 150 }}>
                {periods[categoryPeriod].categoryDistribution.map((item) => (
                  <Stack key={item.category} spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary">
                      {item.percentage.toFixed(1)}%
                    </Typography>
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: 48,
                        minHeight: 12,
                        height: `${Math.max(item.percentage * 1.2, 12)}px`,
                        borderRadius: "12px 12px 4px 4px",
                        background: "#0b5fff",
                        transition: "height 220ms ease"
                      }}
                    />
                    <Typography variant="caption" sx={{ textAlign: "center" }}>
                      {item.category}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.total} ocorrencias
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}


function PeriodSelector({
  value,
  onChange
}: {
  value: DashboardPeriodKey;
  onChange: (value: DashboardPeriodKey) => void;
}) {
  return (
    <Stack alignItems="center">
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        onChange={(_event, nextValue: DashboardPeriodKey | null) => {
          if (nextValue) {
            onChange(nextValue);
          }
        }}
        sx={{ flexWrap: "wrap" }}
      >
        <ToggleButton value="week">Semana</ToggleButton>
        <ToggleButton value="month">Mes</ToggleButton>
        <ToggleButton value="year">Ano</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}


function StatusPieChart({ slices }: { slices: DashboardStatusSlice[] }) {
  const total = slices.reduce((sum, item) => sum + item.total, 0);
  const pieBackground = buildConicGradient(slices);

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      alignItems="center"
      justifyContent="space-between"
      sx={{ width: "100%" }}
    >
      <Stack spacing={1.1} sx={{ width: { xs: "100%", md: "48%" } }}>
        {slices.map((slice) => (
          <Stack key={slice.status} direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
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
        ))}
      </Stack>

      <Box
        sx={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: pieBackground,
          position: "relative",
          flexShrink: 0
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 26,
            borderRadius: "50%",
            bgcolor: "background.paper",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            px: 2
          }}
        >
          <Box>
            <Typography variant="h5">{total}</Typography>
            <Typography variant="caption" color="text.secondary">
              ocorrencias
            </Typography>
          </Box>
        </Box>
      </Box>
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


function MttrColumnChart({ items }: { items: DashboardMttrCategory[] }) {
  const maxHours = Math.max(...items.map((item) => item.averageResolutionHours), 0);
  const chartTop = maxHours + 5;

  return (
    <Stack spacing={1.25}>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
        Escala maxima: {formatHours(chartTop)}
      </Typography>
      <Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ minHeight: 150 }}>
        {items.map((item) => {
          const ratio = chartTop > 0 ? item.averageResolutionHours / chartTop : 0;
          return (
            <Stack key={item.category} spacing={0.7} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                {formatHours(item.averageResolutionHours)}
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 42,
                  minHeight: 12,
                  height: `${Math.max(ratio * 110, 12)}px`,
                  borderRadius: "10px 10px 4px 4px",
                  background: "#0b5fff",
                  transition: "height 220ms ease"
                }}
              />
              <Typography variant="caption" sx={{ textAlign: "center" }}>
                {item.category}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}


function formatHours(hours: number) {
  if (!hours) {
    return "0 h";
  }

  if (hours >= 24) {
    return `${(hours / 24).toFixed(1)} dias`;
  }

  return `${hours.toFixed(1)} h`;
}
