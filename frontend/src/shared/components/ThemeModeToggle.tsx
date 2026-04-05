import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

import { useThemeMode } from "../../theme";


export function ThemeModeToggle() {
  const { preference, setPreference } = useThemeMode();

  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={preference === "system" ? "light" : preference}
      onChange={(_event, value: "light" | "dark" | null) => {
        if (value) {
          setPreference(value);
        }
      }}
      sx={{
        bgcolor: "background.paper",
        borderRadius: 3,
        boxShadow: 1,
        alignSelf: "center",
        "& .MuiToggleButton-root": {
          px: 1.1,
          py: 0.35,
          minHeight: 22,
          minWidth: 58,
          fontSize: "0.72rem",
          lineHeight: 1.1,
          fontWeight: 700
        }
      }}
    >
      <ToggleButton value="light">
        <LightModeRoundedIcon sx={{ mr: 0.45, fontSize: 14 }} />
        Claro
      </ToggleButton>
      <ToggleButton value="dark">
        <DarkModeRoundedIcon sx={{ mr: 0.45, fontSize: 14 }} />
        Escuro
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
