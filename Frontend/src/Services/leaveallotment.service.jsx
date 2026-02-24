import API from "./apiClient";

// Base URL for leave allotment related APIs
const API_BASE_URL = "leaveallotment";

/* ---------------------- FETCH ---------------------- */

// Fetch calendar year dropdown data for leave allotment
export async function getcalendaryearDropdown() {
  const response = await API.get(`${API_BASE_URL}`);
  return response.data;
}

/* ---------------------- CREATE / PROCESS ---------------------- */

// Allot yearly leave to employees based on selected calendar year
export async function Employeesleaveallotment(payload = {}) {
  const response = await API.post(`${API_BASE_URL}/yearlyleave`, payload);

  return response.data;
}
