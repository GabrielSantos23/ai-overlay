import React from "react";

import TitleBar from "@/components/TitleBar";
import { Toaster } from "sonner";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex h-screen">
      <TitleBar>{children}</TitleBar>
      <Toaster position="top-right" />
    </div>
  );
}
