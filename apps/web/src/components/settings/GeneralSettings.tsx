import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { errorToast, InfoToast, successToast } from "@/lib/exportCustomToast";
import { relaunch } from "@tauri-apps/plugin-process";
import {
  ArrowUp,
  ChevronDown,
  Eye,
  Monitor,
  Moon,
  Palette,
  Power,
  SunDim,
} from "lucide-react";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { getVersion } from "@tauri-apps/api/app";

export const GeneralSettings = () => {
  const [detectable, setDetectable] = useState(true);
  const [openOnLogin, setOpenOnLogin] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("");

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const version = await getVersion();
        setAppVersion(version);
      } catch (error) {
        console.error("Failed to get app version:", error);
        setAppVersion("Unknown");
      }
    };

    fetchVersion();
  }, []);

  // ✅ define async function for checking update
  const handleCheckForUpdate = async () => {
    try {
      setUpdating(true);
      const update = await check();

      if (!update) {
        InfoToast("No updates available.");
        return;
      }

      console.log(`Update ${update.version} found (${update.date})`);
      InfoToast(`Update ${update.version} found (${update.date})`);
      console.log(`Release notes: ${update.body}`);

      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength;
            console.log(`Downloading ${contentLength} bytes`);
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            console.log(`Downloaded ${downloaded} of ${contentLength}`);
            break;
          case "Finished":
            console.log("Download finished");
            break;
        }
      });

      console.log("Update installed successfully!");
      successToast("Updated successfully!");
      await relaunch(); // restart app
    } catch (error) {
      console.error("Update check failed:", error);
      errorToast("Failed to check for updates.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex-1 h-screen  overflow-y-auto bg-background border rounded-lg m-1">
      {/* Detectable Section */}
      <div className="p-6  ">
        <div className="flex items-start justify-between bg-card rounded-lg p-3">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-muted-foreground mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-card-foreground mb-1">
                Detectable
              </h3>
              <p className="text-sm text-muted-foreground">
                Cluely is currently detectable by screen-sharing.{" "}
                <span className="text-primary cursor-pointer hover:underline">
                  Limitations here
                </span>
              </p>
            </div>
          </div>
          <Switch
            checked={detectable}
            onCheckedChange={setDetectable}
            className="ml-4"
          />
        </div>
      </div>

      {/* General settings Section */}
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-base font-semibold text-card-foreground mb-1">
            General settings
          </h3>
          <p className="text-sm text-muted-foreground">
            Customize how Cluely works for you
          </p>
        </div>

        {/* Open Cluely when you log in */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-card p-2 rounded-lg">
              <Power className="w-5 h-5 text-muted-foreground " />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-medium text-card-foreground mb-1">
                Open Cluely when you log in
              </h4>
              <p className="text-sm text-muted-foreground">
                Cluely will open automatically when you log in to your computer
              </p>
            </div>
          </div>
          <Switch
            checked={openOnLogin}
            onCheckedChange={setOpenOnLogin}
            className="ml-4"
          />
        </div>

        {/* Theme */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-card p-2 rounded-lg">
              <Palette className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-medium text-card-foreground mb-1">
                Theme
              </h4>
              <p className="text-sm text-muted-foreground">
                Customize how Cluely looks on your device
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="ml-4 bg-secondary border text-card-foreground hover:bg-secondary/70 flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                <span>System</span>
                <ChevronDown className="w-4 h-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <Monitor /> System Preference
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <SunDim /> Light
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <Moon className="fill-card-foreground" /> Dark
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Check for updates */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-card p-2 rounded-lg">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                <div className="text-background font-bold">
                  <ArrowUp className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-medium text-card-foreground mb-1">
                Check for updates
              </h4>
              <p className="text-sm text-muted-foreground">
                Make sure you’re running the latest version of Cluely.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="ml-4 bg-secondary border text-card-foreground hover:bg-secondary/70"
            onClick={handleCheckForUpdate}
            disabled={updating}
          >
            {updating ? "Checking..." : "Check for updates"}
          </Button>
        </div>
      </div>

      {/* Advanced Section */}
      <div className=" px-4 ">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full flex items-center rounded-lg justify-between p-6 hover:bg-secondary/50 transition-colors "
        >
          <div className="">
            <h3 className="text-base font-semibold text-card-foreground text-left mb-1">
              Advanced
            </h3>
            <p className="text-sm text-muted-foreground text-left">
              Configure experimental Cluely features
            </p>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground transition-transform ${
              advancedOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {advancedOpen && (
          <div className="px-6 pb-6 text-sm text-muted-foreground">
            Advanced settings content would go here...
          </div>
        )}
      </div>
      <div className="px-6 text-end justify-end py-3 text-xs text-muted-foreground/50 ">
        About v{appVersion || "..."}
      </div>
    </div>
  );
};
