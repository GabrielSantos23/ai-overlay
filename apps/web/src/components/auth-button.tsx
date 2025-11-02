"use client";

import { useSession, useSignIn, useSignOut } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

/**
 * Example login/logout button component using the new auth hooks
 */
export function AuthButton() {
  const { user, isAuthenticated, isLoading } = useSession();
  const { signIn, isLoading: isSigningIn } = useSignIn();
  const { signOut, isLoading: isSigningOut } = useSignOut();

  if (isLoading) {
    return (
      <Button disabled>
        Carregando...
      </Button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.image && (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm font-medium">
            {user.name || user.email}
          </span>
        </div>
        <Button
          onClick={() => signOut()}
          disabled={isSigningOut}
          variant="destructive"
        >
          {isSigningOut ? "Saindo..." : "Sair"}
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn()} disabled={isSigningIn}>
      {isSigningIn ? "Entrando..." : "Entrar com Google"}
    </Button>
  );
}

