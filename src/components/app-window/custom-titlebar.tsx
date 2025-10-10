"use client";
import React from "react";
import { ArrowLeft, Chromium, Search } from "lucide-react";
import { Kbd, KbdGroup } from "../ui/kbd";
import { Button } from "../ui/button";

interface CustomTitlebarProps {
  onSearchClick?: () => void;
}

export default function CustomTitlebar({ onSearchClick }: CustomTitlebarProps) {
  return (
    <div
      className="flex items-center justify-between dark:bg-background px-4 py-1 border-b cursor-move h-10"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex items-center space-x-2">
        <div className="text-sm font-medium">
          <Button className="bg-transparent text-muted-foreground hover:text-primary transition-colors">
            <Chromium size={20} className="" />
          </Button>
        </div>
        <div>
          <Button disabled variant="default" className="bg-transparent">
            <ArrowLeft size={25} />
          </Button>
        </div>
      </div>
      <div
        className="flex items-center justify-between w-full bg-muted/50 max-w-md rounded-xl placeholder:text-muted-foreground/20 px-2 cursor-pointer hover:bg-muted/70 transition-colors"
        onClick={onSearchClick}
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <Search size={20} className="text-muted-foreground" />
        <span className="text-muted-foreground/40 text-sm">
          Search or ask anything...
        </span>
        <div>
          <KbdGroup className="py-1">
            <Kbd className="rounded-md py-1 text-xs">Ctrl</Kbd>
            <Kbd className="rounded-md text-xs">K</Kbd>
          </KbdGroup>
        </div>
      </div>

      {/* Space for native Windows buttons - they will appear automatically */}
      <div className="w-24"></div>
    </div>
  );
}
