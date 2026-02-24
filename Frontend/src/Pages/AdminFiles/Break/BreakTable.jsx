import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from "@mui/material";
import PauseIcon from "@mui/icons-material/Pause";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";

/**
 * Static placeholder break records.
 * Replace with an API call when the break data endpoint is available.
 */
const breakRows = [
  {
    employeeName: "MAHADEV SK",
    date: "08/Dec/2024",
    latestStartTime: "",
    totalBreakDuration: "00:00",
    totalBreakCount: 1,
    workStatus: "Working",
  },
  {
    employeeName: "SANTHOSH SV",
    date: "08/Dec/2024",
    latestStartTime: "03:30:12 PM",
    totalBreakDuration: "00:00",
    totalBreakCount: 1,
    workStatus: "On Break",
  },
  {
    employeeName: "RAHUL K",
    date: "08/Dec/2024",
    latestStartTime: "02:10:45 PM",
    totalBreakDuration: "00:15",
    totalBreakCount: 2,
    workStatus: "Working",
  },
  {
    employeeName: "PRIYA M",
    date: "08/Dec/2024",
    latestStartTime: "",
    totalBreakDuration: "00:00",
    totalBreakCount: 0,
    workStatus: "Working",
  },
  {
    employeeName: "ARUN B",
    date: "08/Dec/2024",
    latestStartTime: "01:45:22 PM",
    totalBreakDuration: "00:20",
    totalBreakCount: 1,
    workStatus: "On Break",
  },
  {
    employeeName: "DIVYA S",
    date: "08/Dec/2024",
    latestStartTime: "12:30:10 PM",
    totalBreakDuration: "00:30",
    totalBreakCount: 3,
    workStatus: "Working",
  },
  {
    employeeName: "MANJUNATH P",
    date: "08/Dec/2024",
    latestStartTime: "",
    totalBreakDuration: "00:00",
    totalBreakCount: 0,
    workStatus: "Working",
  },
];

/**
 * BreakTable
 * Displays break details for all employees in a scrollable table.
 * Row background color reflects work status — green for Working, red for On Break.
 * Note: currently uses static placeholder data pending API integration.
 */
export default function BreakTable() {
  return (
    <Paper
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        background: (theme) =>
          theme.palette.mode === "dark" ? "#14141f" : "#ffffff",
        boxShadow: "0 3px 15px rgba(0,0,0,0.10)",
      }}
    >
      <TableContainer sx={{ maxHeight: 305 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#2c2c3d" : "#ececec",
                "& th": { fontWeight: 700, color: "inherit" },
              }}
            >
              <TableCell>Employee Name</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Latest Start Time</TableCell>
              <TableCell>Total Break Duration</TableCell>
              <TableCell>Total Break Count</TableCell>
              <TableCell>Work Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {breakRows.map((row, index) => (
              // index used as key since placeholder data has no unique ID
              <TableRow
                key={index}
                sx={(theme) => ({
                  // Background color reflects work status, supports dark mode
                  backgroundColor:
                    row.workStatus === "Working"
                      ? theme.palette.mode === "dark"
                        ? "#1f2b1f" // dark green shade
                        : "#E6F4FF"
                      : theme.palette.mode === "dark"
                        ? "#2b1f1f" // dark red shade
                        : "#FFE6E6",
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#33334a" : "#e5e5e5",
                    cursor: "pointer",
                  },
                })}
              >
                <TableCell sx={{ fontWeight: 600 }}>
                  {row.employeeName}
                </TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.latestStartTime}</TableCell>
                <TableCell>{row.totalBreakDuration}</TableCell>
                <TableCell>{row.totalBreakCount}</TableCell>

                {/* Work status cell with icon indicating current state */}
                <TableCell sx={{ display: "flex", alignItems: "center" }}>
                  {row.workStatus === "Working" ? (
                    <>
                      <CheckBoxOutlineBlankIcon
                        sx={{ color: "success.light", mr: 1 }}
                      />
                      Working
                    </>
                  ) : (
                    <>
                      <PauseIcon sx={{ color: "error.main", mr: 1 }} />
                      On Break
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
