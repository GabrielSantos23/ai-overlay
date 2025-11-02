import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import { getToken } from "@/stores/auth";
import { getAPIUrl } from "@/utils/api";
import {
  appRouter,
  type AppRouter,
} from "../../../../packages/api/src/routers/index";

/**
 * A set of typesafe hooks for consuming your API.
 */
export const api = createTRPCReact<AppRouter>();

/**
 * A wrapper for your app that provides the TRPC context.
 * Use only in _app.tsx
 */
export function TRPCProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
          colorMode: "ansi",
        }),
        httpBatchLink({
          transformer: superjson as any,
          url: `${getAPIUrl()}/api/trpc`,
          async headers() {
            const headers = new Map<string, string>();
            headers.set("x-trpc-source", "react");

            // Try to get token from store (works in both Tauri and browser)
            const token = await getToken();
            if (token) {
              headers.set("Authorization", `Bearer ${token}`);
            }

            return Object.fromEntries(headers);
          },
        }),
      ],
    })
  );

  const { Provider: TRPCReactProvider } = api as any;

  return (
    <TRPCReactProvider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </TRPCReactProvider>
  );
}
