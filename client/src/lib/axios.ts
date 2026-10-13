import axios from 'axios';

let accessTokenMemory: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessTokenMemory = token;
};

export const getAccessToken = () => accessTokenMemory;

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

export const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (accessTokenMemory) {
      config.headers.Authorization = `Bearer ${accessTokenMemory}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to prevent multiple concurrent token refreshes
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${apiBase}/auth/refresh-token`, {}, { withCredentials: true });
        const { accessToken } = response.data;

        setAccessToken(accessToken);
        isRefreshing = false;
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        setAccessToken(null);
        // Clear cookies / redirect to login if necessary
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
export default api;
