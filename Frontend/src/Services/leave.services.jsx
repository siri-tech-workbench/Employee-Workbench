import API from "./apiClient";

// Base URL for leave related APIs
const API_BASE_URL = "leave";

/* ---------------------- FETCH DROPDOWN / BASIC DATA ---------------------- */

// Fetch leave type dropdown data
export async function getLeaveTypeDropdown() {
  const response = await API.get(`${API_BASE_URL}`);
  return response.data;
}

// Fetch remaining leave balance by leave type ID
export async function getRemainingLeave(leaveId) {
  const response = await API.get(`${API_BASE_URL}/remaining/${leaveId}`);
  return response.data;
}

/* ---------------------- CALCULATIONS ---------------------- */

// Calculate number of leave days based on selected dates
export async function calculateleavedays(payload) {
  const response = await API.post(`${API_BASE_URL}/calculate-days`, payload);
  return response.data;
}

// Check if selected leave dates overlap with existing leaves
export async function checkoverlap(payload) {
  const response = await API.post(`${API_BASE_URL}/checkoverlap`, payload);
  return response.data;
}

/* ---------------------- APPLY LEAVE ---------------------- */

// Apply for leave (supports file upload like medical certificate)
export async function applyleave(formData) {
  const response = await API.post(`${API_BASE_URL}/apply`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

/* ---------------------- EMPLOYEE LEAVE DETAILS ---------------------- */

// Fetch employee leave history
export async function getemployeeleavedetails() {
  const response = await API.get(`${API_BASE_URL}/history`);
  return response.data.items;
}

// Fetch leave summary cards (used in dashboard UI)
export async function getemployeeleavecards() {
  const response = await API.get(`${API_BASE_URL}/cards`);
  return response.data.items;
}

// Fetch Loss of Pay (LOP) days count
export async function getlopdayscount() {
  const response = await API.get(`${API_BASE_URL}/getlopcount`);
  return response.data.items;
}

// Fetch previous year earned leave details
export async function getpreviousyearel() {
  const response = await API.get(`${API_BASE_URL}/`);
  return response.data.items;
}

// Fetch today's leave details (who is on leave today)
export async function getemployeetodayleavedetails() {
  const response = await API.get(`${API_BASE_URL}/gettodaysleaves`);
  return response.data;
}
