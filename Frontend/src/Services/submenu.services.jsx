import API from "./apiClient";

// Base URL for sub menu related APIs
const API_BASE_URL = "sub_menu";

/* ---------------------- FETCH DROPDOWN / GRID DATA ---------------------- */

// Fetch module dropdown data (ID dropdown for sub menu mapping)
export async function fetchmodule() {
  const response = await API.get(`${API_BASE_URL}/getdd`);
  return response.data;
}

// Fetch sub menu grid data for table display
export async function fetchgriddata() {
  const response = await API.get(`${API_BASE_URL}/getiddd`);
  return response.data;
}

/* ---------------------- CREATE ---------------------- */

// Create a new sub menu item
export async function createItem(newRecord) {
  const response = await API.post(`${API_BASE_URL}`, newRecord);
  return response.data;
}

/* ---------------------- UPDATE ---------------------- */

// Update an existing sub menu item by ID
export async function updateItem(id, newRecord) {
  const response = await API.put(`${API_BASE_URL}/${id}`, newRecord);
  return response.data;
}

/* ---------------------- DELETE ---------------------- */

// Delete a sub menu item by ID
export async function deleteItem(id) {
  const response = await API.delete(`${API_BASE_URL}/${id}`);
  return response.data;
}
