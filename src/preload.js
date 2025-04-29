const {contextBridge, ipcRenderer} = require('electron');

// Expose des fonctionnalités contrôlées au processus de rendu (render.js)
// sans exposer directement ipcRenderer ou d'autres modules Node.js

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('get-sources'),
  //possible d'ajouter d'autres fonctionnalités apres
});

console.log('preload.js loaded');