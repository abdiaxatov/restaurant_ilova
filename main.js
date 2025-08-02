// main.js
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
      nodeIntegration: false,
    },
  });

  mainWindow.removeMenu();
  mainWindow.loadURL("http://localhost:3000/admin/dashboard");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

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

// Print single receipt
ipcMain.on("print-receipt", (event, html) => {
  const printWindow = new BrowserWindow({
    width: 402,
    height: 600,
    show: false,
    webPreferences: {
      sandbox: true,
    },
  });

  printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  printWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      printWindow.webContents.print({
        silent: true,
        printBackground: true,
      }, () => {
        printWindow.close();
      });
    }, 200);
  });

  printWindow.webContents.on("did-fail-load", (e, code, desc) => {
    console.error(`Print content load error: ${desc} (${code})`);
    printWindow.close();
  });
});

// Print to multiple printers
ipcMain.on("print-to-multiple", (event, { prints }) => {
  prints.forEach(({ html, printerName }, index) => {
    const printWindow = new BrowserWindow({
      width: 402,
      height: 600,
      show: false,
      webPreferences: {
        sandbox: true,
      },
    });

    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    printWindow.webContents.on("did-finish-load", () => {
      setTimeout(() => {
        const printOptions = {
          silent: true,
          printBackground: true,
        };

        if (printerName && printerName !== "default") {
          printOptions.deviceName = printerName;
        }

        printWindow.webContents.getPrintersAsync().then((availablePrinters) => {
          const exists = availablePrinters.some(p => p.name === printerName);
          if (!exists) delete printOptions.deviceName;

          printWindow.webContents.print(printOptions, (success, failureReason) => {
            if (success) {
              console.log(`✅ Print job successful (${printerName || 'default'})`);
            } else {
              console.error(`❌ Print job failed: ${failureReason}`);
            }
            printWindow.close();
          });
        }).catch(err => {
          console.error("Printer check error:", err);
          printWindow.close();
        });
      }, 200 + index * 500);
    });

    printWindow.webContents.on("did-fail-load", (e, code, desc) => {
      console.error(`Print content load error: ${desc} (${code})`);
      printWindow.close();
    });
  });
});

// Printer list handler
ipcMain.handle("get-printers", async () => {
  try {
    const targetWindow = BrowserWindow.getAllWindows()[0];
    if (!targetWindow) return [];

    await new Promise(resolve => {
      if (targetWindow.webContents.isLoading()) {
        targetWindow.webContents.once("did-finish-load", resolve);
      } else {
        resolve();
      }
    });

    const printers = await targetWindow.webContents.getPrintersAsync();
    return printers;
  } catch (error) {
    console.error("❌ Failed to get printers:", error);
    return [];
  }
});