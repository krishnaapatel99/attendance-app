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

  // 🔑 Validate session on app load (cookie-based)
  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
    try {
      const res = await api.get("/auth/validateUser");
      if (res.data?.success) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Login (JWT stored in httpOnly cookie by backend)
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/signIn", { email, password });

      if (res.data?.success) {
        setUser(res.data.user); // cookie already set
        return { success: true, user: res.data.user };
      }

      return {
        success: false,
        message: res.data?.message || "Login failed",
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  // 🚪 Logout (clears cookie on backend)
  const logout = async () => {
    try {
      await api.post("/auth/signOut");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
