// ===================================================================================
// ASSET UTILITIES
// Helper functions for handling asset URLs from your external backend
// ===================================================================================

import { API_BASE_URL } from "@/config/api";

/**
 * Converts a relative asset URL to a full URL using the base URL
 * @param assetUrl - The asset URL (can be relative or absolute)
 * @returns Full URL for the asset
 */
export function getAssetUrl(assetUrl: string | undefined | null): string {
  if (!assetUrl) {
    return ""; // Return empty string for null/undefined
  }

  // If it contains an internal IP address, replace it with the base URL
  if (assetUrl.includes("192.168.29.22:9001")) {
    return assetUrl.replace("http://192.168.29.22:9001", API_BASE_URL);
  }

  // If it's already a full URL (starts with http/https), return as is
  if (assetUrl.startsWith("http://") || assetUrl.startsWith("https://")) {
    return assetUrl;
  }

  // If it's a relative URL starting with /, prepend the base URL
  if (assetUrl.startsWith("/")) {
    return `${API_BASE_URL}${assetUrl}`;
  }

  // If it's a relative URL without /, prepend base URL with /
  return `${API_BASE_URL}/${assetUrl}`;
}

/**
 * Gets the full URL for uploaded files
 * @param fileName - The filename or path
 * @returns Full URL for the uploaded file
 */
export function getUploadUrl(fileName: string | undefined | null): string {
  if (!fileName) {
    return "";
  }

  // If it contains an internal IP address, replace it with the base URL
  if (fileName.includes("192.168.29.22:9001")) {
    return fileName.replace("http://192.168.29.22:9001", API_BASE_URL);
  }

  // If already a full URL, return as is
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
    return fileName;
  }

  // Assume uploads are in /uploads/ directory
  const uploadPath = fileName.startsWith("/")
    ? fileName
    : `/uploads/${fileName}`;
  return `${API_BASE_URL}${uploadPath}`;
}
