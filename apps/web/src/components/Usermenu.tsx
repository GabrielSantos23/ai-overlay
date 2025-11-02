"use client";

import { useState } from "react";

export function UserMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-800/50"
      >
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
          G
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium">Gabs</div>
          <div className="text-xs text-slate-400">gabs@example.com</div>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-slate-850 border border-slate-800 shadow-lg z-50">
          <ul className="p-2">
            <li>
              <a
                className="block px-3 py-2 rounded-md hover:bg-slate-800/40"
                href="#"
              >
                Profile
              </a>
            </li>
            <li>
              <a
                className="block px-3 py-2 rounded-md hover:bg-slate-800/40"
                href="#"
              >
                Account
              </a>
            </li>
            <li>
              <a
                className="block px-3 py-2 rounded-md hover:bg-slate-800/40"
                href="#"
              >
                Sign out
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
