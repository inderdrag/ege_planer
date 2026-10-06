// ГЛАВНЫЙ ПРОЦЕСС ELECTRON
// Просто открывает app/index.html в обычном окне — вся логика приложения
// (данные, расписание, таймер) остаётся той же самой, что и в браузере.
// localStorage здесь работает точно так же, только хранится в профиле
// Electron-приложения, а не в браузере.

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 920,
    minHeight: 620,
    backgroundColor: '#0e1626',
    autoHideMenuBar: true, // прячем стандартное меню File/Edit/View — оно тут не нужно
    icon: path.join(__dirname, 'app', 'icons', 'icon-512.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
