import { Grid, TextField, Paper, Button } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Autocomplete } from "@mui/material";

// DatePicker field styles: label and border visibility in dark/light mode
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

export default function SelfTaskForm() {
  return (
    <Grid container spacing={2} component={Paper} p={2}>
      {/* Task description */}
      <Grid size={{ xs: 12 }}>
        <TextField
          label="Task Description"
          multiline
          rows={4}
          fullWidth
          size="small"
        />
      </Grid>

      {/* Project selector */}
      <Grid size={{ xs: 12 }}>
        <Autocomplete
          options={["Project 1", "Project 2", "Project 3", "Project 4"]}
          renderInput={(params) => (
            <TextField {...params} label="Project" size="small" />
          )}
        />
      </Grid>

      {/* Task category selector */}
      <Grid size={{ xs: 12 }}>
        <Autocomplete
          options={["Category 1", "Category 2", "Category 3", "Category 4"]}
          renderInput={(params) => (
            <TextField {...params} label="Task Category" size="small" />
          )}
        />
      </Grid>

      {/* Date the task was worked on */}
      <Grid size={{ xs: 12 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Worked On"
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                sx: (theme) => datePickerStyle(theme),
              },
            }}
          />
        </LocalizationProvider>
      </Grid>

      {/* Time spent on the task */}
      <Grid size={{ xs: 12 }}>
        <TextField label="Duration" fullWidth size="small" />
      </Grid>

      {/* Completion percentage */}
      <Grid size={{ xs: 12 }}>
        <TextField label="Percentage of Completion" fullWidth size="small" />
      </Grid>

      {/* Intended completion target date */}
      <Grid size={{ xs: 12 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Target Date"
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                sx: (theme) => datePickerStyle(theme),
              },
            }}
          />
        </LocalizationProvider>
      </Grid>

      {/* Revised estimated completion date */}
      <Grid size={{ xs: 12 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Estimated Completion Date"
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                sx: (theme) => datePickerStyle(theme),
              },
            }}
          />
        </LocalizationProvider>
      </Grid>

      {/* Save and clear actions */}
      <Grid size={{ xs: 12 }} mt={2} textAlign="right">
        <Button
          variant="contained"
          size="small"
          color="secondary"
          sx={{ mr: 1 }}
        >
          Save
        </Button>
        <Button variant="contained" size="small" color="warning">
          Clear
        </Button>
      </Grid>
    </Grid>
  );
}
