"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/trpc";

/**
 * Callback component to handle OAuth redirects
 * Gets the NextAuth session - cookies are automatically handled
 */
export function AuthCallback() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isProcessing, setIsProcessing] = useState(true);
  const isTauri = typeof window !== "undefined" && !!(window as any).__TAURI_INTERNALS__;
  
  // Verify session via tRPC
  const { data: trpcSession } = api.auth.getSession.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user) {
      // Wait a moment for tRPC session to be available
      const timer = setTimeout(() => {
        setIsProcessing(false);
        router.push("/");
        router.refresh();
      }, 500);
      
      return () => clearTimeout(timer);
    } else if (status === "unauthenticated") {
      // Authentication failed
      setIsProcessing(false);
      router.push("/?error=auth_failed");
    }
  }, [session, status, router, trpcSession]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">
          {isProcessing ? "Completando login..." : "Redirecionando..."}
        </p>
        {isTauri && (
          <p className="mt-2 text-sm text-gray-500">
            Você pode fechar esta janela após o login
          </p>
        )}
      </div>
    </div>
  );
}

