"use client";

import { useState, useCallback } from "react";
import {
  initiateOAuthFlow,
  completeOAuthFlow,
  getToken,
  removeToken,
  hasToken,
} from "@/utils/oauth";
import { isTauri } from "@/utils/is-tauri";
import { toast } from "sonner";

type OAuthProvider = "google" | "github";

interface UseOAuthReturn {
  login: (provider: OAuthProvider) => Promise<void>;
  logout: (provider: OAuthProvider) => Promise<void>;
  getAccessToken: (provider: OAuthProvider) => Promise<string | null>;
  isAuthenticated: (provider: OAuthProvider) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useOAuth(): UseOAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (provider: OAuthProvider) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if we're in a Tauri environment
      if (!isTauri()) {
        throw new Error(
          "OAuth login is only available in the Tauri desktop app"
        );
      }

      await completeOAuthFlow(provider);
      toast.success(`Successfully logged in with ${provider}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to login";
      setError(errorMessage);
      toast.error(`Login failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (provider: OAuthProvider) => {
    try {
      await removeToken(provider);
      toast.success(`Logged out from ${provider}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to logout";
      setError(errorMessage);
      toast.error(`Logout failed: ${errorMessage}`);
    }
  }, []);

  const getAccessToken = useCallback(
    async (provider: OAuthProvider): Promise<string | null> => {
      try {
        return await getToken(provider);
      } catch (err) {
        console.error(`Failed to get token for ${provider}:`, err);
        return null;
      }
    },
    []
  );

  const isAuthenticated = useCallback(
    async (provider: OAuthProvider): Promise<boolean> => {
      try {
        return await hasToken(provider);
      } catch (err) {
        console.error(`Failed to check authentication for ${provider}:`, err);
        return false;
      }
    },
    []
  );

  return {
    login,
    logout,
    getAccessToken,
    isAuthenticated,
    isLoading,
    error,
  };
}
