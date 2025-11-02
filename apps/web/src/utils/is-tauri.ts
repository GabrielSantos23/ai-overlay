/**
 * Check if the app is running in a Tauri environment
 */
export function isTauri(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // Primary check: __TAURI__ global must be defined (not just present but undefined)
  const hasTauriGlobal = "__TAURI__" in window && typeof (window as any).__TAURI__ !== "undefined";
  const hasTauriInternals = "__TAURI_INTERNALS__" in window && typeof (window as any).__TAURI_INTERNALS__ !== "undefined";
  
  // Both must be present and defined
  if (hasTauriGlobal && hasTauriInternals) {
    return true;
  }

  // Secondary check: Try to detect by checking if Tauri APIs are available
  // Even without __TAURI__, we might be in Tauri if the APIs work
  return false;
}

/**
 * Async check for Tauri environment by trying to use the API
 * This is more reliable as it actually tests if the API works
 */
export async function checkTauriAsync(): Promise<boolean> {
  // First do synchronous check
  if (isTauri()) {
    return true;
  }

  try {
    // Try to import Tauri API
    const { invoke } = await import("@tauri-apps/api/core");
    
    // Verify that invoke is actually callable and has access to internals
    if (!invoke || typeof invoke !== "function") {
      return false;
    }

    // Try to call a simple command that works in Tauri
    // If this succeeds, we're definitely in Tauri
    try {
      // Check if we have access to Tauri internals
      if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
        await invoke("__tauri_internal__get_version");
        return true;
      }
      return false;
    } catch {
      // Even if the specific command fails, verify internals exist
      if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
        return true;
      }
      return false;
    }
  } catch {
    // Import failed or no internals, definitely not in Tauri
    return false;
  }
}

