import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Paper,
  IconButton,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  getlocation,
  signinpage,
  forgotpassword,
} from "../Services/login.service";
import { showAlert, showPostError } from "../Components/swal_alert";
import { encryptData, encryptApiPayload } from "../utils/secureStorage";
import Loading from "../Components/loading";
import sirilogo from "../assets/Siri-Logo.png";

// ---------------------------------------------------------------------------
// Device detection utilities — used to enrich the login payload
// ---------------------------------------------------------------------------
/**
 * Detects the operating system from the browser's user agent and platform strings.
 *
 * @returns {"android"|"ios"|"windows"|"macos"|"linux"|"unknown"} OS identifier string.
 */
const getOS = () => {
  const ua = navigator.userAgent;
  const platform = navigator.platform;

  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Win/i.test(platform)) return "windows";
  if (/Mac/i.test(platform)) return "macos";
  if (/Linux/i.test(platform)) return "linux";
  return "unknown";
};

/**
 * Detects the device form factor from the browser's user agent string.
 *
 * @returns {"tablet"|"mobile"|"desktop"} Device type identifier string.
 */
const getDeviceType = () => {
  const ua = navigator.userAgent;

  if (/Tablet|iPad/i.test(ua)) return "tablet";
  if (/Mobi|Android/i.test(ua)) return "mobile";
  return "desktop";
};

// ---------------------------------------------------------------------------
// Default empty form state
// ---------------------------------------------------------------------------
const defaultFormData = {
  user_name: "",
  password: "",
  emp_loc_id: null,
};

/**
 * Login
 *
 * Full-page login screen for the SIRI Workbench application.
 * Handles:
 *  - Username, password, and work location form with inline validation
 *  - Password show/hide toggle
 *  - Forgot Password flow — sends a reset link via API using the entered login ID
 *  - Encrypted API payload via encryptApiPayload before sending credentials
 *  - Token and user data stored in localStorage on successful login
 *  - Role-based redirect: admin goes to AdminDashboard, others to EmpDashboard
 *  - Device OS and type captured and sent with the login payload
 */
export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(defaultFormData);
  const [showPassword, setShowPassword] = useState(false);

  // Work location dropdown options fetched from the API
  const [locationOptions, setLocationOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Geolocation coords — sent with the login payload if available
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Load work location dropdown on mount
  useEffect(() => {
    loadLocationOptions();
  }, []);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  /**
   * Fetches the work location dropdown options from the API.
   * Resets to an empty list on failure to avoid stale data.
   */
  const loadLocationOptions = async () => {
    try {
      const res = await getlocation();
      setLocationOptions(res.items || []);
    } catch (error) {
      console.error("Failed to load work location options", error);
      setLocationOptions([]);
    }
  };

  // -------------------------------------------------------------------------
  // Form handlers
  // -------------------------------------------------------------------------

  /** Toggles password field visibility between plain text and masked. */
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  /**
   * Updates a single form field and clears its validation error.
   *
   * @param {string} field - The form field name to update.
   * @param {*} value - The new value for the field.
   */
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  /**
   * Runs synchronous validation on all required fields.
   * Returns an object of field-level error messages.
   *
   * @returns {object} Map of field names to error message strings.
   */
  const validate = () => {
    const newErrors = {};
    if (!formData.user_name) newErrors.user_name = "Login Id Required";
    if (!formData.password) newErrors.password = "Password Required";
    if (!formData.emp_loc_id) newErrors.emp_loc_id = "Work location Required";
    return newErrors;
  };

  // -------------------------------------------------------------------------
  // Forgot Password handler
  // -------------------------------------------------------------------------

  /**
   * Sends a password reset request using the currently entered login ID.
   * Requires the user to fill in the username field first.
   * Shows the backend's response message or a fallback error on failure.
   */
  const handleForgotPassword = async () => {
    if (!formData.user_name) {
      showPostError("Please enter Login ID first");
      return;
    }

    try {
      setLoading(true);
      const res = await forgotpassword({ login_id: formData.user_name });
      showAlert(
        "success",
        res?.message || "Reset link will be sent to your email",
      );
    } catch (err) {
      showPostError(
        err?.response?.data?.message || "Please enter correct login id",
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Login submit handler
  // -------------------------------------------------------------------------

  /**
   * Validates the form, encrypts the login payload, calls the sign-in API,
   * stores auth tokens in localStorage, and redirects based on user role.
   * Sends device OS and type alongside the encrypted credentials.
   *
   * @param {React.SyntheticEvent} event - The form submit or button click event.
   */
  const handleLogin = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.values(validationErrors).some(Boolean)) return;

    try {
      setLoading(true);

      // Resolve the selected location name for the login_type field
      const selectedLocation = locationOptions.find(
        (m) => m.emp_loc_id === formData.emp_loc_id,
      );

      const encryptedPayload = encryptApiPayload({
        login_id: formData.user_name,
        password: formData.password,
        login_type: selectedLocation?.emp_loc_name,
      });

      // Clear any existing token before a fresh login attempt
      localStorage.removeItem("AUTH_TOKEN");

      const res = await signinpage({
        payload: encryptedPayload,
        latitude,
        longitude,
        login_os: getOS().toUpperCase(),
        device_type: getDeviceType().toUpperCase(),
      });

      if (res?.statusCode === 200 && res?.items?.token) {
        // Store auth token and user identifiers for session use
        localStorage.setItem("AUTH_TOKEN", res.items.token);
        localStorage.setItem("user_id", res.items.user?.user_id);
        localStorage.setItem("group_id", res.items.user?.group_id);
        await encryptData(res.items);

        // Redirect based on admin status — user_id === 1 is the admin account
        const isAdmin = res.items.user?.user_id === 1;
        navigate(isAdmin ? "/Drawer/AdminDashboard" : "/Drawer/EmpDashboard", {
          replace: true,
        });
        return;
      }

      showPostError("Username or password is incorrect");
    } catch (err) {
      showPostError(
        err.response?.data?.message ||
          err.message ||
          "Username or password is incorrect",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Full-viewport background with gradient overlay and blur */
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage:
          "url('https://cdn.pixabay.com/photo/2016/06/03/13/57/digital-marketing-1433427_1280.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        "&::before": {
          content: "''",
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(111,96,193,0.6), rgba(92,107,192,0.6))",
          backdropFilter: "blur(2px)",
        },
      }}
    >
      {loading && <Loading text="Authenticating" />}

      {/* Frosted glass login card */}
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          zIndex: 2,
          padding: 4,
          paddingY: 5,
          width: 520,
          maxWidth: "90%",
          borderRadius: 4,
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.3)",
        }}
      >
        {/* Logo and application title */}
        <Box sx={{ textAlign: "center", mb: 10 }}>
          <img
            src={sirilogo}
            alt="Siri Logo"
            style={{ width: 350, marginBottom: 20, maxWidth: "100%" }}
          />
          <Typography
            variant="h4"
            fontWeight={600}
            textAlign="center"
            sx={{ color: "#6466C0", letterSpacing: 0.5 }}
          >
            SIRI Workbench
          </Typography>
        </Box>

        {/* Username input */}
        <TextField
          fullWidth
          label="Username"
          variant="outlined"
          margin="normal"
          value={formData.user_name}
          required
          onChange={(e) => handleFieldChange("user_name", e.target.value)}
          error={!!errors.user_name}
          helperText={errors.user_name}
        />

        {/* Password input with show/hide toggle */}
        <TextField
          fullWidth
          label="Password"
          variant="outlined"
          type={showPassword ? "text" : "password"}
          margin="normal"
          value={formData.password}
          required
          onChange={(e) => handleFieldChange("password", e.target.value)}
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

        {/* Work location / mode dropdown */}
        <Autocomplete
          sx={{ mt: "15px" }}
          options={locationOptions}
          getOptionLabel={(o) => o.emp_loc_name || ""}
          value={
            locationOptions.find((m) => m.emp_loc_id === formData.emp_loc_id) ||
            null
          }
          onChange={(e, v) =>
            handleFieldChange("emp_loc_id", v ? v.emp_loc_id : null)
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Work Mode"
              required
              error={!!errors.emp_loc_id}
              helperText={errors.emp_loc_id}
            />
          )}
        />

        {/* Forgot Password link — uses the username already entered in the field above */}
        <Box textAlign="right" mb={2}>
          <Link
            component="button"
            underline="hover"
            sx={{ color: "#222", fontSize: 14 }}
            onClick={handleForgotPassword}
          >
            Forgot Password?
          </Link>
        </Box>

        {/* Submit button — label updates during API call */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleLogin}
          sx={{
            mt: 1,
            py: 1.2,
            fontSize: 16,
            fontWeight: "bold",
            color: "#fff",
            borderRadius: 2,
            textTransform: "none",
            background: "linear-gradient(135deg, #6F60C1, #5C6BC0)",
            "&:hover": {
              background: "linear-gradient(135deg, #5C6BC0, #6F60C1)",
            },
          }}
        >
          {loading ? "Authenticating..." : "Login"}
        </Button>
      </Paper>
    </Box>
  );
}
