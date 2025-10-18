"use client";
import React, { useState, useEffect } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Search,
  Settings,
  FileText,
  HelpCircle,
  Maximize,
  Minimize,
  X,
  ArrowLeft,
  Home,
  User,
  Palette,
  Moon,
  Sun,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommandPalette({
  open,
  onOpenChange,
}: CommandPaletteProps) {
  const [searchValue, setSearchValue] = useState("");

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleCommand = (command: string) => {
    switch (command) {
      case "new-file":
        console.log("Creating new file...");
        break;
      case "open-settings":
        console.log("Opening settings...");
        break;
      case "help":
        console.log("Opening help...");
        break;
      case "minimize-window":
        window.electronAPI?.minimizeWindow?.();
        break;
      case "maximize-window":
        window.electronAPI?.maximizeWindow?.();
        break;
      case "close-window":
        window.electronAPI?.closeWindow?.();
        break;
      case "toggle-theme":
        console.log("Toggling theme...");
        break;
      default:
        console.log(`Executing command: ${command}`);
    }
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={searchValue}
        onValueChange={setSearchValue}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="General">
          <CommandItem onSelect={() => handleCommand("new-file")}>
            <FileText className="mr-2 h-4 w-4" />
            <span>New File</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleCommand("open-settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleCommand("help")}>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help</span>
            <CommandShortcut>F1</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Window">
          <CommandItem onSelect={() => handleCommand("minimize-window")}>
            <Minimize className="mr-2 h-4 w-4" />
            <span>Minimize Window</span>
            <CommandShortcut>⌘M</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleCommand("maximize-window")}>
            <Maximize className="mr-2 h-4 w-4" />
            <span>Maximize Window</span>
            <CommandShortcut>⌘⇧M</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleCommand("close-window")}>
            <X className="mr-2 h-4 w-4" />
            <span>Close Window</span>
            <CommandShortcut>⌘W</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleCommand("go-home")}>
            <Home className="mr-2 h-4 w-4" />
            <span>Go Home</span>
            <CommandShortcut>⌘H</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleCommand("go-back")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>Go Back</span>
            <CommandShortcut>⌘←</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Appearance">
          <CommandItem onSelect={() => handleCommand("toggle-theme")}>
            <Palette className="mr-2 h-4 w-4" />
            <span>Toggle Theme</span>
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleCommand("dark-mode")}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => handleCommand("light-mode")}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Mode</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
