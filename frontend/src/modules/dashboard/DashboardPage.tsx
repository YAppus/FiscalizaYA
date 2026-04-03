import { Card, CardContent, Grid, Tab, Tabs, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { DashboardCards } from "./DashboardCards";


type AppTab = "dashboard" | "occurrences";

type DashboardPageProps = {
  userName: string;
  tab: AppTab;
  counts: { status: string; total: number }[];
  onTabChange: (value: AppTab) => void;
  children?: ReactNode;
};


export function DashboardPage({ userName, tab, counts, onTabChange, children }: DashboardPageProps) {
  return (
    <>
      <Card elevation={0} sx={{ borderRadius: 5, background: "linear-gradient(135deg, #0b5fff 0%, #16367a 100%)", color: "white" }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h4">Bem-vindo, {userName}</Typography>
              <Typography sx={{ opacity: 0.88, mt: 1.2 }}>
                Use o dashboard para acompanhar o fluxo e a grade para operar o CRUD com filtros, paginacao e historico.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Tabs
                value={tab}
                onChange={(_event, value: AppTab) => onTabChange(value)}
                textColor="inherit"
                indicatorColor="secondary"
                variant="fullWidth"
                sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: 3 }}
              >
                <Tab label="Dashboard" value="dashboard" />
                <Tab label="Ocorrencias" value="occurrences" />
              </Tabs>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {tab === "dashboard" ? <DashboardCards counts={counts} /> : children}
    </>
  );
}
