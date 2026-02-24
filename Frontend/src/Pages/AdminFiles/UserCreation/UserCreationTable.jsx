import {
  Autocomplete,
  Box,
  Button,
  Grid,
  Paper,
  TableContainer,
  TextField,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useState, useEffect } from "react";
import { getuserslist, searchusers } from "../../../Services/usermast.services";

/**
 * Normalizes a raw user row from the API into a consistent shape
 * before passing it to the parent edit handler.
 * Converts string IDs to numbers to match the form's expected types.
 *
 * @param {object} row - Raw user row from the API response.
 * @returns {object} Normalized user object for the edit form.
 */
const normalizeEditPayload = (row) => ({
  user_id: Number(row.USER_ID),
  emp_id: Number(row.EMP_ID),
  login_id: row.LOGIN_ID,
  user_type_id: Number(row.USER_TYPE_ID),
});

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
 * UserCreationTable
 *
 * Displays a searchable, scrollable table of user master records.
 * Re-fetches the full user list whenever refreshKey changes (after form save/update).
 * Supports filtering by login ID via the search autocomplete and button.
 * Each row exposes an Edit action that normalizes and passes the row to the parent.
 *
 * @param {Function} onEdit - Callback invoked with the normalized user row when Edit is clicked.
 * @param {number} refreshKey - Incremented by the parent to trigger a full data re-fetch.
 */
export default function UserCreationTable({ onEdit, refreshKey }) {
  // Full unfiltered user list — used as options for the search autocomplete
  const [allUsers, setAllUsers] = useState([]);
  // Currently displayed rows — filtered by search or full list
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Re-fetch full user list on mount and whenever the parent signals a refresh
  useEffect(() => {
    fetchUsers();
  }, [refreshKey]);

  /**
   * Fetches the user list from the API.
   * Without an argument, loads all users and resets both allUsers and users.
   *
   * @param {number|null} userId - Optional user ID to fetch a specific user.
   */
  const fetchUsers = async (userId = null) => {
    try {
      let res;

      if (userId) {
        // Fetch a single user by ID — used for targeted refreshes
        res = await getuserslist({ user_id: userId });
        setUsers(res.items || []);
      } else {
        // Fetch all users — populates both the table and search dropdown
        res = await getuserslist();
        setAllUsers(res.items || []);
        setUsers(res.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  /**
   * Searches for a user by their LOGIN_ID and filters the table rows.
   * Does nothing if no user has been selected in the autocomplete.
   */
  const handleSearch = async () => {
    if (!selectedUser) return;

    try {
      const res = await searchusers(selectedUser.LOGIN_ID);
      setUsers(res.items || []);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  return (
    <Box>
      {/* Search bar — filter table by selecting a user from the dropdown */}
      <Grid container spacing={2} component={Paper} p={2}>
        {/* User search autocomplete — populated with all login IDs */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Autocomplete
            options={allUsers}
            getOptionLabel={(option) => option.LOGIN_ID || ""}
            value={selectedUser}
            isOptionEqualToValue={(o, v) => o.USER_ID === v.USER_ID}
            onChange={(e, value) => setSelectedUser(value)}
            renderInput={(params) => (
              <TextField {...params} label="All User List" />
            )}
          />
        </Grid>

        {/* Search trigger button */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Button variant="contained" size="small" onClick={handleSearch}>
            Search
          </Button>
        </Grid>
      </Grid>

      {/* Scrollable user table with sticky header */}
      <Paper
        sx={{
          borderRadius: "10px",
          mt: 3,
          overflow: "auto",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#1e1e2f" : "#ffffff",
        }}
      >
        <TableContainer sx={{ height: 278 }}>
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
              </TableRow>
            </TableHead>

            {/* Table body — empty state message or striped user rows */}
            <TableBody>
              {users.length === 0 ? (
                // Empty state — shown when no users match the current filter
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((row, index) => (
                  <TableRow
                    key={row.USER_ID}
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
                    {/* Edit action — normalizes the row and passes it to the parent form */}
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <EditIcon
                          sx={{ color: "#6F60C1", cursor: "pointer" }}
                          onClick={() => onEdit?.(normalizeEditPayload(row))}
                        />
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600 }}>
                      {row.EMP_NAME}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {row.LOGIN_ID}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
