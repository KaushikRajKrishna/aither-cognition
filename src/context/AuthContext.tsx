import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, type AuthResponse } from "@/lib/api";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  register: (
    name: string, email: string, password: string,
    dateOfBirth: string, gender: string,
    whyHere?: string, feelingToday?: string,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = (data: AuthResponse) => {
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const register = async (
    name: string, email: string, password: string,
    dateOfBirth: string, gender: string,
    whyHere = "", feelingToday = "",
  ) => {
    const data = await authApi.register(name, email, password, dateOfBirth, gender, whyHere, feelingToday);
    handleAuth(data);
  };

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    handleAuth(data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
