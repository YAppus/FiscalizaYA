import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Container, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppHeader } from "./modules/app/AppHeader";
import { FeedbackSnackbars } from "./modules/app/FeedbackSnackbars";
import { useAuth } from "./modules/auth/AuthContext";
import { LoginScreen } from "./modules/auth/LoginScreen";
import { DashboardPage } from "./modules/dashboard/DashboardPage";
import { useDashboardOverview } from "./modules/dashboard/useDashboardOverview";
import { OccurrenceDialog } from "./modules/occurrences/OccurrenceDialog";
import { OccurrenceHistory } from "./modules/occurrences/OccurrenceHistory";
import { OccurrencePage } from "./modules/occurrences/OccurrencePage";
import { useOccurrencesController } from "./modules/occurrences/useOccurrencesController";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres")
});

type LoginValues = z.infer<typeof loginSchema>;
type AppTab = "dashboard" | "occurrences";

export default function App() {
  const { user, loading, error, message, login, logout, clearFeedback } = useAuth();
  const [tab, setTab] = useState<AppTab>("dashboard");
  const { dashboardCounts, statusDistribution, categoryDistribution, mttrByCategory, loadDashboard } = useDashboardOverview();
  const refreshAll = async () => {
    await Promise.all([loadDashboard(), occurrencesController.loadOccurrences()]);
  };
  const occurrencesController = useOccurrencesController({ onDataChanged: refreshAll });

  const { control, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  useEffect(() => {
    if (!user) {
      setTab("dashboard");
      return;
    }

    setTab("dashboard");
    void occurrencesController.loadBootstrapData();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void occurrencesController.loadOccurrences();
  }, [user, occurrencesController.loadOccurrences]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadDashboard();
  }, [user, loadDashboard]);

  function focusOccurrencesByStatus(status: string) {
    setTab("occurrences");
    occurrencesController.focusOccurrencesByStatus(status);
  }

  function clearAllFeedback() {
    clearFeedback();
    occurrencesController.clearOccurrenceFeedback();
  }

  if (!user) {
    return (
      <LoginScreen
        control={control}
        errors={errors}
        loading={loading}
        error={error}
        onSubmit={handleSubmit(async (values) => login(values))}
      />
    );
  }

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        background: theme.palette.mode === "dark"
          ? "radial-gradient(circle at top left, rgba(75,163,255,0.18), transparent 28%), linear-gradient(180deg, #08111f 0%, #0c1729 100%)"
          : "linear-gradient(180deg, #f4f7fb 0%, #eef4ff 100%)"
      })}
    >
      <AppHeader onRefresh={() => { void refreshAll(); }} onLogout={() => void logout()} />

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <DashboardPage
            userName={user.full_name}
            tab={tab}
            counts={dashboardCounts}
            statusDistribution={statusDistribution}
            categoryDistribution={categoryDistribution}
            mttrByCategory={mttrByCategory}
            onSelectStatus={focusOccurrencesByStatus}
            onTabChange={setTab}
          >
            <OccurrencePage
              categories={occurrencesController.categories}
              priorities={occurrencesController.priorities}
              rows={occurrencesController.occurrences}
              loading={occurrencesController.gridLoading}
              rowCount={occurrencesController.rowCount}
              filterDraft={occurrencesController.filterDraft}
              paginationModel={occurrencesController.paginationModel}
              onFilterChange={occurrencesController.setFilterDraft}
              onApplyFilters={occurrencesController.applyFilters}
              onClearFilters={occurrencesController.clearFilters}
              onPaginationModelChange={occurrencesController.setPaginationModel}
              onCreate={occurrencesController.openCreateDialog}
              onEdit={(id) => void occurrencesController.handleEdit(id)}
              onOpenHistory={(id) => void occurrencesController.handleOpenHistory(id)}
              onDelete={(id) => void occurrencesController.handleDelete(id)}
            />
          </DashboardPage>
        </Stack>
      </Container>

      <OccurrenceDialog
        open={occurrencesController.dialogOpen}
        occurrence={occurrencesController.selectedOccurrence}
        categories={occurrencesController.categories}
        priorities={occurrencesController.priorities}
        loading={occurrencesController.dialogLoading}
        error={occurrencesController.occurrenceError}
        onClose={occurrencesController.closeDialog}
        onSubmit={occurrencesController.submitOccurrence}
      />

      <OccurrenceHistory
        open={occurrencesController.historyOpen}
        occurrence={occurrencesController.historyOccurrence}
        onClose={occurrencesController.closeHistory}
      />

      <FeedbackSnackbars
        successMessage={message ?? occurrencesController.occurrenceMessage}
        errorMessage={error ?? occurrencesController.occurrenceError}
        onClose={clearAllFeedback}
      />
    </Box>
  );
}
