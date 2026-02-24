import API from "./apiClient";

// Base URL for Single Leave Allotment related APIs
const API_BASE_URL = "SingleLeaveAllotment";

/* ---------------------- FETCH DROPDOWN DATA ---------------------- */

// Fetch employee dropdown data for single leave allotment
export async function getSingleLeaveDD() {
  const response = await API.get(`${API_BASE_URL}/dd`);
  return response.data;
}

// Fetch calendar year dropdown data for single leave allotment
export async function getSingleLeaveCalendarDD() {
  const response = await API.get(`${API_BASE_URL}/caldd`);
  return response.data;
}

/* ---------------------- FETCH TABLE DATA ---------------------- */

// Fetch single leave allotment table/grid data
export async function getSingleLeaveTable() {
  const response = await API.get(`${API_BASE_URL}/grid`);
  return response.data;
}

/* ---------------------- CREATE ---------------------- */

// Create a new single leave allotment record
export async function postSingleLeaveTable(data) {
  const response = await API.post(`${API_BASE_URL}/`, data);
  return response.data;
}

/* ---------------------- UPDATE ---------------------- */

// Update an existing single leave allotment record
export async function updateSingleLeaveTable(data) {
  const response = await API.put(`${API_BASE_URL}/`, data);
  return response.data;
}
