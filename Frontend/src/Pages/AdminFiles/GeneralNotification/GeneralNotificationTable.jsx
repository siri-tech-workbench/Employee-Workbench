import {
  Button,
  Grid,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

/* Static Demo Data */
const notificationRows = [
  {
    message:
      "Apply half day leave for Friday and what about today? you are not logged in.",
    date: "05/Apr/2025",
    time: "11:32 AM",
    count: 1,
  },
  {
    message: "We will meet by 1 pm to discuss Seiren project progress",
    date: "28/Feb/2025",
    time: "12:30 PM",
    count: 5,
  },
  {
    message: "Leave has been allotted for the year 2025...",
    date: "13/Jan/2025",
    time: "11:16 PM",
    count: 14,
  },
  {
    message: "I wish all of you a very Happy & Prosperous New Year 2025",
    date: "01/Jan/2025",
    time: "07:43 AM",
    count: 14,
  },
];

/* DatePicker Styling */
const datePickerStyle = (theme) => ({
  "& .MuiPickersSectionList-root": {
    height: 16,
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: "bold",
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
  },
  "& .MuiInputLabel-outlined": {
    height: 11,
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    fontWeight: "bold",
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
  },
  "& .MuiPickersOutlinedInput-root": {
    "& fieldset": {
      borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
      borderWidth: 1,
      borderRadius: 5,
    },
  },
});

/**
 * GeneralNotificationTable
 *
 * Displays:
 * - Date filter section
 * - Notification history table
 *
 * Currently uses static demo data.
 */
export default function GeneralNotificationTable() {
  return (
    <>
      {/* Filter Section */}
      <Paper sx={{ p: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2}>
            <Grid xs={12} md={2}>
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

            <Grid xs={12} md={2}>
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

            <Grid xs={12} md={4} display="flex" alignItems="center">
              <Button variant="contained" size="small">
                Search
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>

      {/* Table Section */}
      <Paper sx={{ mt: 2, borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: 350 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "#2c2c3d" : "#ececec",
                  "& th": { fontWeight: 700 },
                }}
              >
                <TableCell>General Notification</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Msg Count</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {notificationRows.map((row, index) => (
                <TableRow
                  key={index}
                  sx={(theme) => ({
                    backgroundColor:
                      index % 2 === 0
                        ? theme.palette.mode === "dark"
                          ? "#1f1f2b"
                          : "#e8f4ff"
                        : theme.palette.mode === "dark"
                          ? "#29293a"
                          : "#ffe6eb",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark" ? "#33334a" : "#e5e5e5",
                      cursor: "pointer",
                    },
                  })}
                >
                  <TableCell>{row.message}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.time}</TableCell>
                  <TableCell
                    sx={{
                      color: "blue",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {row.count}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}
