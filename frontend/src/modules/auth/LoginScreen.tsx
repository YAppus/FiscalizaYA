import { Alert, Box, Button, Card, CardContent, Container, Grid, Stack, TextField, Typography } from "@mui/material";
import { Controller, type Control, type FieldErrors } from "react-hook-form";

import { ThemeModeToggle } from "../../shared/components/ThemeModeToggle";


type LoginValues = {
  email: string;
  password: string;
};

type LoginScreenProps = {
  control: Control<LoginValues>;
  errors: FieldErrors<LoginValues>;
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
};


export function LoginScreen({ control, errors, loading, error, onSubmit }: LoginScreenProps) {
  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        background: theme.palette.mode === "dark"
          ? "radial-gradient(circle at top left, rgba(75,163,255,0.2), transparent 32%), linear-gradient(180deg, #08111f 0%, #0d1727 100%)"
          : "radial-gradient(circle at top left, rgba(11,95,255,0.22), transparent 35%), linear-gradient(180deg, #f8fbff 0%, #eef3fb 100%)",
        py: 6
      })}
    >
      <Container maxWidth="lg">
        <Stack alignItems={{ xs: "stretch", md: "flex-end" }} sx={{ mb: 3 }}>
          <ThemeModeToggle />
        </Stack>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }} sx={{ order: { xs: 2, md: 1 } }}>
            <Card
              elevation={0}
              sx={(theme) => ({
                borderRadius: 5,
                height: "100%",
                color: "white",
                background: theme.palette.mode === "dark"
                  ? "linear-gradient(145deg, #06122d 0%, #0e2d68 58%, #2b68c7 100%)"
                  : "linear-gradient(145deg, #081f5c 0%, #0b5fff 58%, #4ba3ff 100%)"
              })}
            >
              <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                <Typography variant="h3" gutterBottom>Controle de ocorrencias</Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 560 }}>
                  Login JWT, dashboard por status, DataGrid paginado e historico completo da evolucao de cada atendimento.
                </Typography>
                <Stack spacing={2.5} sx={{ mt: 4 }}>
                  <Feature label="Dashboard operacional" description="Acompanhe rapidamente quantas ocorrencias estao em cada etapa do fluxo." />
                  <Feature label="CRUD responsivo" description="Trabalhe com filtros, paginacao server-side e formularios validados." />
                  <Feature label="Historico auditavel" description="Veja a linha do tempo de mudancas de status sem expor HTML dinamico." />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }} sx={{ order: { xs: 1, md: 2 } }}>
            <Card
              elevation={0}
              sx={(theme) => ({
                borderRadius: 5,
                bgcolor: theme.palette.background.paper,
                boxShadow: theme.palette.mode === "dark" ? "0 18px 40px rgba(0, 0, 0, 0.28)" : undefined
              })}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h4" gutterBottom>Entrar</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>Use suas credenciais para acessar as rotas protegidas.</Typography>
                {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
                <Stack spacing={2.5}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Email" type="email" error={!!errors.email} helperText={errors.email?.message} />
                    )}
                  />
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Senha" type="password" error={!!errors.password} helperText={errors.password?.message} />
                    )}
                  />
                  <Button variant="contained" size="large" onClick={onSubmit} disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    O frontend valida antes do envio, mas a API continua responsavel pela validacao final e pela seguranca.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}


function Feature({ label, description }: { label: string; description: string }) {
  return (
    <Box>
      <Typography variant="h6">{label}</Typography>
      <Typography sx={{ opacity: 0.82 }}>{description}</Typography>
    </Box>
  );
}
