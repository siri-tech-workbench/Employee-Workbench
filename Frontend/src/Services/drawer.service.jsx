import API from "./apiClient";

// Base URL for drawer (menu navigation) related APIs
const API_BASE_URL = "drawer";

// Fetch menus based on logged-in user ID
export const getMenus = async (user_id) => {
  const response = await API.get(API_BASE_URL + `?user_id=${user_id}`);
  if (response.data.sucess) {
    return response.data;
  } else {
    throw response.data.message || "Something went wrong";
  }
};
