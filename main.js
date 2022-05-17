// Modules to control application life and create native browser window
const {app, BrowserWindow, shell, Menu, ipcMain} = require('electron')
const path = require('path')
const openAboutWindow = require('about-window').default
const contextMenu = require('electron-context-menu')

contextMenu({
  showCopyImage: false
});

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  })

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
  mainWindow.loadFile('index.html')
  // mainWindow.setMenuBarVisibility(false)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if(url.startsWith('http')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
  
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault()
  })
}

// Make sure not launching multiple times during install on Windows.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
