import API from "./apiClient";

// Base URL for module menu related APIs
const API_BASE_URL = "module_menu";

// Fetch all module menu items with optional query parameters (pagination, filters, etc.)
export async function getAllItems(params = {}) {
  const response = await API.get(`${API_BASE_URL}`, { params });
  return response.data;
}

// Fetch all modules (used for dropdown or reference data)
export async function getAllModules() {
  const response = await API.get(`${API_BASE_URL}/getmod`);
  return response.data;
}

// Create a new module record
export async function createItem(newRecord) {
  const response = await API.post(`${API_BASE_URL}/addmod`, newRecord);
  return response.data;
}

// Update an existing module record by ID
export async function updateItem(id, newRecord) {
  const response = await API.put(`${API_BASE_URL}/updmod/${id}`, newRecord);
  return response.data;
}

// Delete a module record by ID
export async function deleteItem(id) {
  const response = await API.delete(`${API_BASE_URL}/delmod/${id}`);
  return response.data;
}
