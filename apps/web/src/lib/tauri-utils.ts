export function isTauriApp(): boolean {
  if (typeof window === "undefined") return false;

  // Verifica se está realmente no Tauri
  return "__TAURI__" in window && "__TAURI_INTERNALS__" in window;
}

export async function getTauriModule() {
  if (!isTauriApp()) return null;

  try {
    const { listen } = await import("@tauri-apps/api/event");
    return { listen };
  } catch {
    return null;
  }
}
