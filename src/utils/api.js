// src/utils/api.js
import axios from "axios";

// Create Axios instance
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://attendance-app-backend-4.onrender.com/api",
  withCredentials: true, // Required for sending/receiving cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

/* ============================
   REQUEST LOGGING (DEV)
============================ */
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      console.log("🚀 API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        withCredentials: config.withCredentials,
      });
      return config;
    },
    (error) => Promise.reject(error)
  );
}

/* ============================
   REFRESH TOKEN QUEUE
============================ */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

/* ============================
   RESPONSE INTERCEPTOR
============================ */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Only handle 401 for non-refresh requests
    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue this request until refresh is done
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(api(originalRequest)),
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        // Call refresh endpoint
        const res = await api.post("/auth/refresh");

        isRefreshing = false;
        processQueue(); // retry all queued requests

        if (res.data?.success) {
          return api(originalRequest); // retry original request
        }

        // Refresh failed → reject
        return Promise.reject(new Error("Refresh token failed"));
      } catch (err) {
        isRefreshing = false;
        processQueue(err); // reject all queued requests
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
