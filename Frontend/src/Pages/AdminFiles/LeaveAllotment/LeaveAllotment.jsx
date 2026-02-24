import { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  Paper,
  Button,
  Box,
  Autocomplete,
  Typography,
  Divider,
} from "@mui/material";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useNavigate } from "react-router";

import {
  getcalendaryearDropdown,
  Employeesleaveallotment,
} from "../../../Services/leaveallotment.service";

import { showPostError, showAlert } from "../../../Components/swal_alert";
import Loading from "../../../Components/loading";

/**
 * LeaveAllotment Component
 *
 * Handles yearly leave configuration
 */
export default function LeaveAllotment() {
  const navigate = useNavigate();

  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    casual_leave: "",
    earned_leave: "",
    medical_leave: "",
  });

  const [errors, setErrors] = useState({});

  /* ----------------------------------------------------------
     FETCH CALENDAR YEARS
  ---------------------------------------------------------- */
  useEffect(() => {
    const loadCalendarYears = async () => {
      try {
        const res = await getcalendaryearDropdown();
        setYears(res?.items || []);
      } catch (error) {
        console.error("Failed to load years", error);
      }
    };

    loadCalendarYears();
  }, []);

  /* ----------------------------------------------------------
     VALIDATION
  ---------------------------------------------------------- */
  const validate = () => {
    const newErrors = {};

    if (!selectedYear) newErrors.year = "Year is required";
    if (!formData.casual_leave) newErrors.casual_leave = "Required";
    if (!formData.medical_leave) newErrors.medical_leave = "Required";

    setErrors(newErrors);
    return newErrors;
  };

  /* ----------------------------------------------------------
     NUMERIC INPUT HANDLER
  ---------------------------------------------------------- */
  const handleNumberChange = (field, value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  /* ----------------------------------------------------------
     CLEAR FORM
  ---------------------------------------------------------- */
  const handleClear = () => {
    setSelectedYear(null);
    setFormData({
      casual_leave: "",
      earned_leave: "",
      medical_leave: "",
    });
    setErrors({});
  };

  /* ----------------------------------------------------------
     SUBMIT HANDLER
  ---------------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.values(validationErrors).some(Boolean)) return;

    setLoading(true);

    try {
      const leaveTypes = [
        { leave_id: 1, value: formData.casual_leave },
        { leave_id: 3, value: formData.earned_leave },
        { leave_id: 2, value: formData.medical_leave },
      ];

      for (const leave of leaveTypes) {
        const payload = {
          cal_year_id: selectedYear.cal_year_id,
          leave_id: leave.leave_id,
          alloted: Number(leave.value || 0),
        };

        const response = await Employeesleaveallotment(payload);

        if (response?.Status === 0) {
          showAlert("warning", response.message || "Leave already allotted");
          return;
        }
      }

      showAlert("success", "Leave allotted successfully");
      handleClear();
    } catch (error) {
      console.error("Leave allotment failed", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";

      showPostError(message);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */
  return (
    <>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          mt: 5,
          px: 2,
        }}
      >
        {loading && <Loading />}

        <Paper
          elevation={6}
          sx={{
            width: 650,
            maxWidth: "100%",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "#6F60C1",
              color: "white",
              px: 3,
              py: 2,
            }}
          >
            <CalendarMonthIcon sx={{ mr: 1 }} />
            <Typography variant="h5" fontWeight={700}>
              Leave Allotment
            </Typography>
          </Box>

          {/* CONTENT */}
          <Box sx={{ p: 4 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ mb: 1, color: "#6F60C1" }}
            >
              Leave Configuration
            </Typography>

            <Divider sx={{ borderColor: "#6F60C1", my: 3 }} />

            <Grid container spacing={3}>
              {/* YEAR */}
              <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                <Autocomplete
                  fullWidth
                  options={years}
                  value={selectedYear}
                  isOptionEqualToValue={(o, v) =>
                    o?.cal_year_id === v?.cal_year_id
                  }
                  getOptionLabel={(o) => o?.year?.toString() || ""}
                  onChange={(e, value) => {
                    setSelectedYear(value);
                    setErrors((prev) => ({
                      ...prev,
                      year: "",
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Year *"
                      error={!!errors.year}
                      helperText={errors.year}
                    />
                  )}
                />
              </Grid>

              {/* CASUAL */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Casual Leave"
                  value={formData.casual_leave}
                  onChange={(e) =>
                    handleNumberChange("casual_leave", e.target.value)
                  }
                  error={!!errors.casual_leave}
                  helperText={errors.casual_leave}
                  inputMode="decimal"
                />
              </Grid>

              {/* EARNED */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Earned Leave (Auto Carry Forward)"
                  value="Auto"
                  disabled
                  helperText="EL is auto carried forward"
                />
              </Grid>

              {/* MEDICAL */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Medical Leave"
                  value={formData.medical_leave}
                  onChange={(e) =>
                    handleNumberChange("medical_leave", e.target.value)
                  }
                  error={!!errors.medical_leave}
                  helperText={errors.medical_leave}
                  inputMode="decimal"
                />
              </Grid>

              {/* ACTIONS */}
              <Grid size={{ xs: 12 }} textAlign="left">
                <Box display="flex" justifyContent="flex-start" gap={1}>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={() =>
                      navigate("/Drawer/SingleLeaveAllotmentMaster")
                    }
                  >
                    Single Leave Allotment
                  </Button>

                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={handleSubmit}
                  >
                    Yearly Leave Post
                  </Button>

                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleClear}
                  >
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </>
  );
}
