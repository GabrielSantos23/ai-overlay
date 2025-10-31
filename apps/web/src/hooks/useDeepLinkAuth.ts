import { useEffect } from "react";
import { setupBetterAuthTauri } from "@daveyplate/better-auth-tauri";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function useDeepLinkAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const cleanup = setupBetterAuthTauri({
      authClient,
      scheme: "ai-overlay",
      debugLogs: true, // ative para debug
      onRequest: (href) => {
        console.log("🔗 Auth request:", href);
      },
      onSuccess: (callbackURL) => {
        console.log("✅ Auth successful, redirecting to:", callbackURL);
        toast.success("Login realizado com sucesso!");
        navigate({ to: callbackURL || "/main" });
      },
      onError: (error) => {
        console.error("❌ Auth error:", error);
        toast.error("Erro na autenticação: " + error);
      },
    });

    return cleanup;
  }, [navigate]);
}
