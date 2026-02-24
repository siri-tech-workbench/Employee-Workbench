/**
 * ApplyLeavePopup.jsx
 *
 * Dialog component that allows an employee to apply for leave.
 * Handles leave type selection, date range, half-day toggle,
 * file attachments (image/PDF), overlap detection, LOP warning,
 * and final form submission via multipart/form-data.
 */

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { styled } from "@mui/material/styles";

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
  TextField,
  Checkbox,
  Autocomplete,
} from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";

import {
  showConfirm,
  showPostError,
  showAlert,
} from "../../../Components/swal_alert";
import Loading from "../../../Components/loading";

import {
  getLeaveTypeDropdown,
  getRemainingLeave,
  calculateleavedays,
  applyleave,
  checkoverlap,
} from "../../../Services/leave.services";

// ---------------------------------------------------------------------------
// Styled component: visually hidden file input (accessible file upload trigger)
// ---------------------------------------------------------------------------
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

// ---------------------------------------------------------------------------
// MUI DatePicker theming: keeps borders and labels visible in dark/light mode
// ---------------------------------------------------------------------------
const datePickerStyle = (theme) => ({
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: theme.palette.mode === "dark" ? "#bbb" : "#000",
      borderWidth: "1px",
    },
    "& input": {
      color: theme.palette.text.primary,
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
    fontWeight: "bold",
    fontSize: "14px",
  },
  "& .MuiSvgIcon-root": {
    color: theme.palette.text.primary,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when two Date objects represent the same calendar day.
 * Used to enable/disable the Half Day checkbox.
 */
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1.toDateString() === date2.toDateString();
};

/**
 * Computes the allowed min/max date range for the date pickers.
 * Rule: allow the previous month, current month, and next two months.
 * Special cases handle January (no previous month in prior year)
 * and December (no next month overflow into next year).
 */
const getDateBounds = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  if (month === 0) {
    // January: start of year to end of February
    return {
      minDate: new Date(year, 0, 1),
      maxDate: new Date(year, 2, 0),
    };
  }

  if (month === 11) {
    // December: start of November to end of December
    return {
      minDate: new Date(year, 10, 1),
      maxDate: new Date(year, 11, 31),
    };
  }

  // All other months: previous month start to end of month+2
  return {
    minDate: new Date(year, month - 1, 1),
    maxDate: new Date(year, month + 2, 0),
  };
};

const { minDate, maxDate } = getDateBounds();

// ---------------------------------------------------------------------------
// Zod validation schema for the leave application form
// ---------------------------------------------------------------------------
export const leaveSchema = z.object({
  leave_id: z
    .number({ required_error: "Leave type is required" })
    .nullable()
    .refine((v) => v !== null, "Leave type is required"),

  from_date: z
    .date({ required_error: "From date is required" })
    .nullable()
    .refine((v) => v !== null, "From date is required"),

  to_date: z
    .date({ required_error: "To date is required" })
    .nullable()
    .refine((v) => v !== null, "To date is required"),

  leave_reason: z
    .string()
    .min(5, "Leave reason must be at least 5 characters")
    .max(200, "Leave reason cannot exceed 200 characters"),

  emer_contact_no: z
    .string()
    .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
});

// ---------------------------------------------------------------------------
// Default form state — extracted so handleClear can reuse it
// ---------------------------------------------------------------------------
const INITIAL_FORM_DATA = {
  leave_id: null,
  from_date: null,
  to_date: null,
  half_day: false,
  leave_reason: "",
  emer_contact_no: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ApplyLeavePopup
 *
 * @param {Function} onSuccess - Callback invoked after a successful leave submission.
 *                               Typically used by the parent to refresh the leave list.
 */
export default function ApplyLeavePopup({ onSuccess }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form field values
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Zod field-level error messages keyed by field name
  const [errors, setErrors] = useState({});

  // Leave type dropdown options fetched from the server
  const [leaveTypes, setLeaveTypes] = useState([]);

  // Calculated leave days returned from the server (supports 0.5 for half-day)
  const [noOfDays, setNoOfDays] = useState("");

  // Balance shown to the user: decreases as noOfDays increases
  const [remainingLeave, setRemainingLeave] = useState("");

  // Raw balance from the server before any deduction; used for LOP calculation
  const [dbRemainingLeave, setDbRemainingLeave] = useState(0);

  // Files selected for upload; each entry holds metadata + object URL for preview
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Currently previewed file in the preview dialog (null = dialog closed)
  const [previewFile, setPreviewFile] = useState(null);

  // Whether the selected date range overlaps an existing approved/pending leave
  const [hasOverlap, setHasOverlap] = useState(false);

  // True while the overlap API call is in flight (disables Submit during check)
  const [checkingOverlap, setCheckingOverlap] = useState(false);

  // Derived: controls disabled state of most fields until a leave type is chosen
  const isLeaveSelected = Boolean(formData.leave_id);

  // ---------------------------------------------------------------------------
  // Effect: fetch leave type dropdown options on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const loadLeaveTypes = async () => {
      try {
        const res = await getLeaveTypeDropdown();
        // Hide Comp-Off leave type when the employee has zero balance
        const filtered = (res?.items || []).filter((leave) => {
          const isCompOff = leave.leave_name?.toLowerCase().includes("comp");
          return isCompOff ? Number(leave.bal_leave || 0) > 0 : true;
        });
        setLeaveTypes(filtered);
      } catch {
        showPostError("Failed to load leave types");
      }
    };

    loadLeaveTypes();
  }, []);

  // ---------------------------------------------------------------------------
  // Effect: check for date overlap whenever from/to dates change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const checkDateOverlap = async () => {
      if (!formData.from_date || !formData.to_date) {
        setHasOverlap(false);
        return;
      }

      try {
        setCheckingOverlap(true);
        const res = await checkoverlap({
          from_date: format(formData.from_date, "yyyy-MM-dd"),
          to_date: format(formData.to_date, "yyyy-MM-dd"),
        });
        setHasOverlap(res?.items?.hasOverlap === true);
      } catch {
        setHasOverlap(false);
      } finally {
        setCheckingOverlap(false);
      }
    };

    checkDateOverlap();
  }, [formData.from_date, formData.to_date]);

  // ---------------------------------------------------------------------------
  // Effect: reset half-day flag when from_date and to_date are not the same day
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (
      formData.from_date &&
      formData.to_date &&
      !isSameDay(formData.from_date, formData.to_date)
    ) {
      setFormData((prev) => ({ ...prev, half_day: false }));
      if (noOfDays === 0.5) setNoOfDays("");
    }
  }, [formData.from_date, formData.to_date]);

  // ---------------------------------------------------------------------------
  // Effect: recalculate number of leave days when dates or leave type changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!formData.from_date || !formData.to_date || !formData.leave_id) return;

    const fetchCalculatedDays = async () => {
      try {
        const res = await calculateleavedays({
          from_date: format(formData.from_date, "yyyy-MM-dd"),
          to_date: format(formData.to_date, "yyyy-MM-dd"),
          leave_id: formData.leave_id,
        });
        setNoOfDays(res.items);
      } catch {
        setNoOfDays("");
      }
    };

    fetchCalculatedDays();
  }, [formData.from_date, formData.to_date, formData.leave_id]);

  // ---------------------------------------------------------------------------
  // Effect: recompute displayed remaining balance whenever days or balance changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (
      dbRemainingLeave === "" ||
      dbRemainingLeave === null ||
      noOfDays === "" ||
      noOfDays === null
    )
      return;

    const remaining = Number(dbRemainingLeave) - Number(noOfDays);
    setRemainingLeave(Number(Math.max(remaining, 0).toFixed(2)));
  }, [noOfDays, dbRemainingLeave]);

  // ---------------------------------------------------------------------------
  // Validation helpers
  // ---------------------------------------------------------------------------

  /**
   * Validates a single form field against the Zod schema and updates the
   * errors state without affecting other fields.
   */
  const validateField = (field, value) => {
    try {
      leaveSchema.pick({ [field]: true }).parse({ [field]: value });
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [field]: err.issues[0].message }));
      }
    }
  };

  /**
   * Validates the entire form at submission time.
   * Returns true when all fields are valid; populates errors state otherwise.
   */
  const validateWithZod = () => {
    try {
      leaveSchema.parse({
        leave_id: formData.leave_id,
        from_date: formData.from_date,
        to_date: formData.to_date,
        leave_reason: formData.leave_reason || "",
        emer_contact_no: formData.emer_contact_no || "",
      });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors = {};
        err.issues.forEach((issue) => {
          fieldErrors[issue.path[0]] = issue.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers: returns whether the currently selected leave is Medical Leave
  // ---------------------------------------------------------------------------
  const isMedicalLeave = () => {
    const selected = leaveTypes.find((l) => l.leave_id === formData.leave_id);
    return selected?.leave_name?.toLowerCase() === "medical leave";
  };

  // ---------------------------------------------------------------------------
  // Form reset: resets all controlled state to initial values
  // ---------------------------------------------------------------------------
  const handleClear = () => {
    setFormData(INITIAL_FORM_DATA);
    setNoOfDays("");
    setRemainingLeave("");
    setDbRemainingLeave(0);
    setErrors({});
  };

  // ---------------------------------------------------------------------------
  // Dialog close: resets form + clears file state
  // ---------------------------------------------------------------------------
  const handleClose = () => {
    setOpen(false);
    handleClear();
    setUploadedFiles([]);
    setPreviewFile(null);
  };

  // ---------------------------------------------------------------------------
  // File management
  // ---------------------------------------------------------------------------

  /**
   * Handles the file input change event.
   * Validates each file for type (image or PDF) and size (max 1 MB).
   * Rejected files are reported via an alert; accepted files are appended
   * to uploadedFiles with an object URL for in-browser preview.
   */
  const handleFileChange = (e) => {
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
    const files = Array.from(e.target.files);
    const validFiles = [];
    const rejectedFiles = [];

    files.forEach((file) => {
      const isPdf = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");

      if (!isPdf && !isImage) {
        rejectedFiles.push(`${file.name} (Invalid file type)`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejectedFiles.push(`${file.name} (Exceeds 1MB)`);
        return;
      }

      // Clone the file so the original input reference is safely released
      const clonedFile = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified,
      });

      validFiles.push({
        id: uuidv4(),
        name: file.name,
        file: clonedFile,
        type: file.type,
        preview: URL.createObjectURL(clonedFile),
      });
    });

    if (rejectedFiles.length) {
      showAlert("error", rejectedFiles.join("\n"));
    }

    setUploadedFiles((prev) => [...prev, ...validFiles]);
    // Reset the input so the same file can be re-uploaded if needed
    e.target.value = "";
  };

  /**
   * Removes a single file from the uploaded list and revokes its object URL
   * to avoid memory leaks.
   */
  const handleRemoveFile = (fileId) => {
    setUploadedFiles((prev) => {
      const target = prev.find((f) => f.id === fileId);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== fileId);
    });
    setPreviewFile(null);
  };

  // ---------------------------------------------------------------------------
  // Form submission
  // ---------------------------------------------------------------------------

  /**
   * Validates the form, checks medical certificate requirement, prompts for
   * LOP confirmation when balance is insufficient, then submits via FormData.
   */
  const handleApplyLeave = async (e) => {
    e.preventDefault();

    if (!validateWithZod()) return;

    // Medical leave requires a certificate when more than 2 days are requested
    if (
      isMedicalLeave() &&
      Number(noOfDays) > 2 &&
      uploadedFiles.length === 0
    ) {
      showAlert(
        "warning",
        "Medical certificate is required for medical leave more than 2 days",
      );
      return;
    }

    // Warn the employee when the requested days exceed available balance (LOP)
    const lopDays = Number(noOfDays) - Number(dbRemainingLeave);
    if (lopDays > 0) {
      const result = await showConfirm(
        `You do not have sufficient leave balance.\n\n${lopDays} day(s) will be treated as Loss of Pay.\n\nDo you want to continue?`,
      );
      if (!result?.isConfirmed) return;
    }

    setLoading(true);

    const formPayload = new FormData();
    formPayload.append("leave_id", formData.leave_id);
    formPayload.append(
      "req_leave_from",
      format(formData.from_date, "yyyy-MM-dd"),
    );
    formPayload.append("req_leave_to", format(formData.to_date, "yyyy-MM-dd"));
    formPayload.append("leave_reason", formData.leave_reason);
    formPayload.append("emer_contact_no", formData.emer_contact_no);
    formPayload.append("half_day", formData.half_day ? "Y" : "N");
    formPayload.append("no_of_days", noOfDays);
    uploadedFiles.forEach((f) => formPayload.append("files", f.file));

    try {
      const res = await applyleave(formPayload);

      if (res?.statusCode === 200) {
        setOpen(false);
        await showAlert("success", "Leave applied successfully");
        onSuccess?.();
        handleClose();
      } else {
        showPostError(res?.message || "Apply failed");
        handleClear();
      }
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      // 400/409 are expected business rule violations; show as warnings
      if (status === 400 || status === 409) {
        showAlert("warning", message);
        return;
      }

      showPostError(message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      {loading && <Loading />}

      {/* Trigger button */}
      <Button
        variant="contained"
        sx={{
          px: 4,
          py: 1.2,
          fontSize: "16px",
          fontWeight: 600,
          borderRadius: "8px",
          background: "#FF7A00",
        }}
        onClick={() => setOpen(true)}
      >
        APPLY LEAVE
      </Button>

      {/* ------------------------------------------------------------------ */}
      {/* Main apply-leave dialog                                              */}
      {/* ------------------------------------------------------------------ */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        PaperProps={{
          sx: {
            width: "500px",
            maxWidth: "90%",
            p: 2,
            borderRadius: "15px",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "#1e1e2f" : "#ffffff",
          },
        }}
      >
        {/* Dialog header */}
        <Grid
          container
          spacing={2}
          pb={1}
          borderBottom="2px solid #eee"
          alignItems="center"
        >
          <Grid size={{ xs: 10 }}>
            <Typography variant="h5" fontWeight={700}>
              Apply Leave
            </Typography>
          </Grid>
          <Grid size={{ xs: 2 }} textAlign="right">
            <IconButton onClick={handleClose}>
              <CloseIcon sx={{ color: "gray", fontSize: 28 }} />
            </IconButton>
          </Grid>
        </Grid>

        <DialogContent sx={{ p: 0 }}>
          <Grid container spacing={2}>
            {/* Leave type selector */}
            <Grid size={{ xs: 12, sm: 6 }} mt={2}>
              <Autocomplete
                options={leaveTypes}
                value={
                  leaveTypes.find((l) => l.leave_id === formData.leave_id) ||
                  null
                }
                getOptionLabel={(option) => option?.leave_name || ""}
                isOptionEqualToValue={(option, value) =>
                  option.leave_id === value.leave_id
                }
                onChange={async (e, value) => {
                  const leaveId = value?.leave_id || null;

                  if (!leaveId) {
                    // Clear everything when the selection is removed
                    handleClear();
                    setUploadedFiles([]);
                    setPreviewFile(null);
                    setDbRemainingLeave(0);
                    return;
                  }

                  setFormData((prev) => ({ ...prev, leave_id: leaveId }));
                  validateField("leave_id", leaveId);

                  // Fetch remaining balance for the selected leave type
                  try {
                    const res = await getRemainingLeave(leaveId);
                    setDbRemainingLeave(res.items);
                    setRemainingLeave(res.items);
                  } catch {
                    showPostError("Failed to fetch remaining leaves");
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Leave Type"
                    size="small"
                    error={!!errors.leave_id}
                    helperText={errors.leave_id}
                  />
                )}
              />
            </Grid>

            {/* File upload button — disabled until a leave type is selected */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button
                component="label"
                disabled={!isLeaveSelected}
                fullWidth
                variant="contained"
                sx={{ height: 35, mt: 1.5 }}
                startIcon={<CloudUploadIcon />}
              >
                Browse files
                <VisuallyHiddenInput
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
              </Button>
            </Grid>

            {/* Uploaded files table */}
            <Grid size={{ xs: 12 }}>
              <Paper
                variant="outlined"
                sx={{
                  overflow: "hidden",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "#2a2a3a" : "#fff",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: (theme) =>
                          theme.palette.mode === "dark" ? "#3a3a4f" : "#e8e8e8",
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: "inherit" }}>
                        Serial No
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "inherit" }}>
                        File Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "inherit" }}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uploadedFiles.map((file, index) => (
                      <TableRow key={file.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{file.name}</TableCell>
                        <TableCell>
                          <VisibilityIcon
                            sx={{ color: "blue", cursor: "pointer", mr: 1 }}
                            onClick={() => setPreviewFile(file)}
                          />
                          <DeleteIcon
                            sx={{ color: "red", cursor: "pointer" }}
                            onClick={() => handleRemoveFile(file.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            {/* From date picker */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  disabled={!isLeaveSelected}
                  label="Request From"
                  value={formData.from_date}
                  minDate={minDate}
                  maxDate={maxDate}
                  format="dd-MMM-yyyy"
                  onChange={(newValue) => {
                    // Reset to_date whenever from_date changes
                    setFormData((prev) => ({
                      ...prev,
                      from_date: newValue,
                      to_date: null,
                    }));
                    validateField("from_date", newValue);
                  }}
                  slotProps={{
                    textField: {
                      error: !!errors.from_date,
                      helperText: errors.from_date,
                      fullWidth: true,
                      size: "small",
                      sx: (theme) => datePickerStyle(theme),
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* To date picker — disabled until from_date is set */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  disabled={!formData.from_date}
                  label="Request To"
                  value={formData.to_date}
                  minDate={formData.from_date}
                  format="dd-MMM-yyyy"
                  onChange={(newValue) => {
                    setFormData((prev) => ({ ...prev, to_date: newValue }));
                    validateField("to_date", newValue);
                  }}
                  slotProps={{
                    textField: {
                      error: !!errors.to_date || hasOverlap,
                      helperText:
                        errors.to_date ||
                        (hasOverlap
                          ? "Leave already applied for selected date"
                          : ""),
                      fullWidth: true,
                      size: "small",
                      sx: (theme) => datePickerStyle(theme),
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Half-day toggle — only active when from and to are the same day */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Checkbox
                  checked={formData.half_day}
                  disabled={
                    !isLeaveSelected ||
                    !isSameDay(formData.from_date, formData.to_date)
                  }
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData((prev) => ({ ...prev, half_day: checked }));
                    // Override server-calculated days to 0.5 for half-day requests
                    setNoOfDays(checked ? 0.5 : noOfDays);
                  }}
                />
                <Typography>Half Day</Typography>
              </Box>
            </Grid>

            {/* Read-only: number of calculated leave days */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="No of Days"
                value={noOfDays}
                slotProps={{ input: { readOnly: true } }}
                sx={{
                  "& .MuiInputLabel-root": {
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
              />
            </Grid>

            {/* Read-only: remaining leave balance after deduction */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Remaining Leaves"
                value={remainingLeave}
                slotProps={{ input: { readOnly: true } }}
                sx={{
                  "& .MuiInputBase-input": {
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark" ? "#4e4e4e" : "#FFF9C4",
                  },
                }}
              />
            </Grid>

            {/* Leave reason textarea with character counter */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Leave Reason *"
                disabled={!isLeaveSelected}
                value={formData.leave_reason}
                error={!!errors.leave_reason}
                helperText={
                  errors.leave_reason ||
                  `${formData.leave_reason.length}/200 characters`
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length > 200) return; // Hard cap at 200 chars
                  setFormData((prev) => ({ ...prev, leave_reason: value }));
                  // Only validate once the minimum length threshold is reached
                  if (value.length >= 5) validateField("leave_reason", value);
                }}
                sx={{
                  "& .MuiInputLabel-root": {
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
              />
            </Grid>

            {/* Emergency contact number — digits only, 10-digit validation */}
            <Grid size={{ xs: 12 }}>
              <TextField
                disabled={!isLeaveSelected}
                fullWidth
                label="Emergency Contact Number *"
                value={formData.emer_contact_no}
                error={!!errors.emer_contact_no}
                helperText={errors.emer_contact_no}
                onChange={(e) => {
                  const value = e.target.value;
                  // Reject non-numeric characters before updating state
                  if (!/^\d*$/.test(value)) return;
                  setFormData((prev) => ({ ...prev, emer_contact_no: value }));
                  validateField("emer_contact_no", value);
                }}
                sx={{
                  "& .MuiInputLabel-root": {
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                }}
              />
            </Grid>

            {/* Submit button — disabled while overlap check is pending or overlap exists */}
            <Grid size={{ xs: 12 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleApplyLeave}
                disabled={hasOverlap || checkingOverlap}
              >
                SUBMIT
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* File preview dialog (image or PDF inline preview)                   */}
      {/* ------------------------------------------------------------------ */}
      <Dialog
        open={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          px={2}
          py={1}
          borderBottom="1px solid #eee"
        >
          <Typography fontWeight={600}>File Preview</Typography>
          <IconButton onClick={() => setPreviewFile(null)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent>
          {previewFile?.type?.startsWith("image") && (
            <img
              src={previewFile.preview}
              alt="preview"
              style={{ width: "100%", borderRadius: 8 }}
            />
          )}

          {previewFile?.type === "application/pdf" && (
            <iframe
              src={previewFile.preview}
              width="100%"
              height="500px"
              title="PDF Preview"
            />
          )}

          {previewFile &&
            !previewFile.type?.startsWith("image") &&
            previewFile.type !== "application/pdf" && (
              <Box textAlign="center">
                <Typography>No preview available</Typography>
                <Button
                  variant="contained"
                  href={previewFile.preview}
                  download={previewFile.name}
                  sx={{ mt: 2 }}
                >
                  Download File
                </Button>
              </Box>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
