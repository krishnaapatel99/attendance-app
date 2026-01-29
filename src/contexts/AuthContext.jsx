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

  // =========================
  // Validate session on load
  // =========================
  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
    try {
      const res = await api.get("/auth/validateUser");

      if (res.data?.success) {
        setUser(res.data.user);
      }
      // ❗ IMPORTANT:
      // If validateUser fails, DO NOTHING.
      // Let axios interceptor + routing decide.
    } catch (error) {
      console.warn("Session validation failed (non-fatal)");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Login
  // =========================
  const login = async (email, password, role) => {
    try {
      const res = await api.post("/auth/signIn", {
        email,
        password,
        role,
      });

      if (res.data?.success) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }

      return {
        success: false,
        message: res.data?.message || "Login failed",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Login failed",
      };
    }
  };

  // =========================
  // Logout
  // =========================
  const logout = async () => {
    try {
      await api.post("/auth/signOut");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      // Let router handle redirect
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
