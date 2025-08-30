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
- **渲染进程 (Renderer Process)**:
  - 入口文件: `src/index.html`, `src/index.css`, `src/renderer.js`
  - 职责: 展示用户界面，处理用户交互，通过IPC与主进程通信以获取密钥和发起API请求

### 3. 数据流
1. 用户在渲染进程的界面中输入文本并选择语言。
2. 渲染进程通过IPC向主进程发送翻译请求（包含文本、源语言、目标语言）。
3. 主进程从安全存储中读取API密钥。
4. 主进程构建API请求并发送到LLM服务。
5. 主进程接收API响应并将翻译结果通过IPC发送回渲染进程。
6. 渲染进程更新界面显示翻译结果。

## Components and Interfaces

### 1. 主进程组件 (`src/index.js`)
- **BrowserWindow管理**:
  - `createWindow()`: 创建应用主窗口
  - `app.whenReady()`: 应用准备就绪时创建窗口
  - `app.on('window-all-closed')`: 处理窗口关闭事件
- **IPC处理**:
  - 监听来自渲染进程的`translate`事件
  - 使用`keytar`获取API密钥
  - 调用`translateText`函数处理翻译逻辑
  - 将结果或错误通过IPC发送回渲染进程
- **API密钥管理**:
  - 监听`save-api-key`事件以保存密钥
  - 监听`get-api-key`事件以获取密钥

### 2. 渲染进程组件
- **HTML结构** (`src/index.html`):
  - 文本输入区域 (`<textarea>`)
  - 源语言和目标语言选择下拉菜单 (`<select>`)
  - 翻译按钮 (`<button>`)
  - 结果显示区域 (`<div>`)
  - 设置区域（API密钥输入和保存）
- **CSS样式** (`src/index.css`):
  - 定义界面布局和样式
- **JavaScript逻辑** (`src/renderer.js`):
  - 通过`document.getElementById`等方法获取DOM元素
  - 为翻译按钮添加点击事件监听器
  - 通过IPC向主进程发送翻译请求
  - 监听主进程返回的翻译结果并更新界面
  - 处理API密钥的输入和保存

### 3. 预加载脚本 (`src/preload.js`)
- 使用`contextBridge`和`ipcRenderer`暴露安全的IPC接口给渲染进程
- 暴露`translate`和`saveApiKey`等方法

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