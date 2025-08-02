const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  printReceipt: (html) => ipcRenderer.send("print-receipt", html),
  printToMultiple: (prints) => ipcRenderer.send("print-to-multiple", { prints }),
  getPrinters: () => ipcRenderer.invoke("get-printers")
});
