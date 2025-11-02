"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * User menu component that shows user info and sign out option
 * Uses the tRPC auth router
 */
export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (status !== "authenticated" || !session?.user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 focus:outline-none">
          {session?.user.image ? (
            <img
              src={session?.user.image}
              alt={session?.user.name || "User"}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium">
                {session?.user.name?.[0]?.toUpperCase() ||
                  session?.user.email?.[0]?.toUpperCase() ||
                  "U"}
              </span>
            </div>
          )}
          <span className="hidden md:block text-sm font-medium">
            {session?.user.name || session?.user.email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session?.user.name}
            </p>
            {session?.user.email && (
              <p className="text-xs leading-none text-muted-foreground">
                {session?.user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>Saindo...</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
