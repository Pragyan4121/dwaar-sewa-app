import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/api/client";
import { getToken, setToken, clearToken } from "@/api/storage";
import type { LoginResponse, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (
    fullName: string,
    phone: string,
    password: string,
    email?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const { data } = await api.get<{ user: User }>("/users/me");
          setUser(data.user);
        }
      } catch {
        await clearToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(identifier: string, password: string) {
    const trimmed = identifier.trim();
    const isEmail = trimmed.includes("@");

    const { data } = await api.post<LoginResponse>("/users/login", {
      ...(isEmail ? { email: trimmed.toLowerCase() } : { phone: trimmed }),
      password,
    });
    await setToken(data.token);
    setUser(data.user);
  }

  async function register(
    fullName: string,
    phone: string,
    password: string,
    email?: string,
  ) {
    const { data } = await api.post<LoginResponse>("/users/register", {
      fullName,
      phone,
      password,
      email,
    });
    await login(phone, password);
  }

  async function logout() {
    await clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
