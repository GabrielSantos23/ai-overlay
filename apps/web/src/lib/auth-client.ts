import type { auth } from "@tauri-ai-overlay/auth";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { isTauri } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { platform } from "@tauri-apps/plugin-os";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
  fetchOptions: {
    customFetchImpl: (...params) =>
      isTauri() &&
      platform() === "macos" &&
      window.location.protocol === "tauri:"
        ? tauriFetch(...params)
        : fetch(...params),
  },
  plugins: [inferAdditionalFields<typeof auth>()],
});
