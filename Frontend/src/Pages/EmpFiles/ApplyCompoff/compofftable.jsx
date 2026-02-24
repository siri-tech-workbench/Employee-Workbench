import { Box, Paper, TableContainer } from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useState, useEffect } from "react";
import { getcomoff } from "../../../Services/compoff.service";

// ---------------------------------------------------------------------------
// Status code to label map — matches the backend enum for comp off status
// ---------------------------------------------------------------------------
const COMP_OFF_STATUS_MAP = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
  3: "Expired",
};

/**
 * Formats a raw date string or Date object into DD-MM-YYYY display format.
 * Returns a dash if the value is null, undefined, or empty.
 *
 * @param {string|Date|null} date - The raw date value from the API.
 * @returns {string} Formatted date string or "-".
 */
const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Returns the background color for a striped table row.
 * Alternates between light blue and light pink in light mode,
 * and between two dark shades in dark mode.
 *
 * @param {number} index - Row index from the map iteration.
 * @param {"light"|"dark"} mode - Current MUI theme palette mode.
 * @returns {string} A CSS color string.
 */
const getRowBackgroundColor = (index, mode) => {
  if (mode === "dark") {
    return index % 2 === 0 ? "#1f1f2b" : "#29293a";
  }
  return index % 2 === 0 ? "#e8f4ff" : "#ffe6eb";
};

/**
 * Compofftable
 *
 * Displays a scrollable, striped table of compensatory off leave records.
 * Re-fetches data whenever refreshKey changes (triggered after form save/update).
 * Shows an empty state row when no records are found.
 * Each row exposes an Edit action that passes the full row back to the parent form.
 *
 * @param {Function} onEdit - Callback invoked with the selected row when Edit is clicked.
 * @param {number} refreshKey - Incremented by the parent to trigger a data re-fetch.
 */
export default function Compofftable({ onEdit, refreshKey }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Re-fetch comp off records on mount and whenever the parent signals a refresh
  useEffect(() => {
    fetchCompoffs();
  }, [refreshKey]);

  /**
   * Fetches all comp off records for the current user from the API.
   */
  const fetchCompoffs = async () => {
    setLoading(true);
    try {
      const res = await getcomoff();
      setRows(res.items || []);
    } catch (err) {
      console.error("Failed to load comp-off data", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Scrollable comp off records table with sticky header */}
      <Paper
        sx={{
          borderRadius: "10px",
          overflow: "auto",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#1e1e2f" : "#ffffff",
        }}
      >
        <TableContainer sx={{ height: 350 }}>
          <Table size="small" stickyHeader>
            {/* Table header — bold column labels with theme-aware background */}
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
                <TableCell>Employee Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>From Time</TableCell>
                <TableCell>To Time</TableCell>
                <TableCell>Total Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expires On</TableCell>
              </TableRow>
            </TableHead>

            {/* Table body — striped rows or empty state message */}
            <TableBody>
              {rows.map((row, index) => (
                <TableRow
                  key={row.COMP_OFF_ID}
                  sx={(theme) => ({
                    backgroundColor: getRowBackgroundColor(
                      index,
                      theme.palette.mode,
                    ),
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark" ? "#3a3a50" : "#e5e5e5",
                      cursor: "pointer",
                    },
                  })}
                >
                  {/* Edit action — passes the full row back to the parent form */}
                  <TableCell>
                    <EditIcon
                      sx={{ color: "blue", cursor: "pointer", mr: 1 }}
                      onClick={() => onEdit(row)}
                    />
                  </TableCell>

                  <TableCell sx={{ fontWeight: 600 }}>{row.NAME}</TableCell>
                  <TableCell>{formatDate(row.COMP_OFF_DATE)}</TableCell>
                  <TableCell>{row.START_TIME}</TableCell>
                  <TableCell>{row.END_TIME}</TableCell>
                  <TableCell>{row.DURATION}</TableCell>

                  {/* Status resolved from numeric code to readable label */}
                  <TableCell sx={{ fontWeight: 600 }}>
                    {COMP_OFF_STATUS_MAP[row.STATUS] || "Unknown"}
                  </TableCell>

                  <TableCell>{formatDate(row.EXPIRES_ON)}</TableCell>
                </TableRow>
              ))}

              {/* Empty state — shown when no records exist and loading is complete */}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No comp-off records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
