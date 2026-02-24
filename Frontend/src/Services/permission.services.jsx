import API from "./apiClient";

// Base URL for permission related APIs
const API_BASE_URL = "permission";

/* ---------------------- FETCH ---------------------- */

// Fetch permission details for a specific employee by ID
export async function getPermissionData(empId) {
  const response = await API.get(`${API_BASE_URL}/${empId}`);
  return response.data;
}

// Fetch all permission records
export async function getallpermission() {
  const response = await API.get(`${API_BASE_URL}`);
  return response.data;
}

// Fetch today's permission records
export async function gettodayspermission() {
  const response = await API.get(`${API_BASE_URL}/today`);
  return response.data;
}

/* ---------------------- CREATE ---------------------- */

// Create a new permission request
export async function postPermissionData(data) {
  const response = await API.post(`${API_BASE_URL}`, data);
  return response.data;
}
