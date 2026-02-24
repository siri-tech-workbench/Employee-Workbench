import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  Link,
  Chip,
  Autocomplete,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { DataGrid } from "@mui/x-data-grid";
import { useParams, useNavigate } from "react-router-dom";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import dayjs from "dayjs";

/**
 * AssignPage
 * Displays ticket details for admin review and allows approving or rejecting a ticket.
 * When approved, shows assignment fields to assign the ticket to an employee.
 *
 * Route param: id — the ticket ID pulled from the URL via useParams
 *
 * TODO: Replace hardcoded ticket field values (Client, Dept, Title, Description)
 * with an API call using the ticket `id` once the backend endpoint is available.
 */
export default function AssignPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Approval section state
  const [status, setStatus] = useState(null);
  const [remarks, setRemarks] = useState("");

  // Assignment section state — only relevant when status is "Approved"
  const [assignedTo, setAssignedTo] = useState(null);
  const [project, setProject] = useState(null);
  const [category, setCategory] = useState(null);
  const [priority, setPriority] = useState(null);
  const [workRemark, setWorkRemark] = useState("");
  const [verifiedBy, setVerifiedBy] = useState(null);
  const [completionDate, setCompletionDate] = useState(dayjs());

  // Dropdown options — replace with API-fetched data when available
  const statusOptions = ["Approved", "Rejected"];
  const employeeOptions = ["EMP001", "EMP002"];
  const projectOptions = ["Project A", "Project B"];
  const categoryOptions = ["Login", "System"];
  const priorityOptions = ["High", "Medium"];

  // Attachment list — replace with ticket data from API
  const attachments = [
    { name: "login_error.png", url: "#" },
    { name: "issue_details.pdf", url: "#" },
  ];

  // Assignment history rows — replace with API-fetched history for this ticket
  const historyRows = [
    {
      id: 1,
      assignedTo: "EMP001",
      project: "Project A",
      category: "Login",
      priority: "High",
      status: "Completed",
    },
  ];

  // Column definitions for the assignment history DataGrid
  const historyColumns = [
    { field: "assignedTo", headerName: "Assigned To", flex: 1 },
    { field: "project", headerName: "Project", flex: 1 },
    { field: "category", headerName: "Category", flex: 1 },
    { field: "priority", headerName: "Priority", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "Completed" ? "success" : "warning"}
        />
      ),
    },
  ];

  // Handles Save — submits approval/assignment data to the API
  // TODO: Replace with an actual API call (e.g. API.post(`/tickets/${id}/assign`, payload))
  const handleSave = () => {
    navigate("/Drawer/tickets");
  };

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ background: "#f4f6fa", minHeight: "100vh", p: 3 }}>
          {/* Page header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" fontWeight={600}>
              Ticket Review
            </Typography>
          </Box>

          <Paper sx={{ borderRadius: 3, p: 3, boxShadow: 3 }}>
            {/* Ticket Details and Attachments */}
            <Grid container spacing={3} mb={3}>
              {/* Left — read-only ticket info fields */}
              <Grid size={8}>
                <Typography fontWeight={600} fontSize="14px" mb={2}>
                  Ticket Details
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField
                      label="Ticket ID"
                      value={id}
                      size="small"
                      fullWidth
                      disabled
                    />
                  </Grid>

                  <Grid size={6}>
                    {/* TODO: Fetch Dept from ticket API */}
                    <TextField
                      label="Dept"
                      value="Store"
                      size="small"
                      fullWidth
                      disabled
                    />
                  </Grid>

                  <Grid size={12}>
                    {/* TODO: Fetch Client from ticket API */}
                    <TextField
                      label="Client"
                      value="Vimal"
                      size="small"
                      fullWidth
                      disabled
                    />
                  </Grid>

                  <Grid size={12}>
                    {/* TODO: Fetch Title from ticket API */}
                    <TextField
                      label="Title"
                      value="Login Issue"
                      size="small"
                      fullWidth
                      disabled
                    />
                  </Grid>

                  <Grid size={12}>
                    {/* TODO: Fetch Description from ticket API */}
                    <TextField
                      label="Description"
                      value="Error while login attempt"
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      disabled
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Right — downloadable file attachments */}
              <Grid size={4}>
                <Typography fontWeight={600} fontSize="14px" mb={2}>
                  Attachments
                </Typography>

                {attachments.map((file, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 1.5,
                      p: 1,
                      background: "#fff",
                      borderRadius: 1,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <AttachFileIcon fontSize="small" />
                    <Link href={file.url} underline="hover">
                      {file.name}
                    </Link>
                  </Box>
                ))}
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Approval — status dropdown and admin remarks */}
            <Typography fontWeight={600} fontSize="14px" mb={2}>
              Approval
            </Typography>

            <Grid container spacing={2}>
              <Grid size={6}>
                <Autocomplete
                  size="small"
                  options={statusOptions}
                  value={status}
                  onChange={(_, value) => setStatus(value)}
                  renderInput={(params) => (
                    <TextField {...params} label="Status" />
                  )}
                />
              </Grid>

              <Grid size={6}>
                <TextField
                  label="Admin Remarks"
                  size="small"
                  fullWidth
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </Grid>
            </Grid>

            {/* Assignment — conditionally shown only when ticket is approved */}
            {status === "Approved" && (
              <>
                <Divider sx={{ my: 3 }} />

                <Typography fontWeight={600} fontSize="14px" mb={2}>
                  Assignment
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={3}>
                    <Autocomplete
                      size="small"
                      options={employeeOptions}
                      value={assignedTo}
                      onChange={(_, value) => setAssignedTo(value)}
                      renderInput={(params) => (
                        <TextField {...params} label="Assign To" />
                      )}
                    />
                  </Grid>

                  <Grid size={3}>
                    <Autocomplete
                      size="small"
                      options={projectOptions}
                      value={project}
                      onChange={(_, value) => setProject(value)}
                      renderInput={(params) => (
                        <TextField {...params} label="Project" />
                      )}
                    />
                  </Grid>

                  <Grid size={3}>
                    <Autocomplete
                      size="small"
                      options={categoryOptions}
                      value={category}
                      onChange={(_, value) => setCategory(value)}
                      renderInput={(params) => (
                        <TextField {...params} label="Category" />
                      )}
                    />
                  </Grid>

                  <Grid size={3}>
                    <Autocomplete
                      size="small"
                      options={priorityOptions}
                      value={priority}
                      onChange={(_, value) => setPriority(value)}
                      renderInput={(params) => (
                        <TextField {...params} label="Priority" />
                      )}
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      label="Work Remark"
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      value={workRemark}
                      onChange={(e) => setWorkRemark(e.target.value)}
                    />
                  </Grid>

                  {/* Verified By — uses its own dedicated state, separate from category */}
                  <Grid size={3}>
                    <Autocomplete
                      size="small"
                      options={employeeOptions}
                      value={verifiedBy}
                      onChange={(_, value) => setVerifiedBy(value)}
                      renderInput={(params) => (
                        <TextField {...params} label="Verified By" />
                      )}
                    />
                  </Grid>

                  <Grid size={3}>
                    <DatePicker
                      label="Completion Date"
                      value={completionDate}
                      onChange={(newValue) => setCompletionDate(newValue)}
                      slotProps={{
                        textField: { size: "small", fullWidth: true },
                      }}
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {/* Form action buttons */}
            <Box
              display="flex"
              justifyContent="flex-end"
              gap={1}
              paddingTop={3}
            >
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>

              <Button
                size="small"
                variant="contained"
                sx={{
                  backgroundColor: "#6F60C1",
                  "&:hover": { backgroundColor: "#5748b8" },
                }}
                onClick={handleSave}
              >
                Save
              </Button>
            </Box>
          </Paper>

          {/* Assignment history for this ticket */}
          <Paper sx={{ mt: 3, p: 2, borderRadius: 3, boxShadow: 3 }}>
            <Typography fontWeight={600} fontSize="14px" mb={2}>
              Assignment History
            </Typography>

            <DataGrid
              rows={historyRows}
              columns={historyColumns}
              autoHeight
              hideFooter
              rowHeight={36}
              disableColumnMenu
              disableRowSelectionOnClick
            />
          </Paper>
        </Box>
      </LocalizationProvider>
    </>
  );
}
