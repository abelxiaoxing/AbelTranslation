// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 翻译文本
  translateText: (text, sourceLang, targetLang) => 
    ipcRenderer.invoke('translate-text', { text, sourceLang, targetLang }),
  
  // 保存设置
  saveSettings: (settings) => 
    ipcRenderer.invoke('save-settings', settings),
  
  // 获取设置
  getSettings: () => 
    ipcRenderer.invoke('get-settings')
});