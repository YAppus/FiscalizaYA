import { Alert, Snackbar } from "@mui/material";


type FeedbackSnackbarsProps = {
  successMessage: string | null;
  errorMessage: string | null;
  onClose: () => void;
};


export function FeedbackSnackbars({ successMessage, errorMessage, onClose }: FeedbackSnackbarsProps) {
  return (
    <>
      <Snackbar open={!!successMessage} autoHideDuration={3500} onClose={onClose}>
        <Alert severity="success" onClose={onClose} variant="filled">
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar open={!!errorMessage} autoHideDuration={4500} onClose={onClose}>
        <Alert severity="error" onClose={onClose} variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
