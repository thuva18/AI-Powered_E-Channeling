import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false); // IMPORTANT: stop loading even if no token
        return;
      }
      const res = await api.get("/patient/me");
      setUser(res.data);
    } catch (err) {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    await loadMe();
  }

  async function register(payload) {
    const res = await api.post("/auth/register", payload);
    localStorage.setItem("token", res.data.token);
    await loadMe();
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout, reload: loadMe }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}