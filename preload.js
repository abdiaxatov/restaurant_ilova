const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  printReceipt: (html) => ipcRenderer.send("print-receipt", html)
});
