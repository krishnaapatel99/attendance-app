// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate session (called on app load)
  useEffect(() => {
    setTimeout(validateSession, 0);
  }, []);

 const validateSession = async () => {
  try {
    const res = await api.get("/auth/validateUser");
   
    if (res.data?.success && res.data.user) {
     
      setUser(res.data.user);
      return true;
    }
    throw new Error("Invalid session");
  } catch (error) {
    console.error("Session validation failed:", error);
    if (error.response?.status === 401) {
      try {
        const refreshed = await refreshSession();
        if (refreshed) {
          // Retry validation after refresh
          const retry = await api.get("/auth/validateUser");
          if (retry.data?.success && retry.data.user) {
            setUser(retry.data.user);
            return true;
          }
        }
      } catch (refreshError) {
        console.error("Refresh failed:", refreshError);
      }
    }
    setUser(null);
    return false;
  } finally {
    setLoading(false);
  }
};

  // Refresh access token using backend refresh endpoint
 const refreshSession = async () => {
  try {
    const res = await api.post("/auth/refresh", {}, { withCredentials: true });
    return res.data?.success || false;
  } catch (error) {
    console.error("Refresh token failed:", error);
    return false;
  }
};
  // Login (backend sets httpOnly cookie)
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/signIn", { email, password });
      if (res.data?.success) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data?.message || "Login failed" };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  };

  // Logout (backend clears cookie + local state)
  const logout = async () => {
    try {
      await api.post("/auth/signOut");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null); // reset user state immediately
      window.location.href = "/signin"; // optional redirect to login
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};
