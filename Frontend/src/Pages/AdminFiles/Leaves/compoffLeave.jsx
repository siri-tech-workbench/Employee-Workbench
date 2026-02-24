import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Dialog,
  DialogContent,
  IconButton,
  Grid,
  TextField,
  Button,
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import Loading from "../../../Components/loading";
import { showAlert, showPostError } from "../../../Components/swal_alert";

import {
  getpendingcompoffs,
  approvecompoff,
} from "../../../Services/approvecompoff.service";
import { getleavestatus } from "../../../Services/adminleave.services";

/* ----------------------------------------------------------
   Status Mapping
---------------------------------------------------------- */
const getStatusLabel = (status) => {
  const s = Number(status);

  if (s === 1) return { text: "APPROVED", color: "green" };
  if (s === 2) return { text: "REJECTED", color: "red" };

  return { text: "PENDING", color: "orange" };
};

const StatusLabel = ({ status }) => {
  const label = getStatusLabel(status);

  return (
    <Typography fontWeight={600} fontSize={13} sx={{ color: label.color }}>
      {label.text}
    </Typography>
  );
};

/* ----------------------------------------------------------
   Main Component
---------------------------------------------------------- */
export default function CompOffApproval() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [remarks, setRemarks] = useState("");
  const [statusOptions, setStatusOptions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ----------------------------------------------------------
     Initial Load
  ---------------------------------------------------------- */
  useEffect(() => {
    fetchPending();
    fetchStatuses();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await getpendingcompoffs();
      setRows(res?.items || []);
    } catch (error) {
      console.error(error);
      setRows([]);
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

  /* ----------------------------------------------------------
     Dialog Controls
  ---------------------------------------------------------- */
  const handleRowClick = (row) => {
    setSelectedRow(row);
    setRemarks("");
    setSelectedStatus(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRow(null);
    setRemarks("");
    setSelectedStatus(null);
  };

  /* ----------------------------------------------------------
     Submit Approval
  ---------------------------------------------------------- */
  const handleSubmit = async () => {
    if (!selectedStatus) {
      showAlert("warning", "Please select approval status");
      return;
    }

    const statusText = selectedStatus.apr_status?.toUpperCase();

    if (statusText === "REJECTED" && !remarks.trim()) {
      showAlert("warning", "Remarks required for rejection");
      return;
    }

    const payload = {
      compOffId: selectedRow?.COMP_OFF_ID,
      status: selectedStatus.status_id,
      remarks,
    };

    try {
      setLoading(true);

      const res = await approvecompoff(payload);

      if (res?.statusCode === 200) {
        showAlert(
          "success",
          statusText === "APPROVED"
            ? "Comp-off approved successfully"
            : "Comp-off rejected successfully",
        );

        handleClose();
        fetchPending();
      } else {
        showPostError(res?.message);
      }
    } catch (error) {
      console.error(error);
      showPostError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------------------
     Render
  ---------------------------------------------------------- */
  return (
    <>
      <Box>
        <Typography variant="h4" fontWeight={700} color="#6964C1">
          Comp-Off Approvals
        </Typography>

        <Box
          sx={{
            height: 3,
            background: "#FF7A00",
            mt: 1,
            mb: 3,
          }}
        />

        {/* ===== TABLE ===== */}
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>Employee</b>
                </TableCell>
                <TableCell>
                  <b>Comp-Off Date</b>
                </TableCell>
                <TableCell>
                  <b>Start</b>
                </TableCell>
                <TableCell>
                  <b>End</b>
                </TableCell>
                <TableCell>
                  <b>Duration</b>
                </TableCell>
                <TableCell>
                  <b>Status</b>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No pending comp-off requests
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.COMP_OFF_ID} hover>
                    <TableCell>
                      <Typography
                        sx={{
                          color: "#6F60C1",
                          fontWeight: 600,
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                        onClick={() => handleRowClick(row)}
                      >
                        {row.EMP_NAME}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {dayjs(row.COMP_OFF_DATE).format("DD MMM YYYY")}
                    </TableCell>

                    <TableCell>{row.START_TIME}</TableCell>

                    <TableCell>{row.END_TIME}</TableCell>

                    <TableCell>{row.DURATION}</TableCell>

                    <TableCell>
                      <StatusLabel status={row.STATUS} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ===== DIALOG ===== */}
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth={false}
          fullWidth
          slotProps={{
            paper: {
              sx: {
                width: 450,
                maxWidth: "90%",
                borderRadius: 3,
              },
            },
          }}
        >
          {loading && <Loading />}

          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(135deg, #6F60C1, #8F84E8)",
              color: "#fff",
            }}
          >
            <Typography fontSize={16} fontWeight={600}>
              Comp-Off Approval
            </Typography>

            <IconButton onClick={handleClose}>
              <CloseIcon sx={{ color: "#fff" }} />
            </IconButton>
          </Box>

          {selectedRow && (
            <DialogContent>
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <Typography fontWeight={600}>
                    {selectedRow.EMP_NAME}
                  </Typography>
                </Grid>

                <Grid xs={12}>
                  <Autocomplete
                    options={statusOptions}
                    value={selectedStatus}
                    onChange={(_, value) => setSelectedStatus(value)}
                    getOptionLabel={(o) => o?.apr_status || ""}
                    isOptionEqualToValue={(o, v) => o.status_id === v.status_id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Approval Status *"
                        size="small"
                        fullWidth
                      />
                    )}
                  />
                </Grid>

                <Grid xs={12}>
                  <TextField
                    label="Remarks"
                    fullWidth
                    multiline
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </Grid>

                <Grid xs={12} textAlign="center">
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    sx={{
                      px: 6,
                      borderRadius: 20,
                      backgroundColor: "#FF7A00",
                      "&:hover": {
                        backgroundColor: "#e66a00",
                      },
                    }}
                  >
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
