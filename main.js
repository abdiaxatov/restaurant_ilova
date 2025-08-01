
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
      nodeIntegration: false
    }
  });

  mainWindow.removeMenu();
  mainWindow.loadURL("http://localhost:3000/admin/saboy");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Auto-updater
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

// Old method (backward compatibility)
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
      printWindow.webContents.print({
        silent: true,
        printBackground: true
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

// New method: Multiple printers with different HTML content
ipcMain.on("print-to-multiple", (event, { prints }) => {
  console.log("Printing to multiple printers:", prints.length);
  
  prints.forEach(({ html, printerName }, index) => {
    console.log(`Setting up print job ${index + 1} for printer: ${printerName}`);
    
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
        const printOptions = {
          silent: true,
          printBackground: true
        };
        
        // Add specific printer if provided
        if (printerName && printerName !== 'default') {
          printOptions.deviceName = printerName;
        }
        
        console.log(`Printing job ${index + 1} with options:`, printOptions);
        
        // Check if printer exists
        if (printerName && printerName !== 'default') {
          focused.webContents.getPrinters().then(availablePrinters => {
            const printerExists = availablePrinters.some(p => p.name === printerName);
            if (!printerExists) {
              console.warn(`Printer '${printerName}' not found. Using default printer.`);
              delete printOptions.deviceName;
            }
          }).catch(err => {
            console.error("Error checking printers:", err);
          });
        }
        
        printWindow.webContents.print(printOptions, (success, failureReason) => {
          if (success) {
            console.log(`✅ Print job ${index + 1} successful (printer: ${printerName || 'default'})`);
          } else {
            console.error(`❌ Print job ${index + 1} failed:`, failureReason, `(printer: ${printerName || 'default'})`);
          }
          printWindow.close();
        });
      }, 200 + (index * 500)); // Stagger print jobs by 500ms each
    });

    printWindow.webContents.on("did-fail-load", (e, code, desc) => {
      console.error(`Print content load error for job ${index + 1}: ${desc} (${code})`);
      printWindow.close();
    });
  });
});

// Get available printers
ipcMain.handle("get-printers", async () => {
  try {
    console.log("Printerlarni olish so'rovi keldi");
    const focused = BrowserWindow.getFocusedWindow() || mainWindow;
    
    if (!focused) {
      console.error("Hech qanday oyna topilmadi");
      return [];
    }

    const printers = await focused.webContents.getPrinters();
    console.log("Topilgan printerlar soni:", printers.length);
    console.log("Available printers:", printers.map(p => ({ 
      name: p.name, 
      displayName: p.displayName,
      status: p.status 
    })));
    
    return printers;
  } catch (error) {
    console.error("Printerlarni olishda xatolik:", error);
    return [];
  }
});
