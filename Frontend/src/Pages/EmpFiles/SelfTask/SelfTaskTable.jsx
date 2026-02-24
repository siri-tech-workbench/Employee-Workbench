import { useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  Paper,
  TextField,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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

// Static placeholder rows — replace with state populated from API
const TASK_ROWS = [
  {
    project: "Project A",
    taskCategory: "Design",
    workedOn: "05/Jan/2025",
    duration: "3 hrs",
    percentage: "40%",
    targetDate: "20/Jan/2025",
    estimatedCompletion: "22/Jan/2025",
  },
  {
    project: "Project B",
    taskCategory: "Development",
    workedOn: "07/Jan/2025",
    duration: "5 hrs",
    percentage: "70%",
    targetDate: "25/Jan/2025",
    estimatedCompletion: "26/Jan/2025",
  },
  {
    project: "Project C",
    taskCategory: "Testing",
    workedOn: "10/Jan/2025",
    duration: "2 hrs",
    percentage: "30%",
    targetDate: "18/Jan/2025",
    estimatedCompletion: "19/Jan/2025",
  },
  {
    project: "Project D",
    taskCategory: "Documentation",
    workedOn: "11/Jan/2025",
    duration: "4 hrs",
    percentage: "85%",
    targetDate: "15/Jan/2025",
    estimatedCompletion: "16/Jan/2025",
  },
  {
    project: "Project E",
    taskCategory: "Review",
    workedOn: "09/Jan/2025",
    duration: "1 hr",
    percentage: "50%",
    targetDate: "12/Jan/2025",
    estimatedCompletion: "13/Jan/2025",
  },
  {
    project: "Project F",
    taskCategory: "Deployment",
    workedOn: "12/Jan/2025",
    duration: "6 hrs",
    percentage: "60%",
    targetDate: "22/Jan/2025",
    estimatedCompletion: "23/Jan/2025",
  },
  {
    project: "Project G",
    taskCategory: "Bug Fixing",
    workedOn: "13/Jan/2025",
    duration: "3 hrs",
    percentage: "45%",
    targetDate: "28/Jan/2025",
    estimatedCompletion: "29/Jan/2025",
  },
  {
    project: "Project H",
    taskCategory: "Client Meeting",
    workedOn: "14/Jan/2025",
    duration: "2 hrs",
    percentage: "100%",
    targetDate: "14/Jan/2025",
    estimatedCompletion: "14/Jan/2025",
  },
  {
    project: "Project I",
    taskCategory: "UI Fixes",
    workedOn: "03/Jan/2025",
    duration: "1.5 hrs",
    percentage: "20%",
    targetDate: "17/Jan/2025",
    estimatedCompletion: "20/Jan/2025",
  },
  {
    project: "Project J",
    taskCategory: "API Integration",
    workedOn: "15/Jan/2025",
    duration: "4 hrs",
    percentage: "35%",
    targetDate: "30/Jan/2025",
    estimatedCompletion: "31/Jan/2025",
  },
];

export default function SelfTaskTable() {
  return (
    <>
      {/* Search filter bar */}
      <Grid container spacing={2} component={Paper} p={2}>
        {/* Created date filter */}
        <Grid size={{ xs: 12, md: 4 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Created Date Greater Than"
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

        {/* Project filter */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Autocomplete
            options={["Project A", "Project B", "Project C", "Project D"]}
            renderInput={(params) => (
              <TextField {...params} label="Project" size="small" />
            )}
          />
        </Grid>

        {/* Search trigger */}
        <Grid size={{ xs: 12, md: 5 }} textAlign="right">
          <Button variant="contained" size="small">
            Search
          </Button>
        </Grid>
      </Grid>

      {/* Self task records table */}
      <Paper
        sx={{
          borderRadius: "10px",
          mt: 3,
          height: "450px",
          overflow: "auto",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#1e1e2f" : "#ffffff",
        }}
      >
        <Table size="small" stickyHeader>
          {/* Table header */}
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#2c2c3d" : "#2a0202ff",
                "& th": {
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#fff" : "#000",
                  fontWeight: 600,
                },
              }}
            >
              <TableCell>Action</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Task Category</TableCell>
              <TableCell>Worked On</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>% Completion</TableCell>
              <TableCell>Target Date</TableCell>
              <TableCell>Estimated Completion Date</TableCell>
            </TableRow>
          </TableHead>

          {/* Task rows — alternating blue/pink for light, dark variants */}
          <TableBody>
            {TASK_ROWS.map((row, index) => (
              <TableRow
                key={index}
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? index % 2 === 0
                        ? "#2b2b3c"
                        : "#242437"
                      : index % 2 === 0
                        ? "#EAF3FF"
                        : "#FFEBEE",
                  "& td": {
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#f5f5f5" : "#000",
                  },
                }}
              >
                {/* Edit and delete row actions */}
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <EditIcon sx={{ color: "#6F60C1", cursor: "pointer" }} />
                    <DeleteIcon sx={{ color: "red", cursor: "pointer" }} />
                  </Box>
                </TableCell>

                <TableCell sx={{ fontWeight: 600 }}>{row.project}</TableCell>
                <TableCell>{row.taskCategory}</TableCell>
                <TableCell>{row.workedOn}</TableCell>
                <TableCell>{row.duration}</TableCell>
                <TableCell>{row.percentage}</TableCell>
                <TableCell>{row.targetDate}</TableCell>
                <TableCell>{row.estimatedCompletion}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
