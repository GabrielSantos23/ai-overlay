import { getToken } from "./oauth";

// Get authorization header with token for API calls
export async function getAuthHeader(
  provider: "google" | "github"
): Promise<Record<string, string> | null> {
  try {
    const token = await getToken(provider);
    if (!token) {
      return null;
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.error(`Failed to get auth header for ${provider}:`, error);
    return null;
  }
}

// Example: Make authenticated API call
export async function makeAuthenticatedRequest(
  url: string,
  provider: "google" | "github",
  options: RequestInit = {}
): Promise<Response> {
  const authHeader = await getAuthHeader(provider);

  if (!authHeader) {
    throw new Error(`Not authenticated with ${provider}`);
  }

  return fetch(url, {
    ...options,
    headers: {
      ...authHeader,
      ...options.headers,
      "Content-Type": "application/json",
    },
  });
}

// Example: Get user profile from provider
export async function getUserProfile(
  provider: "google" | "github"
): Promise<any> {
  const token = await getToken(provider);
  if (!token) {
    throw new Error(`Not authenticated with ${provider}`);
  }

  const apiUrl =
    provider === "google"
      ? "https://www.googleapis.com/oauth2/v2/userinfo"
      : "https://api.github.com/user";

  const response = await makeAuthenticatedRequest(apiUrl, provider);

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.statusText}`);
  }

  return response.json();
}

