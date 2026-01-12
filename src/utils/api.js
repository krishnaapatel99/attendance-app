import axios from "axios";

// Axios instance
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://attendance-app-backend-4.onrender.com/api",
  withCredentials: true, // 🔥 REQUIRED for cookies
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ===========================
   REQUEST LOGGING (DEV ONLY)
=========================== */
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
    (error) => {
      console.error("❌ API Request Error:", error);
      return Promise.reject(error);
    }
  );
}

/* ===========================
   RESPONSE HANDLING
=========================== */
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log("✅ API Response:", {
        status: response.status,
        url: response.config.url,
      });
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;

    console.error("❌ API Error:", {
      status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
    });

    // ⚠️ Do NOT force redirect here
    // Let AuthContext decide what to do
    if (status === 401) {
      console.warn("⚠️ Unauthorized – session may have expired");
    }

    return Promise.reject(error);
  }
);

export default api;
