import { useState } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import EmpPerForm from "./EmpPerForm";
import EmpPerTable from "./EmpPerTable";

export default function EmpPermission() {
  // Incrementing this key forces EmpPerTable to re-fetch after a form submission
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  return (
    <Box>
      {/* Page heading */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12 }} component={Paper} p={2}>
          <Typography variant="h4" fontWeight={700} color="#6F60C1">
            Permission Apply
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Permission request form */}
        <Grid size={{ xs: 12 }}>
          <EmpPerForm onSuccess={handleRefresh} />
        </Grid>

        {/* Submitted permissions table */}
        <Grid size={{ xs: 12 }}>
          <EmpPerTable refreshKey={refreshKey} />
        </Grid>
      </Grid>
    </Box>
  );
}
