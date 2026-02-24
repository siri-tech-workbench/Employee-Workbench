import API from "./apiClient";

// Base URL for main menu related APIs
const API_BASE_URL = "main_menu";

// Fetch dropdown data for modules
export async function fetchModuleDD() {
  const response = await API.get(`${API_BASE_URL}/`);
  return response.data;
}

// Fetch all main menu records
export async function fetchMainMenu() {
  const response = await API.get(`${API_BASE_URL}/Main`);
  return response.data;
}

// Create a new main menu record
export async function postMainMenu(data) {
  const response = await API.post(`${API_BASE_URL}/`, data);
  return response.data;
}

// Update an existing main menu record by ID
export async function updateMainMenu(id, data) {
  const response = await API.put(`${API_BASE_URL}/${id}`, data);
  return response.data;
}

// Delete a main menu record by ID
export async function deleteMainMenu(id) {
  const response = await API.delete(`${API_BASE_URL}/${id}`);
  return response.data;
}
