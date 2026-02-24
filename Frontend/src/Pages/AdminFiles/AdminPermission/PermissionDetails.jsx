import { useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Typography,
  Grid,
  Paper,
  Button,
  Box,
  Autocomplete,
  TextField,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { getemployeedd } from "../../../Services/usermast.services";
import { getallpermission } from "../../../Services/permission.services";

// Extend dayjs with the isBetween plugin used in handleSearch date range filter
dayjs.extend(isBetween);

/**
 * Shared sx style function for DatePicker fields.
 * Adjusts input label, section, and border styles
 * for both light and dark MUI theme modes.
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
 * PermissionDetails
 * Displays a searchable, filterable table of all employee permission records.
 * Supports filtering by employee and date range.
 * Exported name matches the filename and the import in PermissionA.
 */
export default function PermissionDetails() {
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [rows, setRows] = useState([]);

  // allRows holds the full unfiltered dataset used to reset on clear
  const [allRows, setAllRows] = useState([]);

  /**
   * Fetches all permission records from the API
   * and stores them in both rows and allRows for filter/reset support.
   */
  const fetchAllPermissions = async () => {
    try {
      const res = await getallpermission();
      const items = res?.items || [];
      setAllRows(items);
      setRows(items);
    } catch (err) {
      console.error("Failed to load permissions", err);
    }
  };

  // Fetch employee dropdown and permission records on mount
  useEffect(() => {
    const init = async () => {
      const res = await getemployeedd();
      setEmployeeList(res?.items || []);
      await fetchAllPermissions();
    };

    init();
  }, []);

  /**
   * Filters the allRows dataset by selected employee and date range.
   * Both filters are optional and can be used independently or together.
   */
  const handleSearch = () => {
    let data = [...allRows];

    if (selectedEmployee) {
      data = data.filter((row) => row.EMP_ID === selectedEmployee.emp_id);
    }

    if (fromDate && toDate) {
      const from = dayjs(fromDate).startOf("day");
      const to = dayjs(toDate).endOf("day");

      data = data.filter((row) => {
        const rowDate = dayjs(row.PERM_DATE, "DD-MMM-YYYY", true);
        return rowDate.isValid() && rowDate.isBetween(from, to, null, "[]");
      });
    }

    setRows(data);
  };

  /**
   * Resets all filter inputs and restores the full unfiltered permission list.
   */
  const handleClear = () => {
    setSelectedEmployee(null);
    setFromDate(null);
    setToDate(null);
    setRows(allRows);
  };

  return (
    <>
      {/* Section title */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={700} color="#6F60C1">
          Permission Details
        </Typography>
      </Paper>

      <Paper sx={{ p: 1, mb: 2 }}>
        {/* Single LocalizationProvider wrapping all date pickers */}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2}>
            {/* From date filter */}
            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(val) => setFromDate(val)}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: (theme) => datePickerStyle(theme),
                  },
                }}
              />
            </Grid>

            {/* To date filter */}
            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(val) => setToDate(val)}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: (theme) => datePickerStyle(theme),
                  },
                }}
              />
            </Grid>

            {/* Employee filter dropdown */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Autocomplete
                options={employeeList}
                getOptionLabel={(option) => option.emp_name || ""}
                value={selectedEmployee}
                onChange={(e, val) => setSelectedEmployee(val)}
                renderInput={(params) => (
                  <TextField {...params} label="Employee" size="small" />
                )}
              />
            </Grid>

            {/* Search and Clear action buttons */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button onClick={handleSearch} variant="contained" size="small">
                  Search
                </Button>

                <Button
                  onClick={handleClear}
                  variant="contained"
                  size="small"
                  color="warning"
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </LocalizationProvider>

        {/* Permission records table */}
        <Box
          sx={{
            borderRadius: 3,
            mt: 3,
            overflow: "hidden",
            background: (theme) =>
              theme.palette.mode === "dark" ? "#14141f" : "#ffffff",
            boxShadow: "0 3px 15px rgba(0,0,0,0.10)",
          }}
        >
          <TableContainer sx={{ maxHeight: 308 }}>
            <Table size="small" stickyHeader>
              {/* Table column headers */}
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark" ? "#2c2c3d" : "#ececec",
                    "& th": { fontWeight: 700 },
                  }}
                >
                  <TableCell>Name</TableCell>
                  <TableCell>From Time</TableCell>
                  <TableCell>To Time</TableCell>
                  <TableCell>Permission Date</TableCell>
                  <TableCell>Permission Reason</TableCell>
                </TableRow>
              </TableHead>

              {/* Table rows — index used as key since records have no unique ID from API */}
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No permission records found
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {row.EMP_NAME}
                      </TableCell>
                      <TableCell>{row.FROM_TIME}</TableCell>
                      <TableCell>{row.TO_TIME}</TableCell>
                      <TableCell>{row.PERM_DATE}</TableCell>
                      <TableCell>{row.PERM_REASON}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </>
  );
}
