import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import { Store } from "@tauri-apps/plugin-store";
import { listen } from "@tauri-apps/api/event";
import { isTauri } from "./is-tauri";

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  authUrl: string;
}

interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

// OAuth configurations
export const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || "",
    redirectUri: "myapp://callback",
    scope: "openid email profile",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  },
  github: {
    clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "",
    clientSecret: process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET || "",
    redirectUri: "myapp://callback",
    scope: "user:email",
    authUrl: "https://github.com/login/oauth/authorize",
  },
};

// Generate authorization URL
export function generateAuthUrl(provider: "google" | "github"): string {
  const config = OAUTH_CONFIGS[provider];
  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scope,
    access_type: provider === "google" ? "offline" : "",
    prompt: provider === "google" ? "consent" : "",
  });

  return `${config.authUrl}?${params.toString()}`;
}

// Open OAuth URL in system browser
export async function openOAuthUrl(url: string): Promise<void> {
  if (!isTauri()) {
    throw new Error("Opening OAuth URL is only available in Tauri environment");
  }
  await open(url);
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(
  provider: "google" | "github",
  code: string
): Promise<TokenResponse> {
  if (!isTauri()) {
    throw new Error("Token exchange is only available in Tauri environment");
  }
  const config = OAUTH_CONFIGS[provider];
  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const response = await invoke<TokenResponse>("exchange_code_for_token", {
    provider,
    code,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
  });

  return response;
}

// Store token securely
let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    if (!isTauri()) {
      throw new Error("Store is only available in Tauri environment");
    }
    store = new Store(".oauth-tokens.dat");
  }
  return store;
}

export async function storeToken(
  provider: string,
  token: string
): Promise<void> {
  if (!isTauri()) {
    throw new Error("Token storage is only available in Tauri environment");
  }
  const tokenStore = await getStore();
  await tokenStore.set(`token_${provider}`, token);
  await tokenStore.save();
}

// Get stored token
export async function getToken(provider: string): Promise<string | null> {
  if (!isTauri()) {
    // Return null if not in Tauri instead of throwing
    return null;
  }
  try {
    const tokenStore = await getStore();
    const token = await tokenStore.get<string>(`token_${provider}`);
    return token || null;
  } catch (error) {
    console.error("Failed to get token:", error);
    return null;
  }
}

// Remove token
export async function removeToken(provider: string): Promise<void> {
  if (!isTauri()) {
    throw new Error("Token removal is only available in Tauri environment");
  }
  const tokenStore = await getStore();
  await tokenStore.delete(`token_${provider}`);
  await tokenStore.save();
}

// Check if token exists
export async function hasToken(provider: string): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }
  try {
    const token = await getToken(provider);
    return token !== null;
  } catch (error) {
    console.error("Failed to check token:", error);
    return false;
  }
}

// Parse OAuth callback URL
export function parseCallbackUrl(url: string): {
  code?: string;
  error?: string;
  state?: string;
} {
  try {
    const parsedUrl = new URL(url);
    const code = parsedUrl.searchParams.get("code");
    const error = parsedUrl.searchParams.get("error");
    const state = parsedUrl.searchParams.get("state");

    return {
      code: code || undefined,
      error: error || undefined,
      state: state || undefined,
    };
  } catch (e) {
    return {};
  }
}

// Main OAuth flow function
export async function initiateOAuthFlow(
  provider: "google" | "github"
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    // Check if running in Tauri
    if (!isTauri()) {
      reject(new Error("OAuth flow is only available in Tauri app"));
      return;
    }

    try {
      // Generate auth URL
      const authUrl = generateAuthUrl(provider);
      
      // Listen for OAuth callback from deep-link plugin
      if (!isTauri()) {
        reject(new Error("OAuth flow is only available in Tauri app"));
        return;
      }
      
      const unlisten = await listen<string>("oauth-callback", (event) => {
        const url = event.payload;
        if (url && url.startsWith("myapp://callback")) {
          unlisten();
          
          const { code, error } = parseCallbackUrl(url);
          
          if (error) {
            reject(new Error(`OAuth error: ${error}`));
          } else if (code) {
            resolve(code);
          } else {
            reject(new Error("No authorization code in callback"));
          }
        }
      });

      // Open browser
      await openOAuthUrl(authUrl);

      // Timeout after 5 minutes
      setTimeout(() => {
        unlisten();
        reject(new Error("OAuth flow timed out"));
      }, 5 * 60 * 1000);
    } catch (err) {
      reject(err);
    }
  });
}

// Complete OAuth flow: initiate, exchange, and store
export async function completeOAuthFlow(
  provider: "google" | "github"
): Promise<TokenResponse> {
  // Step 1: Initiate OAuth flow and get code
  const code = await initiateOAuthFlow(provider);

  // Step 2: Exchange code for token
  const tokenResponse = await exchangeCodeForToken(provider, code);

  // Step 3: Store token securely
  await storeToken(provider, tokenResponse.access_token);

  return tokenResponse;
}

