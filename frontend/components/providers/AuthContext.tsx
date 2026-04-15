"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, UserResponse, AuthResponse } from "@/lib/api";

interface User extends UserResponse {}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("fahin_token");
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (t: string) => {
    try {
      const userData = await api.auth.me(t);
      setUser(userData);
    } catch (err) {
      console.error("Failed to fetch user", err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string) => {
    const { access_token } = await api.auth.login({ email, password: "dev_password" });
    localStorage.setItem("fahin_token", access_token);
    setToken(access_token);
    await fetchUser(access_token);
    router.push("/dashboard");
  };

  const register = async (data: any) => {
    const { access_token } = await api.auth.register(data);
    localStorage.setItem("fahin_token", access_token);
    setToken(access_token);
    await fetchUser(access_token);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("fahin_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
