import {
  Autocomplete,
  Button,
  Grid,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import EditIcon from "@mui/icons-material/Edit";

import { useEffect, useState } from "react";
import dayjs from "dayjs";

import {
  getEmpStatus,
  getEmployee,
  getEmployeeDD,
} from "../../../Services/Employee.services";

import CircularBubbleLoading from "../../../Components/loading";

/* ----------------------------------------------------------
   DATE PICKER STYLE CONFIGURATION
---------------------------------------------------------- */

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

/* ----------------------------------------------------------
   EMPLOYEE TABLE COMPONENT
---------------------------------------------------------- */

/**
 * EmployeeTable Component
 *
 * Responsibilities:
 * - Display employee list
 * - Filter by date range
 * - Filter by employee name
 * - Filter by status
 * - Trigger edit mode
 */
export default function EmployeeTable({ onEditRow, refreshKey }) {
  /* ----------------------------------------------------------
     STATE MANAGEMENT
  ---------------------------------------------------------- */

  const [employeeRows, setEmployeeRows] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [employeeDropdown, setEmployeeDropdown] = useState([]);

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [fromDateError, setFromDateError] = useState("");
  const [toDateError, setToDateError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* ----------------------------------------------------------
     FETCH MASTER DATA
  ---------------------------------------------------------- */

  /**
   * Loads status list
   */
  const fetchStatusList = async () => {
    try {
      const response = await getEmpStatus();
      setStatusList(response?.items || []);
    } catch (error) {
      console.error("Failed to fetch status list", error);
      setStatusList([]);
    }
  };

  /**
   * Loads employee dropdown list
   */
  const fetchEmployeeDropdown = async () => {
    try {
      const response = await getEmployeeDD();
      setEmployeeDropdown(response?.items || []);
    } catch (error) {
      console.error("Failed to fetch employee dropdown", error);
      setEmployeeDropdown([]);
    }
  };

  /**
   * Fetch employee table data
   */
  const fetchEmployeeList = async () => {
    if (fromDateError || toDateError) return;

    try {
      setIsLoading(true);

      const response = await getEmployee({
        fromDate: fromDate ? dayjs(fromDate).format("DD-MM-YY") : undefined,
        toDate: toDate ? dayjs(toDate).format("DD-MM-YY") : undefined,
        name: selectedEmployee?.NAME || undefined,
        status: selectedStatus?.status_name || undefined,
      });

      setEmployeeRows(response?.items || []);
    } catch (error) {
      console.error("Failed to fetch employee list", error);
      setEmployeeRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ----------------------------------------------------------
     DATE VALIDATION
  ---------------------------------------------------------- */

  /**
   * Validates selected date range
   */
  const validateDateRange = (start, end) => {
    let error = "";

    if (start && end && dayjs(start).isAfter(dayjs(end))) {
      error = "End date must be later than start date";
    }

    setFromDateError("");
    setToDateError(error);
  };

  /* ----------------------------------------------------------
     INITIAL LOAD
  ---------------------------------------------------------- */

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        fetchStatusList(),
        fetchEmployeeDropdown(),
        fetchEmployeeList(),
      ]);
    };

    initialize();
  }, [refreshKey]);

  /* ----------------------------------------------------------
     UNIQUE EMPLOYEE GROUPING
  ---------------------------------------------------------- */

  const uniqueEmployees = Array.from(
    new Map(employeeRows.map((e) => [e.EMP_ID, e])).values(),
  );

  /* ----------------------------------------------------------
     CLEAR FILTERS
  ---------------------------------------------------------- */

  /**
   * Resets all search filters
   */
  const clearFilters = (e) => {
    e.preventDefault();
    setFromDate(null);
    setToDate(null);
    setSelectedEmployee(null);
    setSelectedStatus(null);
    setFromDateError("");
    setToDateError("");
  };

  /* ----------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */

  return (
    <>
      {isLoading && <CircularBubbleLoading text="Processing" />}

      {/* FILTER SECTION */}
      <Grid container spacing={2} component={Paper} p={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="From Date"
              value={fromDate}
              maxDate={dayjs()}
              format="DD-MMM-YYYY"
              onChange={(value) => {
                setFromDate(value);
                validateDateRange(value, toDate);
              }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  error: !!fromDateError,
                  helperText: fromDateError,
                  sx: (theme) => datePickerStyle(theme),
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="To Date"
              value={toDate}
              maxDate={dayjs()}
              format="DD-MMM-YYYY"
              onChange={(value) => {
                setToDate(value);
                validateDateRange(fromDate, value);
              }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  error: !!toDateError,
                  helperText: toDateError,
                  sx: (theme) => datePickerStyle(theme),
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            options={statusList}
            value={selectedStatus}
            onChange={(e, value) => setSelectedStatus(value)}
            getOptionLabel={(option) => option?.status_name || ""}
            isOptionEqualToValue={(o, v) => o?.status_id === v?.status_id}
            renderInput={(params) => (
              <TextField {...params} label="Status" size="small" />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Autocomplete
            options={employeeDropdown}
            value={selectedEmployee}
            onChange={(e, value) => setSelectedEmployee(value)}
            getOptionLabel={(option) => option?.NAME || ""}
            isOptionEqualToValue={(o, v) => o?.EMP_ID === v?.EMP_ID}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Employee Name"
                size="small"
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }} display="flex" gap={1}>
          <Button
            variant="contained"
            onClick={fetchEmployeeList}
            disabled={!!fromDateError || !!toDateError}
          >
            Search
          </Button>

          <Button variant="contained" color="error" onClick={clearFilters}>
            Clear
          </Button>
        </Grid>
      </Grid>

      {/* TABLE SECTION */}
      <Paper
        sx={{
          mt: 3,
          height: "430px",
          overflow: "auto",
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Employee Name</TableCell>
              <TableCell>DOJ</TableCell>
              <TableCell>Mobile Number</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {uniqueEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              uniqueEmployees.map((row) => (
                <TableRow key={row.EMP_ID}>
                  <TableCell>
                    <EditIcon
                      color="primary"
                      sx={{ cursor: "pointer" }}
                      onClick={() => {
                        const empRows = employeeRows.filter(
                          (r) => r.EMP_ID === row.EMP_ID,
                        );
                        onEditRow(empRows);
                      }}
                    />
                  </TableCell>

                  <TableCell sx={{ fontWeight: 600 }}>{row.NAME}</TableCell>

                  <TableCell>{dayjs(row.DOJ).format("DD-MMM-YYYY")}</TableCell>

                  <TableCell sx={{ fontWeight: 600 }}>{row.MOBILE}</TableCell>

                  <TableCell
                    sx={{
                      color: row.STATUS === "WORKING" ? "green" : "red",
                      fontWeight: 700,
                    }}
                  >
                    {row.STATUS}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
