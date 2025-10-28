import TitleBar from "@/components/TitleBar";
import { Toaster } from "@/components/ui/sonner";
import { Title } from "@radix-ui/react-dialog";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/main")({
  component: RouteComponent,
});

function RouteComponent() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  return (
    <div className="w-full flex h-screen">
      <TitleBar onSearchClick={() => setCommandPaletteOpen(true)}>
        <Outlet />
      </TitleBar>
      <Toaster position="top-right" />
    </div>
  );
}
