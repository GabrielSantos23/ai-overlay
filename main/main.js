const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  globalShortcut,
  clipboard,
  nativeImage,
  desktopCapturer,
  screen,
} = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");

let mainWindow = null;
let appWindow = null;
let currentIgnoreState = true;

function createMenu() {
  if (app.isPackaged) return;

  const template = [
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Developer Tools",
          accelerator: "F12",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          },
        },
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function registerShortcuts() {
  if (app.isPackaged) return;

  globalShortcut.register("F12", () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  globalShortcut.register("CommandOrControl+Shift+I", () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1900,
    height: 1000,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      devTools: !app.isPackaged,
    },
  });

  // Start with click-through enabled
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  currentIgnoreState = true;

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    const indexHtmlPath = path.join(__dirname, "..", "renderer", "index.html");
    mainWindow.loadFile(indexHtmlPath);
  }

  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      console.log("Electron window is ready and visible");
      console.log("DevTools enabled:", !app.isPackaged);
      console.log("Press F12 or Ctrl+Shift+I to open DevTools");
    }
  });

  mainWindow.on("blur", () => {
    mainWindow.webContents.send("window-blur");
  });

  // Hide overlay when main window loses focus
  mainWindow.on("focus", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.showInactive();
    }
  });
}

function createAppWindow() {
  if (appWindow) {
    appWindow.focus();
    return;
  }

  appWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // Remove default frame for custom frame
    titleBarStyle: "hidden", // Hide default title bar
    titleBarOverlay: {
      color: "transparent", // Make overlay transparent to show custom titlebar
      symbolColor: "#000", // Color of the native Windows buttons
      height: 40, // Height of the title bar area
    },
    resizable: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      devTools: !app.isPackaged,
    },
  });

  if (!app.isPackaged) {
    appWindow.loadURL("http://localhost:3000/app-window");
  } else {
    appWindow.loadURL("http://localhost:3000/app-window");
  }

  appWindow.once("ready-to-show", () => {
    if (appWindow) {
      appWindow.show();
      console.log("New window is ready and visible");
    }
  });

  // Hide overlay when new window gets focus
  appWindow.on("focus", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  });

  // Show overlay when new window loses focus
  appWindow.on("blur", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.showInactive();
    }
  });

  appWindow.on("closed", () => {
    // Show overlay when new window closes
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.showInactive();
    }
    appWindow = null;
  });
}

// Handle interactable region updates with state tracking
ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
  if (mainWindow && currentIgnoreState !== ignore) {
    currentIgnoreState = ignore;

    try {
      mainWindow.setIgnoreMouseEvents(ignore, options || { forward: true });
    } catch (error) {
      console.error("Error setting mouse events:", error);
    }
  }
});

ipcMain.handle("open-app-window", async () => {
  try {
    createAppWindow();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Native Windows buttons are handled automatically by Electron

app.whenReady().then(() => {
  createWindow();
  createMenu();
  registerShortcuts();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

ipcMain.handle("capture-screenshot", async () => {
  if (!mainWindow) return { ok: false, error: "No main window" };

  const wasVisible = mainWindow.isVisible();
  try {
    mainWindow.hide();
    await new Promise((resolve) => setTimeout(resolve, 120));

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;

    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width, height },
    });

    let target = sources.find(
      (s) => s.display_id === String(primaryDisplay.id)
    );
    if (!target && sources.length > 0) target = sources[0];
    if (!target || target.thumbnail.isEmpty()) {
      throw new Error("Unable to capture screen thumbnail");
    }

    const image = target.thumbnail;
    clipboard.writeImage(image);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `screenshot-${timestamp}.png`;
    const screenshotsDir = path.join(os.homedir(), "Pictures", "Screenshots");

    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const filePath = path.join(screenshotsDir, filename);
    const buffer = image.toPNG();
    fs.writeFileSync(filePath, buffer);

    return { ok: true, filePath };
  } catch (error) {
    return {
      ok: false,
      error: String(error && error.message ? error.message : error),
    };
  } finally {
    if (wasVisible) {
      mainWindow.show();
    }
  }
});
