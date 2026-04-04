import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { AuthProvider } from "./modules/auth/AuthContext";
import { AppThemeProvider } from "./theme";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppThemeProvider>
  </React.StrictMode>
);
