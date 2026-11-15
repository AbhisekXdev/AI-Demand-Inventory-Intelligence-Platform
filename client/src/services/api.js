
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Attach JWT token to every API request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized API response error handling
api.interceptors.response.use(
  (response) => response,

  (error) => {
    let message = "Something went wrong. Please try again.";

    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 400:
          message =
            error.response.data?.message ||
            "Invalid request. Please check your input.";
          break;

        case 401:
          message =
            error.response.data?.message ||
            "Authentication failed. Please log in again.";
          break;

        case 403:
          message = "You don't have permission to perform this action.";
          break;

        case 404:
          message = "Requested resource was not found.";
          break;

        case 409:
          message =
            error.response.data?.message ||
            "This record already exists.";
          break;

        case 422:
          message =
            error.response.data?.message ||
            "Please check the submitted information.";
          break;

        case 500:
          message = "Internal server error. Please try again later.";
          break;

        default:
          message =
            error.response.data?.message ||
            `Request failed with status ${status}.`;
      }
    } else if (error.code === "ECONNABORTED") {
      message = "Request timed out. Please try again.";
    } else if (error.code === "ERR_NETWORK") {
      message = "Unable to connect to the server. Check your connection.";
    }

    // Attach a readable message for page-level toast notifications
    error.userMessage = message;

    console.error("API Error:", {
      message,
      status: error.response?.status,
      details: error.response?.data,
    });

// Handle expired or invalid authentication sessions
if (
  error.response?.status === 401 &&
  !error.config?.url?.includes("/auth/login") &&
  !error.config?.url?.includes("/auth/register")
) {
  window.dispatchEvent(
    new CustomEvent("auth:session-expired")
  );
}


    return Promise.reject(error);
  }
);

export default api;
