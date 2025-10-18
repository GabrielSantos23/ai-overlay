"use client";
import React from "react";
import { ArrowLeft, Chromium, Search } from "lucide-react";
import { Kbd, KbdGroup } from "../ui/kbd";
import { Button } from "../ui/button";
import { useLocation, useNavigate } from "@tanstack/react-router";

interface CustomTitlebarProps {
  onSearchClick?: () => void;
  children?: React.ReactNode;
}

export default function CustomTitlebar({
  onSearchClick,
  children,
}: CustomTitlebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/appWindow/page";

  return (
    <div className="flex flex-col h-min-screen w-full min-h-0 bg-[#121214]">
      {/* Titlebar */}
      <div
        className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between  px-4 py-1 cursor-move h-10"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        {/* Left side buttons */}
        <div className="flex items-center space-x-2">
          <Button
            className="bg-transparent text-muted-foreground hover:text-primary transition-colors"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <Chromium size={20} />
          </Button>

          <Button
            variant="default"
            className="bg-transparent"
            onClick={() => navigate({ to: "/appWindow/page" })}
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            disabled={isHome}
          >
            <ArrowLeft size={25} />
          </Button>
        </div>

        {/* Search bar */}
        <div
          className="flex items-center justify-between w-full bg-muted/50 max-w-md rounded-xl placeholder:text-muted-foreground/20 px-2 cursor-pointer hover:bg-muted/70 transition-colors"
          onClick={onSearchClick}
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <Search size={20} className="text-muted-foreground" />
          <span className="text-muted-foreground/40 text-sm">
            Search or ask anything...
          </span>
          <KbdGroup className="py-1">
            <Kbd className="rounded-md py-1 text-xs">Ctrl</Kbd>
            <Kbd className="rounded-md text-xs">K</Kbd>
          </KbdGroup>
        </div>

        {/* Placeholder for native window buttons */}
        <div className="w-24" />
      </div>

      <div className="flex-1 h-screen border mx-1 overflow-hidden rounded-md z-50 mb-1 relative bg-background">
        {children}
        <div
          className="pointer-events-none absolute left-0 right-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent "
          style={{
            // The trick: "mask-image" avoids the gradient overlapping the border
            maskImage: "linear-gradient(to top, black 88%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 88%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
}
