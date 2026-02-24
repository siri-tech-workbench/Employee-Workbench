import API from "./apiClient";

// Base URL for user management related APIs
const API_BASE_URL = "users";

/* ---------------------- PASSWORD MANAGEMENT ---------------------- */

// Update user password
export async function updatepassword(newRecord) {
  const response = await API.put(`${API_BASE_URL}/updpas`, newRecord);
  return response.data;
}

/* ---------------------- FETCH DROPDOWN DATA ---------------------- */

// Fetch employee dropdown data
export async function getemployeedd() {
  const response = await API.get(`${API_BASE_URL}/getempdd`);
  return response.data;
}

// Fetch role dropdown data
export async function getroledd() {
  const response = await API.get(`${API_BASE_URL}/getroledd`);
  return response.data;
}

/* ---------------------- ROLE MANAGEMENT ---------------------- */

// Insert a new role
export async function insertrole(newRecord) {
  const response = await API.post(`${API_BASE_URL}/insrole`, newRecord);
  return response.data;
}

/* ---------------------- USER LIST / SEARCH ---------------------- */

// Fetch users list based on logged-in user ID
export async function getuserslist(user_id) {
  const response = await API.get(`${API_BASE_URL}/getusers`, {
    params: { user_id },
  });
  return response.data;
}

// Search users by login ID
export async function searchusers(login_id) {
  const response = await API.get(`${API_BASE_URL}/users/search`, {
    params: { login_id },
  });
  return response.data;
}

/* ---------------------- CREATE / UPDATE USERS ---------------------- */

// Update existing user by ID
export async function updateusers(id, newRecord) {
  const response = await API.put(`${API_BASE_URL}/updusers/${id}`, newRecord);
  return response.data;
}

// Create a new user
export async function createusers(newRecord) {
  const response = await API.post(`${API_BASE_URL}/postuser`, newRecord);
  return response.data;
}
