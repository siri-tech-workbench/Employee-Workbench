import { Grid, TextField, Paper, Button, Autocomplete } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

/**
 * Hardcoded employee list used as dropdown options.
 * Replace with an API call when the employee endpoint is available.
 */
const EmpList = ["Mahadev", "Santosh SV", "Jashwanth", "Shesha", "Prajwal"];

/**
 * Shared style function for DatePicker fields.
 * Handles font, label, and border styles for both light and dark mode.
 */
const datePickerStyle = (theme) => ({
  "& .MuiPickersSectionList-root": {
    height: "16px",
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: "bold",
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
  },
  "& .MuiInputLabel-outlined": {
    height: "11px",
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    fontWeight: "bold",
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
  },
  "& .MuiPickersOutlinedInput-root": {
    "& fieldset": {
      borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
      borderWidth: "1px",
      borderRadius: "5px",
    },
  },
});

/**
 * BreakForm
 * Filter form for the Break management screen.
 * Allows filtering break records by date range and employee.
 * Note: fields are currently uncontrolled — state and handlers
 * should be added when the Search API is connected.
 */
export default function BreakForm() {
  return (
    // Single LocalizationProvider wraps both DatePickers
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={2} component={Paper} p={2}>
        {/* From date filter */}
        <Grid size={{ xs: 12, md: 2 }}>
          <DatePicker
            label="From Date"
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                sx: (theme) => datePickerStyle(theme),
              },
            }}
          />
        </Grid>

        {/* To date filter */}
        <Grid size={{ xs: 12, md: 2 }}>
          <DatePicker
            label="To Date"
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                sx: (theme) => datePickerStyle(theme),
              },
            }}
          />
        </Grid>

        {/* Employee selection filter */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Autocomplete
            options={EmpList}
            renderInput={(params) => (
              <TextField {...params} label="Employee" size="small" />
            )}
          />
        </Grid>

        {/* Search and Clear action buttons */}
        <Grid size={{ xs: 12, md: 5 }}>
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
    </LocalizationProvider>
  );
}
