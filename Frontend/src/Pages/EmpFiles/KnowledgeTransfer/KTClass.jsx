import { useState } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import KTform from "./KTform";
import KTTable from "./KTTable";

export default function KTClass() {
  // Incrementing this key forces KTTable to re-fetch after a form submission
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  return (
    <Box>
      {/* Page heading */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12 }} component={Paper} p={2}>
          <Typography variant="h4" fontWeight={700} color="#6F60C1">
            Knowledge Sharing
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Knowledge transfer entry form */}
        <Grid size={{ xs: 12, md: 4 }}>
          <KTform onRefresh={handleRefresh} />
        </Grid>

        {/* Knowledge transfer records table */}
        <Grid size={{ xs: 12, md: 8 }}>
          <KTTable refreshKey={refreshKey} />
        </Grid>
      </Grid>
    </Box>
  );
}
