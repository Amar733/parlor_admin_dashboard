// ===================================================================================
// API UTILITIES
// Helper functions for making API calls to your external backend
// ===================================================================================

import { API_BASE_URL } from "@/config/api";

// Generic API call function
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

// GET request helper
export function apiGet<T = any>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: "GET" });
}

// POST request helper
export function apiPost<T = any>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PUT request helper
export function apiPut<T = any>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// DELETE request helper
export function apiDelete<T = any>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: "DELETE" });
}
