import { Box, Grid, Paper, Typography } from "@mui/material";
import { useState } from "react";

import ModuleForm from "./ModuleForm";
import ModuleTable from "./ModuleTable";

/**
 * Module Master Screen
 *
 * - Handles edit state
 * - Triggers grid refresh
 * - Pure layout container
 */
export default function Module() {
  const [editRow, setEditRow] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Forces table reload
   */
  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <Box>
        {/* ===== Page Header ===== */}
        <Grid container spacing={2} mb={2}>
          <Grid xs={12} component={Paper} p={2}>
            <Typography variant="h4" fontWeight={700} color="#6F60C1">
              Module
            </Typography>
          </Grid>
        </Grid>

        {/* ===== Content ===== */}
        <Grid container spacing={2}>
          <Grid xs={12} md={6}>
            <ModuleForm
              editUser={editRow}
              clearEdit={() => setEditRow(null)}
              onSuccess={triggerRefresh}
            />

            <ModuleTable onEdit={setEditRow} refreshKey={refreshKey} />
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
