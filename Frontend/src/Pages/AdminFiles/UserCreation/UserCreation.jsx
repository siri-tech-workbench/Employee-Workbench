import { Box, Grid, Paper, Typography } from "@mui/material";
import { useState } from "react";
import UserCreationFrom from "./UserCreationFrom";
import UserCreationTable from "./UserCreationTable";

/**
 * UserCreation
 *
 * Page-level component for managing user master records.
 * Handles:
 *  - Edit state passed down to UserCreationFrom for update flows
 *  - Refresh trigger to reload UserCreationTable after form submission
 */
export default function UserCreation() {
  const [editUser, setEditUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Increments refreshKey to signal UserCreationTable to re-fetch its data.
   * Called after a successful form save or update.
   */
  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Box>
      {/* Page header */}
      <Grid container spacing={2} mb={2}>
        <Grid size={12} component={Paper} p={2}>
          <Typography variant="h4" fontWeight={700} color="#6F60C1">
            User Master
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Form section — handles both create and edit modes */}
        <Grid size={{ xs: 12, md: 5 }}>
          <UserCreationFrom
            editUser={editUser}
            clearEdit={() => setEditUser(null)}
            onSuccess={triggerRefresh}
          />
        </Grid>

        {/* Table section — displays all users, refreshes on data change */}
        <Grid size={{ xs: 12, md: 7 }}>
          <UserCreationTable
            onEdit={(row) => setEditUser(row)}
            refreshKey={refreshKey}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
