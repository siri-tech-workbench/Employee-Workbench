import API from "./apiClient";

// Base URL for logout related APIs
const API_BASE_URL = "logout";

/* ---------------------- LOGOUT ---------------------- */

// Logout the currently logged-in user
// Sends a custom header to indicate logout action
export async function logoutUser() {
  const response = await API.put(API_BASE_URL, null, {
    headers: {
      "X-LOGOUT": "true", // Custom header to trigger backend logout handling
    },
  });

  return response.data;
}
