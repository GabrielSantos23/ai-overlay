"use client";

import {
  Cancel01Icon,
  MaximizeIcon,
  MinimizeIcon,
} from "@hugeicons/core-free-icons";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft, LoaderPinwheel, Minus, Search, Square } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Kbd, KbdGroup } from "./ui/kbd";
import { ProfileDropdown } from "./ProfileDropdown";

interface TitleBarProps {
  children: React.ReactNode;
  onSearchClick?: () => void;
}

function TitleBar({ children, onSearchClick }: TitleBarProps) {
  const appWindow = getCurrentWindow();
  const router = useRouter(); // Changed
  const pathname = usePathname(); // Changed

  const isHome = location.pathname === "/main";
  const minimize = () => appWindow.minimize();
  const toggleMaximize = () => appWindow.toggleMaximize();
  const close = () => appWindow.close();

  return (
    <div className="flex flex-col h-min-screen w-full min-h-0 bg-[#121214] ">
      <div
        data-tauri-drag-region="true"
        className=" flex h-8 items-center justify-between select-none sticky top-0 left-0 right-0 z-50"
      >
        <div className="flex items-center ml-1.5 ">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/main")}
          >
            <LoaderPinwheel />
          </Button>
          <Button
            variant="default"
            className="bg-transparent"
            onClick={() => router.push("/main")}
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            disabled={isHome}
          >
            <ArrowLeft size={25} />
          </Button>
        </div>

        <div
          className="flex items-center justify-between w-full bg-muted/50 max-w-md rounded-xl placeholder:text-muted-foreground/20 px-2 cursor-pointer hover:bg-muted/70 transition-colors"
          onClick={onSearchClick}
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <Search className="text-muted-foreground w-4" />
          <span className="text-muted-foreground/40 text-sm">
            Search or ask anything...
          </span>
          <KbdGroup className="py-1">
            <Kbd className="rounded-md py-1 text-xs">Ctrl</Kbd>
            <Kbd className="rounded-md text-xs">K</Kbd>
          </KbdGroup>
        </div>

        <div className="flex h-full ">
          <ProfileDropdown />
          <button
            onClick={minimize}
            className=" h-full p-2 rounded flex items-center justify-center border-none bg-transparent cursor-pointer hover:bg-accent"
          >
            <Minus className="w-3.5" />
          </button>
          <button
            onClick={toggleMaximize}
            className=" h-full p-2 rounded flex items-center justify-center border-none bg-transparent cursor-pointer hover:bg-accent"
          >
            <Square className="w-3.5" />
          </button>
          <button
            onClick={close}
            className="  h-full p-2 rounded flex items-center justify-center border-none bg-transparent cursor-pointer hover:bg-destructive"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5" />
          </button>
        </div>
      </div>
      <div className="flex-1  border mx-1 overflow-hidden rounded-md z-50 mb-1 relative bg-background">
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

export default TitleBar;
