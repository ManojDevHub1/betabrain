const { contextBridge } = require("electron");

// Expose safe desktop environment metadata to the frontend
contextBridge.exposeInMainWorld("electronAPI", {
  isDesktop: true,
  platform: process.platform,
});
