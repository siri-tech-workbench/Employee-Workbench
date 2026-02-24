import API from "./apiClient";

// Base URL for customer related APIs
const API_BASE_URL = "customer";

// Fetch all customer records
export async function getcustomer() {
  const response = await API.get(`${API_BASE_URL}`);
  return response.data;
}

// Create a new customer record
export async function postcustomer(params = {}) {
  const response = await API.post(`${API_BASE_URL}/createcustomer`, params);
  return response.data;
}

// Update an existing customer record by ID
export async function updatecustomer(id, newRecord) {
  const response = await API.put(`${API_BASE_URL}/updcust/${id}`, newRecord);
  return response.data;
}

// Delete a customer record by ID
// Note: Axios DELETE typically does not require a body unless explicitly handled in backend
export async function deletecustomer(id, newRecord) {
  const response = await API.delete(`${API_BASE_URL}/delcust/${id}`, newRecord);
  return response.data;
}
