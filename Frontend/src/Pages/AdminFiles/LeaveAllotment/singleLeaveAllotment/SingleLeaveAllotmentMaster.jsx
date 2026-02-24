import { useState } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";

import SingleLeaveAllotmentForm from "./SingleLeaveAllotmentForm";
import SingleLeaveAllotmenttable from "./SingleLeaveAllotmenttable";

/**
 * SingleLeaveAllotmentMaster
 *
 * Container component responsible for:
 * - Managing refresh state
 * - Managing edit row state
 * - Rendering form and table
 */
export default function SingleLeaveAllotmentMaster() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editRowData, setEditRowData] = useState(null);

  return (
    <>
      <Box>
        {/* HEADER */}
        <Grid container spacing={2} mb={2}>
          <Grid size={{ xs: 12, sm: 12, md: 12 }} component={Paper} p={2}>
            <Typography variant="h5" fontWeight={700} color="#6F60C1">
              Individual Leave Allotment
            </Typography>
          </Grid>
        </Grid>

        {/* CONTENT */}
        <Grid container spacing={2}>
          {/* FORM SECTION */}
          <Grid size={{ xs: 12, sm: 12, md: 12 }} md={5}>
            <SingleLeaveAllotmentForm
              setRefreshKey={setRefreshKey}
              editRowData={editRowData}
              setEditRowData={setEditRowData}
            />
          </Grid>

          {/* TABLE SECTION */}
          <Grid size={{ xs: 12, sm: 12, md: 8 }}>
            <SingleLeaveAllotmenttable
              refreshKey={refreshKey}
              setEditRowData={setEditRowData}
            />
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
