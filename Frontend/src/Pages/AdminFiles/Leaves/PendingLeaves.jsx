import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Button,
  Autocomplete,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import CloseIcon from "@mui/icons-material/Close";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PendingActionsIcon from "@mui/icons-material/PendingActions";

import Loading from "../../../Components/loading";
import { showAlert, showPostError } from "../../../Components/swal_alert";

import {
  getpendingleaves,
  getleavestatus,
  leaveapprove,
} from "../../../Services/adminleave.services";

import {
  calculateleavedays,
  getRemainingLeave,
} from "../../../Services/leave.services";

import { getLoginDetails } from "../../../Services/login.service";
import { getuserslist } from "../../../Services/usermast.services";

/* =========================================================
   Helper: DatePicker Style
========================================================= */
const datePickerStyle = (theme) => ({
  "& .MuiPickersOutlinedInput-root fieldset": {
    borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
  },
});

/* =========================================================
   Main Component
========================================================= */
export default function PendingLeaves() {
  /* ----------------------- State ----------------------- */
  const [leaves, setLeaves] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [approvedFrom, setApprovedFrom] = useState(null);
  const [approvedTo, setApprovedTo] = useState(null);
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [remainingLeaves, setRemainingLeaves] = useState(null);

  const [remarks, setRemarks] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingDays, setLoadingDays] = useState(false);

  /* ----------------------- Stats ----------------------- */
  const [todayPresent, setTodayPresent] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [plannedCount, setPlannedCount] = useState(0);
  const [unplannedCount, setUnplannedCount] = useState(0);

  /* =========================================================
     Initial Load
  ========================================================= */
  useEffect(() => {
    fetchPendingLeaves();
    fetchStatuses();
    fetchPresence();
  }, []);

  /* =========================================================
     Fetch Functions
  ========================================================= */
  const fetchPendingLeaves = async () => {
    try {
      const res = await getpendingleaves();
      const data = res?.items || [];
      setLeaves(data);

      let planned = 0;
      let unplanned = 0;

      data.forEach((leave) => {
        const applied = dayjs(leave.created_at);
        const from = dayjs(leave.from_date);
        applied.isBefore(from, "day") ? planned++ : unplanned++;
      });

      setPlannedCount(planned);
      setUnplannedCount(unplanned);
    } catch (error) {
      console.error(error);
      setLeaves([]);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await getleavestatus();
      const filtered = (res?.items || []).filter(
        (s) => s.apr_status?.toUpperCase() !== "EXPIRED",
      );
      setStatusOptions(filtered);
    } catch (error) {
      console.error(error);
      setStatusOptions([]);
    }
  };

  const fetchPresence = async () => {
    try {
      const today = dayjs().format("YYYY-MM-DD");
      const loginRes = await getLoginDetails(today);
      const employeeRes = await getuserslist();

      const present = (loginRes?.items || []).filter(
        (emp) => emp.status === "LOGGED_IN",
      ).length;

      setTodayPresent(present);
      setTotalEmployees(employeeRes?.items?.length || 0);
    } catch (error) {
      console.error(error);
    }
  };

  /* =========================================================
     Recalculate Leave Days
  ========================================================= */
  const recalcDays = async (from, to) => {
    if (!from || !to || !selectedRow) return;

    try {
      setLoadingDays(true);

      const res = await calculateleavedays({
        from_date: from.format("YYYY-MM-DD"),
        to_date: to.format("YYYY-MM-DD"),
        leave_id: selectedRow.leave_id,
      });

      const newDays = Number(res?.items || 0);

      setCalculatedDays(newDays);

      setRemainingLeaves((prev) =>
        prev !== null ? Math.max(prev - newDays, 0) : null,
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDays(false);
    }
  };

  /* =========================================================
     Row Click
  ========================================================= */
  const handleRowClick = async (row) => {
    setSelectedRow(row);
    setRemarks("");
    setSelectedStatus(null);

    const appliedDays = Number(row.no_of_days) || 0;

    setApprovedFrom(dayjs(row.from_date));
    setApprovedTo(dayjs(row.to_date));
    setCalculatedDays(appliedDays);

    const res = await getRemainingLeave(row.leave_id);

    setRemainingLeaves(Number(res?.items || 0));

    setOpen(true);
  };

  /* =========================================================
     Submit
  ========================================================= */
  const handleSubmit = async () => {
    if (!selectedStatus) {
      showAlert("warning", "Select approval status");
      return;
    }

    const isRejected = selectedStatus.apr_status?.toUpperCase() === "REJECTED";

    if (isRejected && !remarks.trim()) {
      showAlert("warning", "Remarks required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        emp_leave_detail_id: selectedRow.emp_leave_detail_id,
        employee_id: selectedRow.emp_id,
        leave_id: selectedRow.leave_id,
        approved_from: approvedFrom?.format("YYYY-MM-DD"),
        approved_to: approvedTo?.format("YYYY-MM-DD"),
        approved_days: calculatedDays,
        status_id: selectedStatus.status_id,
        remarks: isRejected ? remarks : null,
      };

      const res = await leaveapprove(payload);

      if (res?.statusCode === 200) {
        showAlert("success", "Leave processed successfully");
        setOpen(false);
        fetchPendingLeaves();
      } else {
        showPostError(res?.message);
      }
    } catch (error) {
      console.error(error);
      showPostError(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     Stats Config
  ========================================================= */
  const stats = [
    {
      title: "Today Presents",
      value: `${todayPresent}/${totalEmployees}`,
      icon: <PeopleAltIcon />,
    },
    {
      title: "Planned Leaves",
      value: `${plannedCount} Today`,
      icon: <EventAvailableIcon />,
    },
    {
      title: "Unplanned Leaves",
      value: `${unplannedCount} Today`,
      icon: <ReportProblemIcon />,
    },
    {
      title: "Pending Requests",
      value: leaves.length,
      icon: <PendingActionsIcon />,
    },
  ];

  /* =========================================================
     Render
  ========================================================= */
  return (
    <>
      <Box>
        <Typography variant="h4" fontWeight={700} color="#6964C1">
          Leaves
        </Typography>

        {/* ================= STAT CARDS ================= */}
        <Grid container spacing={2} my={3}>
          {stats.map((s, i) => (
            <Grid size={{ xs: 12, md: 3 }} key={i}>
              <Paper
                sx={{
                  display: "flex",
                  alignItems: "center",
                  height: 80,
                  borderRadius: 2,
                  border: "2px solid #6F60C1",
                }}
              >
                <Box
                  sx={{
                    width: 60,
                    height: "100%",
                    background: "#6F60C1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  {s.icon}
                </Box>

                <Box px={2}>
                  <Typography fontSize={13}>{s.title}</Typography>
                  <Typography fontWeight={700} color="#6F60C1">
                    {s.value}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* ================= TABLE ================= */}
        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>Employee</b>
                </TableCell>
                <TableCell>
                  <b>Leave Type</b>
                </TableCell>
                <TableCell>
                  <b>From</b>
                </TableCell>
                <TableCell>
                  <b>To</b>
                </TableCell>
                <TableCell>
                  <b>Days</b>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No pending requests
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((row) => (
                  <TableRow key={row.emp_leave_detail_id} hover>
                    <TableCell>
                      <Typography
                        sx={{
                          cursor: "pointer",
                          color: "#6F60C1",
                          textDecoration: "underline",
                        }}
                        onClick={() => handleRowClick(row)}
                      >
                        {row.employee_name}
                      </Typography>
                    </TableCell>

                    <TableCell>{row.leave_name}</TableCell>

                    <TableCell>
                      {dayjs(row.from_date).format("DD MMM YYYY")}
                    </TableCell>

                    <TableCell>
                      {dayjs(row.to_date).format("DD MMM YYYY")}
                    </TableCell>

                    <TableCell>{row.no_of_days}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ================= DIALOG ================= */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          {loading && <Loading />}

          {selectedRow && (
            <DialogContent>
              <Grid container spacing={2}>
                <Grid xs={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Approved From"
                      value={approvedFrom}
                      onChange={(value) => {
                        setApprovedFrom(value);
                        if (value && approvedTo) recalcDays(value, approvedTo);
                      }}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          sx: datePickerStyle,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid xs={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Approved To"
                      value={approvedTo}
                      minDate={approvedFrom}
                      onChange={(value) => {
                        setApprovedTo(value);
                        if (approvedFrom && value)
                          recalcDays(approvedFrom, value);
                      }}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid xs={12}>
                  <Autocomplete
                    options={statusOptions}
                    value={selectedStatus}
                    onChange={(_, val) => setSelectedStatus(val)}
                    getOptionLabel={(o) => o?.apr_status || ""}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Approval Status"
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid xs={12}>
                  <TextField
                    label="Remarks"
                    multiline
                    rows={2}
                    fullWidth
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </Grid>

                <Grid xs={12} textAlign="center">
                  <Button variant="contained" onClick={handleSubmit}>
                    SUBMIT
                  </Button>
                </Grid>
              </Grid>
            </DialogContent>
          )}
        </Dialog>
      </Box>
    </>
  );
}
