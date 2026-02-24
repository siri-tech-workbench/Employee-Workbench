import { useState, useEffect } from "react";
import { Grid, TextField, Paper, Button, Autocomplete } from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import { format } from "date-fns";

import { getemployeedd } from "../../../Services/usermast.services";
import { leavedetailsearch } from "../../../Services/adminleave.services";

/* ----------------------------------------------------------
   Date Picker Styling
---------------------------------------------------------- */
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
 * Employee Leave Detail Search Form
 */
export default function EmplevDetForm({ setLeaveData }) {
  const [empList, setEmpList] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [empError, setEmpError] = useState("");

  /* ----------------------------------------------------------
     Fetch Employee Dropdown
  ---------------------------------------------------------- */
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await getemployeedd();
        setEmpList(res?.items || []);
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };

    fetchEmployees();
  }, []);

  /* ----------------------------------------------------------
     Search Handler
  ---------------------------------------------------------- */
  const handleSearch = async () => {
    if (!selectedEmp?.emp_id) {
      setEmpError("Please select an employee");
      return;
    }

    setEmpError("");

    try {
      const response = await leavedetailsearch({
        emp_id: selectedEmp.emp_id,
        from_date: fromDate ? format(fromDate, "yyyy-MM-dd") : null,
        to_date: toDate ? format(toDate, "yyyy-MM-dd") : null,
      });

      setLeaveData(response?.items || []);
    } catch (error) {
      console.error("Leave search failed", error);
      setLeaveData([]);
    }
  };

  /* ----------------------------------------------------------
     Clear Handler
  ---------------------------------------------------------- */
  const handleClear = () => {
    setSelectedEmp(null);
    setFromDate(null);
    setToDate(null);
    setEmpError("");
    setLeaveData([]);
  };

  /* ----------------------------------------------------------
     Render
  ---------------------------------------------------------- */
  return (
    <>
      <Grid container spacing={2} component={Paper} p={2}>
        {/* Employee */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            options={empList}
            value={selectedEmp}
            onChange={(e, value) => {
              setSelectedEmp(value);
              setEmpError("");
            }}
            getOptionLabel={(option) => option?.emp_name || ""}
            isOptionEqualToValue={(o, v) => o.emp_id === v.emp_id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Employee Name"
                size="small"
                error={!!empError}
                helperText={empError}
              />
            )}
          />
        </Grid>

        {/* From Date */}
        <Grid size={{ xs: 12, md: 2.5 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="From Date"
              format="dd-MM-yyyy"
              value={fromDate}
              onChange={(value) => {
                setFromDate(value);
                if (!value) setToDate(null);
              }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  sx: (theme) => datePickerStyle(theme),
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        {/* To Date */}
        <Grid size={{ xs: 12, md: 2.5 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="To Date"
              format="dd-MM-yyyy"
              value={toDate}
              onChange={(value) => setToDate(value)}
              disabled={!fromDate}
              minDate={fromDate}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  sx: (theme) => datePickerStyle(theme),
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        {/* Actions */}
        <Grid size={{ xs: 12, md: 3 }} textAlign="right">
          <Button
            variant="contained"
            size="small"
            color="secondary"
            onClick={handleSearch}
            sx={{ mr: 1 }}
          >
            Search
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
    </>
  );
}
