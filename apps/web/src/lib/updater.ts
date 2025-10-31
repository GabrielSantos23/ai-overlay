import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "sonner";

/**
 * Checks for a newer app version and shows a persistent toast
 * that only dismisses when the user confirms the download.
 */
export async function checkForAppUpdate(): Promise<void> {
  // Only run in Tauri desktop context
  if (typeof window === "undefined" || !("__TAURI__" in window)) return;

  try {
    const update = await check();
    if (!update?.available) return;

    const { version, currentVersion, body } = update;

    toast(
      `A new version (${version}) is available. You are on ${currentVersion}.`,
      {
        description: body ?? undefined,
        duration: Infinity,
        action: {
          label: "Download update",
          onClick: async () => {
            try {
              await update.downloadAndInstall();
              // Relaunch the app to finalize the update
              await relaunch();
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              toast.error("Failed to install update", { description: message });
            }
          },
        },
      }
    );
  } catch (error) {
    // Silently ignore on startup; optionally log to console for debugging.
    // eslint-disable-next-line no-console
    console.warn("Update check failed:", error);
  }
}



