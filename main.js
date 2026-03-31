const { app, BrowserWindow } = require('electron');
const http = require('http');

function waitForReact(url, callback) {
  http.get(url, () => callback()).on('error', () => {
    setTimeout(() => waitForReact(url, callback), 1000);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
  });

  waitForReact('http://localhost:3000', () => {
    win.loadURL('http://localhost:3000');
  });
}

app.whenReady().then(createWindow);