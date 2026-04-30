# 🤖 Telegram AI Assistant

一个基于 Telegram 的个人 AI 助手，支持 Groq、DeepSeek、Qwen、NVIDIA 等多种 AI 模型。免费部署，开箱即用！

## ✨ 功能特点

- 💬 **自然语言对话** - 通过 Telegram 与 AI 助手进行流畅对话
- 🔥 **多模型支持** - Groq / DeepSeek / Qwen / OpenRouter / NVIDIA，随意切换
- 🧠 **上下文记忆** - 持久化存储对话历史，重启不丢失
- ⚡ **Per-User 配置** - 每个用户独立选择 AI 提供商和模型，互不干扰
- ⏰ **定时任务** - 支持每日/一次性提醒，`/cancel` 可取消
- 👥 **群组管理** - 支持群组 @机器人 交互
- 🌍 **多语言** - 中文、英文、日语自动切换
- 🖥️ **桌面客户端** - Electron 打包的 GUI 应用（Windows）
- 🐍 **Python 启动器** - tkinter 图形界面启动器
- ☁️ **一键部署** - 支持 Zeabur/Railway 部署，24/7 在线

## 🔑 API Key 获取教程

### 1. TELEGRAM_BOT_TOKEN（必须）

1. 打开 Telegram，搜索 **@BotFather**
2. 发送 `/newbot` 创建新机器人
3. 按照提示设置名称和用户名
4. 获取 Token（格式：`123456:ABC-DEF...`）

### 2. 至少配置一个 AI Provider 的 API Key

| 提供商 | 获取地址 | 费用 |
|--------|----------|------|
| **Groq** | [console.groq.com](https://console.groq.com) | 🆓 免费（推荐）|
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com) | 低价 |
| **Qwen (通义千问)** | [阿里云百炼](https://bailian.console.aliyun.com) | 有免费额度 |
| **OpenRouter** | [openrouter.ai](https://openrouter.ai) | 部分免费 |
| **NVIDIA NIM** | [build.nvidia.com](https://build.nvidia.com) | 有免费额度 |

## 🚀 快速部署

### 方式一：本地运行（命令行）

```bash
git clone https://github.com/jmf-wxy/telegram_chatai.git
cd telegram_chatai
npm install
cp .env.example .env
# 编辑 .env 填入你的 API Keys
npm start
```

### 方式二：Python GUI 启动器（Windows）

```bash
pip install tk
python launcher.py
```

图形界面中配置 API Key 后点击 **Start** 即可运行。

### 方式三：Electron 桌面端（Windows）

```bash
npm run desktop:dev      # 开发模式运行
npm run desktop:build     # 打包为 exe 安装程序
```

打包产物位于 `dist-electron/Telegram AI Assistant Setup 1.0.0.exe`。

### 方式四：Zeabur（推荐云端部署）

1. Fork 本项目
2. 访问 [Zeabur](https://zeabur.com)
3. 连接 GitHub，一键部署
4. 在服务设置中添加环境变量：
   - `TELEGRAM_BOT_TOKEN` = 你的 Telegram Token
   - `GROQ_API_KEY` = 你的 Groq API Key（或其他任一 Provider）

### 方式五：Railway

```bash
npm i -g @railway/cli
railway login
railway init
railway variable set TELEGRAM_BOT_TOKEN=你的Token
railway variable set GROQ_API_KEY=你的Key
railway up
```

## 📋 环境变量说明

| 变量名 | 必需 | 说明 | 默认值 |
|--------|------|------|--------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Telegram Bot Token（@BotFather 获取）| - |
| `GROQ_API_KEY` | ❌* | Groq API Key | - |
| `GROQ_MODEL` | ❌ | Groq 默认模型 | `llama-3.3-70b-versatile` |
| `DEEPSEEK_API_KEY` | ❌* | DeepSeek API Key | - |
| `DEEPSEEK_MODEL` | ❌ | DeepSeek 默认模型 | `deepseek-chat` |
| `QWEN_API_KEY` | ❌* | 通义千问 API Key | - |
| `QWEN_MODEL` | ❌ | Qwen 默认模型 | `qwen-turbo` |
| `OPENROUTER_API_KEY` | ❌* | OpenRouter API Key | - |
| `OPENROUTER_MODEL` | ❌ | OpenRouter 默认模型 | `qwen/qwen3-coder:free` |
| `NVIDIA_API_KEY` | ❌* | NVIDIA Integrate API Key | - |
| `NVIDIA_BASE_URL` | ❌ | NVIDIA API 地址 | `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL` | ❌ | NVIDIA 默认模型 | `z-ai/glm5` |
| `DEFAULT_PROVIDER` | ❌ | 默认提供商 | `groq` |
| `DEFAULT_MODEL` | ❌ | 默认模型（覆盖提供商默认）| - |
| `PORT` | ❌ | HTTP 服务端口 | `3000` |

> *至少配置一个 AI Provider 的 API Key

## 🤖 可用命令

| 命令 | 说明 |
|------|------|
| `/start` | 启动机器人，显示欢迎信息 |
| `/help` | 查看帮助信息 |
| `/model` | 切换 AI 模型（内联按钮选择）|
| `/clear` | 清除当前用户的聊天历史 |
| `/status` | 查看 Bot 状态（当前提供商/模型/活跃用户数）|
| `/remind HH:MMam/pm 内容` | 设置每日定时提醒 |
| `/remind HH:MMam/pm once 内容` | 设置一次性提醒 |
| `/tasks` | 查看当前用户的活跃任务列表 |
| `/cancel <taskId>` | 取消指定任务 |

## 💰 免费与低价 AI 模型

| 提供商 | 模型 | 价格 | 特点 |
|--------|------|------|------|
| **Groq** | Llama 3.3 70B | 🆓 免费 | 极快速度（1000+ tokens/秒），推荐默认 |
| **OpenRouter** | Qwen3 Coder | 🆓 免费 | 编程能力强 |
| **NVIDIA** | GLM5 / MiniMax M2.7 | 🆓 有免费额度 | 多种开源模型可选 |
| **DeepSeek** | DeepSeek Chat | 💰 低价 | 中文能力强 |
| **Qwen** | Qwen Turbo | 🆓 有免费额度 | 阿里出品，中文优秀 |

> 当主提供商请求失败时，会自动 fallback 到其他已配置 API Key 的提供商。

## 📂 项目结构

```
telegram-ai-assistant/
├── src/
│   ├── ai/
│   │   ├── index.js              # AIChat 主模块（per-user 状态管理）
│   │   ├── constants.js           # 共享常量（System Prompt 等）
│   │   └── providers/             # AI 提供商实现
│   │       ├── deepseek.js        # DeepSeek (OpenAI-compatible)
│   │       ├── groq.js            # Groq SDK
│   │       ├── qwen.js            # 通义千问 (OpenAI-compatible)
│   │       ├── openrouter.js      # OpenRouter (OpenAI-compatible)
│   │       └── nvidia.js          # NVIDIA Integrate (OpenAI-compatible)
│   ├── bot/
│   │   ├── index.js               # TelegramBotManager（统一消息分发）
│   │   └── handlers/
│   │       ├── command.js         # /start, /help 处理
│   │       ├── message.js         # 私聊消息处理 + i18n
│   │       └── callback.js        # 内联按钮回调处理
│   ├── features/
│   │   ├── group.js               # 群组 @提及 处理
│   │   └── scheduler.js           # 定时任务调度器（支持一次性）
│   ├── storage/
│   │   └── sessions.js            # 会话管理（单例 + 文件持久化）
│   ├── i18n/
│   │   └── index.js               # 国际化（zh/en/ja）
│   ├── middleware/
│   │   └── error.js               # Express 错误中间件
│   ├── utils/
│   │   ├── config.js              # 环境变量配置
│   │   ├── logger.js              # Winston 日志
│   │   └── telegram.js            # Telegram 工具（sendMessageSafe 等）
│   ├── server.js                 # Express HTTP 服务入口
│   └── runtime.js                # 统一运行时入口（Bot + Server）
├── electron/                      # Electron 桌面端
│   ├── main.js                    # 主进程
│   ├── preload.js                 # 预加载脚本
│   ├── env.js                     # .env 读写工具
│   └── renderer/                  # 渲染进程
│       ├── index.html
│       ├── renderer.js
│       └── style.css
├── launcher.py                    # Python tkinter GUI 启动器
├── .env.example                   # 环境变量模板
├── Procfile                       # 部署配置（worker 类型）
├── package.json
└── README.md
```

## 🛠️ 开发指南

```bash
npm install           # 安装依赖
npm start             # 启动服务（CLI 模式）
npm run dev           # 开发模式（nodemon 自动重启）
npm run desktop:dev   # Electron 开发模式
npm run desktop:build # 打包 Windows exe 安装程序
```

## 📦 数据存储

| 数据 | 存储位置 | 格式 |
|------|----------|------|
| 用户会话历史 | `data/sessions.json` | JSON 文件 |
| 运行日志 | `logs/combined.log`, `logs/error.log` | Winston 日志文件 |
| Electron 配置 | `<userData>/.env` | 环境变量文件 |
| Python 启动器设置 | `launcher_settings.json` | JSON 文件 |

## 📝 更新日志

### v1.0.0 (2026-05-01)

- ✅ 全新架构：AIChat per-user 状态，多用户互不干扰
- ✅ SessionManager 单例 + 文件持久化，重启数据不丢失
- ✅ 新增 NVIDIA Integrate 提供商支持（GLM5 / MiniMax M2.7）
- ✅ Markdown 解析自动回退机制，特殊字符不再导致发送失败
- ✅ 新增 `/cancel` 命令取消定时任务
- ✅ `/remind` 支持一次性提醒（添加 `once` 关键字）
- ✅ Electron 桌面端完整支持所有 5 个 AI 提供商配置
- ✅ Fallback 逻辑智能跳过无 API Key 的提供商
- ✅ 统一日志系统（winston），修复开发模式重复输出问题
- ✅ System Prompt 提取为共享常量，一处修改全局生效

## License

MIT
