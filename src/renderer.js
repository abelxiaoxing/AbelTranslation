// renderer.js

// 获取DOM元素
const apiKeyInput = document.getElementById('api-key');
const saveApiKeyButton = document.getElementById('save-api-key');

const inputTextArea = document.getElementById('input-text');
const sourceLanguageSelect = document.getElementById('source-language');
const targetLanguageSelect = document.getElementById('target-language');
const translateButton = document.getElementById('translate-btn');
const outputTextDiv = document.getElementById('output-text');

const defaultSourceLanguageSelect = document.getElementById('default-source-language');
const defaultTargetLanguageSelect = document.getElementById('default-target-language');
const saveDefaultSettingsButton = document.getElementById('save-default-settings');

// 保存API密钥
saveApiKeyButton.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value;
  if (apiKey) {
    try {
      const result = await window.electronAPI.saveApiKey('llm-translator', 'default', apiKey);
      if (result.success) {
        alert('API密钥已保存');
      } else {
        alert(`保存失败: ${result.error}`);
      }
    } catch (error) {
      console.error('保存API密钥时发生错误:', error);
      alert(`保存失败: ${error.message}`);
    }
  } else {
    alert('请输入API密钥');
  }
});

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

// 保存默认语言设置
saveDefaultSettingsButton.addEventListener('click', async () => {
  const sourceLang = defaultSourceLanguageSelect.value;
  const targetLang = defaultTargetLanguageSelect.value;
  
  try {
    const result = await window.electronAPI.saveDefaultLanguages(sourceLang, targetLang);
    if (result.success) {
      alert('默认设置已保存');
      // 同步到翻译区域
      sourceLanguageSelect.value = sourceLang;
      targetLanguageSelect.value = targetLang;
    } else {
      alert(`保存失败: ${result.error}`);
    }
  } catch (error) {
    console.error('保存默认语言设置时发生错误:', error);
    alert(`保存失败: ${error.message}`);
  }
});

// 初始化界面
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 加载默认语言设置
    const result = await window.electronAPI.getDefaultLanguages();
    if (result.success) {
      defaultSourceLanguageSelect.value = result.source;
      defaultTargetLanguageSelect.value = result.target;
      
      // 同步默认设置到翻译区域
      sourceLanguageSelect.value = result.source;
      targetLanguageSelect.value = result.target;
    } else {
      console.error('加载默认语言设置失败:', result.error);
    }
  } catch (error) {
    console.error('加载默认语言设置时发生错误:', error);
  }
  
  console.log('界面初始化完成');
});