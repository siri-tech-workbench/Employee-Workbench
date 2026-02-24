import { Grid, TextField, Paper, Button, Autocomplete } from "@mui/material";
import { useState } from "react";

/* Static list of employees used for the Autocomplete options */
const employeeList = ["emp1", "emp2", "emp3", "emp4", "emp5"];

export default function NotificationTeamForm() {
  /* State for the team name text input */
  const [teamName, setTeamName] = useState("");

  /* State for the selected employee from the Autocomplete dropdown */
  const [employee, setEmployee] = useState(null);

  /* Function to reset all form fields to their initial states */
  const handleClear = () => {
    setTeamName("");
    setEmployee(null);
  };

  return (
    /* Main container using Material UI Grid and Paper for layout and elevation */
    <Grid container spacing={2} component={Paper} p={2}>
      {/* Team Name Input Field */}
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField
          label="Team Name"
          fullWidth
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
      </Grid>

      {/* Employee Selection Dropdown */}
      <Grid size={{ xs: 12, md: 3 }}>
        <Autocomplete
          options={employeeList}
          value={employee}
          onChange={(e, value) => setEmployee(value)}
          renderInput={(params) => (
            <TextField {...params} label="Employee" fullWidth />
          )}
        />
      </Grid>

      {/* Action Buttons Section */}
      <Grid size={{ xs: 12, md: 3 }} display="flex" alignItems="center" gap={1}>
        <Button variant="contained" size="small" color="secondary">
          Save
        </Button>

        <Button
          variant="contained"
          size="small"
          color="warning"
          onClick={handleClear}
        >
          Clear
        </Button>
      </Grid>
    </Grid>
  );
}
