import { Grid, Paper, Box, Typography, Divider } from "@mui/material";
import AddAlertIcon from "@mui/icons-material/AddAlert";
import NotificationTypeForm from "./NotificationTypeForm";
import NotificationTypeTable from "./NotificationTypeTable";

/**
 * NotificationType
 *
 * Page-level layout component for managing notification types.
 * Renders a centered card containing:
 *  - A header bar with title and icon
 *  - NotificationTypeForm  — for creating/editing a notification type
 *  - NotificationTypeTable — for listing existing notification types
 */
export default function NotificationType() {
  return (
    /* Full-width centering wrapper with top margin and horizontal padding */
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        mt: 5,
        px: 2,
        fontFamily: "Calibri, sans-serif",
      }}
    >
      {/* Card container — fixed width with rounded corners */}
      <Paper
        elevation={6}
        sx={{
          width: "650px",
          maxWidth: "100%",
          borderRadius: "18px",
          overflow: "hidden",
        }}
      >
        {/* Header bar — brand color background with page title */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: "#6F60C1",
            color: "white",
            px: 3,
            py: 2,
          }}
        >
          <AddAlertIcon sx={{ fontSize: 32, mr: 1 }} />
          <Typography variant="h5" fontWeight={700}>
            Notification Type
          </Typography>
        </Box>

        {/* Content area — form on top, divider, table below */}
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Form section — create or edit a notification type */}
            <Grid size={12}>
              <NotificationTypeForm />
            </Grid>

            {/* Visual separator between form and table */}
            <Divider
              sx={{
                borderColor: "#6F60C1",
                borderWidth: 1,
                width: "100%",
              }}
            />

            {/* Table section — list all existing notification types */}
            <Grid size={12}>
              <NotificationTypeTable />
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
