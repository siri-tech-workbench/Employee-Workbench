import { Box, Grid, Paper, Typography } from "@mui/material";
import SelfTaskForm from "./SelfTaskForm";
import SelfTaskTable from "./SelfTaskTable";

// Note: component is named Holiday but renders the Self Task page
export default function Holiday() {
  return (
    <Box>
      {/* Page heading */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12 }} component={Paper} p={2}>
          <Typography variant="h4" fontWeight={700} color="#6F60C1">
            Self Task
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Self task entry form */}
        <Grid size={{ xs: 12, md: 3 }}>
          <SelfTaskForm />
        </Grid>

        {/* Self task records table */}
        <Grid size={{ xs: 12, md: 9 }}>
          <SelfTaskTable />
        </Grid>
      </Grid>
    </Box>
  );
}
