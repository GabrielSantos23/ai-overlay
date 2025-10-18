"use client";
import React, { useState } from "react";
import CustomTitlebar from "./custom-titlebar";
import CommandPalette from "./command-palette";

interface AppWindowProps {
  // Add any props you might need for the new window
}

export default function AppWindow({}: AppWindowProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  return (
    <div className="w-full h-full bg-background text-foreground flex flex-col">
      <CustomTitlebar onSearchClick={() => setCommandPaletteOpen(true)} />
      <div className="flex-1 p-8 pt-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">New Window</h1>
          <p className="text-lg text-muted-foreground mb-8">
            This is a new separated window opened from the ChromeIcon button.
          </p>

          <div className="mb-8">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Open Command Palette (Ctrl+K)
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Features</h2>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Independent window from the main overlay</li>
                <li>Full window controls (minimize, maximize, close)</li>
                <li>Separate from the transparent overlay</li>
                <li>Can be used for extended functionality</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Usage</h2>
              <p className="text-muted-foreground">
                This window can be used for additional features, settings, or
                extended functionality that doesn't need to be part of the main
                transparent overlay.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
}
