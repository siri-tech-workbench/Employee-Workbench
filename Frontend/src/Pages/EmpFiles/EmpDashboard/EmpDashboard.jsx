import { Box, Grid } from "@mui/material";
import TaskDash from "./TaskDash";
import NotificationDash from "./NotificationDash";
import QuickAccses from "./QuickAccses";

export default function EmpDashboard() {
  return (
    <Box>
      <Grid container spacing={2} mt={2}>
        {/* Quick access shortcuts — full width across all breakpoints */}
        <Grid size={{ xs: 12 }}>
          <QuickAccses />
        </Grid>

        {/* Notifications panel — half width on medium and above */}
        <Grid size={{ xs: 12, md: 6 }}>
          <NotificationDash />
        </Grid>

        {/* Task summary panel — half width on medium and above */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TaskDash />
        </Grid>
      </Grid>
    </Box>
  );
}
