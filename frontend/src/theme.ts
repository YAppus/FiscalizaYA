import { createContext, createElement, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import type { PaletteMode } from "@mui/material";


export type ThemePreference = "system" | PaletteMode;

type ThemeModeContextValue = {
  preference: ThemePreference;
  mode: PaletteMode;
  setPreference: (value: ThemePreference) => void;
};

const STORAGE_KEY = "fiscateste.theme.preference";

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);


export function AppThemeProvider({ children }: PropsWithChildren) {
  const [preference, setPreference] = useState<ThemePreference>(() => getStoredPreference());
  const [systemMode, setSystemMode] = useState<PaletteMode>(() => getSystemMode());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemMode = (event?: MediaQueryListEvent) => {
      setSystemMode(event?.matches ?? mediaQuery.matches ? "dark" : "light");
    };

    syncSystemMode();
    mediaQuery.addEventListener("change", syncSystemMode);
    return () => mediaQuery.removeEventListener("change", syncSystemMode);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, preference);
  }, [preference]);

  const mode = preference === "system" ? systemMode : preference;
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const value = useMemo(() => ({ preference, mode, setPreference }), [mode, preference]);

  return createElement(
    ThemeModeContext.Provider,
    { value },
    createElement(
      ThemeProvider,
      { theme },
      createElement(CssBaseline),
      children
    )
  );
}


export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within AppThemeProvider");
  }
  return context;
}


function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#0b5fff"
      },
      secondary: {
        main: "#ff6b35"
      },
      background: mode === "dark"
        ? {
            default: "#08111f",
            paper: "#101b2d"
          }
        : {
            default: "#f4f7fb",
            paper: "#ffffff"
          }
    },
    shape: {
      borderRadius: 18
    },
    typography: {
      fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
      h3: {
        fontWeight: 700
      },
      h4: {
        fontWeight: 700
      },
      button: {
        textTransform: "none",
        fontWeight: 700
      }
    }
  });
}


function getStoredPreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}


function getSystemMode(): PaletteMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
