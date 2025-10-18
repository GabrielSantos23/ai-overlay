const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  on: (channel, callback) => {
    ipcRenderer.on(channel, callback);
  },
  send: (channel, args) => {
    ipcRenderer.send(channel, args);
  },
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send("set-ignore-mouse-events", ignore, options);
  },
  enableTransparentClick: () => {
    ipcRenderer.send("enable-transparent-click");
  },
  onWindowBlur: (callback) => {
    ipcRenderer.on("window-blur", callback);
  },
  removeWindowBlurListener: () => {
    ipcRenderer.removeAllListeners("window-blur");
  },
  captureScreenshot: async () => {
    try {
      const result = await ipcRenderer.invoke("capture-screenshot");
      return result;
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  },
  openappWindow: async () => {
    try {
      const result = await ipcRenderer.invoke("open-app-window");
      return result;
    } catch (e) {
      return { success: false, error: String(e && e.message ? e.message : e) };
    }
  },
  forceQuit: async () => {
    try {
      const result = await ipcRenderer.invoke("force-quit");
      return result;
    } catch (e) {
      return { success: false, error: String(e && e.message ? e.message : e) };
    }
  },
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send("set-ignore-mouse-events", ignore, options);
  },
});
