import { useState, useEffect } from "react";
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from "@mui/material";
import { getPermissionData } from "../../../Services/permission.services";
import { decryptData } from "../../../utils/secureStorage";

export default function EmpPerTable({ refreshKey }) {
  const [permissionRows, setPermissionRows] = useState([]);
  const [empId, setEmpId] = useState(null);

  // Decrypt session on mount to retrieve the employee ID for data fetching
  useEffect(() => {
    (async () => {
      const session = await decryptData("userSession");
      setEmpId(session?.user?.emp_id || null);
    })();
  }, []);

  // Fetch permission history whenever empId is ready or a form submission triggers refreshKey
  useEffect(() => {
    if (!empId) return;

    const fetchPermissionData = async () => {
      try {
        const response = await getPermissionData(empId);
        setPermissionRows(response?.items || []);
      } catch (error) {
        console.error("Error fetching permission data:", error);
      }
    };

    fetchPermissionData();
  }, [refreshKey, empId]);

  return (
    <Paper
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "#1b1b23" : "#ffffff",
        boxShadow: "0 3px 15px rgba(0,0,0,0.12)",
      }}
    >
      <TableContainer sx={{ maxHeight: 305 }}>
        <Table size="small" stickyHeader>
          {/* Table header */}
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#2b2b36" : "#ececec",
                "& th": {
                  fontWeight: 700,
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#fff" : "#000",
                },
              }}
            >
              <TableCell>From Time</TableCell>
              <TableCell>To Time</TableCell>
              <TableCell>Applied Time</TableCell>
              <TableCell>Permission Date</TableCell>
              <TableCell>Permission Duration</TableCell>
              <TableCell>Permission Reason</TableCell>
            </TableRow>
          </TableHead>

          {/* Table rows — alternating row background for readability */}
          <TableBody>
            {permissionRows.map((row, index) => (
              <TableRow
                key={index}
                sx={(theme) => ({
                  backgroundColor:
                    index % 2 === 0
                      ? theme.palette.mode === "dark"
                        ? "#20202A"
                        : "#ffffff"
                      : theme.palette.mode === "dark"
                        ? "#262635"
                        : "#f7f7f7",
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#333348" : "#e5e5e5",
                    cursor: "pointer",
                  },
                  "& td": {
                    color: theme.palette.mode === "dark" ? "#ddd" : "#333",
                  },
                })}
              >
                <TableCell>{row.FROM_TIME}</TableCell>
                <TableCell>{row.TO_TIME}</TableCell>
                <TableCell>{row.APPLIED_TIME}</TableCell>
                <TableCell>{row.PERM_DATE}</TableCell>
                <TableCell>{row.PERM_DURATION}</TableCell>
                <TableCell>{row.PERM_REASON}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
