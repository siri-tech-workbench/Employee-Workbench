import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  Grid,
  Typography,
  IconButton,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Autocomplete,
  TextField,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import {
  getcalender,
  postcalender,
  updatecalender,
} from "../../../Services/calender.service";

import { showPostError, showAlert } from "../../../Components/swal_alert";
import Loading from "../../../Components/loading";

/**
 * AddCalendar Component
 *
 * Handles:
 * - Add calendar year
 * - Update calendar year
 * - Display existing calendar entries
 */
export default function AddCalendar() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const statusOptions = ["ACTIVE", "INACTIVE"];

  const [formData, setFormData] = useState({
    year: null,
    status: "",
    posted: "",
  });

  /* ----------------------------------------------------------
     FETCH DATA
  ---------------------------------------------------------- */
  const fetchCalendar = async () => {
    try {
      const data = await getcalender();
      setRows(data?.items || []);
    } catch (error) {
      console.error("Failed to fetch calendar", error);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  /* ----------------------------------------------------------
     FORM HANDLERS
  ---------------------------------------------------------- */

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.year) newErrors.year = "Year required";
    if (!formData.status) newErrors.status = "Status required";
    if (!formData.posted) newErrors.posted = "Posted required";

    return newErrors;
  };

  const resetForm = () => {
    setFormData({
      year: null,
      status: "",
      posted: "",
    });
    setErrors({});
    setIsEdit(false);
    setEditId(null);
  };

  /* ----------------------------------------------------------
     STATUS CONVERTERS
  ---------------------------------------------------------- */

  const statusToYN = (value) => (value === "ACTIVE" ? "Y" : "N");
  const ynToStatus = (value) => (value === "Y" ? "ACTIVE" : "INACTIVE");

  /* ----------------------------------------------------------
     SAVE / UPDATE
  ---------------------------------------------------------- */

  const handleSave = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.values(validationErrors).some(Boolean)) return;

    setLoading(true);

    const payload = {
      year: formData.year.getFullYear(),
      status: statusToYN(formData.status),
      posted: statusToYN(formData.posted),
    };

    try {
      let response;

      if (isEdit) {
        response = await updatecalender(editId, payload);
      } else {
        response = await postcalender(payload);
      }

      const success = response?.Status === 1 || response?.statusCode === 200;

      if (!success) {
        showPostError("Operation failed");
        return;
      }

      await showAlert(
        "success",
        isEdit
          ? "Calendar updated successfully"
          : "Calendar saved successfully",
      );

      await fetchCalendar();
      resetForm();
    } catch (error) {
      console.error("Calendar save failed", error);
      await showAlert(
        "error",
        error.response?.data?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------------------
     EDIT HANDLER
  ---------------------------------------------------------- */

  const handleEdit = (row) => {
    setIsEdit(true);
    setEditId(row.cal_year_id);

    setFormData({
      year: new Date(row.year, 0, 1),
      status: ynToStatus(row.status),
      posted: ynToStatus(row.posted),
    });

    setOpen(true);
  };

  /* ----------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */

  return (
    <>
      <Button
        variant="contained"
        color="error"
        fullWidth
        sx={{ fontWeight: 600, px: 3, py: 1 }}
        onClick={() => setOpen(true)}
      >
        Add Calendar
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            width: 900,
            maxWidth: "90%",
            borderRadius: 3,
            p: 2,
          },
        }}
      >
        {/* HEADER */}
        <Grid container pb={2} borderBottom="1px solid #ddd">
          {loading && <Loading />}

          <Grid xs={11}>
            <Typography variant="h5" fontWeight={700}>
              {isEdit ? "Edit Calendar" : "Add Calendar"}
            </Typography>
          </Grid>

          <Grid xs={1} textAlign="right">
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon sx={{ color: "red" }} />
            </IconButton>
          </Grid>
        </Grid>

        <DialogContent>
          <Grid container spacing={4}>
            {/* FORM */}
            <Grid xs={12} md={5}>
              <Box display="flex" flexDirection="column" gap={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    views={["year"]}
                    label="Select Year"
                    value={formData.year}
                    onChange={(value) => handleFieldChange("year", value)}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        error: !!errors.year,
                        helperText: errors.year,
                      },
                    }}
                  />
                </LocalizationProvider>

                <Autocomplete
                  options={statusOptions}
                  value={formData.status}
                  onChange={(e, value) => handleFieldChange("status", value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Status"
                      error={!!errors.status}
                      helperText={errors.status}
                    />
                  )}
                />

                <Autocomplete
                  options={statusOptions}
                  value={formData.posted}
                  onChange={(e, value) => handleFieldChange("posted", value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Posted"
                      error={!!errors.posted}
                      helperText={errors.posted}
                    />
                  )}
                />

                <Button
                  variant="contained"
                  onClick={handleSave}
                  fullWidth
                  disabled={loading}
                >
                  {isEdit ? "Update Calendar" : "Add Calendar"}
                </Button>
              </Box>
            </Grid>

            {/* TABLE */}
            <Grid xs={12} md={7}>
              <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Action</TableCell>
                      <TableCell>Year</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Posted</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No data found
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow key={row.cal_year_id}>
                          <TableCell>
                            <EditIcon
                              sx={{
                                color: "#6F60C1",
                                cursor: "pointer",
                              }}
                              onClick={() => handleEdit(row)}
                            />
                          </TableCell>
                          <TableCell>{row.year}</TableCell>
                          <TableCell>{row.status}</TableCell>
                          <TableCell>{row.posted}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
}
