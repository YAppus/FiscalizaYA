import { Card, CardContent, Grid, Typography } from "@mui/material";

import { TxStatusBadge } from "../../shared/components/TxStatusBadge";


type StatusCount = {
  status: string;
  total: number;
};


export function DashboardCards({ counts }: { counts: StatusCount[] }) {
  return (
    <Grid container spacing={2}>
      {counts.map((item) => (
        <Grid key={item.status} size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card elevation={0} sx={{ borderRadius: 4, height: "100%" }}>
            <CardContent>
              <TxStatusBadge status={item.status} />
              <Typography variant="h4" sx={{ mt: 2, mb: 0.5 }}>
                {item.total}
              </Typography>
              <Typography color="text.secondary">ocorrencias com status {item.status}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
