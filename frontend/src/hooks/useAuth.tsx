import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loginUser, registerUser } from "@/services/auth";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("hiresense_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("hiresense_user");
      }
    }
    setIsLoading(false);
  }, []);

  function persistSession(token: string, nextUser: User) {
    localStorage.setItem("hiresense_token", token);
    localStorage.setItem("hiresense_user", JSON.stringify(nextUser));
    setUser(nextUser);
  }

  async function login(email: string, password: string) {
    const data = await loginUser(email, password);
    persistSession(data.access_token, data.user);
  }

  async function register(name: string, email: string, password: string) {
    const data = await registerUser(name, email, password);
    persistSession(data.access_token, data.user);
  }

  function logout() {
    localStorage.removeItem("hiresense_token");
    localStorage.removeItem("hiresense_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
