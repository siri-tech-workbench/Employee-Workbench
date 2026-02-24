import API from "./apiClient";

// Base URL for login and authentication related APIs
const API_BASE_URL = "login";

/* ---------------------- FETCH ---------------------- */

// Fetch location dropdown data (used in login screen)
export async function getlocation() {
  const response = await API.get(`${API_BASE_URL}/locdd`);
  return response.data;
}

/* ---------------------- AUTHENTICATION ---------------------- */

// Sign in user with credentials
export async function signinpage(payload = {}) {
  const response = await API.post(`${API_BASE_URL}/signin`, payload);
  return response.data;
}

// Fetch login dashboard details for a specific date
export async function getLoginDetails(date) {
  const response = await API.get(`${API_BASE_URL}/dash`, {
    params: { date }, // Send selected date to backend
  });
  return response.data;
}

/* ---------------------- PASSWORD MANAGEMENT ---------------------- */

// Request forgot password (send email/username)
export async function forgotpassword(params = {}) {
  const response = await API.post(`${API_BASE_URL}/forgot-password`, params);
  return response.data;
}

// Reset password using reset token or credentials
export async function Resetpassword(payload = {}) {
  const response = await API.post(`${API_BASE_URL}/reset-password`, payload);
  return response.data;
}
