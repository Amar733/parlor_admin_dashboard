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

      console.log('Making API request to:', url);
      console.log('With token:', currentToken ? 'Present' : 'Missing');

      try {
        const response = await fetch(url, {
          ...init,
          headers,
        });

        console.log('API Response status:', response.status);

        if (response.status === 401) {
          console.log('401 Unauthorized for URL:', url);
          console.log('Token used:', currentToken?.substring(0, 20) + '...');
          // Only logout for auth-specific endpoints, not data endpoints
          if (url.toString().includes('/auth/') || url.toString().includes('/api/auth/')) {
            logout();
            throw new Error("Session expired. Please log in again.");
          }
          // For other endpoints, just return the response without logging out
        }

        return response;
      } catch (error) {
        console.error('API Request failed:', error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.error('Network error - check if backend is running at:', API_BASE_URL);
        }
        throw error;
      }
    },
    [logout]
  );

  const login = async (email: string, pass: string): Promise<void> => {
    console.log('Attempting login to:', `${API_BASE_URL}/api/auth/login`);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: pass }),
    });

    console.log('Login response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Login failed:', errorData);
      throw new Error(errorData.message || "Login failed");
    }

    const { token: newToken, user: userData }: { token: string; user: User } =
      await response.json();
    
    console.log('Login successful, token received:', newToken ? 'Yes' : 'No');
    console.log('User data:', userData);
    
    localStorage.setItem("srmarnik_user", JSON.stringify(userData));
    localStorage.setItem("srmarnik_token", newToken);
    setUser(userData);
    setToken(newToken);
  };

  return { user, token, login, logout, loading, authFetch, updateUserContext };
}














