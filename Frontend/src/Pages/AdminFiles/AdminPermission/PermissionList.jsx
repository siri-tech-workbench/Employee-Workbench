import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Typography,
  Box,
} from "@mui/material";
import { useEffect, useState } from "react";
import { gettodayspermission } from "../../../Services/permission.services";

/**
 * PermissionList
 * Displays today's approved permission entries
 * in a scrollable striped table.
 */
export default function PermissionList() {
  const [rows, setRows] = useState([]);

  /**
   * Fetches today's permission records from the API
   * and populates the table rows.
   */
  const fetchTodayPermissions = async () => {
    try {
      const res = await gettodayspermission();
      setRows(res?.items || []);
    } catch (err) {
      console.error("Failed to load today's permissions", err);
    }
  };

  // Load today's permissions on initial mount
  useEffect(() => {
    fetchTodayPermissions();
  }, []);

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        {/* Section title */}
        <Typography variant="h6" fontWeight={700} color="#6F60C1">
          Today's Permission List
        </Typography>

        {/* Permissions table */}
        <Box
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            background: (theme) =>
              theme.palette.mode === "dark" ? "#14141f" : "#ffffff",
            boxShadow: "0 3px 15px rgba(0,0,0,0.10)",
            mt: 1,
          }}
        >
          <TableContainer sx={{ height: 365 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark" ? "#2c2c3d" : "#ececec",
                    "& th": { fontWeight: 700 },
                  }}
                >
                  <TableCell>Name</TableCell>
                  <TableCell>From Time</TableCell>
                  <TableCell>To Time</TableCell>
                  <TableCell>Permission Reason</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No permissions for today
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    // index used as key since permission records have no unique ID from backend
                    <TableRow
                      key={index}
                      sx={(theme) => ({
                        // Zebra stripe — handles both light and dark mode
                        backgroundColor:
                          index % 2 === 0
                            ? theme.palette.mode === "dark"
                              ? "#1f1f2b"
                              : "#ffffff"
                            : theme.palette.mode === "dark"
                              ? "#29293a"
                              : "#f7f7f7",
                      })}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>
                        {row.EMP_NAME}
                      </TableCell>
                      <TableCell>{row.FROM_TIME}</TableCell>
                      <TableCell>{row.TO_TIME}</TableCell>
                      <TableCell>{row.PERM_REASON}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </Box>
  );
}
