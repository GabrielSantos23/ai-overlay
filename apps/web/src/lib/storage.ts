import type { ShortcutBinding, ShortcutsConfig } from "./shortcuts";
import { DEFAULT_SHORTCUT_ACTIONS } from "../config/shortcut";

const SHORTCUTS_KEY = "app_shortcuts";

function getPlatform(): "macos" | "windows" | "linux" {
  if (typeof window === "undefined") return "windows";

  const platform = navigator.platform.toLowerCase();
  if (platform.includes("mac")) return "macos";
  if (platform.includes("win")) return "windows";
  return "linux";
}

/**
 * Get shortcuts configuration from localStorage or use defaults
 */
export function getShortcutsConfig(): {
  bindings: Record<string, ShortcutBinding>;
} {
  try {
    const stored = localStorage.getItem(SHORTCUTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.bindings) {
        return { bindings: parsed.bindings };
      }
    }
  } catch (error) {
    console.error("Failed to load shortcuts from localStorage:", error);
  }

  // Return default shortcuts if nothing is stored
  const platform = getPlatform();
  const defaultKey = platform === "macos" ? "macos" : "windows";

  const bindings: Record<string, ShortcutBinding> = {};

  for (const action of DEFAULT_SHORTCUT_ACTIONS) {
    bindings[action.id] = {
      action: action.id,
      key: action.defaultKey[defaultKey],
      enabled: true,
    };
  }

  return { bindings };
}

/**
 * Save shortcuts configuration to localStorage
 */
export function saveShortcutsConfig(config: {
  bindings: Record<string, ShortcutBinding>;
}): void {
  try {
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to save shortcuts to localStorage:", error);
  }
}

/**
 * Initialize shortcuts with default values if not set
 */
export function initializeShortcutsIfNeeded(): void {
  const stored = localStorage.getItem(SHORTCUTS_KEY);
  if (!stored) {
    const defaultConfig = getShortcutsConfig();
    saveShortcutsConfig(defaultConfig);
  }
}
