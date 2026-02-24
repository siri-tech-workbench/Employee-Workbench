import API from "./apiClient";

// Base URL for project related APIs
const API_BASE_URL = "project";

/* ---------------------- FETCH DROPDOWN DATA ---------------------- */

// Fetch customer dropdown data for project creation
export async function getcustomerdd() {
  const response = await API.get(`${API_BASE_URL}/getcustomer`);
  return response.data;
}

// Fetch module dropdown data for project creation
export async function getmoduledd() {
  const response = await API.get(`${API_BASE_URL}/getmodule`);
  return response.data;
}

/* ---------------------- CREATE ---------------------- */

// Create a new project (supports file upload using multipart/form-data)
export async function postproject(formData) {
  const response = await API.post(`${API_BASE_URL}/insproj`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

/* ---------------------- UPDATE ---------------------- */

// Update an existing project by ID
export async function updateproject(id, newRecord) {
  const response = await API.put(`${API_BASE_URL}/updproj/${id}`, newRecord);
  return response.data;
}

/* ---------------------- FETCH TABLE DATA ---------------------- */

// Fetch project table data for listing page
export async function getprojecttabledata() {
  const response = await API.get(`${API_BASE_URL}/getprojecttable`);
  return response.data;
}

/* ---------------------- DELETE ---------------------- */

// Delete a project by ID
// Note: DELETE request may optionally include additional config if backend expects it
export async function deleteproject(id, newRecord) {
  const response = await API.delete(
    `${API_BASE_URL}/delproject/${id}`,
    newRecord,
  );
  return response.data;
}
