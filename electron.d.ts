// electron.d.ts
export interface ElectronAPI {
  // IPC communication
  on: (channel: string, callback: (...args: any[]) => void) => void;
  send: (channel: string, args?: any) => void;

  // Screenshot API
  captureScreenshot: () => Promise<{
    ok: boolean;
    filePath?: string;
    error?: string;
  }>;

  // Window management
  openappWindow: () => Promise<{ success: boolean; error?: string }>;
  forceQuit: () => Promise<{ success: boolean; error?: string }>;

  // Window events
  onWindowBlur: (callback: () => void) => void;
  removeWindowBlurListener: () => void;

  // Mouse events API - CRITICAL for click-through functionality
  setIgnoreMouseEvents: (
    ignore: boolean,
    options?: { forward: boolean },
  ) => void;
  enableTransparentClick: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
