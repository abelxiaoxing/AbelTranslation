// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 保存API密钥
  saveApiKey: (service, account, password) => 
    ipcRenderer.invoke('save-api-key', { service, account, password }),
  
  // 获取API密钥
  getApiKey: (service, account) => 
    ipcRenderer.invoke('get-api-key', { service, account }),
  
  // 翻译文本
  translateText: (text, sourceLang, targetLang) => 
    ipcRenderer.invoke('translate-text', { text, sourceLang, targetLang }),
  
  // 保存默认语言设置
  saveDefaultLanguages: (source, target) => 
    ipcRenderer.invoke('save-default-languages', { source, target }),
  
  // 获取默认语言设置
  getDefaultLanguages: () => 
    ipcRenderer.invoke('get-default-languages')
});