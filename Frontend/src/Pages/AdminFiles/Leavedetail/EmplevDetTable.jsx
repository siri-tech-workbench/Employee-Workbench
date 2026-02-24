import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Box,
  Grid,
  Typography,
} from "@mui/material";
import { format } from "date-fns";

/* ----------------------------------------------------------
   Status Mapping
---------------------------------------------------------- */
const statusMap = {
  1: "Approved",
  2: "Rejected",
};

/* ----------------------------------------------------------
   Table Row Renderer
---------------------------------------------------------- */
const renderRows = (rows = []) =>
  rows.map((row, index) => (
    <TableRow
      key={`${row.from}-${row.to}-${index}`}
      sx={(theme) => ({
        backgroundColor:
          index % 2 === 0
            ? theme.palette.mode === "dark"
              ? "#1f1f2b"
              : "#ffffff"
            : theme.palette.mode === "dark"
              ? "#29293a"
              : "#f7f7f7",
        "&:hover": {
          backgroundColor:
            theme.palette.mode === "dark" ? "#33334a" : "#e5e5e5",
        },
      })}
    >
      <TableCell sx={{ fontSize: 12 }}>
        {format(new Date(row.from), "dd-MM-yyyy")}
      </TableCell>

      <TableCell sx={{ fontSize: 12 }}>
        {format(new Date(row.to), "dd-MM-yyyy")}
      </TableCell>

      <TableCell sx={{ fontSize: 12 }}>{row.days}</TableCell>

      <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>
        {statusMap[row.status] || "Pending"}
      </TableCell>
    </TableRow>
  ));

/* ----------------------------------------------------------
   Approved Count
---------------------------------------------------------- */
const getApprovedTotal = (rows = []) =>
  rows.filter((row) => row.status === 1).length;

/* ----------------------------------------------------------
   Reusable Leave Section Component
---------------------------------------------------------- */
const LeaveSection = ({ title, rows }) => (
  <Grid size={{ xs: 12, md: 6 }}>
    <Paper
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        background: (theme) =>
          theme.palette.mode === "dark" ? "#14141f" : "#ffffff",
        boxShadow: "0 3px 15px rgba(0,0,0,0.10)",
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        textAlign="center"
        p={1}
        color="#6F60C1"
      >
        {title}
      </Typography>

      <TableContainer sx={{ maxHeight: 350 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#2c2c3d" : "#ececec",
                "& th": {
                  fontWeight: 700,
                  fontSize: 12,
                },
              }}
            >
              <TableCell>Req From</TableCell>
              <TableCell>Req To</TableCell>
              <TableCell>No of Day</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              renderRows(rows)
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography
        variant="subtitle2"
        fontWeight={700}
        textAlign="center"
        p={1}
        color="#6F60C1"
      >
        Total Approved: {getApprovedTotal(rows)}
      </Typography>
    </Paper>
  </Grid>
);

/* ----------------------------------------------------------
   Main Component
---------------------------------------------------------- */
export default function EmployeeLeaveDetailTable({ leaveData }) {
  const { casual = [], earned = [], medical = [] } = leaveData || {};

  return (
    <>
      <Box>
        <Grid container spacing={2}>
          <LeaveSection title="Casual Leave" rows={casual} />

          <LeaveSection title="Earned Leave" rows={earned} />

          <LeaveSection title="Medical Leave" rows={medical} />
        </Grid>
      </Box>
    </>
  );
}
