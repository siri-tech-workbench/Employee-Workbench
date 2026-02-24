import { Box, Grid, Paper, Typography } from "@mui/material";
import NewtaskEmpForm from "./NewtaskEmpForm";
import NewTaskEmpTable from "./NewTaskEmpTable";

export default function NewtaskEmp() {
  return (
    <Box>
      {/* Page heading */}
      <Grid container>
        <Grid size={{ xs: 12 }} component={Paper} p={2}>
          <Typography variant="h4" fontWeight={700} color="#6F60C1">
            New Task
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Task entry form */}
        <Grid size={{ xs: 12 }}>
          <NewtaskEmpForm />
        </Grid>

        {/* Submitted tasks table */}
        <Grid size={{ xs: 12 }}>
          <NewTaskEmpTable />
        </Grid>
      </Grid>
    </Box>
  );
}
