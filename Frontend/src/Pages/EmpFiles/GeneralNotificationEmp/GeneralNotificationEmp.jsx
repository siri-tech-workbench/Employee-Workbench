import { Box, Grid, Paper, Typography } from "@mui/material";
import GeneralNotificationEmpForm from "./GeneralNotificationEmpForm";
import GeneralNotificationEmpTable from "./GeneralNotificationEmpTable";

export default function GeneralNotificationEmp() {
  return (
    <Box>
      {/* Page heading */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12 }} component={Paper} p={2}>
          <Typography variant="h4" fontWeight={700} color="#6F60C1">
            General Notification
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Notification entry form */}
        <Grid size={{ xs: 12 }}>
          <GeneralNotificationEmpForm />
        </Grid>

        {/* Sent notifications table */}
        <Grid size={{ xs: 12 }}>
          <GeneralNotificationEmpTable />
        </Grid>
      </Grid>
    </Box>
  );
}
