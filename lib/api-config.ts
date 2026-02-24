// ===================================================================================
// API CONFIGURATION UTILITIES
// Helper functions for API URL management
// ===================================================================================

import { API_BASE_URL } from '@/config/api';

/**
 * Creates a full API URL from a relative endpoint
 * @param endpoint - The API endpoint (e.g., '/api/users')
 * @returns Full API URL
 */
export function createApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
}

/**
 * Creates a CMS API URL for doctor-specific content
 * @param doctorId - The doctor's ID
 * @param page - The page (e.g., 'home')
 * @param section - The section (e.g., 'carousel')
 * @returns Full CMS API URL
 */
export function createCmsApiUrl(doctorId: string, page: string, section: string): string {
  return `${API_BASE_URL}/api/cms/${page}/${section}_${doctorId}`;
}

/**
 * Creates an asset URL for uploaded files
 * @param assetPath - The asset path (e.g., '/uploads/image.jpg')
 * @returns Full asset URL
 */
export function createAssetUrl(assetPath: string): string {
  if (!assetPath) return '';
  if (assetPath.startsWith('http')) return assetPath;
  
  // Ensure the path starts with a slash
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Gets the current API base URL
 * @returns The configured API base URL
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * Checks if the current API base URL is localhost
 * @returns True if using localhost
 */
export function isLocalApi(): boolean {
  return API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
}

/**
 * Checks if the current API base URL is using HTTPS
 * @returns True if using HTTPS
 */
export function isSecureApi(): boolean {
  return API_BASE_URL.startsWith('https://');
}