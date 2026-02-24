import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Box,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * Static placeholder data representing notification types.
 * Replace this with an API call or props once the backend is connected.
 */
const notificationRows = [
  { type: "TASK" },
  { type: "GENERAL" },
  { type: "MEETING" },
  { type: "VERIFICATION" },
];

/**
 * Returns the background color for an alternating striped table row.
 * Even rows use a light blue, odd rows use a light pink (matching the UI design).
 *
 * @param {number} index - Row index from the map iteration.
 * @param {"light"|"dark"} mode - Current MUI theme palette mode.
 * @returns {string} A CSS color string.
 */
function getRowBackgroundColor(index, mode) {
  if (mode === "dark") {
    return index % 2 === 0 ? "#1f1f2b" : "#29293a";
  }
  return index % 2 === 0 ? "#e8f4ff" : "#ffe6eb";
}

/**
 * NotificationTypeTable
 *
 * Displays a paginated, scrollable table of existing notification types.
 * Each row includes Edit and Delete action icons.
 * Supports light and dark theme via MUI theme-aware sx styling.
 */
export default function NotificationTypeTable() {
  return (
    /* Box replaces the unnecessary div wrapper */
    <Box>
      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          background: (theme) =>
            theme.palette.mode === "dark" ? "#14141f" : "#ffffff",
          boxShadow: "0 3px 15px rgba(0,0,0,0.10)",
        }}
      >
        {/* Scrollable container — maxHeight prevents the table from overflowing the card */}
        <TableContainer sx={{ maxHeight: 350 }}>
          <Table size="small" stickyHeader>
            {/* Table header — bold column labels with theme-aware background */}
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "#2c2c3d" : "#ececec",
                  "& th": { fontWeight: 700 },
                }}
              >
                <TableCell>Action</TableCell>
                <TableCell>Notification Type</TableCell>
              </TableRow>
            </TableHead>

            {/* Table body — alternating row colors, hover highlight */}
            <TableBody>
              {notificationRows.map((row, index) => (
                <TableRow
                  key={row.type}
                  sx={(theme) => ({
                    backgroundColor: getRowBackgroundColor(
                      index,
                      theme.palette.mode,
                    ),
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark" ? "#33334a" : "#e5e5e5",
                      cursor: "pointer",
                    },
                  })}
                >
                  {/* Action icons — Edit triggers update flow, Delete removes the entry */}
                  <TableCell>
                    <EditIcon
                      sx={{
                        color: "blue",
                        cursor: "pointer",
                        mr: 1,
                      }}
                    />
                    <DeleteIcon
                      sx={{
                        color: "red",
                        cursor: "pointer",
                        fontSize: 22,
                      }}
                    />
                  </TableCell>

                  {/* Notification type label — uppercase, bold for visibility */}
                  <TableCell sx={{ fontWeight: 700 }}>{row.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
