const fs = require('fs');
const os = require('os');
const path = require('path');

let app;
let BrowserWindow;

try {
  ({ app, BrowserWindow } = require('electron/main'));
} catch {
  ({ app, BrowserWindow } = require('electron'));
}

let mainWindow;
let backendStarted = false;
const bootLogPath = path.join(os.tmpdir(), 'vaccitrack-electron.log');
let devLoadRetries = 0;
const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
}

function loadDevApp() {
  const devUrl = 'http://localhost:3000';
  mainWindow.loadURL(devUrl).catch((error) => {
    writeBootLog(`loadURL failed: ${error.message}`);
  });
}

function writeBootLog(message) {
  try {
    fs.appendFileSync(bootLogPath, `[${new Date().toISOString()}] ${message}\n`);
  } catch {}
}

writeBootLog('electron-main loaded');

function startBackend() {
  if (backendStarted || !app.isPackaged) return;

  const dataDir = path.join(app.getPath('userData'), 'server-data');
  fs.mkdirSync(dataDir, { recursive: true });

  process.env.VACCITRACK_DATA_DIR = dataDir;
  process.env.PORT = process.env.PORT || '3001';
  process.env.VACCITRACK_ALLOW_PORT_CONFLICT = '1';

  writeBootLog(`starting backend with data dir: ${dataDir}`);
  try {
    require('./server/index.js');
    backendStarted = true;
    writeBootLog('backend started');
  } catch (error) {
    writeBootLog(`backend start failed: ${error.stack || error.message}`);
  }
}

function createWindow() {
  writeBootLog('creating browser window');
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
    path.join(__dirname, 'client', 'build-electron-app', 'index.html'),
    path.join(__dirname, 'client', 'build-electron', 'index.html'),
    path.join(__dirname, 'client', 'build', 'index.html'),
  ].find((entry) => fs.existsSync(entry));
  writeBootLog(`packaged entry: ${packagedEntry || 'not found'}`);

  if (isDev) {
    loadDevApp();
  } else if (packagedEntry) {
    mainWindow.loadFile(packagedEntry);
  } else {
    console.error('No packaged frontend entry found.');
    writeBootLog('no packaged frontend entry found');
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Electron failed to load content:', errorCode, errorDescription);
    writeBootLog(`did-fail-load ${errorCode}: ${errorDescription}`);

    if (isDev && errorCode === -102 && devLoadRetries < 20) {
      devLoadRetries += 1;
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          loadDevApp();
        }
      }, 1000);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  writeBootLog('app ready');
  try {
    startBackend();
  } catch (error) {
    writeBootLog(`startBackend outer error: ${error.stack || error.message}`);
  }

  try {
    createWindow();
  } catch (error) {
    writeBootLog(`createWindow error: ${error.stack || error.message}`);
  }
}).catch((error) => {
  writeBootLog(`whenReady error: ${error.stack || error.message}`);
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

process.on('uncaughtException', (error) => {
  writeBootLog(`uncaughtException: ${error.stack || error.message}`);
});

process.on('unhandledRejection', (error) => {
  writeBootLog(`unhandledRejection: ${error && (error.stack || error.message || String(error))}`);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
