import { Box, Grid, Paper, Typography } from "@mui/material";
import BreakForm from "./BreakForm";
import BreakTable from "./BreakTable";

/**
 * Break
 * Layout component for the Break management screen.
 * Renders the page header, break entry form, and break history table.
 */
export default function Break() {
  return (
    <Box>
      {/* Page header */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, sm: 12, md: 12 }} component={Paper} p={2}>
          <Typography variant="h4" fontWeight={700} color="#6F60C1">
            Today's Break Details
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Break entry form */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <BreakForm />
        </Grid>

        {/* Break history table */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <BreakTable />
        </Grid>
      </Grid>
    </Box>
  );
}
