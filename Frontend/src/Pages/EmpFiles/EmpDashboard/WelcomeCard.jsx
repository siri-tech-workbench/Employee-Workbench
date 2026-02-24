import { useState, useEffect } from "react";
import { Avatar, Box, Grid, Paper, Typography } from "@mui/material";
import WavingHandIcon from "@mui/icons-material/WavingHand";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DevicesIcon from "@mui/icons-material/Devices";
import LanguageIcon from "@mui/icons-material/Language";
import ComputerIcon from "@mui/icons-material/Computer";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { empsessioninfo } from "../../../Services/empdash.services";

/**
 * Reusable session info row: icon + bold label + value.
 * Defined outside the parent component to avoid re-creation on every render.
 */
const InfoRow = ({ icon, label, value }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
    {icon}
    <Typography fontSize={13}>
      <b>{label}:</b> {value}
    </Typography>
  </Box>
);

export default function WelcomeCard() {
  const [sessionInfo, setSessionInfo] = useState(null);

  // Fetch current session metadata (device, browser, location, etc.) on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await empsessioninfo();
        setSessionInfo(res?.items ?? null);
      } catch {
        // Silently ignore — card simply won't render if the call fails
      }
    };

    fetchSession();
  }, []);

  // Render nothing while session data is loading or unavailable
  if (!sessionInfo) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        border: "2px solid #6F60C1",
        borderRadius: "12px",
        background: "linear-gradient(90deg, #6367C0, #9ea3f4ff)",
        color: "white",
      }}
    >
      {/* Card header: greeting + username + avatar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Waving hand icon badge */}
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WavingHandIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Typography variant="h6" fontWeight={600}>
              Welcome Back
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {sessionInfo.user_name}
            </Typography>
          </Box>
        </Box>

        <Avatar
          src="https://i.pravatar.cc/100?img=12"
          sx={{ width: 60, height: 60, border: "2px solid white" }}
        />
      </Box>

      {/* Session details grid: location, device, browser, OS, coordinates */}
      <Grid container spacing={1}>
        <Grid size={{ xs: 6, md: 4 }}>
          <InfoRow
            icon={<LocationOnIcon fontSize="small" />}
            label="Logged From"
            value={sessionInfo.logged_from}
          />
        </Grid>

        <Grid size={{ xs: 6, md: 4 }}>
          <InfoRow
            icon={<DevicesIcon fontSize="small" />}
            label="Device"
            value={sessionInfo.device}
          />
        </Grid>

        <Grid size={{ xs: 6, md: 4 }}>
          <InfoRow
            icon={<LanguageIcon fontSize="small" />}
            label="Browser"
            value={sessionInfo.browser}
          />
        </Grid>

        <Grid size={{ xs: 6, md: 4 }}>
          <InfoRow
            icon={<ComputerIcon fontSize="small" />}
            label="OS"
            value={sessionInfo.os}
          />
        </Grid>

        <Grid size={{ xs: 6, md: 4 }}>
          <InfoRow
            icon={<MyLocationIcon fontSize="small" />}
            label="Latitude"
            value={sessionInfo.latitude}
          />
        </Grid>

        <Grid size={{ xs: 6, md: 4 }}>
          <InfoRow
            icon={<MyLocationIcon fontSize="small" />}
            label="Longitude"
            value={sessionInfo.longitude}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
