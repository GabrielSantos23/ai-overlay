import { RouterProvider, createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, trpc } from "./utils/trpc";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: () => <Loader />,
  context: { trpc, queryClient },
  Wrap: function WrapComponent({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// At the very top of main.tsx
if (window.__TAURI__) {
  console.log("Running in Tauri");
  console.log("Server URL:", import.meta.env.VITE_SERVER_URL);

  // Test fetch
  import("@tauri-apps/plugin-http").then(({ fetch: tauriFetch }) => {
    tauriFetch(`${import.meta.env.VITE_SERVER_URL}/trpc`)
      .then((r) => console.log("Fetch test success:", r.status))
      .catch((e) => {
        console.error("Fetch test failed:", e);
        alert(`Fetch test failed: ${e.message}`);
      });
  });
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
