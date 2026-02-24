import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * HolidayTable Component
 *
 * Displays holiday list with:
 * - Edit action
 * - Delete action
 */
export default function HolidayTable({ rows = [], onEdit, onDelete }) {
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-GB");

  const getDayName = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
    });

  return (
    <>
      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          background: (theme) =>
            theme.palette.mode === "dark" ? "#14141f" : "#ffffff",
          boxShadow: "0 3px 15px rgba(0,0,0,0.10)",
        }}
      >
        <TableContainer sx={{ maxHeight: 350 }}>
          <Table size="small" stickyHeader>
            {/* HEADER */}
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "#2c2c3d" : "#ececec",
                  "& th": { fontWeight: 700 },
                }}
              >
                <TableCell>Action</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Day</TableCell>
                <TableCell>Title</TableCell>
              </TableRow>
            </TableHead>

            {/* BODY */}
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No holidays found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.holiday_id} hover>
                    <TableCell>
                      <EditIcon
                        sx={{
                          color: "#6F60C1",
                          cursor: "pointer",
                          mr: 1,
                        }}
                        onClick={() => onEdit(row)}
                      />

                      <DeleteIcon
                        sx={{ color: "red", cursor: "pointer" }}
                        onClick={() => onDelete(row)}
                      />
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600 }}>
                      {formatDate(row.holiday_date)}
                    </TableCell>

                    <TableCell>{getDayName(row.holiday_date)}</TableCell>

                    <TableCell sx={{ fontWeight: 600 }}>{row.title}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}
