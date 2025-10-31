import Header from "@/components/header";
import Loader from "@/components/loader";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { trpc } from "@/utils/trpc";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useApp } from "@/hooks/useApp";
import "../index.css";
import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useDeepLinkAuth } from "@/hooks/useDeepLinkAuth";
export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "tauri-ai-overlay",
      },
      {
        name: "description",
        content: "tauri-ai-overlay is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  });
  const navigate = useNavigate();

  // Initialize app (including shortcuts)
  useApp();
  useDeepLinkAuth();

  // Listen for deep link callback after OAuth login
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    (async () => {
      unlisten = await listen<string>("deep-link-received", async (event) => {
        const url = event.payload;
        try {
          const parsed = new URL(url);
          if (
            parsed.protocol === "ai-overlay:" &&
            parsed.pathname === "/auth/callback"
          ) {
            toast.success("Login successful");
            // Navigate into the app; cookies should be set by the server's domain
            navigate({ to: "/main" });
          }
        } catch {
          // Ignore malformed URLs
        }
      });
    })();
    return () => {
      if (unlisten) unlisten();
    };
  }, [navigate]);

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <div className="">{isFetching ? <Loader /> : <Outlet />}</div>
        <Toaster position="top-right" />
      </ThemeProvider>
      {/*<TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />*/}
    </>
  );
}
