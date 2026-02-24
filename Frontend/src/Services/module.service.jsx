import API from "./apiClient";

// Base URL for module related APIs
const API_BASE_URL = "module";

/* ---------------------- CREATE ---------------------- */

// Insert a new module record
export async function insertmodule(data) {
  const response = await API.post(`${API_BASE_URL}/insertmodule`, data);
  return response.data;
}

/* ---------------------- FETCH ---------------------- */

// Fetch all module records
export async function getmodulesdata() {
  const response = await API.get(`${API_BASE_URL}`);
  return response.data;
}

/* ---------------------- UPDATE ---------------------- */

// Update an existing module record by ID
export async function updatemodule(id, newRecord) {
  const response = await API.put(`${API_BASE_URL}/updmodule/${id}`, newRecord);
  return response.data;
}
