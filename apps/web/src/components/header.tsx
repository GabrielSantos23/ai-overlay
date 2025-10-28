import { Link } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { ExternalLink } from "lucide-react";

export const handleOpenAppWindow = async () => {
  // try {
  //   if (window.electronAPI?.openappWindow) {
  //     const result = await window.electronAPI.openappWindow();
  //     if (!result.success) {
  //       console.error("Failed to open app window:", result.error);
  //     }
  //   } else {
  //     console.log("Not running in Electron environment");
  //   }
  // } catch (error) {
  //   console.error("Error opening app window:", error);
  // }
};

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/ai", label: "AI Chat" },
  ] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => {
            return (
              <Link key={to} to={to}>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAppWindow}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            title="Open in separate window"
          >
            <ExternalLink size={16} />
            <span>New Window</span>
          </button>
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  );
}
