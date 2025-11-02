"use client";

import { useOAuth } from "@/hooks/useOAuth";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Github, Mail } from "lucide-react";
import { isTauri as checkIsTauri } from "@/utils/is-tauri";

export function OAuthLogin() {
  const { login, logout, isAuthenticated, isLoading } = useOAuth();
  const [googleAuth, setGoogleAuth] = useState(false);
  const [githubAuth, setGithubAuth] = useState(false);
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    // Check if running in Tauri (async check is more reliable)
    const checkTauri = async () => {
      // First try synchronous check
      let tauri = checkIsTauri();

      // If that doesn't work, try async check by importing the API
      if (!tauri) {
        try {
          const { checkTauriAsync } = await import("@/utils/is-tauri");
          tauri = await checkTauriAsync();
        } catch {
          // If async check fails, we're definitely not in Tauri
          tauri = false;
        }
      }

      console.log(
        "Tauri detection:",
        tauri,
        "window.__TAURI__:",
        typeof window !== "undefined" ? (window as any).__TAURI__ : "N/A"
      );
      setIsTauri(tauri);

      // Check authentication status only if we're actually in Tauri
      if (tauri) {
        isAuthenticated("google")
          .then(setGoogleAuth)
          .catch(() => setGoogleAuth(false));
        isAuthenticated("github")
          .then(setGithubAuth)
          .catch(() => setGithubAuth(false));
      } else {
        // Make sure auth states are false when not in Tauri
        setGoogleAuth(false);
        setGithubAuth(false);
      }
    };

    checkTauri();
  }, [isAuthenticated]);

  // Listen for OAuth callback
  useEffect(() => {
    if (!isTauri) return;

    let unlisten: (() => void) | null = null;

    const handleUrl = (url: string) => {
      if (url.startsWith("myapp://callback")) {
        const params = new URLSearchParams(url.split("?")[1] || "");
        const code = params.get("code");
        const error = params.get("error");

        if (error) {
          console.error("OAuth error:", error);
        } else if (code) {
          console.log("OAuth code received:", code);
          // The code will be handled by the useOAuth hook
          // Refresh auth status
          isAuthenticated("google").then(setGoogleAuth);
          isAuthenticated("github").then(setGithubAuth);
        }
      }
    };

    // Listen for OAuth callback events from deep-link plugin
    const setupListeners = async () => {
      if (typeof window !== "undefined" && window.__TAURI__) {
        const { listen } = await import("@tauri-apps/api/event");

        // Listen for OAuth callback events emitted by Rust backend
        listen<string>("oauth-callback", (event) => {
          handleUrl(event.payload);
        })
          .then((unlistenFn) => {
            unlisten = unlistenFn;
          })
          .catch(console.error);
      }
    };

    setupListeners();

    return () => {
      if (unlisten) unlisten();
    };
  }, [isTauri, isAuthenticated]);

  if (!isTauri) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          OAuth login is only available in the Tauri desktop app.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">OAuth Login</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Google OAuth */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <span className="font-medium">Google</span>
            </div>
            {googleAuth && (
              <span className="text-xs text-green-600">Authenticated</span>
            )}
          </div>
          <Button
            onClick={() => login("google")}
            disabled={isLoading}
            className="mt-4 w-full"
            variant={googleAuth ? "outline" : "default"}
          >
            {googleAuth ? "Re-authenticate" : "Login with Google"}
          </Button>
          {googleAuth && (
            <Button
              onClick={() => {
                logout("google");
                setGoogleAuth(false);
              }}
              variant="ghost"
              className="mt-2 w-full"
              size="sm"
            >
              Logout
            </Button>
          )}
        </div>

        {/* GitHub OAuth */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              <span className="font-medium">GitHub</span>
            </div>
            {githubAuth && (
              <span className="text-xs text-green-600">Authenticated</span>
            )}
          </div>
          <Button
            onClick={() => login("github")}
            disabled={isLoading}
            className="mt-4 w-full"
            variant={githubAuth ? "outline" : "default"}
          >
            {githubAuth ? "Re-authenticate" : "Login with GitHub"}
          </Button>
          {githubAuth && (
            <Button
              onClick={() => {
                logout("github");
                setGithubAuth(false);
              }}
              variant="ghost"
              className="mt-2 w-full"
              size="sm"
            >
              Logout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
