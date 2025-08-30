# LLM翻译软件 - Task List

## Implementation Tasks

- [x] 1. **设置项目基础结构和依赖**
    - [x] 1.1. 安装必要的依赖库
        - *Goal*: 为项目添加`keytar`和`electron-store`等必要库
        - *Details*: 使用`pnpm install keytar electron-store`命令安装。如果需要HTTP客户端库（如axios），也在此步骤安装。
        - *Requirements*: API密钥管理、用户设置存储
    - [x] 1.2. 配置主进程入口文件
        - *Goal*: 更新`src/index.js`以支持创建窗口和基本应用生命周期
        - *Details*: 确保基本的BrowserWindow创建代码已存在，并能加载`index.html`。暂时保留现有代码结构。
        - *Requirements*: 应用启动、窗口管理

- [x] 2. **设计和实现用户界面**
    - [x] 2.1. 创建HTML结构
        - *Goal*: 构建应用的基本HTML布局
        - *Details*: 在`src/index.html`中添加文本输入区域、语言选择下拉菜单、翻译按钮、结果显示区域和API密钥设置区域。使用语义化的HTML标签。
        - *Requirements*: 文本翻译、API密钥管理、语言设置、用户界面
    - [x] 2.2. 添加CSS样式
        - *Goal*: 为HTML元素添加样式，使其布局合理且美观
        - *Details*: 在`src/index.css`中编写CSS规则，确保界面元素有适当的间距、对齐和视觉效果。使用Flexbox或Grid进行布局。
        - *Requirements*: 用户界面
    - [x] 2.3. 实现基础的前端交互逻辑
        - *Goal*: 让HTML元素能够响应用户操作
        - *Details*: 创建`src/renderer.js`文件，并在HTML中引用。实现DOM元素的获取、事件监听器的添加（如按钮点击）。暂时不实现与主进程的通信。
        - *Requirements*: 用户界面

- [ ] 3. **实现主进程与渲染进程的通信**
    - [ ] 3.1. 配置预加载脚本
        - *Goal*: 建立安全的IPC通信桥梁
        - *Details*: 在`src/preload.js`中使用`contextBridge`暴露必要的API给渲染进程，如`translate`和`saveApiKey`方法，内部使用`ipcRenderer`。
        - *Requirements*: API密钥管理、文本翻译
    - [ ] 3.2. 在主进程处理IPC请求
        - *Goal*: 使主进程能够响应渲染进程的请求
        - *Details*: 在`src/index.js`中使用`ipcMain`监听来自渲染进程的事件（如`translate-request`、`save-api-key`）。实现基本的事件处理函数，暂时返回模拟数据。
        - *Requirements*: API密钥管理、文本翻译

- [ ] 4. **实现API密钥的安全存储和管理**
    - [ ] 4.1. 实现API密钥保存功能
        - *Goal*: 安全地存储用户输入的API密钥
        - *Details*: 在主进程中实现`save-api-key`事件的处理函数，使用`keytar`库将密钥保存到系统钥匙串。
        - *Requirements*: API密钥管理
    - [ ] 4.2. 实现API密钥读取功能
        - *Goal*: 安全地从存储中读取API密钥
        - *Details*: 在主进程中实现`get-api-key`事件的处理函数，使用`keytar`库从系统钥匙串读取密钥，并通过IPC发送给渲染进程。
        - *Requirements*: API密钥管理

- [ ] 5. **实现翻译核心功能**
    - [ ] 5.1. 实现LLM API调用逻辑
        - *Goal*: 能够向LLM服务发送翻译请求并接收响应
        - *Details*: 在主进程中创建一个异步函数（如`translateText`），使用Node.js的`https`模块或`axios`库构建HTTP请求。请求应包含从渲染进程传来的文本、源语言、目标语言和从`keytar`获取的API密钥。处理API响应并解析出翻译结果。
        - *Requirements*: 文本翻译
    - [ ] 5.2. 整合翻译功能到IPC流程
        - *Goal*: 完成端到端的翻译请求处理
        - *Details*: 更新主进程中`translate-request`事件的处理函数，调用`translateText`函数，并将真实的翻译结果或错误信息通过IPC发送回渲染进程。
        - *Requirements*: 文本翻译

- [ ] 6. **实现用户设置的存储和管理**
    - [ ] 6.1. 实现默认语言设置的保存和读取
        - *Goal*: 允许用户设置并保存默认的源语言和目标语言
        - *Details*: 使用`electron-store`创建一个配置实例。在主进程中实现保存和读取默认语言的函数，并通过IPC与渲染进程通信。
        - *Requirements*: 语言设置
    - [ ] 6.2. 在前端界面中集成设置功能
        - *Goal*: 让用户能在界面中操作默认语言设置
        - *Details*: 在渲染进程中实现API调用，获取和保存默认语言设置，并更新相应的下拉菜单选项。
        - *Requirements*: 语言设置

- [ ] 7. **实现错误处理和用户体验优化**
    - [ ] 7.1. 添加全面的错误处理
        - *Goal*: 提高应用的健壮性和用户友好性
        - *Details*: 在API调用、IPC通信、文件读写等关键环节添加try-catch块。定义清晰的错误消息，并通过UI反馈给用户。
        - *Requirements*: 所有功能的健壮性
    - [ ] 7.2. 优化用户界面交互
        - *Goal*: 提升用户体验
        - *Details*: 添加加载指示器，在翻译请求期间显示。确保按钮在适当时候禁用。优化界面响应速度。
        - *Requirements*: 用户界面、可用性

## Task Dependencies

- 任务1（设置项目基础结构）应在所有其他任务之前完成或并行开始。
- 任务2（用户界面）应在任务3（IPC通信）之前完成，因为前端需要有元素来绑定事件。
- 任务3（IPC通信）是任务4（API密钥管理）和任务5（翻译核心功能）的前提。
- 任务4（API密钥管理）和任务6（用户设置管理）可以相对独立地进行，但都依赖于任务3。
- 任务5（翻译核心功能）依赖于任务4提供的API密钥功能。
- 任务7（错误处理和优化）可以贯穿整个开发过程，并在最后进行集中优化。

## Estimated Timeline

- 任务1: 2小时
- 任务2: 4小时
- 任务3: 3小时
- 任务4: 3小时
- 任务5: 4小时
- 任务6: 2小时
- 任务7: 3小时
- **Total: 21小时**