const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;
  const packagedEntry = [
    path.join(__dirname, 'client', 'build-electron', 'index.html'),
    path.join(__dirname, 'client', 'build', 'index.html'),
  ].find((entry) => fs.existsSync(entry));

  if (isDev) {
    // 🟢 DEV MODE
    mainWindow.loadURL('http://localhost:3000');
  } else if (packagedEntry) {
    // 🔵 PRODUCTION (.exe)
    mainWindow.loadFile(packagedEntry);
  } else {
    console.error('No packaged frontend entry found.');
  }

  // افتح devtools للتشخيص (اختياري)
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Electron failed to load content:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
