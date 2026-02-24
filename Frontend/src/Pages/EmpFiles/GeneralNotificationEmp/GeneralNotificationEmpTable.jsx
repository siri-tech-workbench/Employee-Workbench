import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Button, Grid, Paper } from "@mui/material";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from "@mui/material";

// Static placeholder rows — replace with state populated from API
const NOTIFICATION_ROWS = [
  {
    msg: "Apply half day leave for Friday and what about today? you are not logged in.",
    date: "05/Apr/2025",
    time: "11:32 AM",
    count: 1,
  },
  {
    msg: "We will meet by 1 pm to discuss Seiren project progress",
    date: "28/Feb/2025",
    time: "12:30 PM",
    count: 5,
  },
  {
    msg: "Leave has been allotted for the year 2025...",
    date: "13/Jan/2025",
    time: "11:16 PM",
    count: 14,
  },
  {
    msg: "I wish all of you a very Happy & Prosperous New Year 2025",
    date: "01/Jan/2025",
    time: "07:43 AM",
    count: 14,
  },
];

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

export default function GeneralNotificationEmpTable() {
  return (
    <>
      {/* Date range filter bar */}
      <Grid container spacing={2} component={Paper} p={2} mt={-2}>
        {/* From date picker */}
        <Grid size={{ xs: 12, md: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
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
          </LocalizationProvider>
        </Grid>

        {/* To date picker */}
        <Grid size={{ xs: 12, md: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
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
          </LocalizationProvider>
        </Grid>

        {/* Search trigger */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Button variant="contained" size="small">
            SEARCH
          </Button>
        </Grid>
      </Grid>

      {/* Notifications table — alternating blue/pink rows for light, dark variants */}
      <Paper sx={{ mt: 2, borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: 350, borderRadius: 2 }}>
          <Table size="small" stickyHeader>
            {/* Table header */}
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

            {/* Notification rows */}
            <TableBody>
              {NOTIFICATION_ROWS.map((row, index) => (
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
                  <TableCell>{row.msg}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.time}</TableCell>
                  <TableCell sx={{ color: "blue", cursor: "pointer" }}>
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
