// electron.d.ts or global.d.ts
export interface IElectronAPI {
  getAppVersion: () => Promise<string>;

  system: {
    getPlatform: () => string;
    getArch: () => string;
  };

  overlay: {
    toggleAlwaysOnTop: () => Promise<boolean>;
    setTransparency: (alpha: number) => Promise<void>;
    setIgnoreMouseEvents: (
      ignore: boolean,
      options?: { forward?: boolean }
    ) => Promise<void>;
    enableMouseEvents: () => Promise<void>;
    disableMouseEvents: () => Promise<void>;
    createSeparateWindow: () => Promise<void>;
    getWindowBounds: () => Promise<any>;
    setWindowBounds: (bounds: any) => Promise<void>;
    batchSetBounds: (boundsArray: any[]) => Promise<void>;
    getScreenBounds: () => Promise<{ width: number; height: number }>;
    constrainBounds: (bounds: any) => Promise<any>;
    detectOutsideClick: () => void;
    onOverlayBlur: (callback: () => void) => void;
    onOverlayFocus: (callback: () => void) => void;
    onOverlayHidden: (callback: () => void) => void;
    onOverlayShown: (callback: () => void) => void;
    removeAllListeners: (channel: string) => void;
    resizeForChat: (isChatOpen: boolean) => Promise<void>;
  };

  onCloseChat: (callback: () => void) => () => void;

  // Additional methods that your code is using
  onWindowBlur: (callback: () => void) => void;
  removeWindowBlurListener: () => void;
  setIgnoreMouseEvents: (
    ignore: boolean,
    options?: { forward?: boolean }
  ) => void;

  captureScreenshot: () => Promise<{
    ok: boolean;
    error?: string;
    filePath?: string;
  }>;

  openappWindow: () => Promise<{
    success: boolean;
    error?: string;
  }>;

  // Native Windows buttons are handled automatically by Electron
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

export {};
