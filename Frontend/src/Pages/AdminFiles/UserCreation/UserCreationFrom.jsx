import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Grid,
  TextField,
  Paper,
  Button,
  Autocomplete,
  Typography,
  InputAdornment,
  IconButton,
  Box,
} from "@mui/material";
import { useState, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
import { z } from "zod";
import {
  getemployeedd,
  getroledd,
  insertrole,
  updateusers,
  createusers,
} from "../../../Services/usermast.services";
import { showPostError, showAlert } from "../../../Components/swal_alert";
import Loading from "../../../Components/loading";

// ---------------------------------------------------------------------------
// Password strength regex — requires uppercase, lowercase, digit, special char
// ---------------------------------------------------------------------------
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

// ---------------------------------------------------------------------------
// Shared base schema fields — used by both create and update schemas
// ---------------------------------------------------------------------------
const baseSchema = {
  employee: z
    .number({ required_error: "Employee is required" })
    .nullable()
    .refine((v) => v !== null, "Employee is required"),

  userId: z
    .string({ required_error: "User ID is required" })
    .min(3, "User ID must be at least 3 characters"),

  role: z
    .number({ required_error: "Role is required" })
    .nullable()
    .refine((v) => v !== null, "Role is required"),
};

/**
 * Schema for creating a new user.
 * Password and confirmPassword are required and must match.
 */
export const createUserSchema = z
  .object({
    ...baseSchema,
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters")
      .regex(
        passwordRegex,
        "Password must contain uppercase, lowercase, number and special character",
      ),
    confirmPassword: z
      .string({ required_error: "Confirm Password is required" })
      .min(6, "Confirm Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Schema for updating an existing user.
 * Password is optional; if provided it must meet strength requirements and match confirmPassword.
 */
export const updateUserSchema = z
  .object({
    ...baseSchema,
    password: z
      .string()
      .optional()
      .refine(
        (val) => !val || passwordRegex.test(val),
        "Password must be at least 6 characters and include uppercase, lowercase, and special character",
      ),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ---------------------------------------------------------------------------
// Default empty form state — used on mount and after a successful submit
// ---------------------------------------------------------------------------
const defaultFormData = {
  employee: null,
  userId: "",
  password: "",
  confirmPassword: "",
  role: null,
  addRole: "",
};

/**
 * Validates a single form field against the active schema.
 * Also cross-validates confirmPassword against the current password value.
 *
 * @param {import("zod").ZodObject} schema - The active Zod schema (create or update).
 * @param {string} field - The field name to validate.
 * @param {*} value - The current value of that field.
 * @param {object} fullData - The complete current form state for cross-field checks.
 * @returns {string} Validation error message or empty string.
 */
const validateField = (schema, field, value, fullData) => {
  if (!schema.shape[field]) return "";

  const result = schema.pick({ [field]: true }).safeParse({ [field]: value });

  if (!result.success) {
    return result.error.issues[0].message;
  }

  // Cross-field check: confirm password must match a valid password
  if (
    field === "confirmPassword" &&
    fullData.password &&
    passwordRegex.test(fullData.password) &&
    fullData.password !== value
  ) {
    return "Passwords do not match";
  }

  return "";
};

/**
 * UserCreationFrom
 *
 * Form component for creating and editing user master records.
 * Handles:
 *  - Employee and role dropdown population on mount
 *  - Zod schema switching between create and update modes
 *  - Inline per-field validation on change
 *  - Inline role creation via the Add Role toggle panel
 *  - POST (create) and PUT (update) API calls via service functions
 *  - Populating form fields when an editUser row is passed from the table
 *
 * @param {object|null} editUser - Row data from the table when editing; null for create mode.
 * @param {Function} clearEdit - Callback to clear the edit state in the parent.
 * @param {Function} onSuccess - Callback to trigger a table refresh after save/update.
 */
export default function UserCreationFrom({ editUser, clearEdit, onSuccess }) {
  // Switch validation schema based on whether we are in edit or create mode
  const activeSchema = editUser ? updateUserSchema : createUserSchema;

  const [showPassword, setShowPassword] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employeeList, setEmployeeList] = useState([]);
  const [roleList, setRolesList] = useState([]);
  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState({});

  // Fetch dropdown data on mount
  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

  // Populate form fields when the parent passes an editUser row
  useEffect(() => {
    if (!editUser) return;

    setFormData({
      employee: Number(editUser.emp_id),
      userId: editUser.login_id,
      password: "",
      confirmPassword: "",
      role: Number(editUser.user_type_id),
      addRole: "",
    });

    setErrors({});
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

  const fetchRoles = async () => {
    try {
      const res = await getroledd();
      setRolesList(res.items || []);
    } catch (error) {
      console.error("Failed to fetch roles", error);
    }
  };

  // -------------------------------------------------------------------------
  // Form event handlers
  // -------------------------------------------------------------------------

  /** Toggles password field visibility between plain text and masked. */
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  /**
   * Updates a single form field value and runs inline validation for that field.
   *
   * @param {string} field - The form field name to update.
   * @param {*} value - The new value for the field.
   */
  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      const errorMessage = validateField(activeSchema, field, value, updated);
      setErrors((prevErrors) => ({ ...prevErrors, [field]: errorMessage }));
      return updated;
    });
  };

  /**
   * Resets the form to its default empty state and closes the add role panel.
   */
  const handleClear = () => {
    setFormData(defaultFormData);
    setErrors({});
    clearEdit();
    setShowAddRole(false);
    setShowPassword(false);
  };

  /**
   * Validates the full form with Zod, then calls create or update API
   * based on whether editUser is present.
   * Password is only included in the payload if it has been filled in.
   */
  const handleSubmit = async () => {
    const schema = editUser ? updateUserSchema : createUserSchema;
    const result = schema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const payload = {
      emp_id: formData.employee,
      login_id: formData.userId,
      user_type_id: formData.role,
    };

    // Only include password in payload if the user filled it in
    if (formData.password) {
      payload.password = formData.password;
    }

    setLoading(true);

    try {
      if (editUser) {
        // Update existing user record
        await updateusers(editUser.user_id, payload);
        showAlert("success", "User updated successfully");
      } else {
        // Create new user record
        await createusers(payload);
        showAlert("success", "User created successfully");
      }

      handleClear();
      onSuccess();
    } catch (err) {
      console.error("Operation failed", err);
      showPostError(err?.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validates the addRole field, calls the insert API, refreshes the role list,
   * and auto-selects the newly created role in the dropdown.
   */
  const handleAddRole = async () => {
    const roleName = formData.addRole.trim();

    if (!roleName) {
      setErrors((prev) => ({ ...prev, addRole: "Role name is required" }));
      return;
    }

    if (roleName.length < 3) {
      setErrors((prev) => ({
        ...prev,
        addRole: "Role name must be at least 3 characters",
      }));
      return;
    }

    try {
      await insertrole({ user_types: roleName });

      // Refresh role list and auto-select the newly added role
      const rolesRes = await getroledd();
      const updatedRoles = rolesRes.items || [];
      setRolesList(updatedRoles);

      const newRole = updatedRoles.find((r) => r.user_types === roleName);
      if (newRole) {
        handleChange("role", newRole.user_type_id);
      }

      setShowAddRole(false);
      setFormData((prev) => ({ ...prev, addRole: "" }));
      setErrors((prev) => ({ ...prev, addRole: "" }));
    } catch (error) {
      if (error?.response?.status === 409) {
        setErrors((prev) => ({ ...prev, addRole: "Role already exists" }));
      }
    }
  };

  return (
    <Box>
      {loading && <Loading />}

      <Grid container spacing={2} component={Paper} p={2}>
        {/* Form section title — switches label between create and edit context */}
        <Grid size={12}>
          <Typography variant="h6" fontWeight={700} color="#6F60C1">
            {editUser ? "Update User" : "Create Users"}
          </Typography>
        </Grid>

        {/* Employee dropdown */}
        <Grid size={12}>
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
                label="Select Employee"
                error={!!errors.employee}
                helperText={errors.employee}
              />
            )}
          />
        </Grid>

        {/* User ID input */}
        <Grid size={12}>
          <TextField
            label="User ID"
            fullWidth
            autoComplete="new-username"
            value={formData.userId}
            onChange={(e) => handleChange("userId", e.target.value)}
            error={!!errors.userId}
            helperText={errors.userId}
          />
        </Grid>

        {/* Password input with show/hide toggle */}
        <Grid size={12} mt={-2}>
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            margin="normal"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={!!errors.password}
            helperText={errors.password}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>

        {/* Confirm password input */}
        <Grid size={12} mt={-3}>
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            margin="normal"
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
          />
        </Grid>

        {/* Role dropdown with inline Add Role toggle button */}
        <Grid size={{ xs: 12, md: 9 }} mt={-1}>
          <Autocomplete
            options={roleList}
            getOptionLabel={(option) => option.user_types || ""}
            isOptionEqualToValue={(opt, val) =>
              opt.user_type_id === val.user_type_id
            }
            value={
              roleList.find((e) => e.user_type_id === formData.role) || null
            }
            onChange={(e, value) =>
              handleChange("role", value ? value.user_type_id : null)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Role"
                error={!!errors.role}
                helperText={errors.role}
              />
            )}
          />
        </Grid>

        {/* Toggle button to show or hide the Add Role input panel */}
        <Grid size={{ xs: 12, md: 3 }} mt={-1}>
          <Button
            variant="contained"
            size="small"
            fullWidth
            sx={{ borderRadius: "3px" }}
            startIcon={<AddIcon />}
            onClick={() => setShowAddRole((prev) => !prev)}
          >
            Role
          </Button>
        </Grid>

        {/* Add Role inline panel — visible only when the toggle button is clicked */}
        {showAddRole && (
          <>
            <Grid size={{ xs: 12, md: 9 }}>
              <TextField
                label="Add Role"
                fullWidth
                error={!!errors.addRole}
                helperText={errors.addRole}
                onChange={(e) => handleChange("addRole", e.target.value)}
              />
            </Grid>

            {/* Save button submits the new role to the API */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                variant="contained"
                size="small"
                color="secondary"
                onClick={handleAddRole}
              >
                Save
              </Button>
            </Grid>
          </>
        )}

        {/* Form action buttons — label switches between Save and Update */}
        <Grid size={12} textAlign="right" mt={2}>
          <Button
            variant="contained"
            size="small"
            color="secondary"
            sx={{ mr: 1 }}
            onClick={handleSubmit}
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
