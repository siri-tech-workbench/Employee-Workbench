import API from "./apiClient";

// Base URL for holiday related APIs
const API_BASE_URL = "holiday";

/* ---------------------- FETCH ---------------------- */

// Fetch holiday year dropdown data
export async function getholidayyeardropdown() {
  const response = await API.get(`${API_BASE_URL}/gethol`);  
  return response.data;
}

// Fetch complete holiday list
export async function getholidaylist() {
  const response = await API.get(`${API_BASE_URL}`);
  return response.data;
}

/* ---------------------- CREATE ---------------------- */

// Create a new holiday record
export async function postholiday(params = {}) {
  const response = await API.post(`${API_BASE_URL}/addhol`, params);
  return response.data;
}

/* ---------------------- UPDATE ---------------------- */

// Update an existing holiday record by ID
export async function updateholiday(id, newRecord) {
  const response = await API.put(`${API_BASE_URL}/updhol/${id}`, newRecord);
  return response.data;
}

/* ---------------------- DELETE ---------------------- */

// Delete a holiday record by ID
export async function deleteholiday(id) {
  const response = await API.delete(`${API_BASE_URL}/delhol/${id}`);
  return response.data;
}
