import { Box, Button, Grid, Paper, Typography } from "@mui/material";
import NotificationTeamForm from "./NotificationTeamForm";
import NotificationTeamTable from "./NotificationTeamTable";

export default function NotificationTeam() {
  return (
    <Box>
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, sm: 12, md: 12 }} component={Paper} p={2}>
          <Typography variant="h4" fontWeight={700} color="#6F60C1">
            Notification Team
          </Typography>
        </Grid>
      </Grid>
      {/* ========== */}
      <Grid container spacing={2}>
        {/* Employee Entry Form */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <NotificationTeamForm />
        </Grid>
        {/* Employee Table */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <NotificationTeamTable />
        </Grid>
      </Grid>
    </Box>
  );
}
