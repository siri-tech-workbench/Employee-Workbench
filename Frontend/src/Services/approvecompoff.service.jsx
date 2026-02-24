import API from "./apiClient";

// Base URL for comp-off approval related APIs
const API_BASE_URL = "approvecompoff";

// Fetch all pending comp-off requests
export async function getpendingcompoffs() {
  const response = await API.get(`${API_BASE_URL}/getcompoffrequest`);
  return response.data;
}

// Approve or update a comp-off request
export async function approvecompoff(newRecord) {
  const response = await API.put(
    `${API_BASE_URL}/approvecompoffrequest`,
    newRecord,
  );
  return response.data;
}
