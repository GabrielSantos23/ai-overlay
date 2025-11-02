"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "@/trpc";
import { AuthProvider } from "@/contexts/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <TRPCProvider>
          <AuthProvider>{children}</AuthProvider>
          <ReactQueryDevtools />
        </TRPCProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
