import { useState, useEffect } from "react";
import { Grid, Paper, Box, Typography, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import WelcomeCard from "./WelcomeCard";
import { getcomoffalert } from "../../../Services/compoff.service";

// Brand color reused across card borders, icons, and ticker
const BRAND = "#6665C1";

export default function QuickAccses() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  // Comp-off expiry alerts fetched from the server
  const [compOffItems, setCompOffItems] = useState([]);

  // Builds the scrolling ticker string from all expiring comp-off entries
  const tickerText = compOffItems
    .map(
      (item) =>
        `Comp-Off (${item.remainingDays} day) expires on ${item.expiresOn} — use before expiry`,
    )
    .join("   |   ");

  // Shared style for quick-access card tiles
  const paperStyle = {
    px: 1.5,
    py: 1.2,
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    borderRadius: "10px",
    cursor: "pointer",
    backgroundColor: isDark ? theme.palette.background.paper : "#fff",
    border: `2px solid ${BRAND}`,
    transition: "0.25s ease",
    "&:hover": {
      boxShadow: isDark
        ? "0 6px 16px rgba(102,101,193,0.45)"
        : "0 6px 16px rgba(102,101,193,0.25)",
    },
  };

  const iconStyle = { color: BRAND, fontSize: 50 };

  const titleStyle = { fontSize: 18, fontWeight: 600, color: "text.primary" };

  const subTitleStyle = { fontSize: 15, color: "text.secondary" };

  // Fetch comp-off expiry alerts on mount
  useEffect(() => {
    const fetchCompOffAlert = async () => {
      try {
        const res = await getcomoffalert();
        setCompOffItems(res?.items?.items || []);
      } catch {
        // Silently ignore — ticker simply won't render if the call fails
      }
    };

    fetchCompOffAlert();
  }, []);

  return (
    <Grid container spacing={2}>
      {/* Welcome card — occupies most of the row */}
      <Grid size={{ xs: 12, md: 8.5 }}>
        <WelcomeCard />
      </Grid>

      {/* Quick-access tiles: Apply Leave and Permission */}
      <Grid size={{ xs: 12, md: 3.5 }}>
        <Paper sx={paperStyle} onClick={() => navigate("/Drawer/ApplyLeave")}>
          <CalendarMonthIcon sx={iconStyle} />
          <Box sx={{ ml: 1 }}>
            <Typography sx={titleStyle}>Apply Leave</Typography>
            <Typography sx={subTitleStyle}>Submit leave</Typography>
          </Box>
        </Paper>

        <Paper
          sx={{ ...paperStyle, mt: 1.5 }}
          onClick={() => navigate("/Drawer/EmpPermission")}
        >
          <AssignmentTurnedInIcon sx={iconStyle} />
          <Box sx={{ ml: 1 }}>
            <Typography sx={titleStyle}>Permission</Typography>
            <Typography sx={subTitleStyle}>Short permission</Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Comp-off expiry news ticker — only rendered when there are alerts */}
      <Grid size={{ xs: 12 }}>
        {compOffItems.length > 0 && (
          <Box
            sx={{
              mb: 1.5,
              overflow: "hidden",
              whiteSpace: "nowrap",
              borderRadius: "8px",
              border: "1.5px solid #6764C0",
              backgroundColor: isDark ? "#3b3a12" : "#ffffff",
              cursor: "pointer",
            }}
            onClick={() => navigate("/Drawer/ApplyLeave")}
          >
            <Box
              sx={{
                display: "inline-block",
                px: 2,
                py: 0.8,
                animation: "newsTicker 18s linear infinite",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: isDark ? "#ffeb3b" : "#9a6b00",
                }}
              >
                {tickerText}
              </Typography>
            </Box>
          </Box>
        )}
      </Grid>
    </Grid>
  );
}
