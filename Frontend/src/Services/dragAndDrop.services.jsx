import API from "./apiClient";

// Base URL for drag and drop related APIs
const API_BASE_URL = "draganddrop";

/* ---------------------- FETCH Drag and Drop Data ---------------------- */

// Fetch all users for drag and drop (dropdown or initial list)
export async function fetchUsers_Drag() {
  const response = await API.get(`${API_BASE_URL}`);
  return response.data;
}

// Fetch available actions for drag and drop
export async function fetchUsersactions_Drag() {
  const response = await API.get(`${API_BASE_URL}/actions`);  
  
  return response.data;
}

/* ---------------------- CREATE ---------------------- */

// Create or assign users via drag and drop
export async function postUsers_Drag(data) {
  const response = await API.post(`${API_BASE_URL}`, data);
  return response.data;
}

/* ---------------------- DELETE ---------------------- */

// Remove users via drag and drop
// Note: DELETE request includes body data configuration
export async function deleteUsers_Drag(data) {
  const response = await API.delete(`${API_BASE_URL}`, {
    data: data,
  });
  return response.data;
}

/* ---------------------- UPDATE ---------------------- */

// Update drag and drop user configuration
export async function updateUsers_Drag(data) {
  const response = await API.put(`${API_BASE_URL}`, data);
  return response.data;
}

/* ---------------------- FILTER / GROUP BASED FETCH ---------------------- */

// Fetch users based on Group ID
export async function getUsersbyGroupID_Drag(groupId) {
  const response = await API.get(`${API_BASE_URL}/group/${groupId}`);
  return response.data;
}
