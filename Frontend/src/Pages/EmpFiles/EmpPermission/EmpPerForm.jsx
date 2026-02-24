import { useState, useEffect } from "react";
import { Grid, TextField, Paper, Button } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { decryptData } from "../../../utils/secureStorage";
import { postPermissionData } from "../../../Services/permission.services";
import { showPostSuccess, showPostError } from "../../../Components/swal_alert";
import CircularBubbleLoading from "../../../Components/loading";

dayjs.extend(duration);

// DatePicker field styles: label and border visibility in dark/light mode
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

// TimePicker field styles: taller section container to fit AM/PM clock display
const timePickerStyle = (theme) => ({
  "& .MuiPickersSectionList-root": {
    height: "26px",
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: "bold",
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
  },
  "& .MuiInputLabel-outlined": {
    height: "19px",
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

// Initial form field values — reused by both useState and clearAll
const INITIAL_FORM = { Date: null, PermissionReason: "" };

// Initial error state — reused by both useState and clearAll
const INITIAL_ERRORS = {
  Date: "",
  fromTime: "",
  toTime: "",
  permDuration: "",
  PermissionReason: "",
};

export default function EmpPerForm({ onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [empId, setEmpId] = useState(null);
  const [fromTime, setFromTime] = useState(null);
  const [toTime, setToTime] = useState(null);
  const [permDuration, setPermDuration] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState(INITIAL_ERRORS);

  // Decrypt session on mount to retrieve the employee ID for payload submission
  useEffect(() => {
    (async () => {
      const session = await decryptData("userSession");
      setEmpId(session?.user?.emp_id || null);
    })();
  }, []);

  /**
   * Calculates the duration in hours and minutes between two dayjs time values.
   * Returns null for missing input, -1 totalMinutes for negative diff,
   * and 121 totalMinutes when the range exceeds the 2-hour maximum.
   */
  const calculateDuration = (start, end) => {
    if (!start || !end) return null;

    const totalMinutes = Math.floor(end.diff(start) / 60000);

    if (totalMinutes < 0) {
      showPostError("End time cannot be earlier than start time!");
      return { hours: 0, minutes: 0, totalMinutes: -1 };
    }

    if (totalMinutes > 120) {
      showPostError("Permission cannot exceed 2 hours!");
      return { hours: 0, minutes: 0, totalMinutes: 121 };
    }

    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      totalMinutes,
    };
  };

  /**
   * Shared duration update logic used by both handleFromTime and handleToTime.
   * Resets toTime and permDuration when the calculated range is invalid.
   */
  const updateDuration = (start, end) => {
    const diff = calculateDuration(start, end);
    if (!diff || diff.totalMinutes < 0 || diff.totalMinutes > 120) {
      setToTime(null);
      setPermDuration("");
      return;
    }
    setPermDuration(`${diff.hours}h ${diff.minutes}m`);
    setErrors((prev) => ({ ...prev, permDuration: "" }));
  };

  const handleFromTime = (value) => {
    setFromTime(value);
    setErrors((prev) => ({ ...prev, fromTime: "" }));
    if (value && toTime) updateDuration(value, toTime);
  };

  const handleToTime = (value) => {
    setToTime(value);
    setErrors((prev) => ({ ...prev, toTime: "" }));
    if (fromTime && value) updateDuration(fromTime, value);
  };

  // Validates all fields and submits the permission request
  const handleSubmit = async () => {
    const newErrors = {};

    if (!form.Date) newErrors.Date = "Date is required";
    if (!fromTime) newErrors.fromTime = "From Time is required";
    if (!toTime) newErrors.toTime = "To Time is required";
    if (!permDuration)
      newErrors.permDuration = "Permission Duration is required";
    if (!form.PermissionReason.trim())
      newErrors.PermissionReason = "Permission Reason is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!empId) {
      showPostError("Unable to detect Employee ID. Please login again.");
      return;
    }

    const payload = {
      emp_id: empId,
      perm_date: dayjs(form.Date).format("YYYY-MM-DD"),
      from_time: dayjs(fromTime).format("hh:mm A"),
      to_time: dayjs(toTime).format("hh:mm A"),
      perm_reason: form.PermissionReason.trim(),
      perm_duration: permDuration,
      status: null,
      remarks: null,
      applied_time: dayjs().format("hh:mm A"),
    };

    try {
      setIsLoading(true);
      const res = await postPermissionData(payload);

      if (res?.statusCode === 201) {
        showPostSuccess("Permission submitted successfully!");
        onSuccess?.();
        clearAll();
      } else {
        showPostError(
          res?.errors || res?.message || "Failed to submit permission",
        );
      }
    } catch (error) {
      if (error?.response?.status === 400) {
        showPostError(
          "Someone has already applied for permission for this date.",
        );
        return;
      }
      showPostError(
        error?.response?.data?.errors ||
          error?.response?.data?.message ||
          "Unexpected error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Resets all form fields, time pickers, duration, and error messages
  const clearAll = () => {
    setForm(INITIAL_FORM);
    setFromTime(null);
    setToTime(null);
    setPermDuration("");
    setErrors(INITIAL_ERRORS);
  };

  return (
    <Grid container spacing={2} component={Paper} p={2}>
      {/* Permission date picker */}
      <Grid size={{ xs: 12, md: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date"
            value={form.Date}
            format="DD-MMM-YYYY"
            minDate={dayjs()}
            onChange={(val) => setForm({ ...form, Date: val })}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                error: !!errors.Date,
                helperText: errors.Date,
                sx: (theme) => datePickerStyle(theme),
              },
            }}
          />
        </LocalizationProvider>
      </Grid>

      {/* From time picker */}
      <Grid size={{ xs: 12, md: 3 }} mt={-1}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer
            components={["TimePicker"]}
            sx={{ overflow: "hidden" }}
          >
            <TimePicker
              label="From Time"
              value={fromTime}
              onChange={handleFromTime}
              ampm
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  error: !!errors.fromTime,
                  helperText: errors.fromTime,
                  sx: (theme) => timePickerStyle(theme),
                },
              }}
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
                seconds: renderTimeViewClock,
              }}
            />
          </DemoContainer>
        </LocalizationProvider>
      </Grid>

      {/* To time picker */}
      <Grid size={{ xs: 12, md: 3 }} mt={-1}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer
            components={["TimePicker"]}
            sx={{ overflow: "hidden" }}
          >
            <TimePicker
              label="To Time"
              value={toTime}
              onChange={handleToTime}
              ampm
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  error: !!errors.toTime,
                  helperText: errors.toTime,
                  sx: (theme) => datePickerStyle(theme),
                },
              }}
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
                seconds: renderTimeViewClock,
              }}
            />
          </DemoContainer>
        </LocalizationProvider>
      </Grid>

      {/* Read-only: auto-calculated permission duration */}
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField
          label="Permission Duration"
          value={permDuration}
          size="small"
          fullWidth
          slotProps={{ input: { readOnly: true } }}
          sx={{
            "& .MuiInputLabel-root": {
              color: (theme) =>
                theme.palette.mode === "dark" ? "#fff" : "#000",
            },
          }}
        />
      </Grid>

      {/* Permission reason textarea */}
      <Grid size={{ xs: 12 }}>
        <TextField
          label="Permission Reason"
          name="PermissionReason"
          value={form.PermissionReason}
          onChange={(e) => {
            setForm({ ...form, PermissionReason: e.target.value });
            setErrors({ ...errors, PermissionReason: "" });
          }}
          multiline
          rows={2}
          fullWidth
          size="small"
          error={!!errors.PermissionReason}
          helperText={errors.PermissionReason}
        />
      </Grid>

      {/* Form actions */}
      <Grid size={{ xs: 12 }}>
        <Button
          variant="contained"
          size="small"
          color="secondary"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? <CircularBubbleLoading size={20} /> : "Submit"}
        </Button>

        <Button
          variant="contained"
          size="small"
          color="error"
          sx={{ ml: 1 }}
          onClick={clearAll}
        >
          Clear
        </Button>
      </Grid>
    </Grid>
  );
}
