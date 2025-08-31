// renderer.js

// 获取翻译区域的DOM元素
const inputTextArea = document.getElementById('input-text');
const sourceLanguageSelect = document.getElementById('source-language');
const targetLanguageSelect = document.getElementById('target-language');
const translateButton = document.getElementById('translate-btn');
const outputTextDiv = document.getElementById('output-text');

// 获取设置区域的DOM元素
const hostnameInput = document.getElementById('hostname');
const modelInput = document.getElementById('model');
const apiKeyInput = document.getElementById('api-key');
const hotkeyInput = document.getElementById('hotkey');
const defaultSourceLanguageSelect = document.getElementById('default-source-language');
const defaultTargetLanguageSelect = document.getElementById('default-target-language');
const saveSettingsButton = document.getElementById('save-settings');

// 翻译文本
translateButton.addEventListener('click', async () => {
  const text = inputTextArea.value;
  const sourceLang = sourceLanguageSelect.value;
  const targetLang = targetLanguageSelect.value;
  
  if (text) {
    try {
      // 显示加载状态
      outputTextDiv.textContent = '翻译中...';
      translateButton.disabled = true;
      
      const result = await window.electronAPI.translateText(text, sourceLang, targetLang);
      
      if (result.success) {
        outputTextDiv.textContent = result.translatedText;
      } else {
        outputTextDiv.textContent = `翻译失败: ${result.error}`;
      }
    } catch (error) {
      console.error('翻译时发生错误:', error);
      outputTextDiv.textContent = `翻译失败: ${error.message}`;
    } finally {
      // 恢复按钮状态
      translateButton.disabled = false;
    }
  } else {
    alert('请输入要翻译的文本');
  }
});

// 保存设置
saveSettingsButton.addEventListener('click', async () => {
  const settings = {
    hostname: hostnameInput.value,
    model: modelInput.value,
    apiKey: apiKeyInput.value,
    hotkey: hotkeyInput.value,
    defaultSourceLanguage: defaultSourceLanguageSelect.value,
    defaultTargetLanguage: defaultTargetLanguageSelect.value,
  };

  try {
    const result = await window.electronAPI.saveSettings(settings);
    if (result.success) {
      alert('设置已保存。');
    } else {
      alert(`保存失败: ${result.error}`);
    }
  } catch (error) {
    console.error('保存设置时发生错误:', error);
    alert(`保存失败: ${error.message}`);
  }
});

// 初始化界面
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const settings = await window.electronAPI.getSettings();
    if (settings) {
      // 填充设置表单
      hostnameInput.value = settings.hostname || '';
      modelInput.value = settings.model || '';
      apiKeyInput.value = settings.apiKey || '';
      hotkeyInput.value = settings.hotkey || '';
      defaultSourceLanguageSelect.value = settings.defaultSourceLanguage || 'auto';
      defaultTargetLanguageSelect.value = settings.defaultTargetLanguage || 'zh';

      // 同步默认语言到翻译区域
      sourceLanguageSelect.value = settings.defaultSourceLanguage || 'auto';
      targetLanguageSelect.value = settings.defaultTargetLanguage || 'zh';
    }
  } catch (error) {
    console.error('加载设置时发生错误:', error);
  }
  
  console.log('界面初始化完成');
});