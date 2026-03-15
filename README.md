# Telegram AI Assistant

一个基于 Telegram 的个人 AI 助手，支持 DeepSeek、Qwen 等多种 AI 模型。

## 功能特点

- 💬 自然语言对话：通过 Telegram 与 AI 助手进行自然语言对话
- 🤖 多模型支持：支持 DeepSeek V3、Qwen Turbo 等多种 AI 模型，可随时切换
- 🧠 上下文记忆：记住对话历史，提供连贯的交流体验
- ⚙️ 管理员功能：通过命令管理 AI 助手（切换模型、查看状态等）
- ⏰ 定时任务：支持定时提醒、消息推送等功能
- 👥 群组管理：支持群组 @机器人 交互
- 🌐 多语言支持：中文、英文、日语自动切换
- 💾 会话持久化：对话历史本地存储，重启后不丢失
- 🖥️ 多端支持：Telegram Bot + 桌面端 (exe) + 手机端 (APK) + 网页版

## 技术栈

- **后端**：Node.js + Express
- **AI 接入**：DeepSeek API + Qwen API (通过 OpenAI 兼容接口)
- **存储**：SQLite (对话历史和会话管理)
- **机器人框架**：node-telegram-bot-api
- **定时任务**：node-cron
- **日志**：Winston
- **多语言**：自定义 i18n 实现
- **多端构建**：Tauri (桌面端和手机端)

## 快速开始

### 前置条件

- Node.js 18+
- Telegram Bot Token (从 @BotFather 获取)
- DeepSeek API Key (从 [DeepSeek 平台](https://platform.deepseek.com/) 获取)
- 可选：Qwen API Key (从 [阿里云百炼](https://help.aliyun.com/) 获取)

### 安装和运行

1. 克隆仓库
   ```bash
   git clone <your-repo-url>
   cd telegram-ai-assistant
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 配置环境变量
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入你的 API Keys
   ```

4. 启动开发模式
   ```bash
   npm run dev
   ```

5. 在 Telegram 中给你的机器人发送 `/start` 开始使用

## 部署

### Zeabur (推荐 - 一键部署)

1. 访问 [Zeabur](https://zeabur.com)
2. 连接你的 GitHub 仓库
3. 一键部署
4. 在服务设置中添加环境变量

### Railway

1. 安装 Railway CLI: `npm i -g @railway/cli`
2. 登录: `railway login`
3. 初始化项目: `railway init`
4. 设置环境变量:
   ```bash
   railway variable set TELEGRAM_BOT_TOKEN=your_token
   railway variable set DEEPSEEK_API_KEY=your_key
   ```
5. 部署: `railway up`

### Docker

```bash
docker build -t telegram-ai-assistant .
docker run -p 3000:3000 --env-file .env telegram-ai-assistant
```

## 多端构建

### 桌面端 (使用 Tauri)

```bash
# 安装 Tauri CLI
npm install -g @tauri-apps/cli

# 创建 Tauri 项目（在项目根目录外执行）
npm create tauri-app@latest my-ai-assistant-desktop
# 选择 Vanilla JS 或 Vue/React
# 选择 Yes, using NPM

# 复制我们的前端代码到 Tauri 项目的 src 目录
# 构建
npm run tauri build
```

### 手机端 APK (使用 Tauri)

```bash
# 在 Tauri 项目中添加 Android 支持
npm run tauri add android

# 构建 APK
npm run tauri build android
```

### 网页版

1. 构建前端静态文件
2. 部署到 Zeabur/Vercel/Netlify/Cloudflare Pages 作为静态网站

## 项目结构

```
telegram-ai-assistant/
├── .env                  # 环境变量（不提交到 Git）
├── .env.example          # 环境变量模板
├── package.json
├── src/
│   ├── bot/              # Telegram Bot 相关
│   │   ├── index.js      # Bot 入口
│   │   ├── handlers/     # 消息和命令处理
│   │   └── keyboards/    # 键盘布局
│   ├── ai/               # AI 服务
│   │   ├── index.js      # AI 统一入口
│   │   └── providers/    # AI 提供商 (DeepSeek, Qwen)
│   ├── storage/          # 数据存储
│   │   └── sessions.js   # 会话管理 (SQLite)
│   ├── features/         # 高级功能
│   │   ├── scheduler.js  # 定时任务
│   │   ├── group.js      # 群组管理
│   │   └── i18n.js       # 多语言支持
│   ├── utils/            # 工具函数
│   │   ├── config.js     # 配置管理
│   │   └── logger.js     # 日志系统
│   ├── middleware/       # Express 中间件
│   │   └── error.js      # 错误处理
│   └── server.js         # Express 服务器 (用于健康检查等)
└── data/                 # SQLite 数据库目录
```

## 命令列表

- `/start` - 启动机器人，显示欢迎信息
- `/help` - 显示帮助信息
- `/model` - 切换 AI 模型（DeepSeek/Qwen 各种变体）
- `/clear` - 清除当前聊天历史
- `/status` - 显示当前状态（模型、版本等）

## 数据隐私

- 所有对话历史存储在本地 SQLite 数据库中
- 数据不会上传到第三方服务器（除了调用 AI API 时必要的数据）
- 可以随时通过 `/clear` 命令清除历史

## 许可证

MIT License

## 鸣谢

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [DeepSeek](https://deepseek.com/)
- [Qwen](https://qwen.ai/)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
