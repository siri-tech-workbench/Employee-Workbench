import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useParams, useNavigate } from "react-router-dom";

/**
 * TicketProgressPage
 * Displays the progress of all employees assigned to a specific ticket.
 * Each row shows an employee's assigned project, current status, completion
 * percentage, remarks, and last updated date.
 *
 * Route param: id — the ticket ID used to identify and label the page
 *
 * TODO: Replace hardcoded progressRows with an API call using the ticket `id`
 */
export default function TicketProgressPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Progress data rows — replace with API-fetched data for this ticket
  // Using useState to prepare for future API integration
  const [progressRows] = useState([
    {
      id: 1,
      employee: "EMP001",
      project: "Project A",
      status: "In Progress",
      progress: 60,
      remarks: "Working on backend validation",
      updatedAt: "17-02-2026",
    },
    {
      id: 2,
      employee: "EMP002",
      project: "Project B",
      status: "Completed",
      progress: 100,
      remarks: "UI Fix Completed",
      updatedAt: "16-02-2026",
    },
  ]);

  // Maps status string to a MUI Chip color
  const getStatusColor = (status) => {
    if (status === "Completed") return "success";
    if (status === "In Progress") return "warning";
    return "default";
  };

  // Column definitions for the progress DataGrid
  const columns = [
    { field: "employee", headerName: "Employee", flex: 1 },
    { field: "project", headerName: "Project", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getStatusColor(params.value)}
        />
      ),
    },
    {
      field: "progress",
      headerName: "Progress",
      flex: 1.5,
      // Renders a progress bar with percentage label below it
      renderCell: (params) => (
        <Box sx={{ width: "100%" }}>
          <LinearProgress
            variant="determinate"
            value={params.value}
            sx={{ height: 8, borderRadius: 5, mb: 0.5 }}
          />
          <Typography fontSize="12px">{params.value}%</Typography>
        </Box>
      ),
    },
    { field: "remarks", headerName: "Remarks", flex: 2 },
    { field: "updatedAt", headerName: "Last Updated", flex: 1 },
  ];

  return (
    <>
      <Box sx={{ p: 3, background: "#f4f6fa", minHeight: "100vh" }}>
        {/* Page header with ticket ID and back navigation */}
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={600}>
            Ticket Progress - #{id}
          </Typography>

          <Button size="small" variant="outlined" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Box>

        {/* Progress table */}
        <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
          <DataGrid
            rows={progressRows}
            columns={columns}
            autoHeight
            hideFooter
            rowHeight={70}
            disableColumnMenu
            disableRowSelectionOnClick
          />
        </Paper>
      </Box>
    </>
  );
}
