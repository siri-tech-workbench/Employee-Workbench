import API from "./apiClient";

// Base URL for Group Master related APIs
const API_BASE_URL = "Group";

/* ---------------------- FETCH ---------------------- */

// Fetch all Group Master records (used for dropdown or listing)
export async function getGroupMaster() {
  const response = await API.get(`${API_BASE_URL}`);
  return response.data;
}

/* ---------------------- CREATE ---------------------- */

// Create a new Group Master record
export async function postGroupMaster(data) {
  const response = await API.post(`${API_BASE_URL}`, data);
  return response.data;
}

/* ---------------------- DELETE ---------------------- */

// Delete a Group Master record by ID
export async function deleteGroupMaster(id) {
  const response = await API.delete(`${API_BASE_URL}/${id}`);
  return response.data;
}

/* ---------------------- UPDATE ---------------------- */

// Update an existing Group Master record by ID
export async function updateGroupMaster(id, newRecord) {
  const response = await API.put(`${API_BASE_URL}/${id}`, newRecord);
  return response.data;
}
