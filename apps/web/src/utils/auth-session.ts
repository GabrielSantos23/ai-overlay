/**
 * Utilities for handling NextAuth session tokens
 * Works with the tRPC auth router
 */

import { getToken, setToken, deleteToken } from "@/stores/auth";

/**
 * Extract session token from NextAuth callback URL
 * This is called after NextAuth redirects back from OAuth
 */
export function extractTokenFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("token") || urlObj.searchParams.get("session_token");
  } catch {
    return null;
  }
}

/**
 * Handle NextAuth callback and store token
 * Should be called from your callback route/page
 */
export async function handleAuthCallback(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // Try to get token from URL
  const token = extractTokenFromUrl(window.location.href);
  
  if (token) {
    await setToken(token);
    return token;
  }

  return null;
}

/**
 * Check if we have a valid token stored
 */
export async function hasStoredToken(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}

/**
 * Clear all auth data
 */
export async function clearAuth(): Promise<void> {
  await deleteToken();
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("tauri_session_token");
    localStorage.removeItem("tauri_user_session");
  }
}

