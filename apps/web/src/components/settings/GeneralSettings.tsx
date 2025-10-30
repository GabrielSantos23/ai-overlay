// components/settings/GeneralSettings.tsx
import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useUpdater } from "@/hooks/useUpdater";
import {
  ArrowUp,
  ChevronDown,
  Download,
  Eye,
  Loader2,
  Monitor,
  Moon,
  Palette,
  Power,
  RefreshCw,
  SunDim,
} from "lucide-react";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Progress } from "../ui/progress";
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";
import { errorToast, InfoToast, successToast } from "@/lib/exportCustomToast";
import { useTheme } from "next-themes";

export const GeneralSettings = () => {
  const [detectable, setDetectable] = useState(true);
  const [openOnLogin, setOpenOnLogin] = useState(false);
  const [isLoadingAutostart, setIsLoadingAutostart] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("");
  const { theme, setTheme } = useTheme();

  const {
    isChecking,
    isDownloading,
    isInstalling,
    updateAvailable,
    progress,
    checkForUpdates,
    downloadAndInstall,
    cancelUpdate,
  } = useUpdater();

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

    const checkAutostart = async () => {
      try {
        const enabled = await isEnabled();
        setOpenOnLogin(enabled);
      } catch (error) {
        console.error("Failed to check autostart status:", error);
        errorToast("Failed to check autostart status");
      }
    };

    fetchVersion();
    checkAutostart();
  }, []);

  const handleAutostartToggle = async (checked: boolean) => {
    setIsLoadingAutostart(true);

    try {
      if (checked) {
        await enable();
        setOpenOnLogin(true);
        successToast(
          "Autostart enabled",
          "Cluely will open automatically when you log in",
        );
      } else {
        await disable();
        setOpenOnLogin(false);
        successToast(
          "Autostart disabled",
          "Cluely will not open automatically on login",
        );
      }
    } catch (error) {
      console.error("Failed to toggle autostart:", error);
      errorToast(
        "Failed to update autostart",

        error instanceof Error ? error.message : "Unknown error occurred",
      );

      setOpenOnLogin(!checked);
    } finally {
      setIsLoadingAutostart(false);
    }
  };

  const handleCheckUpdate = async () => {
    try {
      await checkForUpdates();
      if (!updateAvailable) {
        successToast(
          "You're up to date!",
          "You're running the latest version of Cluely",
        );
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
      errorToast("Failed to check for updates", "Please try again later");
    }
  };

  const handleDownloadUpdate = async () => {
    try {
      await downloadAndInstall();
      successToast(
        "Update installed successfully",
        "Cluely will restart to apply the update",
      );
    } catch (error) {
      console.error("Failed to download update:", error);
      errorToast(
        "Failed to download update",
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  };

  const handleCancelUpdate = () => {
    cancelUpdate();
    InfoToast("Update cancelled", "You can check for updates again later");
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-background border rounded-lg m-1">
      {/* Detectable Section */}
      <div className="p-6">
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
              <Power className="w-5 h-5 text-muted-foreground" />
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
            onCheckedChange={handleAutostartToggle}
            disabled={isLoadingAutostart}
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
                {theme === "light" ? (
                  <SunDim className="w-4 h-4" />
                ) : theme === "dark" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Monitor className="w-4 h-4" />
                )}
                <span className="capitalize">{theme || "System"}</span>
                <ChevronDown className="w-4 h-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Monitor /> System Preference
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <SunDim /> Light
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Moon className="fill-card-foreground" /> Dark
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Check for updates */}
        <div className="flex flex-col gap-3">
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
                  Make sure you're running the latest version of Cluely.
                </p>
              </div>
            </div>

            {/* Botão Check/Download baseado no estado */}
            {!updateAvailable ? (
              <Button
                variant="outline"
                className="ml-4 bg-secondary border text-card-foreground hover:bg-secondary/70"
                onClick={handleCheckUpdate}
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check for updates
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="bg-secondary border text-card-foreground hover:bg-secondary/70"
                  onClick={handleCancelUpdate}
                  disabled={isDownloading || isInstalling}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleDownloadUpdate}
                  disabled={isDownloading || isInstalling}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : isInstalling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download v{updateAvailable.version}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Barra de progresso */}
          {progress && (
            <div className="ml-14 space-y-2">
              <Progress value={progress.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {progress.percentage}% (
                {(progress.downloaded / 1024 / 1024).toFixed(2)} MB of{" "}
                {(progress.total / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}

          {/* Informações da atualização */}
          {updateAvailable && (
            <div className="ml-14 p-3 bg-secondary/50 rounded-lg border border-green-500/20">
              <h5 className="text-sm font-semibold text-card-foreground mb-1">
                New version available: v{updateAvailable.version}
              </h5>
              <p className="text-xs text-muted-foreground">
                {updateAvailable.body || "No release notes available."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Section */}
      <div className="px-4">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full flex items-center rounded-lg justify-between p-6 hover:bg-secondary/50 transition-colors"
        >
          <div>
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

      <div className="px-6 text-end justify-end py-3 text-xs text-muted-foreground/50">
        About v{appVersion || "..."}
      </div>
    </div>
  );
};
