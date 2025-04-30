const { create } = require('domain');
const {app, BrowserWindow, ipcMain, desktopCapturer} = require('electron');
const path = require('path');

if (require('electron-squirrel-startup')){
  app.quit();
}

const createWindow = () => {
  //creation de la fenêtre
  const mainWindow = new BrowserWindow({
    width: 800,
    height:600,
    webPreferences:{
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', 'icon.ico')
  });

  //Charge index.html dans la fenêtre
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  //Ouvre le DevTools
  //mainWindow.webContents.openDevTools();
};

//Cette methode est appelee lorsque Electron a fini de s'initialiser
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if(BrowserWindow.getAllWindows().length === 0){
      createWindow();
    }
  });
});

//quitter lorque la fenetre est fermée
app.on('window-all-closed', () =>{
  if(process.platform !== 'darwin'){
    app.quit();
  }
});

//Ecouteur IPC pour obtenir les sources de capture (fenêtres et ecrans)
ipcMain.handle('get-sources', async() =>{
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
  });
  return sources
});

