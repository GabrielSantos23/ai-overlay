// src/routes/__root.tsx
import { Outlet, createRootRoute } from "@tanstack/react-router";
import "../index.css";

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
    </>
  ),
});
