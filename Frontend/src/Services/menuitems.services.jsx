import API from "./apiClient";

// Base URL for menu items related APIs
const API_BASE_URL = "menuitems";

/* ---------------------- FETCH DROPDOWN DATA ---------------------- */

// Fetch module dropdown data
export async function fetchmodule() {
  const response = await API.get(`${API_BASE_URL}/dd_module`);
  return response.data;
}

// Fetch main menu dropdown based on selected module ID
export async function fetchmenus(id) {
  const response = await API.get(`${API_BASE_URL}/dd_main_menu`, {
    params: { module_id: id },
  });
  return response.data;
}

// Fetch menu items dropdown data
export async function fetchItems() {
  const response = await API.get(`${API_BASE_URL}/dd_items`);
  return response.data;
}

/* ---------------------- FETCH LIST ---------------------- */

// Fetch all menu items with optional filters (pagination, search, etc.)
export async function getAllItems(params = {}) {
  const response = await API.get(`${API_BASE_URL}`, { params });
  return response.data;
}

/* ---------------------- CREATE ---------------------- */

// Create a new menu item
export async function createmenuitem(newRecord) {
  const response = await API.post(`${API_BASE_URL}`, newRecord);
  return response.data;
}

/* ---------------------- UPDATE ---------------------- */

// Update an existing menu item by ID (ID passed as query parameter)
export async function updatemenuitem(id, newRecord) {
  const response = await API.put(`${API_BASE_URL}/${id}`, newRecord);
  return response.data;
}

/* ---------------------- DELETE ---------------------- */

// Delete a menu item by ID
export async function deletemenuitem(id) {
  const response = await API.delete(`${API_BASE_URL}/${id}`);
  return response.data;
}
