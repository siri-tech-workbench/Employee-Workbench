import { Box, Grid, Paper, Typography } from "@mui/material";
import { useState } from "react";
import CustomerForm from "./CustomerForm";
import CustomerTable from "./CustomerTable";

/**
 * Customer
 * Parent/master component for the Customer management screen.
 * Manages shared edit state between the form and the table.
 * Refresh after save or update is handled via the onSuccess callback
 * passed to CustomerForm, which CustomerTable listens to via refreshKey.
 */
export default function Customer() {
  const [editUser, setEditUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Increments the refresh key to trigger CustomerTable
   * to reload its data after a successful save or update.
   */
  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Box>
      {/* Page header */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, sm: 12, md: 12 }} component={Paper} p={2}>
          <Typography variant="h4" fontWeight={700} color="#6F60C1">
            Customer
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Customer entry and edit form */}
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <CustomerForm
            editUser={editUser}
            clearEdit={() => setEditUser(null)}
            onSuccess={triggerRefresh}
          />
        </Grid>

        {/* Customer records table */}
        <Grid size={{ xs: 12, sm: 12, md: 8 }}>
          <CustomerTable
            onEdit={(row) => setEditUser(row)}
            refreshKey={refreshKey}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
