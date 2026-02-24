import {
  Autocomplete,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  TextField,
  Box,
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

// DatePicker field styles: keeps label and section text visible in dark/light mode
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
 * Returns the status label color.
 * Centralised here so the table cell sx is not cluttered with nested ternaries.
 */
const getStatusColor = (status) => {
  if (status === "ASSIGNED") return "green";
  if (status === "PLANNED") return "blue";
  return "red";
};

// Static task rows — replace with API call when integrating backend
const taskRows = [
  {
    task: "In emp dashboard...",
    project: "SIRI WORKBENCH",
    assignedTo: "MAHADEV SK",
    expected: "06/Jan/2025",
    actual: "",
    status: "ASSIGNED",
  },
  {
    task: "New email create...",
    project: "ADHOC",
    assignedTo: "ANURAAG",
    expected: "20/Nov/2025",
    actual: "Invalid Date",
    status: "UNDER REVIEW",
  },
  {
    task: "Payment gateway...",
    project: "VIMUL MOBILE A...",
    assignedTo: "MAHADEV SK",
    expected: "20/Nov/2025",
    actual: "",
    status: "ASSIGNED",
  },
  {
    task: "Bill generation",
    project: "CHIMUL MILKBILL",
    assignedTo: "PRATHIVINDYA",
    expected: "20/Nov/2025",
    actual: "",
    status: "ASSIGNED",
  },
  {
    task: "Taluk BMC Cluste...",
    project: "CHIMUL MILKBILL",
    assignedTo: "JEEVAN",
    expected: "20/Nov/2025",
    actual: "",
    status: "WORK IN PROG...",
  },
  {
    task: "Create 2 new ui a...",
    project: "SHIMUL INCENTIV...",
    assignedTo: "GANAPATHI",
    expected: "20/Nov/2025",
    actual: "",
    status: "ASSIGNED",
  },
  {
    task: "Modify camp offic...",
    project: "CHIMUL MILKBILL",
    assignedTo: "JEEVAN",
    expected: "20/Nov/2025",
    actual: "Invalid Date",
    status: "UNDER REVIEW",
  },
  {
    task: "testing 2 12 25",
    project: "ADHOC",
    assignedTo: "siri",
    expected: "06/Dec/2025",
    actual: "",
    status: "PLANNED",
  },
  {
    task: "siri test 2 12 2025...",
    project: "ADHOC",
    assignedTo: "siri",
    expected: "02/Dec/2025",
    actual: "Invalid Date",
    status: "UNDER REVIEW",
  },
];

export default function NewTaskEmpTable() {
  return (
    <>
      {/* Filter bar */}
      <Grid container spacing={2} component={Paper} p={2}>
        {/* Date filter */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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

        {/* Status filter */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Autocomplete
            options={["Active", "Inactive"]}
            renderInput={(params) => (
              <TextField {...params} label="Status" size="small" />
            )}
          />
        </Grid>

        {/* Project filter */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Autocomplete
            options={["Project 1", "Project 2", "Project 3", "Project 4"]}
            renderInput={(params) => (
              <TextField {...params} label="Project" size="small" />
            )}
          />
        </Grid>

        {/* Assigned by filter */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Autocomplete
            options={["Employee 1", "Employee 2", "Employee 3", "Employee 4"]}
            renderInput={(params) => (
              <TextField {...params} label="Assigned By" size="small" />
            )}
          />
        </Grid>

        {/* Assigned to filter */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Autocomplete
            options={["Employee 1", "Employee 2", "Employee 3", "Employee 4"]}
            renderInput={(params) => (
              <TextField {...params} label="Assigned To" size="small" />
            )}
          />
        </Grid>

        {/* Past due toggle + search action */}
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <FormControlLabel control={<Checkbox />} label="Past Due" />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 6 }} textAlign="right">
          <Button variant="contained" size="small">
            Search
          </Button>
        </Grid>
      </Grid>

      {/* Task results table */}
      <Paper
        sx={{
          borderRadius: "10px",
          mt: 3,
          height: "180px",
          overflow: "auto",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#1e1e2f" : "#ffffff",
        }}
      >
        <Table size="small" stickyHeader>
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
              <TableCell>Task Name</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Expected End Date</TableCell>
              <TableCell>Actual End Time</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {taskRows.map((row, i) => (
              <TableRow
                key={i}
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? i % 2 === 0
                        ? "#2b2b3c"
                        : "#242437"
                      : i % 2 === 0
                        ? "#EAF3FF"
                        : "#FFEBEE",
                  "& td": {
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#f5f5f5" : "#000",
                  },
                }}
              >
                {/* Edit and delete actions */}
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <EditIcon
                      fontSize="small"
                      color="secondary"
                      sx={{ cursor: "pointer" }}
                    />
                    <DeleteIcon color="error" sx={{ cursor: "pointer" }} />
                  </Box>
                </TableCell>

                <TableCell sx={{ fontWeight: 600 }}>{row.task}</TableCell>
                <TableCell>{row.project}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{row.assignedTo}</TableCell>
                <TableCell>{row.expected}</TableCell>
                <TableCell>{row.actual}</TableCell>

                {/* Status cell: color driven by getStatusColor helper */}
                <TableCell
                  sx={{ color: getStatusColor(row.status), fontWeight: 700 }}
                >
                  {row.status}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
