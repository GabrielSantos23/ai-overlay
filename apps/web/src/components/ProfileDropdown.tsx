"use client";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Folder,
  CreditCard,
  HelpCircle,
  Settings,
  ArrowUp,
  UserCircle,
} from "lucide-react";
import { SettingsComponent } from "./settings/SettingsComponents";
import { useAuth } from "@/contexts/AuthContext";

export const ProfileDropdown = () => {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const isLoggedIn = isAuthenticated;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={!isLoggedIn} className="">
          <Button variant="outline" size="icon" className="rounded-lg ">
            {isAuthenticated ? (
              <img
                src={user?.image}
                alt={user?.name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <UserCircle className="w-5 h-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44 p-2">
          <DropdownMenuLabel className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuGroup>
            <DropdownMenuItem className="p-2 cursor-pointer hover:bg-accent hover:text-accent-foreground">
              <Folder className="mr-2 h-4 w-4" />
              <span>Customize Cluely</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-2 cursor-pointer hover:bg-accent hover:text-accent-foreground">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-2 cursor-pointer hover:bg-accent hover:text-accent-foreground">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Get help</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSettingsOpen(true)}
              className="p-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem className="p-2 cursor-pointer hover:bg-accent hover:text-accent-foreground">
            <ArrowUp className="mr-2 h-4 w-4" />
            <span>Restart to Update</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsComponent open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};
