import { useState, useEffect } from "react";
import { Grid, TextField, Paper, Button, Autocomplete } from "@mui/material";

import {
  getSingleLeaveDD,
  getSingleLeaveCalendarDD,
  postSingleLeaveTable,
  updateSingleLeaveTable,
} from "../../../../Services/SingleLeaveAllotment.services";

import {
  showPostError,
  showPostSuccess,
} from "../../../../Components/swal_alert";

import Loading from "../../../../Components/loading";

/**
 * SingleLeaveAllotmentForm
 *
 * Handles:
 * - Create leave allotment
 * - Update leave allotment
 * - Employee & Calendar dropdown loading
 */
export default function SingleLeaveAllotmentForm({
  setRefreshKey,
  editRowData,
  setEditRowData,
}) {
  const [employeeList, setEmployeeList] = useState([]);
  const [calendarYearList, setCalendarYearList] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedCalendarYear, setSelectedCalendarYear] = useState(null);

  const [cl, setCl] = useState("");
  const [el, setEl] = useState("");
  const [ml, setMl] = useState("");

  const [loading, setLoading] = useState(false);

  /* ----------------------------------------------------------
     FETCH DROPDOWNS
  ---------------------------------------------------------- */
  const fetchEmployees = async () => {
    try {
      const res = await getSingleLeaveDD();
      setEmployeeList(res?.items || []);
    } catch (error) {
      console.error("Employee dropdown error", error);
    }
  };

  const fetchCalendarYears = async () => {
    try {
      const res = await getSingleLeaveCalendarDD();
      setCalendarYearList(res?.items || []);
    } catch (error) {
      console.error("Calendar dropdown error", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchCalendarYears();
  }, []);

  /* ----------------------------------------------------------
     LOAD EDIT DATA
  ---------------------------------------------------------- */
  useEffect(() => {
    if (editRowData) {
      setSelectedEmployee({
        EMP_ID: editRowData.EMP_ID,
        NAME: editRowData.EMPLOYEE_NAME,
      });

      setSelectedCalendarYear({
        CAL_YEAR_ID: editRowData.CAL_YEAR_ID,
        YEAR: editRowData.YEAR,
      });

      setCl(editRowData.CASUAL_LEAVE || "");
      setEl(editRowData.EARNED_LEAVE || "");
      setMl(editRowData.MEDICAL_LEAVE || "");
    }
  }, [editRowData]);

  /* ----------------------------------------------------------
     VALIDATION
  ---------------------------------------------------------- */
  const validate = () => {
    if (!selectedEmployee) {
      showPostError("Please select Employee");
      return false;
    }

    if (!selectedCalendarYear) {
      showPostError("Please select Calendar Year");
      return false;
    }

    return true;
  };

  /* ----------------------------------------------------------
     RESET FORM
  ---------------------------------------------------------- */
  const resetForm = () => {
    setSelectedEmployee(null);
    setSelectedCalendarYear(null);
    setCl("");
    setEl("");
    setMl("");
    setEditRowData(null);
  };

  /* ----------------------------------------------------------
     SUBMIT HANDLER (CREATE / UPDATE)
  ---------------------------------------------------------- */
  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      EMP_ID: selectedEmployee.EMP_ID,
      CAL_YEAR_ID: selectedCalendarYear.CAL_YEAR_ID,
      CL: cl !== "" ? Number(cl) : null,
      EL: el !== "" ? Number(el) : null,
      ML: ml !== "" ? Number(ml) : null,
    };

    try {
      setLoading(true);

      let response;

      if (editRowData) {
        response = await updateSingleLeaveTable(payload);
      } else {
        response = await postSingleLeaveTable(payload);
      }

      if (response?.Status === 1) {
        showPostSuccess(
          editRowData
            ? "Leave updated successfully"
            : "Leave allotted successfully",
        );
        setRefreshKey((prev) => prev + 1);
        resetForm();
      } else {
        showPostError("Operation failed");
      }
    } catch (error) {
      console.error("Leave operation failed", error);
      showPostError(error?.response?.data?.message || "Something went wrong");
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
        <Grid size={{ xs: 12, sm: 12, md: 2 }}>
          <Autocomplete
            options={employeeList}
            getOptionLabel={(option) => option?.NAME || ""}
            value={selectedEmployee}
            onChange={(e, value) => setSelectedEmployee(value)}
            renderInput={(params) => (
              <TextField {...params} label="Select Employee" />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 2 }}>
          <Autocomplete
            options={calendarYearList}
            value={selectedCalendarYear}
            onChange={(e, value) => setSelectedCalendarYear(value)}
            getOptionLabel={(option) => option?.YEAR?.toString() || ""}
            isOptionEqualToValue={(option, value) =>
              option.CAL_YEAR_ID === value?.CAL_YEAR_ID
            }
            renderInput={(params) => (
              <TextField {...params} label="Select Year" />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <TextField
            fullWidth
            label="Casual Leave"
            type="number"
            value={cl}
            onChange={(e) => setCl(e.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <TextField
            fullWidth
            label="Earned Leave"
            type="number"
            value={el}
            onChange={(e) => setEl(e.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <TextField
            fullWidth
            label="Medical Leave"
            type="number"
            value={ml}
            onChange={(e) => setMl(e.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 2 }} textAlign="center" >
          <Button
            variant="contained"
            size="small"
            color="secondary"
            sx={{ mr: 1 }}
            onClick={handleSubmit}
          >
            {editRowData ? "Update" : "Submit"}
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
