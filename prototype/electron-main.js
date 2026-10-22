const { app, BrowserWindow, dialog } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

let mainWindow;
let localServer;
let bootstrapPasswordFile;

async function openApplication() {
  const appData = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(appData, { recursive: true });
  process.env.HOST = "127.0.0.1";
  process.env.PORT = "0";
  process.env.PATRIMONIA_DATA_DIR = appData;
  bootstrapPasswordFile = path.join(appData, "sabri-bootstrap-once.txt");
  process.env.PATRIMONIA_BOOTSTRAP_PASSWORD_FILE = bootstrapPasswordFile;

  try {
    localServer = require("./server.js");
    if (!localServer.listening) {
      await new Promise((resolve, reject) => {
        localServer.once("listening", resolve);
        localServer.once("error", reject);
      });
    }

    if (fs.existsSync(bootstrapPasswordFile)) {
      const password = fs.readFileSync(bootstrapPasswordFile, "utf8");
      fs.rmSync(bootstrapPasswordFile, { force: true });
      await dialog.showMessageBox({
        type: "info",
        title: "Compte administrateur Sabri Casado",
        message: "Identifiant : sabri@patrimonia.local\nMot de passe initial : " + password,
        detail: "Conserve ce mot de passe. Tu pourras le modifier dans l'application."
      });
    }

    const address = localServer.address();
    mainWindow = new BrowserWindow({
      width: 1440,
      height: 960,
      minWidth: 900,
      minHeight: 640,
      show: false,
      autoHideMenuBar: true,
      backgroundColor: "#f5f7f9",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });
    mainWindow.once("ready-to-show", () => mainWindow.show());
    await mainWindow.loadURL("http://127.0.0.1:" + address.port);
    mainWindow.on("closed", () => { mainWindow = null; });
  } catch (error) {
    dialog.showErrorBox(
      "PATRIMONIA ERP n'a pas pu démarrer",
      "L'application n'a pas pu ouvrir sa base locale. Redémarre-la.\n\n" + error.message
    );
    app.quit();
  }
}

app.whenReady().then(openApplication);
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  if (localServer && localServer.listening) localServer.close();
});
