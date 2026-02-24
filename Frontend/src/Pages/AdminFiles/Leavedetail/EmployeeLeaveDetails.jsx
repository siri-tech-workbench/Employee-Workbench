import { Box, Grid, Paper, Typography } from "@mui/material";
import { useState } from "react";

import EmplevDetForm from "./EmplevDetForm";
import EmplevDetTable from "./EmplevDetTable";

/**
 * Employee Leave Details Page
 * Manages leave search form and results table
 */
export default function EmployeeLeaveDetails() {
  const [leaveData, setLeaveData] = useState({
    casual: [],
    earned: [],
    medical: [],
  });

  return (
    <>
      <Box>
        {/* Header */}
        <Grid container mb={1}>
          <Grid xs={12} component={Paper} p={2}>
            <Typography variant="h5" fontWeight={700} color="#6F60C1">
              Employee Leave Details
            </Typography>
          </Grid>
        </Grid>

        {/* Content */}
        <Grid container spacing={2}>
          <Grid xs={12}>
            <EmplevDetForm setLeaveData={setLeaveData} />
          </Grid>

          <Grid xs={12}>
            <EmplevDetTable leaveData={leaveData} />
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
