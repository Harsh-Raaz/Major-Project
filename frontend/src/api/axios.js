import axios from 'axios';
import { clearAllAuthData, getToken } from '../utils/storage';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const aiDirectApi = axios.create({
  baseURL: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:5001',
});

const attachToken = (client) => {
  client.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        clearAllAuthData();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};

attachToken(api);
attachToken(aiDirectApi);
