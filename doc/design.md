# LLM翻译软件 - Design Document

## Overview

本设计文档旨在详细描述基于Electron的桌面翻译软件的架构和实现方案。该软件将利用Electron框架构建一个跨平台的桌面应用，前端采用HTML/CSS/JavaScript技术栈实现用户界面，后端通过Node.js与OpenAI兼容的LLM API进行交互。应用将包含主进程和渲染进程，主进程负责应用生命周期管理和安全的API密钥存储，渲染进程负责用户界面展示和交互。

## Architecture

### 1. 技术选型
- **框架**: Electron (结合Node.js和Chromium)
- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **UI库**: 不使用额外的UI库，使用原生HTML/CSS构建简洁界面
- **密钥存储**: `keytar` 库用于安全地存储API密钥
- **配置存储**: `electron-store` 用于存储用户偏好设置（如默认语言）
- **HTTP客户端**: Node.js内置的`https`模块或`axios`库（如果需要安装）用于API请求

### 2. 进程结构
- **主进程 (Main Process)**: 
  - 入口文件: `src/index.js`
  - 职责: 创建和管理浏览器窗口，处理应用生命周期事件，安全地存储和检索API密钥
- **主渲染进程 (Main Renderer Process)**:
  - 入口文件: `src/index.html`, `src/index.css`, `src/renderer.js`
  - 职责: 展示主设置界面，处理用户交互，通过IPC与主进程通信。
- **弹出窗口渲染进程 (Popup Renderer Process)**:
  - 入口文件: `src/popup.html`, `src/popup.css`, `src/popup.js`
  - 职责: 展示快捷键翻译结果，是一个无边框、置顶的窗口。

### 3. 数据流
**主窗口翻译流程:**
1. 用户在主渲染进程的界面中输入文本并选择语言。
2. 主渲染进程通过IPC向主进程发送翻译请求。
3. 主进程从安全存储中读取API密钥和配置。
4. 主进程构建API请求并发送到LLM服务。
5. 主进程接收API响应并将翻译结果通过IPC发送回主渲染进程。
6. 主渲染进程更新界面显示翻译结果。

**快捷键翻译流程:**
1. 用户在操作系统任意位置复制文本，然后按下预设的全局快捷键。
2. 主进程捕获快捷键事件，并从系统剪贴板读取文本。
3. 主进程读取API配置，调用翻译核心逻辑。
4. 主进程将原始文本和翻译结果通过IPC发送到弹出窗口渲染进程。
5. 弹出窗口渲染进程接收到数据并将其展示出来。
6. 弹出窗口根据内容自动调整大小，并在失去焦点时自动隐藏。

## Components and Interfaces

### 1. 主进程组件 (`src/index.js`)
- **窗口管理**:
  - `createWindow()`: 创建应用主窗口。
  - `createPopupWindow()`: 创建无边框、置顶的翻译结果弹出窗口。
  - `createTray()`: 创建系统托盘图标及菜单。
- **全局快捷键管理**:
  - `registerGlobalShortcut()`: 注册/更新用户自定义的全局快捷键。
  - 快捷键回调函数负责读取剪贴板、调用翻译、显示弹出窗口。
- **IPC处理**:
  - 监听和处理来自主渲染进程的设置保存/读取、文本翻译请求。
  - 向弹出窗口渲染进程发送`translation-data`事件，传递翻译结果。
  - 监听来自弹出窗口的`popup-resize`事件，以调整窗口高度。
- **API密钥与配置管理**:
  - 使用`keytar`安全存取API密钥。
  - 使用`electron-store`存取主机、模型、快捷键、默认语言等配置。

### 2. 主渲染进程组件
- **HTML结构** (`src/index.html`):
  - 包含翻译区域和完整的设置区域（API密钥、模型、快捷键等）。
- **CSS样式** (`src/index.css`):
  - 定义主窗口的界面布局和样式。
- **JavaScript逻辑** (`src/renderer.js`):
  - 处理翻译输入和按钮点击。
  - 处理所有设置项的读取和保存。
  - 通过预加载脚本与主进程进行IPC通信。
- **预加载脚本** (`src/preload.js`):
  - 使用`contextBridge`暴露`translateText`, `saveSettings`, `getSettings`等接口。

### 3. 弹出窗口渲染进程组件
- **HTML结构** (`src/popup.html`):
  - 包含一个可拖拽区域和两个用于显示原文和译文的`div`。
- **CSS样式** (`src/popup.css`):
  - 定义弹出窗口的深色、紧凑布局和自定义滚动条。
- **JavaScript逻辑** (`src/popup.js`):
  - 监听主进程通过`translation-data`事件发送来的数据并更新UI。
  - 在内容更新后，计算并通知主进程调整窗口高度。
- **预加载脚本** (`src/popup-preload.js`):
  - 暴露`onTranslationData`用于接收数据，`resizePopup`用于通知主进程调整大小。

## Data Models

### 1. 配置数据 (使用`electron-store`)
- `defaultSourceLanguage`: 字符串，用户设置的默认源语言代码
- `defaultTargetLanguage`: 字符串，用户设置的默认目标语言代码

### 2. API请求/响应数据
- **请求体**:
  ```json
  {
    "model": "gpt-3.5-turbo", // 或其他模型名称
    "messages": [
      {
        "role": "user",
        "content": "Translate the following text from {sourceLanguage} to {targetLanguage}: {text}"
      }
    ]
  }
  ```
- **响应体** (简化):
  ```json
  {
    "choices": [
      {
        "message": {
          "content": "翻译后的文本"
        }
      }
    ]
  }
  ```

### 3. 语言列表
- 应用内维护一个支持的语言列表对象，例如:
  ```javascript
  const languages = {
    "auto": "自动检测",
    "zh": "中文",
    "en": "英文",
    "ja": "日文",
    "ko": "韩文"
    // 可以根据需要添加更多
  };
  ```

## Error Handling

### 1. API请求错误
- 网络错误：向用户显示“网络连接失败，请检查网络设置”。
- API密钥错误：向用户显示“API密钥无效，请检查密钥设置”。
- API额度超限：向用户显示“API调用额度超限，请检查账户状态”。
- 其他HTTP错误：显示具体的错误状态码和消息。

### 2. 应用内部错误
- IPC通信错误：记录日志并尝试重新建立连接。
- 文件读写错误（如配置文件）：使用默认值并提示用户。
- 密钥存储错误：提示用户密钥保存失败，并建议重新输入。

### 3. 用户输入错误
- 空文本输入：提示用户“请输入需要翻译的文本”。

## Testing Strategy

### 1. 单元测试
- 对`translateText`等核心逻辑函数进行单元测试（如果将其模块化）。
- 测试语言列表的正确性。

### 2. 集成测试
- 测试主进程与渲染进程之间的IPC通信是否正常。
- 测试API密钥的保存和读取功能。
- 测试应用配置的保存和读取。

### 3. 端到端测试
- 手动测试完整的用户流程：输入文本 -> 选择语言 -> 点击翻译 -> 显示结果。
- 测试各种错误情况下的用户提示。

### 4. 依赖项
- 由于这是一个Electron应用，主要依赖手动测试和集成测试来保证质量。