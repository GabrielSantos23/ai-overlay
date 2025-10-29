import type { AppRouter } from "@tauri-ai-overlay/api/routers/index";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

// Detect if running in Tauri
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(error.message, {
        action: {
          label: "retry",
          onClick: () => {
            queryClient.invalidateQueries();
          },
        },
      });
    },
  }),
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_SERVER_URL}/trpc`,
      async fetch(url, options) {
        // Use Tauri's fetch in production, browser fetch in dev
        const fetchFn = isTauri ? tauriFetch : fetch;

        return fetchFn(url, {
          ...options,
          credentials: "include",
        } as any);
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
