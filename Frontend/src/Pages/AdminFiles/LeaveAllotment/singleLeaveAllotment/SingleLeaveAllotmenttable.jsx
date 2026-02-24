import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import { getSingleLeaveTable } from "../../../../Services/SingleLeaveAllotment.services";

/**
 * SingleLeaveAllotmentTable
 *
 * Displays:
 * - Employee leave allotment list
 * - Edit action
 */
const SingleLeaveAllotmenttable = ({ refreshKey, setEditRowData }) => {
  const [rows, setRows] = useState([]);

  /* ----------------------------------------------------------
     FETCH TABLE DATA
  ---------------------------------------------------------- */
  const fetchData = async () => {
    try {
      const res = await getSingleLeaveTable();
      setRows(res?.items || []);
    } catch (error) {
      console.error("Failed to fetch leave data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  return (
    <>
      <Paper
        sx={{
          borderRadius: 2,
          overflow: "auto",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#1e1e2f" : "#ffffff",
        }}
      >
        <TableContainer sx={{ height: 320 }}>
          <Table size="small" stickyHeader>
            {/* HEADER */}
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
                <TableCell>Casual Leave</TableCell>
                <TableCell>Earned Leave</TableCell>
                <TableCell>Medical Leave</TableCell>
              </TableRow>
            </TableHead>

            {/* BODY */}
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No leave records found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={`${row.EMP_ID}-${row.CAL_YEAR_ID}`}
                    sx={(theme) => ({
                      backgroundColor:
                        theme.palette.mode === "dark" ? "#242437" : "#EAF3FF",
                      "& td": {
                        color:
                          theme.palette.mode === "dark" ? "#f5f5f5" : "#000",
                      },
                    })}
                  >
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <EditIcon
                          sx={{
                            color: "#6F60C1",
                            cursor: "pointer",
                          }}
                          onClick={() => setEditRowData(row)}
                        />
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600 }}>
                      {row.EMPLOYEE_NAME}
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600 }}>
                      {row.CASUAL_LEAVE}
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600 }}>
                      {row.EARNED_LEAVE}
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600 }}>
                      {row.MEDICAL_LEAVE}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

export default SingleLeaveAllotmenttable;
