import { Grid, TextField, Paper, Button, Box } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useState, useEffect } from "react";
import { z } from "zod";
import { showPostError, showAlert } from "../../../Components/swal_alert";
import Loading from "../../../Components/loading";
import { postcompoff, updatecompoff } from "../../../Services/compoff.service";

// ---------------------------------------------------------------------------
// Zod validation schema for the comp off form fields
// ---------------------------------------------------------------------------
const compoffSchema = z.object({
  compOffDate: z.date({ required_error: "Date is required" }),
  fromTime: z.date({ required_error: "From time is required" }),
  toTime: z.date({ required_error: "To time is required" }),
});

// ---------------------------------------------------------------------------
// Default empty form state — used on mount and after a successful submit
// ---------------------------------------------------------------------------
const defaultFormData = {
  compOffDate: null,
  fromTime: null,
  toTime: null,
  fromTimeText: "",
  toTimeText: "",
  duration: "",
};

/**
 * Returns MUI sx styles for DatePicker inputs.
 * Adjusts label, border, and section colors based on the active theme mode.
 *
 * @param {import("@mui/material").Theme} theme - The active MUI theme.
 * @returns {object} MUI sx style object.
 */
const datePickerStyle = (theme) => ({
  "& .MuiPickersSectionList-root": {
    height: "16px",
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: "bold",
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
  },
  "& .MuiInputLabel-outlined": {
    height: "11px",
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    fontWeight: "bold",
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
  },
  "& .MuiPickersOutlinedInput-root": {
    "& fieldset": {
      borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
      borderWidth: "1px",
      borderRadius: "5px",
    },
  },
});

/**
 * Parses a HH:MM time string from the API into a Date object set to today's date.
 * Returns null if the input is empty or not a valid time string.
 *
 * @param {string|null} timeStr - Time string in "HH:MM" or "HH:MM:SS" format.
 * @returns {Date|null}
 */
const parseTimeToDate = (timeStr) => {
  if (!timeStr) return null;

  const today = new Date();
  const parsed = new Date(`1970-01-01 ${timeStr}`);

  if (isNaN(parsed.getTime())) return null;

  today.setHours(
    parsed.getHours(),
    parsed.getMinutes(),
    parsed.getSeconds(),
    0,
  );
  return today;
};

/**
 * Parses a user-typed 24-hour time string (HH:MM) into a Date object.
 * Returns null if the string does not match the expected format.
 *
 * @param {string|null} value - User input string (e.g. "09:30").
 * @returns {Date|null}
 */
const parse24HourTime = (value) => {
  if (!value) return null;

  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;

  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
};

/**
 * Formats a Date object into a YYYY-MM-DD string for the API payload.
 * Returns null if the input is null.
 *
 * @param {Date|null} date - The date to format.
 * @returns {string|null}
 */
const formatDate = (date) => {
  if (!date) return null;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Formats a Date object into a 12-hour HH:MM string for the API payload.
 * Returns null if the input is null.
 *
 * @param {Date|null} date - The Date object to format.
 * @returns {string|null}
 */
const formatPlainTime12 = (date) => {
  if (!date) return null;
  let hours = date.getHours() % 12;
  hours = hours === 0 ? 12 : hours;
  const hh = String(hours).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

/**
 * Converts a Date object to a display-friendly HH:MM string in 12-hour format.
 * Used when populating the text fields from an editUser row.
 *
 * @param {Date|null} d - The Date object to convert.
 * @returns {string} Formatted time string or empty string if null.
 */
const toTimeText = (d) =>
  d
    ? `${String(d.getHours() % 12 || 12).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    : "";

/**
 * Compoffform
 *
 * Form component for applying and editing compensatory off leave requests.
 * Handles:
 *  - Date selection restricted to the past 40 days up to today
 *  - Manual 24-hour time entry for From and To time fields
 *  - Auto-calculated duration based on the entered time range
 *  - Zod validation before submit
 *  - POST (create) and PUT (update) API calls via service functions
 *  - 409 conflict handling shown as a warning alert
 *  - Populating form fields when an editUser row is passed from the table
 *
 * @param {object|null} editUser - Row data from the table when editing; null for create mode.
 * @param {Function} clearEdit - Callback to clear the edit state in the parent.
 * @param {Function} onSuccess - Callback to trigger a table refresh after save/update.
 */
export default function Compoffform({ editUser, clearEdit, onSuccess }) {
  // Date boundaries — comp off applications allowed only within the past 40 days
  const today = new Date();
  const minDate = new Date();
  minDate.setDate(today.getDate() - 40);
  const maxDate = today;

  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Populate form fields when the parent passes an editUser row
  useEffect(() => {
    if (!editUser) return;

    const fromDate = parseTimeToDate(
      editUser.start_time ?? editUser.START_TIME,
    );
    const toDate = parseTimeToDate(editUser.end_time ?? editUser.END_TIME);

    setFormData({
      compOffDate: editUser.comp_off_date
        ? new Date(editUser.comp_off_date)
        : editUser.COMP_OFF_DATE
          ? new Date(editUser.COMP_OFF_DATE)
          : null,
      fromTime: fromDate,
      toTime: toDate,
      fromTimeText: toTimeText(fromDate),
      toTimeText: toTimeText(toDate),
      duration: editUser.duration ?? editUser.DURATION ?? "",
    });

    setErrors({});
  }, [editUser]);

  // -------------------------------------------------------------------------
  // Duration calculator
  // -------------------------------------------------------------------------

  /**
   * Calculates the duration between from and to time and updates formData.duration.
   * Handles overnight spans (negative diff) by adding 24 hours.
   * Clears the duration if the range is invalid or exceeds 18 hours.
   *
   * @param {Date|null} from - The start time Date object.
   * @param {Date|null} to - The end time Date object.
   */
  const calculateDuration = (from, to) => {
    if (!from || !to) {
      setFormData((p) => ({ ...p, duration: "" }));
      return;
    }

    let diff = to.getTime() - from.getTime();

    // Handle overnight time spans
    if (diff < 0) diff += 24 * 3600000;

    // Reject zero or excessively long durations (> 18 hours)
    if (diff <= 0 || diff > 18 * 3600000) {
      setFormData((p) => ({ ...p, duration: "" }));
      return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);

    setFormData((p) => ({
      ...p,
      duration: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`,
    }));
  };

  // -------------------------------------------------------------------------
  // Form event handlers
  // -------------------------------------------------------------------------

  /**
   * Resets the form to its default empty state and clears the edit context.
   */
  const handleClear = () => {
    setFormData(defaultFormData);
    setErrors({});
    clearEdit();
  };

  /**
   * Validates the form with Zod, then calls the appropriate API
   * (create or update) based on whether editUser has a COMP_OFF_ID.
   * Handles 409 conflict responses as warnings rather than errors.
   */
  const handleSubmit = async () => {
    const result = compoffSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const payload = {
      comp_off_date: formatDate(formData.compOffDate),
      start_time: formatPlainTime12(formData.fromTime),
      end_time: formatPlainTime12(formData.toTime),
      duration: formData.duration,
      expires_on: formData.expiresOn ? formatDate(formData.expiresOn) : null,
    };

    setLoading(true);

    try {
      let response;

      if (editUser?.COMP_OFF_ID) {
        // Update existing comp off record
        response = await updatecompoff(editUser.COMP_OFF_ID, payload);

        if (response?.Status === 1 || response?.statusCode === 200) {
          await showAlert("success", "Comp-off updated successfully");
          clearEdit();
        } else {
          showPostError(response?.message || "Update failed");
          return;
        }
      } else {
        // Create new comp off record
        response = await postcompoff(payload);

        if (response?.Status === 1 || response?.statusCode === 200) {
          await showAlert("success", "Comp-off saved successfully");
        } else {
          showPostError(response?.message || "Save failed");
          return;
        }
      }

      onSuccess?.();
      handleClear();
    } catch (err) {
      const message = err?.response?.data?.message;

      // 409 Conflict — duplicate or overlapping entry, shown as a warning
      if (err?.response?.status === 409) {
        showAlert("warning", message);
      } else {
        showAlert("error", message || "Something went wrong!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {loading && <Loading />}

      <Grid container spacing={2} component={Paper} p={2}>
        {/* Date picker — restricted to the past 40 days up to today */}
        <Grid size={{ xs: 12, md:2.4 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              format="dd-MM-yyyy"
              value={formData.compOffDate}
              minDate={minDate}
              maxDate={maxDate}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, compOffDate: val }))
              }
              slotProps={{
                textField: {
                  error: !!errors.compOffDate,
                  helperText: errors.compOffDate,
                  size: "small",
                  fullWidth: true,
                  sx: (theme) => datePickerStyle(theme),
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        {/* From time — manual 24-hour input, triggers duration recalculation */}
        <Grid size={{ xs: 12, md:2.4 }}>
          <TextField
            label="From Time (hh:mm)"
            placeholder="09:00"
            size="small"
            fullWidth
            value={formData.fromTimeText}
            error={!!errors.fromTime}
            helperText={errors.fromTime}
            onChange={(e) => {
              const value = e.target.value;
              const parsed = parse24HourTime(value);
              setFormData((prev) => ({
                ...prev,
                fromTimeText: value,
                fromTime: parsed,
              }));
              calculateDuration(parsed, formData.toTime);
            }}
          />
        </Grid>

        {/* To time — manual 24-hour input, triggers duration recalculation */}
        <Grid size={{ xs: 12, md:2.4 }}>
          <TextField
            label="To Time (hh:mm)"
            placeholder="18:00"
            size="small"
            fullWidth
            value={formData.toTimeText}
            error={!!errors.toTime}
            helperText={errors.toTime}
            onChange={(e) => {
              const value = e.target.value;
              const parsed = parse24HourTime(value);
              setFormData((prev) => ({
                ...prev,
                toTimeText: value,
                toTime: parsed,
              }));
              calculateDuration(formData.fromTime, parsed);
            }}
          />
        </Grid>

        {/* Duration — read-only, auto-calculated from From and To times */}
        <Grid size={{ xs: 12, md:2.4 }}>
          <TextField
            label="Duration"
            value={formData.duration}
            size="small"
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Grid>

        {/* Form action buttons — label switches between Save and Update */}
        <Grid size={{ xs: 12, md:2.4 }} display="flex" justifyContent="flex-start">
          <Button
            variant="contained"
            size="small"
            color="secondary"
            onClick={handleSubmit}
            sx={{ mr: 1 }}
          >
            {editUser ? "Update" : "Save"}
          </Button>

          <Button
            variant="contained"
            size="small"
            color="warning"
            onClick={handleClear}
          >
            Clear
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
