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
    // In Tauri, use production proxy URL (your Vercel URL)
    return process.env.NEXT_PUBLIC_PROXY_URL || "http://localhost:3000";
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
      const urlObj = new URL(urlToOpen);
      const cleanUrl = urlObj.toString();
      console.log(`[OAuth] Retrying with cleaned URL: ${cleanUrl}`);
      await open(cleanUrl);
    }

    // Step 3: Wait for callback using both deep links and polling
    console.log(`[OAuth] Waiting for callback...`);
    const token = await waitForAuthCallback(sessionId);

    console.log(`[OAuth] Token received`);

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
    let pollingInterval: NodeJS.Timeout | null = null;
    let resolved = false;

    const cleanup = () => {
      console.log(`[OAuth] Cleaning up listeners`);
      if (deepLinkUnlisten) {
        deepLinkUnlisten();
        deepLinkUnlisten = null;
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    const resolveWithToken = (token: string) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      cleanup();
      resolve(token);
    };

    const timeout = setTimeout(() => {
      if (!resolved) {
        console.error(`[OAuth] Timeout waiting for callback`);
        cleanup();
        reject(new Error("Authentication timeout - please try again"));
      }
    }, 5 * 60 * 1000);

    // Strategy 1: Listen for deep link events
    try {
      console.log(`[OAuth] Registering deep link listener...`);
      deepLinkUnlisten = await listen<string | string[]>(
        "deep-link-received",
        (event) => {
          if (resolved) return;

          console.log(`[OAuth] Deep link event received:`, event);

          try {
            const urls = Array.isArray(event.payload)
              ? event.payload
              : [event.payload];

            for (const urlStr of urls) {
              const urlString = String(urlStr);
              console.log(`[OAuth] Processing URL: ${urlString}`);

              if (urlString.startsWith("myapp://callback")) {
                const parts = urlString.split("?");
                if (parts.length > 1) {
                  const params = new URLSearchParams(parts[1]);
                  const token = params.get("token");
                  const receivedSessionId = params.get("sessionId");

                  console.log(`[OAuth] Extracted parameters:`, {
                    hasToken: !!token,
                    sessionMatch: receivedSessionId === sessionId,
                  });

                  if (token && receivedSessionId === sessionId) {
                    console.log(
                      `[OAuth] ✓ Token received successfully via deep link`
                    );
                    resolveWithToken(token);
                    return;
                  }
                }
              }
            }
          } catch (e) {
            console.error("[OAuth] Error parsing deep link:", e);
          }
        }
      );

      console.log(`[OAuth] ✓ Deep link listener registered`);
    } catch (e) {
      console.error("[OAuth] Failed to set up deep link listener:", e);
    }

    // Strategy 2: Poll the proxy server (fallback for when deep links don't work)
    console.log(`[OAuth] Starting polling fallback...`);
    let pollAttempts = 0;
    const maxPollAttempts = 60; // 60 attempts * 5 seconds = 5 minutes

    pollingInterval = setInterval(async () => {
      if (resolved) {
        cleanup();
        return;
      }

      pollAttempts++;

      if (pollAttempts > maxPollAttempts) {
        console.error(`[OAuth] Max polling attempts reached`);
        cleanup();
        if (!resolved) {
          reject(new Error("Authentication timeout - please try again"));
        }
        return;
      }

      try {
        console.log(
          `[OAuth] Polling attempt ${pollAttempts}/${maxPollAttempts}`
        );

        const response = await fetch(`${PROXY_URL}/auth/status/${sessionId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();

          if (data.status === "complete" && data.token) {
            console.log(`[OAuth] ✓ Token received successfully via polling`);
            resolveWithToken(data.token);
          } else {
            console.log(`[OAuth] Auth still pending...`);
          }
        } else if (response.status === 404) {
          console.log(`[OAuth] Session not found or expired`);
          cleanup();
          if (!resolved) {
            reject(new Error("Session expired - please try again"));
          }
        }
      } catch (e) {
        console.error(`[OAuth] Polling error:`, e);
        // Continue polling despite errors
      }
    }, 5000); // Poll every 5 seconds
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
