import {
  app,
  BrowserWindow,
  globalShortcut,
  screen,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
} from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;
let tray: Tray | null = null;
let isClickThroughEnabled = true;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    thickFrame: false,
    focusable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    show: false,

    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      backgroundThrottling: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setIgnoreMouseEvents(true, { forward: true });

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  win.once("ready-to-show", () => {
    const display = screen.getDisplayNearestPoint(win!.getBounds());
    win?.setBounds(display.workArea);
    win?.showInactive();
  });

  win.on("minimize", (event: any) => {
    event.preventDefault();
    win?.restore();
  });

  win.on("close", (event) => {
    event.preventDefault();
    win?.hide();
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(process.env.VITE_PUBLIC, "electron-vite.svg")
  );
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Toggle Click-Through",
      click: () => {
        isClickThroughEnabled = !isClickThroughEnabled;
        if (win) {
          win.setIgnoreMouseEvents(isClickThroughEnabled, { forward: true });
          win.setFocusable(false);
        }
      },
    },
    {
      label: "Show/Hide Overlay",
      click: () => {
        if (!win) return;
        if (win.isVisible()) {
          win.hide();
        } else {
          win.showInactive();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("AI Overlay - Ctrl+Shift+O to toggle click-through");
}

ipcMain.on("set-click-through", (_, enabled) => {
  if (win) {
    win.setIgnoreMouseEvents(enabled, { forward: true });
    win.setFocusable(false);
  }
});

app.on("window-all-closed", () => {});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  globalShortcut.register("Control+Shift+O", () => {
    isClickThroughEnabled = !isClickThroughEnabled;
    if (win) {
      win.setIgnoreMouseEvents(isClickThroughEnabled, { forward: true });
      win.setFocusable(false);
    }
  });

  globalShortcut.register("Control+Shift+Y", () => {
    if (!win) return;
    if (win.isVisible()) {
      win.hide();
    } else {
      win.showInactive();
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
