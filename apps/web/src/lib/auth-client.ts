import type { auth } from "@tauri-ai-overlay/auth";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

// Detect if running in Tauri
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
  // Add custom fetch for Tauri
  fetchOptions: {
    customFetchImpl: isTauri ? (tauriFetch as any) : undefined,
    credentials: "include",
  },
});
