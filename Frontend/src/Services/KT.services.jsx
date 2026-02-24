import API from "./apiClient";

// Base URL for KT (Knowledge Transfer) related APIs
const API_BASE_URL = "KT";

/* ---------------------- FETCH ---------------------- */

// Fetch KT records with optional filters (pagination, date, employee, etc.)
export async function getKT(params = {}) {
  const response = await API.get(`${API_BASE_URL}/`, {
    params,
  });
  return response.data;
}

// Fetch employee dropdown data for KT module
export async function getKT_emp_DD() {
  const response = await API.get(`${API_BASE_URL}/Emp_dd`);
  return response.data;
}

/* ---------------------- CREATE ---------------------- */

// Create a new KT record
export async function postKT(data) {
  const response = await API.post(`${API_BASE_URL}/`, data);
  return response.data;
}

/* ---------------------- DOWNLOAD ---------------------- */

// Download KT document/file by ID (returns blob data)
export async function downloadKT(id) {
  const response = await API.get(`${API_BASE_URL}/download/${id}`, {
    responseType: "blob", // Required for file download
  });

  return response.data;
}
