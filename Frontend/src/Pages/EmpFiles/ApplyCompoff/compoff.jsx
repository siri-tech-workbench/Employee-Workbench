import { Box, Grid, Paper, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import Compoffform from "./compoffform";
import Compofftable from "./compofftable";
import Loading from "../../../Components/loading";

/**
 * Compoff
 *
 * Page-level component for managing compensatory off leave applications.
 * Handles:
 *  - Initial page load with a brief loading state
 *  - Edit state passed down to Compoffform for update flows
 *  - Refresh trigger to reload Compofftable after form submission
 */
export default function Compoff() {
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Increments refreshKey to signal Compofftable to re-fetch its data.
   * Called after a successful form save or update.
   */
  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  /**
   * Simulates an initial page load delay before showing content.
   * Replace the setTimeout with a real API prefetch call if needed.
   */
  useEffect(() => {
    const initLoad = async () => {
      try {
        await new Promise((r) => setTimeout(r, 300));
      } finally {
        setLoading(false);
      }
    };

    initLoad();
  }, []);

  return (
    <Box>
      {/* Show full-page loader during initial data fetch */}
      {loading && <Loading />}

      {/* Page header */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12 ,md: 12}} component={Paper} p={2}>
          <Typography variant="h5" fontWeight={700} color="#6F60C1">
            Comp Off Leave Apply
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Form section — handles both create and edit modes */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Compoffform
            editUser={editUser}
            clearEdit={() => setEditUser(null)}
            onSuccess={triggerRefresh}
          />
        </Grid>

        {/* Table section — displays all comp off records, refreshes on data change */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Compofftable
            onEdit={(row) => setEditUser(row)}
            refreshKey={refreshKey}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
