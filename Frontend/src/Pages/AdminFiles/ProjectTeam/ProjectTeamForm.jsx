import {
  Grid,
  TextField,
  Paper,
  Button,
  Box,
  Autocomplete,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useState, useEffect } from "react";
import { z } from "zod";
import { getemployeedd } from "../../../Services/usermast.services";
import {
  getprojectdd,
  getroledd,
  getstatusdd,
  postprojectteam,
  updateprojectteam,
} from "../../../Services/projectteam.services";
import { showPostError, showAlert } from "../../../Components/swal_alert";
import Loading from "../../../Components/loading";

// ---------------------------------------------------------------------------
// Zod validation schema for the project team form fields
// ---------------------------------------------------------------------------
const projectSchema = z.object({
  project: z
    .number({ invalid_type_error: "Project is required" })
    .nullable()
    .refine((v) => v !== null, { message: "Project is required" }),

  employee: z
    .number({ invalid_type_error: "Employee is required" })
    .nullable()
    .refine((v) => v !== null, { message: "Employee is required" }),

  role: z
    .number({ invalid_type_error: "Role is required" })
    .nullable()
    .refine((v) => v !== null, { message: "Role is required" }),

  status: z
    .number({ invalid_type_error: "Status is required" })
    .nullable()
    .refine((v) => v !== null, { message: "Status is required" }),

  startDate: z
    .date({ required_error: "Start Date is required" })
    .nullable()
    .refine((v) => v !== null, { message: "Start Date is required" }),

  endDate: z.date().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Default empty form state — used on mount and after a successful submit
// ---------------------------------------------------------------------------
const defaultFormData = {
  project: null,
  employee: null,
  role: null,
  startDate: null,
  endDate: null,
  status: null,
};

/**
 * Validates a single form field against the projectSchema.
 * Returns the first error message for that field, or an empty string if valid.
 *
 * @param {import("zod").ZodObject} schema - The full Zod schema object.
 * @param {string} field - The field name to validate.
 * @param {*} value - The current value of the field.
 * @returns {string} Validation error message or empty string.
 */
const validateField = (schema, field, value) => {
  if (!schema.shape[field]) return "";
  const result = schema.pick({ [field]: true }).safeParse({ [field]: value });
  return result.success ? "" : result.error.issues[0].message;
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
 * Safely reads a field value from an editUser object,
 * supporting both snake_case (API) and UPPER_CASE (legacy) key formats.
 *
 * @param {object} user - The row object passed from the table on edit.
 * @param {string} snakeKey - snake_case field name (e.g. "project_id").
 * @param {string} upperKey - UPPER_CASE field name (e.g. "PROJECT_ID").
 * @returns {number|null} The resolved field value or null.
 */
const resolveField = (user, snakeKey, upperKey) =>
  user[snakeKey] ?? user[upperKey] ?? null;

/**
 * Safely resolves a date field from an editUser object into a Date instance.
 * Supports both snake_case and UPPER_CASE key formats.
 *
 * @param {object} user - The row object passed from the table on edit.
 * @param {string} snakeKey - snake_case date field name (e.g. "start_date").
 * @param {string} upperKey - UPPER_CASE date field name (e.g. "START_DATE").
 * @returns {Date|null}
 */
const resolveDate = (user, snakeKey, upperKey) => {
  const raw = user[snakeKey] ?? user[upperKey];
  return raw ? new Date(raw) : null;
};

/**
 * ProjectTeamForm
 *
 * Form component for creating and editing project team assignments.
 * Handles:
 *  - Fetching dropdown options (projects, employees, roles, statuses) on mount
 *  - Zod-based field validation before submit
 *  - POST (create) and PUT (update) API calls via service functions
 *  - Populating form fields when an editUser row is passed from the table
 *
 * @param {object|null} editUser - Row data from the table when editing; null for create mode.
 * @param {Function} clearEdit - Callback to clear the edit state in the parent.
 * @param {Function} onSuccess - Callback to trigger a table refresh after save/update.
 */
export default function ProjectTeamForm({ editUser, clearEdit, onSuccess }) {
  const [employeeList, setEmployeeList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [errors, setError] = useState({});
  const [loading, setLoading] = useState(false);
  const [formData, setForm] = useState(defaultFormData);

  // Fetch all dropdown data when the component mounts
  useEffect(() => {
    fetchEmployees();
    fetchProjects();
    fetchRoles();
    fetchStatus();
  }, []);

  // Populate form fields when the parent passes an editUser row
  useEffect(() => {
    if (!editUser) return;

    setForm({
      project: resolveField(editUser, "project_id", "PROJECT_ID"),
      employee: resolveField(editUser, "emp_id", "EMP_ID"),
      role: resolveField(editUser, "role_id", "ROLE_ID"),
      status: resolveField(editUser, "status_id", "STATUS_ID"),
      startDate: resolveDate(editUser, "start_date", "START_DATE"),
      endDate: resolveDate(editUser, "end_date", "END_DATE"),
    });

    setError({});
  }, [editUser]);

  // -------------------------------------------------------------------------
  // Dropdown fetch functions
  // -------------------------------------------------------------------------

  const fetchEmployees = async () => {
    try {
      const res = await getemployeedd();
      setEmployeeList(res.items || []);
    } catch (error) {
      console.error("Failed to fetch employees", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await getprojectdd();
      setProjectList(res.items || []);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await getroledd();
      setRoleList(res.items || []);
    } catch (error) {
      console.error("Failed to fetch roles", error);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await getstatusdd();
      setStatusList(res.items || []);
    } catch (error) {
      console.error("Failed to fetch statuses", error);
    }
  };

  // -------------------------------------------------------------------------
  // Form event handlers
  // -------------------------------------------------------------------------

  /**
   * Updates a single form field and clears its validation error.
   *
   * @param {string} field - The form field name to update.
   * @param {*} value - The new value for the field.
   */
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError((prev) => ({ ...prev, [field]: "" }));
  };

  /**
   * Resets the form to its default empty state and clears the edit context.
   */
  const handleClear = () => {
    setForm(defaultFormData);
    setError({});
    clearEdit();
  };

  /**
   * Validates the form with Zod, then calls the appropriate API
   * (create or update) based on whether editUser has a TEAM_ID.
   * Shows a success or error alert based on the API response.
   */
  const handleSubmit = async () => {
    // Run full schema validation before making any API call
    const result = projectSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setError(fieldErrors);
      return;
    }

    const payload = {
      project_id: formData.project,
      emp_id: formData.employee,
      role_id: formData.role,
      status_id: formData.status,
      start_date: formData.startDate,
      end_date: formData.endDate || null,
    };

    setLoading(true);

    try {
      let response;

      if (editUser?.TEAM_ID) {
        // Update existing project team assignment
        response = await updateprojectteam(editUser.TEAM_ID, payload);

        if (response?.Status === 1 || response?.statusCode === 200) {
          await showAlert("success", "Project team updated successfully");
          clearEdit();
        } else {
          showPostError(response?.message || "Update failed");
          return;
        }
      } else {
        // Create new project team assignment
        response = await postprojectteam(payload);

        if (response?.Status === 1 || response?.statusCode === 200) {
          await showAlert("success", "Project team saved successfully");
        } else {
          showPostError(response?.message || "Save failed");
          return;
        }
      }

      onSuccess?.();
      handleClear();
    } catch (err) {
      console.error("Project team save/update failed", err);
      await showAlert(
        "error",
        err.response?.data?.message || "Something went wrong!",
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Shared DatePicker slot props — avoids repeating the same object twice
  // -------------------------------------------------------------------------

  /**
   * Builds the slotProps.textField config for a DatePicker field.
   *
   * @param {string} errorKey - The formData key to read the error message from.
   * @returns {object} slotProps object for the DatePicker component.
   */
  const dateSlotProps = (errorKey) => ({
    textField: {
      size: "small",
      fullWidth: true,
      error: !!errors[errorKey],
      helperText: errors[errorKey],
      sx: (theme) => datePickerStyle(theme),
    },
  });

  return (
    <Box>
      {loading && <Loading />}

      <Grid container spacing={2} component={Paper} p={2}>
        {/* Project dropdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            options={projectList}
            getOptionLabel={(option) => option.project_name || ""}
            isOptionEqualToValue={(opt, val) =>
              opt.project_id === val.project_id
            }
            value={
              projectList.find((e) => e.project_id === formData.project) || null
            }
            onChange={(e, value) =>
              handleChange("project", value ? value.project_id : null)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Project Name"
                error={!!errors.project}
                helperText={errors.project}
              />
            )}
          />
        </Grid>

        {/* Employee dropdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            options={employeeList}
            getOptionLabel={(option) => option.emp_name || ""}
            isOptionEqualToValue={(opt, val) => opt.emp_id === val.emp_id}
            value={
              employeeList.find((e) => e.emp_id === formData.employee) || null
            }
            onChange={(e, value) =>
              handleChange("employee", value ? value.emp_id : null)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Employee"
                error={!!errors.employee}
                helperText={errors.employee}
              />
            )}
          />
        </Grid>

        {/* Role dropdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            options={roleList}
            getOptionLabel={(option) => option.role_name || ""}
            isOptionEqualToValue={(opt, val) => opt.role_id === val.role_id}
            value={roleList.find((e) => e.role_id === formData.role) || null}
            onChange={(e, value) =>
              handleChange("role", value ? value.role_id : null)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Role"
                error={!!errors.role}
                helperText={errors.role}
              />
            )}
          />
        </Grid>

        {/* Start Date picker — required field */}
        <Grid size={{ xs: 12, md: 2.7 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              format="dd-MM-yyyy"
              value={formData.startDate}
              onChange={(value) => handleChange("startDate", value)}
              slotProps={dateSlotProps("startDate")}
            />
          </LocalizationProvider>
        </Grid>

        {/* End Date picker — optional, disabled until Start Date is set */}
        <Grid size={{ xs: 12, md: 2.7 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="End Date"
              format="dd-MM-yyyy"
              value={formData.endDate}
              onChange={(value) => handleChange("endDate", value)}
              disabled={!formData.startDate}
              minDate={formData.startDate}
              slotProps={dateSlotProps("endDate")}
            />
          </LocalizationProvider>
        </Grid>

        {/* Status dropdown */}
        <Grid size={{ xs: 12, md: 2.6 }}>
          <Autocomplete
            options={statusList}
            getOptionLabel={(option) => option.status_name || ""}
            isOptionEqualToValue={(opt, val) => opt.status_id === val.status_id}
            value={
              statusList.find((e) => e.status_id === formData.status) || null
            }
            onChange={(e, value) =>
              handleChange("status", value ? value.status_id : null)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Status"
                error={!!errors.status}
                helperText={errors.status}
              />
            )}
          />
        </Grid>

        {/* Form action buttons — label switches between Save and Update */}
        <Grid size={{ xs: 12, md: 4 }} textAlign="right">
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
