"use client";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Calendar,
  Keyboard,
  User,
  Languages,
  CreditCard,
  GraduationCap,
  Bug,
  HelpCircle,
  LogOut,
  X,
  Power,
  Palette,
  ChevronDown,
  Eye,
} from "lucide-react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { errorToast, InfoToast, successToast } from "@/lib/exportCustomToast";
const menuItems = [
  { id: "general", title: "General", icon: Settings },
  { id: "calendar", title: "Calendar", icon: Calendar },
  { id: "keybinds", title: "Keybinds", icon: Keyboard },
  { id: "profile", title: "Profile", icon: User },
  { id: "language", title: "Language", icon: Languages },
  { id: "billing", title: "Billing", icon: CreditCard },
];

const supportItems = [
  { id: "tutorial", title: "Cluely Tutorial", icon: GraduationCap },
  { id: "changelog", title: "Changelog", icon: HelpCircle },
  { id: "help", title: "Help Center", icon: HelpCircle },
  { id: "bug", title: "Report a bug", icon: Bug },
];

export const GeneralSettings = () => {
  const [detectable, setDetectable] = useState(true);
  const [openOnLogin, setOpenOnLogin] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

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
    <div className="flex-1 overflow-y-auto">
      {/* Detectable Section */}
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                Detectable
              </h3>
              <p className="text-sm text-gray-400">
                Cluely is currently detectable by screen-sharing.{" "}
                <span className="text-blue-400 cursor-pointer hover:underline">
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
          <h3 className="text-base font-semibold text-white mb-1">
            General settings
          </h3>
          <p className="text-sm text-gray-400">
            Customize how Cluely works for you
          </p>
        </div>

        {/* Open Cluely when you log in */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Power className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <h4 className="text-base font-medium text-white mb-1">
                Open Cluely when you log in
              </h4>
              <p className="text-sm text-gray-400">
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
            <Palette className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <h4 className="text-base font-medium text-white mb-1">Theme</h4>
              <p className="text-sm text-gray-400">
                Customize how Cluely looks on your device
              </p>
            </div>
          </div>
          <select className="ml-4 bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 text-sm">
            <option>System Preference</option>
            <option>Light</option>
            <option>Dark</option>
          </select>
        </div>

        {/* Check for updates */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
              <div className="text-white font-bold">↑</div>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-medium text-white mb-1">
                Check for updates
              </h4>
              <p className="text-sm text-gray-400">
                Make sure you’re running the latest version of Cluely.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="ml-4 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            onClick={handleCheckForUpdate}
            disabled={updating}
          >
            {updating ? "Checking..." : "Check for updates"}
          </Button>
        </div>
      </div>

      {/* Advanced Section */}
      <div className="border-t border-gray-800">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-800/50 transition-colors"
        >
          <div>
            <h3 className="text-base font-semibold text-white text-left mb-1">
              Advanced
            </h3>
            <p className="text-sm text-gray-400 text-left">
              Configure experimental Cluely features
            </p>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${
              advancedOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {advancedOpen && (
          <div className="px-6 pb-6 text-sm text-gray-400">
            Advanced settings content would go here...
          </div>
        )}
      </div>
    </div>
  );
};
// Placeholder Components
const CalendarSettings = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-white mb-2">Calendar Settings</h2>
    <p className="text-gray-400">Calendar settings will be configured here.</p>
  </div>
);

const KeybindsSettings = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-white mb-2">Keybinds</h2>
    <p className="text-gray-400">Keyboard shortcuts configuration.</p>
  </div>
);

const ProfileSettings = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-white mb-2">Profile</h2>
    <p className="text-gray-400">Manage your profile settings.</p>
  </div>
);

const LanguageSettings = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-white mb-2">Language</h2>
    <p className="text-gray-400">Choose your preferred language.</p>
  </div>
);

const BillingSettings = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-white mb-2">Billing</h2>
    <p className="text-gray-400">Manage your billing and subscription.</p>
  </div>
);

const TutorialSettings = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-white mb-2">Cluely Tutorial</h2>
    <p className="text-gray-400">Learn how to use Cluely.</p>
  </div>
);

const ChangelogSettings = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-white mb-2">Changelog</h2>
    <p className="text-gray-400">See what's new in Cluely.</p>
  </div>
);

const HelpSettings = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-white mb-2">Help Center</h2>
    <p className="text-gray-400">Get help with Cluely.</p>
  </div>
);

const BugReportSettings = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-white mb-2">Report a Bug</h2>
    <p className="text-gray-400">Help us improve by reporting issues.</p>
  </div>
);

export const SettingsComponent = ({ open, onOpenChange }) => {
  const [activeSection, setActiveSection] = useState("general");

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSettings />;
      case "calendar":
        return <CalendarSettings />;
      case "keybinds":
        return <KeybindsSettings />;
      case "profile":
        return <ProfileSettings />;
      case "language":
        return <LanguageSettings />;
      case "billing":
        return <BillingSettings />;
      case "tutorial":
        return <TutorialSettings />;
      case "changelog":
        return <ChangelogSettings />;
      case "help":
        return <HelpSettings />;
      case "bug":
        return <BugReportSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw]! [&>button]:hidden max-w-none! h-[80vh]! max-h-[80vh]! p-0  border border-muted ">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64  border-r  flex flex-col">
            {/* Close button */}
            <div className="p-4 border-b border-gray-800">
              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeSection === item.id
                          ? " text-white"
                          : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Support Section */}
              <div className="mt-6 px-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                  Support
                </div>
                <nav className="space-y-1">
                  {supportItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeSection === item.id
                            ? "bg-gray-800 text-white"
                            : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-gray-800 p-3 space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors">
                <Power className="w-4 h-4" />
                <span>Quit Cluely</span>
              </button>
            </div>

            {/* Version */}
            <div className="px-6 py-3 text-xs text-gray-600 text-center border-t border-gray-800">
              About v1.72.0
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col ">{renderContent()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function Demo() {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Button onClick={() => setOpen(true)}>Open Settings</Button>
      <SettingsComponent open={open} onOpenChange={setOpen} />
    </div>
  );
}
