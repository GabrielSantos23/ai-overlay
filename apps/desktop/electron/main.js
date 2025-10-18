const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  desktopCapturer,
  clipboard,
} = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

const isDev = process.env.NODE_ENV !== "production";

let mainWindow;
let appWindow;
let allWindows = new Set();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1900,
    height: 1000,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    // show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      devTools: !app.isPackaged,
    },
  });

  // CRITICAL: Set initial click-through state
  // This makes the entire window transparent to mouse events by default
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Ensure renderer uses transparent background as well
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.insertCSS(`
      html, body, #root, #app {
        background: transparent !important;
      }
    `);
  });

  // Track the window
  allWindows.add(mainWindow);

  // IMPORTANT: Load from your web app's dev server (port 3001)
  if (isDev) {
    mainWindow.loadURL("http://localhost:3001");
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html from the desktop package root
    // The web files are copied to the desktop package root during build
    // __dirname -> /apps/desktop/electron
    // .. -> /apps/desktop
    // index.html -> /apps/desktop/index.html
    const indexPath = path.join(__dirname, "..", "index.html");
    console.log("Loading index.html from:", indexPath);
    console.log("File exists:", require("fs").existsSync(indexPath));

    mainWindow.loadFile(indexPath).catch((error) => {
      console.error("Failed to load index.html:", error);
    });
  }

  // Handle window close
  mainWindow.on("closed", () => {
    allWindows.delete(mainWindow);
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  // Force quit all windows and processes
  allWindows.forEach((window) => {
    if (window && !window.isDestroyed()) {
      window.destroy();
    }
  });
  allWindows.clear();

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
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
      (s) => s.display_id === String(primaryDisplay.id),
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

function createAppWindow() {
  if (appWindow && !appWindow.isDestroyed()) {
    appWindow.focus();
    return;
  }

  appWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // Remove default frame for custom frame
    titleBarStyle: "hidden", // Hide default title bar
    titleBarOverlay: {
      color: "#121214", // Make overlay transparent to show custom titlebar
      symbolColor: "#fff", // Color of the native Windows buttons
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

  // Track the window
  allWindows.add(appWindow);

  if (!app.isPackaged) {
    appWindow.loadURL("http://localhost:3001/appWindow/page");
  } else {
    // In production, load the built index.html from the desktop package root
    const indexPath = path.join(__dirname, "..", "index.html");
    console.log("Loading app-window from:", indexPath);
    console.log("File exists:", require("fs").existsSync(indexPath));

    appWindow
      .loadFile(indexPath)
      .then(() => {
        // Navigate to the app-window route after the page loads
        appWindow.webContents.executeJavaScript(`
        if (window.location.pathname !== '/app-window') {
          window.history.pushState({}, '', '/app-window');
          window.location.reload();
        }
      `);
      })
      .catch((error) => {
        console.error("Failed to load app-window:", error);
      });
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
    allWindows.delete(appWindow);
    appWindow = null;
  });
}

ipcMain.handle("open-app-window", async () => {
  try {
    createAppWindow();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Add force quit handler
ipcMain.handle("force-quit", async () => {
  try {
    // Force destroy all windows
    allWindows.forEach((window) => {
      if (window && !window.isDestroyed()) {
        window.destroy();
      }
    });
    allWindows.clear();

    // Force quit the app
    app.quit();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle app termination more aggressively
app.on("before-quit", (event) => {
  // Force destroy all windows before quitting
  cleanupIPC();
  allWindows.forEach((window) => {
    if (window && !window.isDestroyed()) {
      window.destroy();
    }
  });
  allWindows.clear();
});

// Clean up IPC handlers
function cleanupIPC() {
  ipcMain.removeAllListeners("capture-screenshot");
  ipcMain.removeAllListeners("open-app-window");
  ipcMain.removeAllListeners("force-quit");
  ipcMain.removeAllListeners("set-ignore-mouse-events");
  ipcMain.removeAllListeners("enable-transparent-click");
}

// Handle process termination
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  cleanupIPC();
  allWindows.forEach((window) => {
    if (window && !window.isDestroyed()) {
      window.destroy();
    }
  });
  allWindows.clear();
  app.quit();
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  cleanupIPC();
  allWindows.forEach((window) => {
    if (window && !window.isDestroyed()) {
      window.destroy();
    }
  });
  allWindows.clear();
  app.quit();
});

ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setIgnoreMouseEvents(ignore, options);
  }
});
