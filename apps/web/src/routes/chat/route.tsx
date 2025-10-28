import Menu from "@/components/floating-menu/menu";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useApp } from "@/hooks/useApp";
import { useWindowResize } from "@/hooks/useWindow";
import { useState, useRef, useEffect } from "react";
export const Route = createFileRoute("/chat")({
  component: ChatLayout,
});

function ChatLayout() {
  const { isHidden } = useApp();
  const { resizeWindow } = useWindowResize();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverContentRef = useRef<HTMLDivElement>(null);

  const calculatePopoverHeight = () => {
    if (popoverContentRef.current) {
      const rect = popoverContentRef.current.getBoundingClientRect();
      // Add some padding for proper spacing
      return Math.max(rect.height + 20, 100) + 4;
    }
    return 600; // fallback height
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);

    if (open) {
      // Use setTimeout to ensure the popover content is rendered before measuring
      setTimeout(() => {
        const height = calculatePopoverHeight();
        resizeWindow(true, height);
      }, 0);
    } else {
      resizeWindow(false);
    }
  };

  return (
    <div
      className={`w-screen h-screen flex   justify-center items-start ${
        isHidden ? "hidden pointer-events-none" : ""
      }`}
    >
      <Outlet />
    </div>
  );
}
