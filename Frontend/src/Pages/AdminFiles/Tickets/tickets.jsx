import { useState } from "react";
import { Box, Typography, Card, Tabs, Tab, Paper, Chip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

// Tab index to ticket status mapping — used for filtering rows and row-click navigation
const TAB_STATUS = ["NEW", "ASSIGNED", "COMPLETED"];

/**
 * Returns the MUI Chip color for a given ticket status.
 *
 * @param {string} status - Ticket status string ("NEW" | "ASSIGNED" | "COMPLETED")
 * @returns {string} MUI color variant
 */
const getStatusColor = (status) => {
  if (status === "NEW") return "warning";
  if (status === "ASSIGNED") return "info";
  return "success";
};

/**
 * Tickets
 * Admin view listing all tickets grouped by status across three tabs:
 * New, Assigned, and Completed.
 *
 * Clicking a NEW ticket navigates to the AssignPage.
 * Clicking an ASSIGNED ticket navigates to the TicketProgressPage.
 * Clicking a COMPLETED ticket does nothing (intentional).
 *
 * TODO: Replace hardcoded tickets array with an API call on mount.
 */
export default function Tickets() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  // Ticket list — replace with API-fetched data when available
  const [tickets] = useState([
    {
      id: 101,
      department: "Store",
      client_name: "Vimal",
      title: "Login Issue",
      status: "NEW",
      expected_completion_date: "2026-02-15",
      assigned_status: "No",
    },
    {
      id: 102,
      department: "Marketing",
      client_name: "Tomul",
      title: "Indent Issue",
      status: "NEW",
      expected_completion_date: "2026-02-16",
      assigned_status: "No",
    },
    {
      id: 103,
      department: "Sales",
      client_name: "Arun",
      title: "Report Issue",
      status: "ASSIGNED",
      expected_completion_date: "2026-02-18",
      assigned_status: "Yes",
    },
    {
      id: 104,
      department: "HR",
      client_name: "Meena",
      title: "Salary Issue",
      status: "COMPLETED",
      expected_completion_date: "2026-02-10",
      assigned_status: "Yes",
    },
  ]);

  // Filters tickets to match the currently selected tab's status
  const getRows = () => tickets.filter((t) => t.status === TAB_STATUS[tab]);

  // Column definitions for the tickets DataGrid
  const columns = [
    { field: "id", headerName: "Ticket ID", width: 110 },
    { field: "department", headerName: "Dept Name", width: 150 },
    { field: "client_name", headerName: "Client Name", width: 150 },
    { field: "title", headerName: "Title", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: "expected_completion_date",
      headerName: "Expected Completion",
      width: 180,
      // Format ISO date string to readable format (e.g. 15-Feb-2026)
      renderCell: (params) => dayjs(params.value).format("DD-MMM-YYYY"),
    },
    {
      field: "assigned_status",
      headerName: "Assigned Status",
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "Yes" ? "success" : "default"}
          size="small"
        />
      ),
    },
  ];

  // Handles row click — routes to the appropriate page based on ticket status
  const handleRowClick = (params) => {
    const { id: ticketId, status } = params.row;

    if (status === "NEW") {
      navigate(`/Drawer/assign/${ticketId}`);
    } else if (status === "ASSIGNED") {
      navigate(`/Drawer/ticket-progress/${ticketId}`);
    }
    // COMPLETED tickets are view-only — no navigation on click
  };

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight={700} color="#6F60C1">
        Tickets
      </Typography>

      {/* Orange accent divider below the page title */}
      <Box sx={{ height: 3, background: "#FF7A00", mt: 1, mb: 3 }} />

      <Card sx={{ borderRadius: 3, p: 2, border: "2px solid #6F60C1" }}>
        {/* Tab bar — filters the grid by ticket status */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .Mui-selected": { color: "#6F60C1" },
            "& .MuiTabs-indicator": { backgroundColor: "#6F60C1" },
          }}
        >
          <Tab label="New Tickets" />
          <Tab label="Assigned Tickets" />
          <Tab label="Completed Tickets" />
        </Tabs>

        <Paper sx={{ height: 500, mt: 2 }}>
          <DataGrid
            rows={getRows()}
            columns={columns}
            pageSize={5}
            disableRowSelectionOnClick
            onRowClick={handleRowClick}
            sx={{
              border: "none",
              cursor: "pointer",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f4f3ff",
                fontWeight: 600,
              },
            }}
          />
        </Paper>
      </Card>
    </Box>
  );
}
