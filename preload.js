
const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  // Old method (backward compatibility)
  printReceipt: (html) => {
    ipcRenderer.send("print-receipt", html)
  },
  
  // New method for multiple printers
  printToMultiple: (prints) => {
    ipcRenderer.send("print-to-multiple", { prints })
  },
  
  // Get available printers
  getPrinters: () => {
    return ipcRenderer.invoke("get-printers")
  }
})
