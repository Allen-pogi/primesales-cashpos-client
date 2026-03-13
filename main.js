const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // optional depending on your setup
    },
  });

  const indexPath = path.join(__dirname, "build", "index.html");

  console.log("🔍 Resolved path to index.html:", indexPath);
  console.log("📁 Does index.html exist?", fs.existsSync(indexPath));

  if (fs.existsSync(indexPath)) {
    win.loadFile(indexPath);
  } else {
    console.error("❌ index.html not found at:", indexPath);
    win.loadURL("data:text/html,<h1>404 - index.html not found</h1>");
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
