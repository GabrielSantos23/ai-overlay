"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsAuthenticated, useUser } from "@/hooks/useAuth";
import { useSignIn } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Component to protect routes that require authentication
 * Shows children only if user is authenticated
 */
export function ProtectedRoute({
  children,
  fallback,
  redirectTo = "/",
}: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const router = useRouter();
  const { signIn } = useSignIn();

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      // User is not authenticated, redirect or show login
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, user, router, redirectTo]);

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg">Você precisa estar logado para acessar esta página</p>
        <button
          onClick={() => signIn()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Fazer Login
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

