import { Grid, TextField, Paper, Button, Autocomplete } from "@mui/material";

export default function Mytask() {
  return (
    <>
      <Grid container spacing={2} component={Paper} p={2}>
        {/* Filter: Assigned Employee */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            options={["Emp 1", "Emp 2", "Emp 3", "Emp 4"]}
            renderInput={(params) => (
              <TextField {...params} label="Assigned To" size="small" />
            )}
          />
        </Grid>

        {/* Filter: Task Status */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            options={["Pending", "Completed", "Overdue", "Cancelled"]}
            renderInput={(params) => (
              <TextField {...params} label="Status" size="small" />
            )}
          />
        </Grid>

        {/* Action Buttons */}
        <Grid size={{ xs: 12, md: 4 }} textAlign="right">
          <Button
            variant="contained"
            size="small"
            color="secondary"
            sx={{ mr: 1 }}
          >
            Search
          </Button>
          <Button variant="contained" size="small" color="warning">
            Clear
          </Button>
        </Grid>
      </Grid>
    </>
  );
}
