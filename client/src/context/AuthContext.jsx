import { createContext, useContext, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem("authToken") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || "null");
    } catch {
      return null;
    }
  });

  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    const { token: newToken, user: userData } = response.data;

    if (!newToken || !userData) {
      throw new Error("Invalid login response from server");
    }

    localStorage.setItem("authToken", newToken);
    localStorage.setItem("authUser", JSON.stringify(userData));

    setToken(newToken);
    setUser(userData);

    return response.data;
  };

  const register = async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [token, user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}