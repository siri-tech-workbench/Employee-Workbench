import { Box, Grid, Paper, Typography } from "@mui/material";
import EmployeeForm from "./EmployeeForm";
import EmployeeTable from "./EmployeeTable";
import { useState } from "react";

/**
 * Employee
 * Parent/master component for the Employee module.
 * Manages edit state shared between the form and the table.
 * Passes a refresh callback to the form so the table reloads after changes.
 */
export default function Employee() {
  const [editRowData, setEditRowData] = useState(null);

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Page header */}
        <Grid size={{ xs: 12 }} component={Paper}>
          <Typography variant="h4" fontWeight={700} color="#6F60C1" p={2}>
            Employee
          </Typography>
        </Grid>

        {/* Employee entry form — switches between Add and Edit mode */}
        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
          <EmployeeForm
            key={editRowData?.EMP_ID || "new"}
            editRowData={editRowData}
            setEditRowData={setEditRowData}
          />
        </Grid>

        {/* Employee table — displays all employee records */}
        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
          <EmployeeTable onEditRow={setEditRowData} editRowData={editRowData} />
        </Grid>
      </Grid>
    </Box>
  );
}
