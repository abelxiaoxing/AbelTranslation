const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const keytar = require('keytar');
const Store = require('electron-store');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// 初始化electron-store
const store = new Store();

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC处理函数
// 保存API密钥
ipcMain.handle('save-api-key', async (event, { service, account, password }) => {
  try {
    await keytar.setPassword(service, account, password);
    return { success: true };
  } catch (error) {
    console.error('保存API密钥失败:', error);
    return { success: false, error: error.message };
  }
});

// 获取API密钥
ipcMain.handle('get-api-key', async (event, { service, account }) => {
  try {
    const password = await keytar.getPassword(service, account);
    return { success: true, password };
  } catch (error) {
    console.error('获取API密钥失败:', error);
    return { success: false, error: error.message };
  }
});

// 保存默认语言设置
ipcMain.handle('save-default-languages', (event, { source, target }) => {
  try {
    store.set('defaultSourceLanguage', source);
    store.set('defaultTargetLanguage', target);
    return { success: true };
  } catch (error) {
    console.error('保存默认语言设置失败:', error);
    return { success: false, error: error.message };
  }
});

// 获取默认语言设置
ipcMain.handle('get-default-languages', (event) => {
  try {
    const source = store.get('defaultSourceLanguage', 'auto');
    const target = store.get('defaultTargetLanguage', 'zh');
    return { success: true, source, target };
  } catch (error) {
    console.error('获取默认语言设置失败:', error);
    return { success: false, error: error.message };
  }
});

// 翻译文本
ipcMain.handle('translate-text', async (event, { text, sourceLang, targetLang }) => {
  try {
    // 获取API密钥
    const service = 'llm-translator';
    const account = 'default';
    const keyData = await keytar.getPassword(service, account);
    
    if (!keyData) {
      return { success: false, error: '未找到API密钥，请先设置API密钥' };
    }
    
    // 这里应该是调用实际的LLM API
    // 暂时返回模拟数据
    const translatedText = `翻译结果: ${text} (从${sourceLang}到${targetLang})`;
    return { success: true, translatedText };
  } catch (error) {
    console.error('翻译失败:', error);
    return { success: false, error: error.message };
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
