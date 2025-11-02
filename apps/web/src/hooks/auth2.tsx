// src/hooks/auth2.tsx
import { open } from "@tauri-apps/plugin-shell";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

// Helper to get proxy URL - use production URL in Tauri, localhost otherwise
function getProxyUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_PROXY_URL || "http://localhost:3000";
  }

  // Check if we're in Tauri
  const isTauri =
    "__TAURI__" in window &&
    typeof (window as any).__TAURI__ !== "undefined" &&
    "__TAURI_INTERNALS__" in window;

  if (isTauri) {
    // In Tauri, use production proxy URL
    return process.env.NEXT_PUBLIC_PROXY_URL || "https://proxy.bangg.xyz";
  }

  // In browser/Next.js, use localhost or env var
  return process.env.NEXT_PUBLIC_PROXY_URL || "http://localhost:3000";
}

const PROXY_URL = getProxyUrl();

interface AuthResponse {
  authUrl: string;
  sessionId: string;
}

export async function loginWithOAuth(provider: string): Promise<string> {
  try {
    console.log(`[OAuth] Starting OAuth flow for provider: ${provider}`);
    console.log(`[OAuth] Using proxy URL: ${PROXY_URL}`);

    // Step 1: Initialize OAuth flow
    let response: Response;
    try {
      response = await fetch(`${PROXY_URL}/auth/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          callbackUrl: "myapp://callback",
        }),
      });
    } catch (fetchError) {
      console.error(`[OAuth] Fetch error:`, fetchError);
      throw new Error(
        `Failed to connect to proxy server at ${PROXY_URL}. ` +
          `Make sure the proxy is running and accessible. Error: ${
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError)
          }`
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `[OAuth] Proxy returned error: ${response.status}`,
        errorText
      );
      throw new Error(
        `Failed to initialize OAuth flow: ${response.status} - ${errorText}`
      );
    }

    const { authUrl, sessionId }: AuthResponse = await response.json();
    console.log(`[OAuth] Auth URL generated: ${authUrl}`);
    console.log(`[OAuth] Session ID: ${sessionId}`);

    // Step 2: Open browser
    // Validate and clean the URL before opening
    let urlToOpen = authUrl.trim();
    if (!urlToOpen.startsWith("http://") && !urlToOpen.startsWith("https://")) {
      console.error(`[OAuth] Invalid URL format: ${urlToOpen}`);
      throw new Error(`Invalid auth URL format: ${urlToOpen}`);
    }

    console.log(`[OAuth] Opening browser with URL: ${urlToOpen}`);
    try {
      await open(urlToOpen);
    } catch (openError) {
      console.error(`[OAuth] Failed to open URL:`, openError);
      // Fallback: try to open without validation
      const urlObj = new URL(urlToOpen);
      const cleanUrl = urlObj.toString();
      console.log(`[OAuth] Retrying with cleaned URL: ${cleanUrl}`);
      await open(cleanUrl);
    }

    // Step 3: Wait for callback
    console.log(`[OAuth] Waiting for callback...`);
    const token = await waitForAuthCallback(sessionId);

    console.log(`[OAuth] Token received: ${token}`);

    try {
      await invoke("show_overlay_window");
      console.log("[OAuth] Overlay window shown");
    } catch (error) {
      console.error("[OAuth] Failed to show overlay window:", error);
    }

    return token;
  } catch (error) {
    console.error("[OAuth] Login error:", error);
    throw error;
  }
}

function waitForAuthCallback(sessionId: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    console.log(
      `[OAuth] Setting up callback listener for session: ${sessionId}`
    );

    let deepLinkUnlisten: (() => void) | null = null;
    let resolved = false;

    const cleanup = () => {
      console.log(`[OAuth] Cleaning up listeners`);
      if (deepLinkUnlisten) {
        deepLinkUnlisten();
        deepLinkUnlisten = null;
      }
    };

    const timeout = setTimeout(() => {
      if (!resolved) {
        console.error(`[OAuth] Timeout waiting for callback`);
        cleanup();
        reject(new Error("Authentication timeout - please try again"));
      }
    }, 5 * 60 * 1000);

    // Listen for deep link events
    try {
      console.log(`[OAuth] Registering deep link listener...`);
      deepLinkUnlisten = await listen<string | string[]>(
        "deep-link-received",
        (event) => {
          if (resolved) {
            console.log(`[OAuth] Already resolved, ignoring event`);
            return;
          }

          console.log(`[OAuth] Deep link event received:`, event);
          console.log(`[OAuth] Event payload type:`, typeof event.payload);
          console.log(`[OAuth] Event payload:`, event.payload);

          try {
            // Handle both string and array payloads
            const urls = Array.isArray(event.payload)
              ? event.payload
              : [event.payload];

            console.log(`[OAuth] Processing ${urls.length} URL(s)`);

            for (const urlStr of urls) {
              const urlString = String(urlStr);
              console.log(`[OAuth] Processing URL: ${urlString}`);

              // Parse myapp:// URL
              if (urlString.startsWith("myapp://callback")) {
                console.log(`[OAuth] Matched myapp://callback URL`);

                const parts = urlString.split("?");
                if (parts.length > 1) {
                  const params = new URLSearchParams(parts[1]);
                  const token = params.get("token");
                  const receivedSessionId = params.get("sessionId");
                  const email = params.get("email");
                  const name = params.get("name");

                  console.log(`[OAuth] Extracted parameters:`, {
                    token: token ? `${token.substring(0, 10)}...` : null,
                    receivedSessionId,
                    expectedSessionId: sessionId,
                    email,
                    name,
                  });

                  if (token && receivedSessionId === sessionId) {
                    console.log(
                      `[OAuth] ✓ Token received successfully via deep link`
                    );
                    resolved = true;
                    clearTimeout(timeout);
                    cleanup();
                    resolve(token);
                    return;
                  } else {
                    console.warn(`[OAuth] Session ID mismatch or no token`, {
                      hasToken: !!token,
                      sessionMatch: receivedSessionId === sessionId,
                    });
                  }
                } else {
                  console.warn(`[OAuth] No query parameters in URL`);
                }
              } else {
                console.log(
                  `[OAuth] URL does not match myapp://callback pattern`
                );
              }
            }
          } catch (e) {
            console.error("[OAuth] Error parsing deep link:", e);
          }
        }
      );

      console.log(`[OAuth] ✓ Deep link listener registered successfully`);
    } catch (e) {
      console.error("[OAuth] Failed to set up deep link listener:", e);
      reject(new Error("Failed to set up authentication listener"));
    }
  });
}

export async function authenticatedFetch(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${PROXY_URL}/api${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function getUserSession(token: string) {
  try {
    // The token is actually the NextAuth session token (encrypted JWT)
    // We need to send it as a cookie, not as Authorization header
    const response = await fetch(`${PROXY_URL}/api/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get user session: ${response.status} - ${errorText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("[OAuth] Error fetching user session:", error);
    throw error;
  }
}

export async function logout() {
  try {
    await invoke("hide_overlay_window");
    console.log("[OAuth] Overlay window hidden");
  } catch (error) {
    console.error("[OAuth] Failed to hide overlay window:", error);
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}
