import API from "./apiClient";

// Base URL for project team related APIs
const API_BASE_URL = "projectteam";

/* ---------------------- FETCH DROPDOWN DATA ---------------------- */

// Fetch project dropdown data
export async function getprojectdd() {
  const response = await API.get(`${API_BASE_URL}/getproject`);
  return response.data;
}

// Fetch role dropdown data
export async function getroledd() {
  const response = await API.get(`${API_BASE_URL}/getrole`);
  return response.data;
}

// Fetch status dropdown data
export async function getstatusdd() {
  const response = await API.get(`${API_BASE_URL}/getstatus`);
  return response.data;
}

/* ---------------------- FETCH TABLE DATA ---------------------- */

// Fetch project team table data
export async function gettabledata() {
  const response = await API.get(`${API_BASE_URL}/getteamtable`);
  return response.data;
}

/* ---------------------- CREATE ---------------------- */

// Create a new project team entry
export async function postprojectteam(params = {}) {
  const response = await API.post(`${API_BASE_URL}/createteam`, params);
  return response.data;
}

/* ---------------------- UPDATE ---------------------- */

// Update an existing project team record by ID
export async function updateprojectteam(id, newRecord) {
  const response = await API.put(`${API_BASE_URL}/updateteam/${id}`, newRecord);
  return response.data;
}
