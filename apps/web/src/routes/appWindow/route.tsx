import CustomTitlebar from "@/components/app-window/custom-titlebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/appWindow")({
  component: RouteComponent,
});

function RouteComponent() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <CustomTitlebar onSearchClick={() => setCommandPaletteOpen(true)}>
      <Outlet />
    </CustomTitlebar>
  );
}
