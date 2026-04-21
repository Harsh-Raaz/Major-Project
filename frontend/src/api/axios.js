import axios from "axios";
import { getToken } from "../utils/storage";

export const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const aiDirectApi = axios.create({
  baseURL: "http://localhost:5001",
});

// Add request interceptor to inject token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on 401 Unauthorized
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
