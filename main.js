// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const openAboutWindow = require('about-window').default;
const contextMenu = require('electron-context-menu');
const ElectronStore = require('electron-store');
ElectronStore.initRenderer();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Set context menu of mouse right click.
contextMenu({
  showCopyImage: false
});

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('paia-desktop', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('paia-desktop');
}

let mainWindow;

function processUrl(input) {
  try {
    const url = new URL(input);
    if (url.protocol == 'paia-desktop:') {
      switch (url.hostname) {
        case 'login':
          const token = url.searchParams.get('token');
          mainWindow.webContents.send('login', token);
          break;
      }
    }
  } catch (error) {
    dialog.showErrorBox('Error', error);
  }
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      webviewTag: true
    }
  });

  // The menubar template.
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          click() {
              mainWindow.close();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click() {
            mainWindow.webContents.reload();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click() {
            mainWindow.webContents.openDevTools();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click() {
            openAboutWindow({
              icon_path: path.join(__dirname, 'media', 'paia-logo.png'),
              package_json_dir: __dirname,
              bug_report_url: 'https://github.com/PAIA-Playful-AI-Arena/Paia-Desktop/issues'
            });
          }
        }
      ]
    }
  ];
  
  mainWindow.maximize();
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  // and load the index.html of the app.
  mainWindow.loadFile('index.html');
  // mainWindow.setMenuBarVisibility(false)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if(url.startsWith('http')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  })
  
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // the commandLine is array of strings in which last element is deep link url
    processUrl(commandLine.pop());
  })

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
  })
  
  app.on('open-url', (event, url) => {
    processUrl(url);
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('selectPath', (event, options) => {
  event.returnValue = dialog.showOpenDialogSync(options);
});

ipcMain.on('savePath', (event, options) => {
  event.returnValue = dialog.showSaveDialogSync(options);
});

ipcMain.on('openPath', (event, pathname) => {
  shell.openPath(pathname);
});

ipcMain.on('getVersion', (event) => {
  event.returnValue = app.getVersion();
});

ipcMain.on('fixFocus', () => {
  mainWindow.blur();
  mainWindow.focus();
});
