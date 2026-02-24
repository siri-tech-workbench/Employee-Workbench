import { Box, Grid, Paper, Typography } from "@mui/material";
import GeneralNotificationForm from "./GeneralNotificationForm";
import GeneralNotificationTable from "./GeneralNotificationTable";

/**
 * GeneralNotification Component
 *
 * Acts as a container for:
 * - GeneralNotificationForm (creation section)
 * - GeneralNotificationTable (listing section)
 *
 * This component only handles layout composition.
 */
export default function GeneralNotification() {
  return (
    <Box>
      {/* Header Section */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, sm: 12, md: 12 }} component={Paper} p={2}>
          <Typography variant="h4" fontWeight={700} color="#6F60C1">
            General Notification
          </Typography>
        </Grid>
      </Grid>

      {/* Content Section */}
      <Grid container spacing={2}>
        {/* Notification Form */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }} >
          <GeneralNotificationForm />
        </Grid>

        {/* Notification Table */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <GeneralNotificationTable />
        </Grid>
      </Grid>
    </Box>
  );
}
