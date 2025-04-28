const { contextBridge, ipcRenderer, desktopCapturer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getSources: (options) => desktopCapturer.getSources(options),
    saveFile: (buffer) => ipcRenderer.invoke('save-file', buffer)
});
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
