import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Resetpassword } from "../Services/login.service";
import { showAlert, showPostError } from "../Components/swal_alert";

// ---------------------------------------------------------------------------
// Password strength regex — requires min 6 chars, uppercase, lowercase,
// digit, and one special character from the allowed set
// ---------------------------------------------------------------------------
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;

/**
 * ResetPassword
 *
 * Full-page password reset screen accessed via an emailed reset link.
 * Reads the reset token from the URL search params (?token=...).
 * Handles:
 *  - New password and confirm password fields with inline validation
 *  - Password strength check against passwordRegex before API call
 *  - Confirm password cross-check before API call
 *  - Calls Resetpassword API with the token and new password
 *  - Redirects to the login page on successful reset
 */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Reset token extracted from the URL query string (?token=...)
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------------------------
  // Reset handler
  // -------------------------------------------------------------------------

  /**
   * Validates both password fields then calls the reset API with the token.
   * Shows a success alert and redirects to login on success.
   * Shows an error alert on validation failure or API error.
   */
  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      showPostError("All fields are required");
      return;
    }

    if (!passwordRegex.test(password)) {
      showPostError("Password format invalid");
      return;
    }

    if (password !== confirmPassword) {
      showPostError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await Resetpassword({
        token,
        new_password: password,
      });

      showAlert("success", res.message || "Password reset successful");
      navigate("/");
    } catch (err) {
      showPostError(err?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Full-viewport gradient background */
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #6F60C1 0%, #5C6BC0 50%, #3F51B5 100%)",
        px: 2,
      }}
    >
      {/* Frosted glass reset card */}
      <Paper
        elevation={0}
        sx={{
          width: 420,
          maxWidth: "100%",
          p: 4,
          borderRadius: 4,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Page title and subtitle */}
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" fontWeight={700} sx={{ color: "#5C6BC0" }}>
            Reset Password
          </Typography>

          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
            Create a strong password to secure your account
          </Typography>
        </Box>

        {/* New password field — shows strength error inline while typing */}
        <TextField
          fullWidth
          label="New Password"
          type={showPassword ? "text" : "password"}
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={password.length > 0 && !passwordRegex.test(password)}
          helperText={
            password.length > 0 && !passwordRegex.test(password)
              ? "Password must be at least 6 characters and include 1 uppercase, 1 lowercase, 1 number, and 1 special character"
              : " "
          }
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Confirm password field — shows mismatch error inline while typing */}
        <TextField
          fullWidth
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          margin="normal"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmPassword.length > 0 && password !== confirmPassword}
          helperText={
            confirmPassword.length > 0 && password !== confirmPassword
              ? "Passwords do not match"
              : " "
          }
        />

        {/* Submit button — disabled and relabeled while the API call is in flight */}
        <Button
          fullWidth
          variant="contained"
          sx={{
            mt: 3,
            py: 1.4,
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 2,
            textTransform: "none",
            background: "linear-gradient(135deg, #6F60C1, #5C6BC0)",
            boxShadow: "0 10px 25px rgba(92,107,192,0.4)",
            "&:hover": {
              background: "linear-gradient(135deg, #5C6BC0, #6F60C1)",
            },
          }}
          onClick={handleResetPassword}
          disabled={loading}
        >
          {loading ? "Updating..." : "Reset Password"}
        </Button>

        {/* Post-reset redirect notice */}
        <Box textAlign="center" mt={3}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            You'll be redirected to login after reset
          </Typography>
        </Box>
      </Paper>

      {/* Footer copyright — pinned to bottom center of the viewport */}
      <Box
        sx={{
          position: "absolute",
          bottom: 16,
          width: "100%",
          textAlign: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "rgba(255,255,255,0.85)", letterSpacing: 0.3 }}
        >
          &copy; {new Date().getFullYear()} Siri Technologies. All rights
          reserved.
        </Typography>
      </Box>
    </Box>
  );
}
