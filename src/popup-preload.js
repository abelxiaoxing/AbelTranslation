const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('popupAPI', {
  onTranslationData: (callback) => ipcRenderer.on('translation-data', callback),
  resizePopup: (height) => ipcRenderer.send('popup-resize', height)
});