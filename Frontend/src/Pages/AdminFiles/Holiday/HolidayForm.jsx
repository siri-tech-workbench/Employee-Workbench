import { useState, useEffect } from "react";
import { Grid, TextField, Paper, Button, Autocomplete } from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import {
  getholidayyeardropdown,
  postholiday,
  updateholiday,
  getholidaylist,
} from "../../../Services/holiday.service";

import { showPostError, showAlert } from "../../../Components/swal_alert";
import Loading from "../../../Components/loading";

/* DatePicker styling */
const datePickerStyle = (theme) => ({
  "& .MuiPickersSectionList-root": {
    height: 16,
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: "bold",
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
  },
  "& .MuiInputLabel-outlined": {
    height: 11,
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    fontWeight: "bold",
    color: theme.palette.mode === "dark" ? "#fff" : "#000",
  },
  "& .MuiPickersOutlinedInput-root": {
    "& fieldset": {
      borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
      borderWidth: 1,
      borderRadius: 5,
    },
  },
});

/**
 * HolidayForm Component
 *
 * Handles:
 * - Add holiday
 * - Update holiday
 * - Form validation
 */
export default function HolidayForm({ editRow, setEditRow, setRows }) {
  const [calendarYears, setCalendarYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    cal_year_id: null,
    holiday_date: null,
    title: "",
  });

  /* ----------------------------------------------------------
     FETCH YEAR DROPDOWN
  ---------------------------------------------------------- */
  useEffect(() => {
    const loadYears = async () => {
      try {
        const res = await getholidayyeardropdown();
        
        setCalendarYears(res?.items || []);
      } catch (err) {
        console.error("Failed to load calendar years", err);
        showPostError("Failed to load calendar years");
      }
    };

    loadYears();
  }, []);

  /* ----------------------------------------------------------
     LOAD EDIT DATA
  ---------------------------------------------------------- */
  useEffect(() => {
    if (editRow && calendarYears.length > 0) {
      setIsEdit(true);
      setEditId(editRow.holiday_id);

      setFormData({
        cal_year_id: Number(editRow.cal_year_id),
        holiday_date: new Date(editRow.holiday_date),
        title: editRow.title,
      });
    }
  }, [editRow, calendarYears]);

  /* ----------------------------------------------------------
     VALIDATION
  ---------------------------------------------------------- */
  const validate = () => {
    const newErrors = {};

    if (!formData.cal_year_id)
      newErrors.cal_year_id = "Calendar year is required";

    if (!formData.holiday_date) newErrors.holiday_date = "Date is required";

    if (!formData.title.trim()) newErrors.title = "Title is required";

    setErrors(newErrors);
    return newErrors;
  };

  /* ----------------------------------------------------------
     RESET FORM
  ---------------------------------------------------------- */
  const resetForm = () => {
    setFormData({
      cal_year_id: null,
      holiday_date: null,
      title: "",
    });

    setErrors({});
    setIsEdit(false);
    setEditId(null);
    setEditRow(null);
  };

  /* ----------------------------------------------------------
     SAVE / UPDATE
  ---------------------------------------------------------- */
  const handleSave = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.values(validationErrors).some(Boolean)) return;

    setLoading(true);

    const payload = {
      holiday_date: formData.holiday_date,
      cal_year_id: formData.cal_year_id,
      title: formData.title.trim(),
    };

    try {
      let response;

      if (isEdit) {
        response = await updateholiday(editId, payload);
      } else {
        response = await postholiday(payload);
      }

      const success = response?.statusCode === 200;

      if (!success) {
        showPostError(response?.message || "Operation failed");
        return;
      }

      await showAlert(
        "success",
        isEdit ? "Holiday updated successfully" : "Holiday added successfully",
      );

      const listRes = await getholidaylist();
      setRows(listRes?.items || []);

      resetForm();
    } catch (error) {
      console.error("Holiday save failed", error);
      await showAlert(
        "error",
        error.response?.data?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */
  return (
    <>
      {loading && <Loading />}

      <Grid container spacing={2} component={Paper} p={2}>
        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          <Autocomplete
            size="small"
            fullWidth
            options={calendarYears}
            getOptionLabel={(option) => option.year?.toString() || ""}
            isOptionEqualToValue={(option, value) =>
              option.cal_year_id === value.cal_year_id
            }
            value={
              calendarYears.find(
                (y) => y.cal_year_id === formData.cal_year_id,
              ) || null
            }
            onChange={(e, value) =>
              setFormData((prev) => ({
                ...prev,
                cal_year_id: value?.cal_year_id || null,
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Calendar Year *"
                size="small"
                error={!!errors.cal_year_id}
                helperText={errors.cal_year_id}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              format="dd-MM-yyyy"
              value={formData.holiday_date}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  holiday_date: value,
                }))
              }
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  error: !!errors.holiday_date,
                  helperText: errors.holiday_date,
                  sx: (theme) => datePickerStyle(theme),
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          <TextField
            label="Title *"
            size="small"
            fullWidth
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                title: e.target.value.toUpperCase(),
              }))
            }
            error={!!errors.title}
            helperText={errors.title}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 3 }}   textAlign="right">
          <Button
            variant="contained"
            size="small"
            color="secondary"
            sx={{ mr: 1 }}
            onClick={handleSave}
            disabled={loading}
          >
            {isEdit ? "Update" : "Add"}
          </Button>

          <Button
            variant="contained"
            size="small"
            color="warning"
            onClick={resetForm}
          >
            Clear
          </Button>
        </Grid>
      </Grid>
    </>
  );
}
