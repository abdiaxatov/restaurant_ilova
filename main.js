const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "logo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true
    }
  });

  mainWindow.removeMenu();
  mainWindow.loadURL("https://xonim-uz.vercel.app/admin/login");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // 🔁 Auto-updater
  mainWindow.webContents.once("did-finish-load", () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ✅ Receipt HTML chop etish
ipcMain.on("print-receipt", (event, html) => {
  const printWindow = new BrowserWindow({
    width: 402,
    height: 600,
    show: false,
    webPreferences: {
      sandbox: true
    }
  });

  printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  printWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      printWindow.webContents.print({ silent: true, printBackground: true }, () => {
        printWindow.close();
      });
    }, 200); // render tugagach biroz kutadi
  });

  printWindow.webContents.on("did-fail-load", (e, code, desc) => {
    console.error(`Print content load error: ${desc} (${code})`);
    printWindow.close();
  });
});
