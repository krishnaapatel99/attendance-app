import axios from "axios";

// ============================
// AXIOS INSTANCE
// ============================
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://attendance-app-backend-4.onrender.com/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

// ============================
// DEV REQUEST LOGGING
// ============================
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      console.log("🚀 API:", config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => Promise.reject(error)
  );
}

// ============================
// REFRESH QUEUE
// ============================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

// ============================
// RESPONSE INTERCEPTOR
// ============================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || "";

    // ----------------------------
    // DO NOT REFRESH IN THESE CASES
    // ----------------------------
    if (
      status !== 401 ||
      originalRequest._retry ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/validateUser")
    ) {
      return Promise.reject(error);
    }

    // ----------------------------
    // MARK RETRY
    // ----------------------------
    originalRequest._retry = true;

    // ----------------------------
    // QUEUE IF REFRESHING
    // ----------------------------
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(api(originalRequest)),
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      // ----------------------------
      // ATTEMPT REFRESH
      // ----------------------------
      const res = await api.post("/auth/refresh");

      isRefreshing = false;
      processQueue();

      if (res.data?.success) {
        return api(originalRequest);
      }

      return Promise.reject(error);
    } catch (refreshError) {
      isRefreshing = false;
      processQueue(refreshError);
      return Promise.reject(refreshError);
    }
  }
);

export default api;
