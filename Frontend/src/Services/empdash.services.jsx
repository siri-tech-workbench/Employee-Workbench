import API from "./apiClient";

// Base URL for employee dashboard related APIs
const API_BASE_URL = "empdash";

// Fetch employee session information (logged-in user details)
export async function empsessioninfo() {
  const response = await API.get(`${API_BASE_URL}/session-info`);
  return response.data;
}
