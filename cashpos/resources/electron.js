const path = require("path");
const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;

  const indexPath = isDev
    ? path.join(__dirname, "build", "index.html")
    : path.join(process.resourcesPath, "app", "build", "index.html");

  console.log("Loading:", indexPath);

  win.loadFile(indexPath);

  win.webContents.on("did-fail-load", (e, code, desc) => {
    console.error("LOAD FAIL:", code, desc);
  });

  win.webContents.openDevTools(); // optional for production
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
