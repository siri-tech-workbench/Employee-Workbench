import API from "./apiClient";

// Base URL for admin leave management APIs
const API_BASE_URL = "adminleave";

// Fetch all pending leave requests
export async function getpendingleaves() {
  const response = await API.get(`${API_BASE_URL}/pending`);
  return response.data;
}

// Fetch available leave status options (Approved, Rejected, Pending, etc.)
export async function getleavestatus() {
  const response = await API.get(`${API_BASE_URL}/leave-status`);
  return response.data;
}

// Approve or reject a leave request
export async function leaveapprove(payload) {
  const response = await API.post(`${API_BASE_URL}/approve-leave`, payload);
  return response.data;
}

// Search leave details using query parameters (employee, date range, status, etc.)
export async function leavedetailsearch(params) {
  const response = await API.get(`${API_BASE_URL}/searchleave`, {
    params,
  });

  return response.data;
}
