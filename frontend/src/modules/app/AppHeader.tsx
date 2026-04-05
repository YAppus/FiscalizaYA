import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { AppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material";

import { ThemeModeToggle } from "../../shared/components/ThemeModeToggle";


type AppHeaderProps = {
  onRefresh: () => void;
  onLogout: () => void;
};


export function AppHeader({ onRefresh, onLogout }: AppHeaderProps) {
  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={(theme) => ({
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(11,95,255,0.12)"}`
      })}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ width: "100%" }} spacing={1.5}>
          <Box>
            <Typography variant="h5">FiscaTeste</Typography>
            <Typography color="text.secondary">Painel de ocorrencias e acompanhamento por status</Typography>
          </Box>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
            <ThemeModeToggle />
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={onRefresh}>
              Atualizar
            </Button>
            <Button variant="contained" color="secondary" onClick={onLogout}>
              Sair
            </Button>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
