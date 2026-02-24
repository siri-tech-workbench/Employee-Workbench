import API from "./apiClient";

// Base URL for holiday list table related APIs
const API_BASE_URL = "holidaylist";

// Fetch holiday list data for table display
export async function getHolidayListTable() {
  const response = await API.get(`/${API_BASE_URL}`);
  return response.data;
}
