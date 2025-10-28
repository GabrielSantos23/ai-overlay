import { useState, useCallback, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface ScreenshotConfig {
  enabled: boolean;
  mode: "auto" | "manual" | "selection";
  autoPrompt?: string;
}

interface UseScreenshotOptions {
  onScreenshot?: (base64: string, prompt?: string) => void;
  config?: ScreenshotConfig;
  maxFiles?: number;
  currentFilesCount?: number;
}

export const useScreenshot = (options: UseScreenshotOptions = {}) => {
  const { onScreenshot, config, maxFiles = 6, currentFilesCount = 0 } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedPermissionRef = useRef(false);
  const isProcessingScreenshotRef = useRef(false);

  const checkPermissions = useCallback(async () => {
    const platform = navigator.platform.toLowerCase();

    // if (platform.includes("mac") && !hasCheckedPermissionRef.current) {
    //   try {
    //     // Try to dynamically import the permissions plugin if available
    //     // @ts-ignore - optional dependency
    //     const permissionsModule = await import(
    //       "tauri-plugin-macos-permissions-api"
    //     ).catch(() => null);

    //     if (permissionsModule) {
    //       const {
    //         checkScreenRecordingPermission,
    //         requestScreenRecordingPermission,
    //       } = permissionsModule;

    //       const hasPermission = await checkScreenRecordingPermission();

    //       if (!hasPermission) {
    //         // Request permission
    //         await requestScreenRecordingPermission();

    //         // Wait a moment and check again
    //         await new Promise((resolve) => setTimeout(resolve, 2000));

    //         const hasPermissionNow = await checkScreenRecordingPermission();

    //         if (!hasPermissionNow) {
    //           setError(
    //             "Screen Recording permission required. Please enable it by going to System Settings > Privacy & Security > Screen & System Audio Recording. If you don't see the app in the list, click the '+' button to add it. If it's already listed, make sure it's enabled. Then restart the app."
    //           );
    //           setIsLoading(false);
    //           return false;
    //         }
    //       }
    //     }

    //     hasCheckedPermissionRef.current = true;
    //     return true;
    //   } catch (error) {
    //     console.error("Failed to check permissions:", error);
    //     // Continue anyway if permissions check fails
    //     return true;
    //   }
    // }

    return true;
  }, []);

  const captureFullScreen = useCallback(
    async (prompt?: string) => {
      try {
        const hasPermission = await checkPermissions();
        if (!hasPermission) {
          return;
        }

        const base64 = await invoke<string>("capture_to_base64");

        if (base64 && onScreenshot) {
          await onScreenshot(base64, prompt);
        }

        return base64;
      } catch (err) {
        console.error("Failed to capture screenshot:", err);
        setError("Failed to capture screenshot. Please try again.");
        throw err;
      }
    },
    [onScreenshot, checkPermissions]
  );

  const captureSelection = useCallback(async () => {
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        return;
      }

      // Start screen capture in selection mode
      isProcessingScreenshotRef.current = false;
      await invoke("start_screen_capture");
    } catch (err) {
      console.error("Failed to start capture:", err);
      setError("Failed to start screen capture. Please try again.");
      setIsLoading(false);
    }
  }, [checkPermissions]);

  const captureScreenshot = useCallback(async () => {
    if (currentFilesCount >= maxFiles) {
      setError(`You can only upload ${maxFiles} files`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const screenshotConfig = config || {
        enabled: true,
        mode: "selection",
      };

      if (screenshotConfig.enabled) {
        // Capture full screen immediately
        const base64 = await captureFullScreen(screenshotConfig.autoPrompt);

        if (base64) {
          if (screenshotConfig.mode === "auto") {
            // Auto mode: Submit directly to AI with the configured prompt
            await onScreenshot?.(base64, screenshotConfig.autoPrompt);
          } else if (screenshotConfig.mode === "manual") {
            // Manual mode: Add to attached files without prompt
            await onScreenshot?.(base64);
          }
        }
      } else {
        // Selection Mode: Open overlay to select an area
        await captureSelection();
      }
    } catch (err) {
      console.error("Failed to capture screenshot:", err);
      setError("Failed to capture screenshot. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [
    config,
    captureFullScreen,
    captureSelection,
    onScreenshot,
    currentFilesCount,
    maxFiles,
  ]);

  // Listen for captured-selection event from the Rust backend
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await listen("captured-selection", async (event: any) => {
        if (isProcessingScreenshotRef.current) {
          return;
        }

        isProcessingScreenshotRef.current = true;
        const base64 = event.payload;
        const screenshotConfig = config || {
          enabled: true,
          mode: "manual",
        };

        try {
          if (base64 && onScreenshot) {
            if (screenshotConfig.mode === "auto") {
              // Auto mode: Submit directly to AI with the configured prompt
              await onScreenshot(base64, screenshotConfig.autoPrompt);
            } else if (screenshotConfig.mode === "manual") {
              // Manual mode: Add to attached files without prompt
              await onScreenshot(base64);
            }
          }
        } catch (error) {
          console.error("Error processing selection:", error);
          setError("Failed to process selection");
        } finally {
          setIsLoading(false);
          setTimeout(() => {
            isProcessingScreenshotRef.current = false;
          }, 100);
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [config, onScreenshot]);

  // Listen for capture-closed event
  useEffect(() => {
    const unlistenPromise = listen("capture-closed", () => {
      setIsLoading(false);
      isProcessingScreenshotRef.current = false;
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return {
    captureScreenshot,
    isLoading,
    error,
    setError,
  };
};
