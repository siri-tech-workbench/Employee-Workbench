import API from "./apiClient";

// Base URL for comp-off related APIs
const API_BASE_URL = "compoff";

// Create a new comp-off request
export async function postcompoff(params = {}) {
  const response = await API.post(`${API_BASE_URL}/createcompoff`, params);
  return response.data;
}

// Fetch all comp-off records
export async function getcomoff() {
  const response = await API.get(`${API_BASE_URL}/getcompoff`);
  return response.data;
}

// Update an existing comp-off record by ID
export async function updatecompoff(id, newRecord) {
  const response = await API.put(
    `${API_BASE_URL}/updatecompoff/${id}`,
    newRecord,
  );
  return response.data;
}

// Fetch comp-off alert data (notifications or reminders)
export async function getcomoffalert() {
  const response = await API.get(`${API_BASE_URL}/comoffalert`);
  return response.data;
}
