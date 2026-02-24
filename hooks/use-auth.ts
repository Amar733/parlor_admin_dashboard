"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";

export interface User {
  _id: string;
  id: string; // Added for compatibility with existing code
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  permissions: string[];
  specialization?: string;
  bio?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    toast({
      title: "Session Expired",
      description: "You have been logged out. Please log in again.",
    });
    localStorage.removeItem("srmarnik_user");
    localStorage.removeItem("srmarnik_token");
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    try {
      const userItem = localStorage.getItem("srmarnik_user");
      const tokenItem = localStorage.getItem("srmarnik_token");
      if (userItem && tokenItem) {
        setUser(JSON.parse(userItem));
        setToken(tokenItem);
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
      localStorage.removeItem("srmarnik_user");
      localStorage.removeItem("srmarnik_token");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserContext = useCallback((updatedUserData: User) => {
    setUser(updatedUserData);
    localStorage.setItem("srmarnik_user", JSON.stringify(updatedUserData));
  }, []);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const currentToken = localStorage.getItem("srmarnik_token");

      // Build full URL if input is a relative path
      const url =
        typeof input === "string" && input.startsWith("/")
          ? `${API_BASE_URL}${input}`
          : input;

      const headers = new Headers(init?.headers);
      if (currentToken) {
        headers.set("Authorization", `Bearer ${currentToken}`);
      }

      const response = await fetch(url, {
        ...init,
        headers,
      });

      if (response.status === 401) {
        logout();
        throw new Error("Session expired. Please log in again.");
      }

      return response;
    },
    [logout]
  );

  const login = async (email: string, pass: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: pass }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Login failed");
    }

    const { token: newToken, user: userData }: { token: string; user: User } =
      await response.json();
    localStorage.setItem("srmarnik_user", JSON.stringify(userData));
    localStorage.setItem("srmarnik_token", newToken);
    setUser(userData);
    setToken(newToken);
  };

  return { user, token, login, logout, loading, authFetch, updateUserContext };
}














