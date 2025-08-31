const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, clipboard, screen } = require('electron');
const path = require('node:path');
const keytar = require('keytar');
const Store = require('electron-store').default || require('electron-store');

// Initialization
const store = new Store();
const SERVICE_NAME = 'llm-translator';
const ACCOUNT_NAME = 'default-api-key';

let mainWindow;
let popupWindow;
let tray;
let isQuitting = false;

// --- Window Creation ---

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
};

const createPopupWindow = () => {
  const lastBounds = store.get('popupBounds', { width: 450, height: 400 });

  popupWindow = new BrowserWindow({
    x: lastBounds.x,
    y: lastBounds.y,
    width: lastBounds.width,
    height: lastBounds.height,
    frame: false,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'popup-preload.js'),
    },
  });

  popupWindow.loadFile(path.join(__dirname, 'popup.html'));

  const saveBounds = () => {
    const bounds = popupWindow.getBounds();
    store.set('popupBounds', { x: bounds.x, y: bounds.y, width: bounds.width });
  };

  popupWindow.on('close', (event) => {
    saveBounds();
    if (!isQuitting) {
      event.preventDefault();
      popupWindow.hide();
    }
  });

  popupWindow.on('blur', () => {
    saveBounds();
    popupWindow.hide();
  });
};

const createTray = () => {
  const iconDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAEklEQVR4nGNgGAWjYBSMAggAAAQQAAFVN1rQAAAAAElFTkSuQmCC';
  const icon = nativeImage.createFromDataURL(iconDataURL);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示/隐藏窗口', click: () => { mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show(); } },
    { label: '退出', click: () => { app.quit(); } },
  ]);

  tray.setToolTip('LLM 翻译软件');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => { mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show(); });
};

// --- Shortcut & Translation Logic ---

const showPopup = (original, translated) => {
  popupWindow.webContents.send('translation-data', { original, translated });
  popupWindow.show();
  popupWindow.focus();
};

const registerGlobalShortcut = () => {
  const hotkey = store.get('hotkey', 'Alt+E');
  if (!hotkey) {
    console.log('快捷键未设置，跳过注册。');
    return;
  }

  if (globalShortcut.isRegistered(hotkey)) {
    globalShortcut.unregister(hotkey);
  }

  const ret = globalShortcut.register(hotkey, async () => {
    const text = clipboard.readText();
    if (!text) return;

    try {
      const apiKey = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      const hostname = store.get('hostname');
      const model = store.get('model');
      const sourceLang = store.get('defaultSourceLanguage', 'auto');
      const targetLang = store.get('defaultTargetLanguage', 'zh');

      if (!apiKey || !hostname || !model) {
        showPopup(text, '翻译失败: 请先在主窗口中完成API设置。');
        return;
      }

      const translatedText = await translateTextWithOpenAI(text, sourceLang, targetLang, apiKey, hostname, model);
      showPopup(text, translatedText);

    } catch (error) {
      console.error('快捷键翻译失败:', error);
      showPopup(text, `翻译失败: ${error.message}`);
    }
  });

  if (!ret) {
    console.error('快捷键注册失败:', hotkey);
  } else {
    console.log('快捷键注册成功:', hotkey);
  }
};

// --- App Lifecycle ---

app.whenReady().then(() => {
  createWindow();
  createPopupWindow();
  createTray();
  registerGlobalShortcut();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// --- IPC Handlers ---

ipcMain.on('popup-resize', (event, height) => {
  if (popupWindow && !popupWindow.isDestroyed()) {
    const bounds = popupWindow.getBounds();
    const newHeight = height + 25; // Add padding for better aesthetics
    popupWindow.setBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: newHeight });
  }
});

ipcMain.handle('get-settings', async () => {
  const apiKey = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  return {
    hostname: store.get('hostname', 'api.mistral.ai'),
    model: store.get('model', 'mistral-small-latest'),
    hotkey: store.get('hotkey', 'Alt+E'),
    defaultSourceLanguage: store.get('defaultSourceLanguage', 'auto'),
    defaultTargetLanguage: store.get('defaultTargetLanguage', 'zh'),
    apiKey: apiKey || '',
  };
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    store.set('hostname', settings.hostname);
    store.set('model', settings.model);
    store.set('hotkey', settings.hotkey);
    store.set('defaultSourceLanguage', settings.defaultSourceLanguage);
    store.set('defaultTargetLanguage', settings.defaultTargetLanguage);

    if (settings.apiKey) {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, settings.apiKey);
    } else {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    }
    
    registerGlobalShortcut();
    return { success: true };
  } catch (error) {
    console.error('保存设置失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('translate-text', async (event, { text, sourceLang, targetLang }) => {
  try {
    const apiKey = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    if (!apiKey) return { success: false, error: '未找到API密钥' };
    
    const hostname = store.get('hostname');
    const model = store.get('model');
    if (!hostname || !model) return { success: false, error: '未配置Hostname或Model' };

    const translatedText = await translateTextWithOpenAI(text, sourceLang, targetLang, apiKey, hostname, model);
    return { success: true, translatedText };
  } catch (error) {
    console.error('翻译失败:', error);
    return { success: false, error: error.message };
  }
});

// --- Translation Core ---

async function translateTextWithOpenAI(text, sourceLang, targetLang, apiKey, hostname, model) {
  const https = require('https');
  const path = '/v1/chat/completions';
  const prompt = `Translate the following text from ${sourceLang === 'auto' ? 'auto-detected' : sourceLang} to ${targetLang}:

"${text}"`;
  const postData = JSON.stringify({
    model: model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });
  const options = {
    hostname: hostname,
    port: 443,
    path: path,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.choices && response.choices.length > 0 && response.choices[0].message) {
            resolve(response.choices[0].message.content.trim());
          } else {
            reject(new Error(`Invalid API response: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    });
    req.on('error', (error) => { reject(new Error(`Network request failed: ${error.message}`)); });
    req.write(postData);
    req.end();
  });
}