import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://crm-backend-5-iocr.onrender.com";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = 
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("token="))
            ?.split("=")[1]
        : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const authApi = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post("/api/auth/login", {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getProfile: async () => {
    try {
      const response = await apiClient.get("/api/auth/profile");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: async () => {
    try {
      const response = await apiClient.post("/api/auth/logout");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await apiClient.post("/api/auth/refresh");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default authApi;
