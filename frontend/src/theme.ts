import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0b5fff"
    },
    secondary: {
      main: "#ff6b35"
    },
    background: {
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
