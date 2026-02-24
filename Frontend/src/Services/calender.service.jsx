import API from "./apiClient";

// Base URL for calendar year related APIs
const API_BASE_URL = "calender_year";

// Fetch all calendar year records
export async function getcalender() {
  const response = await API.get(`${API_BASE_URL}`);
  return response.data;
}

// Create a new calendar year record
export async function postcalender(params = {}) {
  const response = await API.post(`${API_BASE_URL}/postcal`, params);
  return response.data;
}

// Update an existing calendar year record by ID
export async function updatecalender(id, newRecord) {
  const response = await API.put(`${API_BASE_URL}/updcal/${id}`, newRecord);
  return response.data;
}
