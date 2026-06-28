// ─── OpenLedger Electron Main Process ─────────────────────────────────────
// Provides a native desktop wrapper for Windows/Linux/macOS packaging.
// Run with: npx electron .

const { app, BrowserWindow, protocol, shell } = require("electron");
const path = require("path");

const isProd = app.isPackaged;
const DEV_URL = "http://localhost:3000";
const PROD_DIR = path.join(__dirname, "..", "out");

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 375,
    minHeight: 600,
    title: "OpenLedger",
    icon: path.join(__dirname, "..", "public", "icons", "icon-512x512.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: !isProd,
    },
    show: false,
    backgroundColor: "#F5F0E8",
  });

  // Add custom user agent so platform detection works
  const ua = mainWindow.webContents.userAgent + " OpenLedgerWin/1.0";
  mainWindow.webContents.userAgent = ua;

  if (isProd) {
    // In production, serve from the Next.js static export
    mainWindow.loadFile(path.join(PROD_DIR, "index.html"));
  } else {
    // In development, connect to Next.js dev server
    mainWindow.loadURL(DEV_URL);
  }

  // Show window when ready (avoids white flash)
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Register custom protocol for deep linking
  protocol.registerHttpProtocol("openledger", (request) => {
    if (mainWindow) {
      mainWindow.loadURL(request.url.replace("openledger://", "https://"));
    }
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
