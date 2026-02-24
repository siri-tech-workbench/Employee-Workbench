import API from "./apiClient";

// Base URL for employee related APIs
const API_BASE_URL = "employee";

/* ---------------------- FETCH MASTER DATA ---------------------- */

// Fetch designation list
export async function getDesignation() {
  const response = await API.get(`${API_BASE_URL}/designation`);
  return response.data;
}

// Fetch available languages list
export async function getLanguages() {
  const response = await API.get(`${API_BASE_URL}/languages`);
  return response.data;
}

// Fetch employee status list (Active, Inactive, etc.)
export async function getEmpStatus() {
  const response = await API.get(`${API_BASE_URL}/emp_status`);
  return response.data;
}

// Fetch document types required for employees
export async function getDocuments() {
  const response = await API.get(`${API_BASE_URL}/document`);
  return response.data;
}

/* ---------------------- CREATE ---------------------- */

// Create a new employee
export async function postEmployee(data) {
  const response = await API.post(`${API_BASE_URL}/`, data);
  return response.data;
}

// Add employee language details
export async function postEmployeelanguage(data) {
  const response = await API.post(`${API_BASE_URL}/languages`, data);
  return response.data;
}

/* ---------------------- FETCH EMPLOYEES ---------------------- */

// Fetch employees with optional filters (date range, name, status)
export async function getEmployee({ fromDate, toDate, name, status }) {
  const response = await API.get(`${API_BASE_URL}/employees`, {
    params: {
      fromDate,
      toDate,
      name,
      status,
    },
  });

  return response.data;
}

/* ---------------------- UPDATE ---------------------- */

// Update employee details by ID
export async function updateEmployee(id, data) {
  const response = await API.put(`${API_BASE_URL}/${id}`, data);
  return response.data;
}

/* ---------------------- DOCUMENT MANAGEMENT ---------------------- */

// Upload employee documents (multiple files with document IDs)
export async function uploadEmployeeDocuments(empId, files, docIds) {
  const formData = new FormData();

  // Append all selected files
  files.forEach((file) => {
    formData.append("documents", file);
  });

  // Append corresponding document IDs
  docIds.forEach((docId) => {
    formData.append("docIds", docId);
  });

  const response = await API.post(
    `${API_BASE_URL}/employee_documents/${empId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

// Fetch uploaded documents for an employee
export async function getEmployeeUploadedDocuments(empId) {
  const res = await API.get(`${API_BASE_URL}/employee_documents/${empId}`);
  return res.data;
}

// Fetch document preview (image or PDF as blob)
export async function getEmployeeUploadedDocumentsPreview(linkId) {
  const res = await API.get(
    `${API_BASE_URL}/employee_documents/preview/${linkId}`,
    {
      responseType: "blob", // Required for images and PDFs
    },
  );
  return res.data;
}

// Delete uploaded employee document
export async function deleteEmployeeUploadedDocuments(empId, docLinkId) {
  const res = await API.delete(
    `${API_BASE_URL}/employee_documents/${empId}/${docLinkId}`,
  );
  return res.data;
}

/* ---------------------- DROPDOWN ---------------------- */

// Fetch employee dropdown data (for selection fields)
export async function getEmployeeDD() {
  const response = await API.get(`${API_BASE_URL}/dd`);
  return response?.data;
}
