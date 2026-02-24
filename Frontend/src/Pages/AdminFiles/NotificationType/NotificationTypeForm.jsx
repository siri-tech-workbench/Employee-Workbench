import { Box, Button, Grid, TextField } from "@mui/material";

/**
 * NotificationTypeForm
 *
 * Form component for creating or clearing a notification type entry.
 * Renders a text input for the notification type name alongside
 * Save and Clear action buttons.
 */
export default function NotificationTypeForm() {
  return (
    /* Wrapper box ensures consistent spacing within the parent card */
    <Box>
      <Grid container spacing={3} alignItems="center">
        {/* Input field — captures the notification type name */}
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField fullWidth label="Notification Type" />
        </Grid>

        {/* Action buttons — Save submits the form, Clear resets it */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Button
            variant="contained"
            size="small"
            color="secondary"
            sx={{ mr: 1 }}
          >
            Save
          </Button>
          <Button variant="contained" size="small" color="warning">
            Clear
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
