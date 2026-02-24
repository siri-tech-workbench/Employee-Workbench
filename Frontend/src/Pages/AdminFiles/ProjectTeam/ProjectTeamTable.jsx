import { Paper, TableContainer } from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useState, useEffect } from "react";
import { gettabledata } from "../../../Services/projectteam.services";

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
 * ProjectTeamTable
 *
 * Displays a scrollable, striped table of project team assignments.
 * Re-fetches data whenever refreshKey changes (triggered after form save/update).
 * Each row exposes an Edit action that passes the row back to the parent.
 *
 * @param {Function} onEdit - Callback invoked with the selected row when Edit is clicked.
 * @param {number} refreshKey - Incremented by the parent to trigger a data re-fetch.
 */
export default function ProjectTeamTable({ onEdit, refreshKey }) {
  const [teamRows, setTeamRows] = useState([]);

  // Re-fetch team data on mount and whenever the parent signals a refresh
  useEffect(() => {
    fetchProjectTeam();
  }, [refreshKey]);

  /**
   * Fetches the full project team list from the API and updates table rows.
   */
  const fetchProjectTeam = async () => {
    try {
      const res = await gettabledata();
      setTeamRows(res.items || []);
    } catch (err) {
      console.error("Failed to load project team data", err);
    }
  };

  return (
    <Paper
      sx={{
        borderRadius: "10px",
        overflow: "auto",
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "#1e1e2f" : "#ffffff",
      }}
    >
      {/* Scrollable table container — fixed height enables sticky header */}
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
              <TableCell>Login ID</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          {/* Table body — striped rows with hover highlight and edit action */}
          <TableBody>
            {teamRows.map((row, index) => (
              <TableRow
                key={row.TEAM_ID}
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
                <TableCell>{row.LOGIN_ID}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {row.PROJECT_NAME}
                </TableCell>
                <TableCell>{row.ROLE_NAME}</TableCell>
                <TableCell>{formatDate(row.START_DATE)}</TableCell>
                <TableCell>{formatDate(row.END_DATE)}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {row.STATUS_NAME}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
