# 个人 AI 助手开发指南

> 项目名称：Telegram AI Assistant  
> 更新时间：2026-03-12  
> 技术栈：Node.js + Telegram Bot + DeepSeek/Qwen API

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术选型](#2-技术选型)
3. [架构设计](#3-架构设计)
4. [环境准备](#4-环境准备)
5. [核心功能实现](#5-核心功能实现)
6. [AI 模型接入](#6-ai-模型接入)
7. [高级功能](#7-高级功能)
8. [部署上线](#8-部署上线)
9. [构建桌面端 exe](#9-构建桌面端-exe)
10. [构建手机端 APK](#10-构建手机端-apk)
11. [网页版部署](#11-网页版部署)
12. [运维与监控](#12-运维与监控)

---

## 1. 项目概述

### 1.1 项目目标

创建一个基于 Telegram 的个人 AI 助手，具备以下核心功能：

| 功能 | 说明 |
|------|------|
| AI 对话 | 通过 Telegram 与 AI 助手进行自然语言对话 |
| 多模型支持 | 支持 DeepSeek、Qwen、OpenAI 等多种 AI 模型 |
| 上下文记忆 | 记住对话历史，提供连贯的交流体验 |
| 管理员功能 | 通过命令管理 AI 助手（切换模型、查看状态等） |
| 定时任务 | 支持定时提醒、消息推送等功能 |

### 1.2 应用场景

- 个人 AI 助手：日常对话、知识查询、写作辅助
- 学习伙伴：语言练习、编程帮助、问题解答
- 效率工具：日程提醒、翻译服务、信息整理

---

## 2. 技术选型

### 2.1 AI 模型对比

| 模型 | 价格 | 编程能力 | 中文能力 | 推荐场景 |
|------|------|----------|----------|----------|
| **DeepSeek V3** | $0.27/M tokens | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐首选 |
| **Qwen Turbo** | $0.2/M tokens | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 性价比高 |
| **DeepSeek Chat** | $0.14/M tokens | ⭐⭐⭐ | ⭐⭐⭐⭐ | 预算有限 |
| **OpenAI GPT-4o** | $15/M tokens | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 追求最强 |

### 2.2 推荐方案

**首选方案（性价比）：**
- Telegram Bot + DeepSeek V3
- 成本：约 $0.27/百万 tokens
- 适合：个人使用、日常对话

**进阶方案（更强能力）：**
- Telegram Bot + Qwen Turbo
- 成本：约 $0.2/百万 tokens
- 适合：需要更好中文理解

### 2.3 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 消息入口 | Telegram Bot API | 用户交互界面 |
| 后端服务 | Node.js + Express | 处理消息、路由 |
| AI 接入 | DeepSeek/Qwen API | 对话能力 |
| 存储 | SQLite/Redis | 对话历史、会话管理 |
| 部署 | Railway/Zeabur/Cloudflare | 免费/低价托管 |

---

## 3. 架构设计

### 3.1 系统架构图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Telegram  │────▶│  Node.js   │────▶│  DeepSeek  │
│   User     │     │   Server   │     │    API     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   SQLite    │
                    │  (历史记录)  │
                    └─────────────┘
```

### 3.2 核心模块

```
src/
├── bot/
│   ├── index.js          # Bot 入口
│   ├── handlers/
│   │   ├── message.js    # 消息处理
│   │   ├── command.js    # 命令处理
│   │   └── callback.js   # 回调处理
│   └── keyboards/
│       └── main.js       # 键盘布局
├── ai/
│   ├── index.js          # AI 统一入口
│   ├── providers/
│   │   ├── deepseek.js  # DeepSeek 提供商
│   │   ├── qwen.js      # 阿里 Qwen
│   │   └── openai.js    # OpenAI
│   └── prompts/
│       └── system.js     # 系统提示词
├── storage/
│   ├── database.js       # SQLite 封装
│   └── sessions.js      # 会话管理
├── utils/
│   ├── logger.js        # 日志
│   └── config.js        # 配置管理
└── server.js            # Express 服务
```

---

## 4. 环境准备

### 4.1 必要账号

| 服务 | 获取方式 | 用途 |
|------|----------|------|
| Telegram Bot Token | @BotFather | 机器人身份 |
| DeepSeek API Key | deepseek.com | AI 对话能力 |
| Qwen API Key | qwen.ai | 备选 AI 能力 |

### 4.2 获取 Telegram Bot Token

1. 打开 Telegram，搜索 `@BotFather`
2. 发送 `/newbot` 命令
3. 按提示设置机器人名称和用户名（必须以 `bot` 结尾）
4. 复制 BotFather 返回的 Token

### 4.3 获取 DeepSeek API Key

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册账号并登录
3. 在「API 管理」创建新的 API Key
4. 复制保存（只显示一次）

### 4.4 环境变量配置

创建 `.env` 文件：

```env
# Telegram 配置
TELEGRAM_BOT_TOKEN=你的TelegramBotToken

# AI 模型配置
DEEPSEEK_API_KEY=你的DeepSeekAPIKey
DEEPSEEK_MODEL=deepseek-chat

# 可选：Qwen 配置
QWEN_API_KEY=你的QwenAPIKey
QWEN_MODEL=qwen-turbo

# 服务配置
PORT=3000
NODE_ENV=development
```

---

## 5. 核心功能实现

### 5.1 项目初始化

```bash
# 创建项目目录
mkdir telegram-ai-assistant
cd telegram-ai-assistant

# 初始化 npm
npm init -y

# 安装依赖
npm install node-telegram-bot-api openai dotenv express sqlite3
npm install -D nodemon
```

### 5.2 Bot 基础代码

```javascript
// src/bot/index.js
const TelegramBot = require('node-telegram-bot-api');
const config = require('../utils/config');

class TelegramBotManager {
  constructor() {
    this.bot = new TelegramBot(config.telegram.token, { polling: true });
    this.setupHandlers();
  }

  setupHandlers() {
    // 监听消息
    this.bot.on('message', async (msg) => {
      const { text, chat, from } = msg;
      
      // 忽略命令和群组消息
      if (text.startsWith('/') || chat.type !== 'private') return;
      
      await this.handleMessage(msg);
    });

    // 命令处理
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
    this.bot.onText(/\/model/, (msg) => this.handleModel(msg));
    this.bot.onText(/\/clear/, (msg) => this.handleClear(msg));
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    try {
      // 显示"正在输入"状态
      this.bot.sendChatAction(chatId, 'typing');

      // 调用 AI 处理
      const response = await ai.chat(userId, text);

      // 发送回复
      await this.bot.sendMessage(chatId, response, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 New Chat', callback_data: 'new_chat' }],
            [{ text: '📖 History', callback_data: 'show_history' }]
          ]
        }
      });
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
  }

  handleStart(msg) {
    const chatId = msg.chat.id;
    this.bot.sendMessage(chatId, 
      `👋 Welcome to AI Assistant!\n\n` +
      `I can help you with:\n` +
      `• 💬 General conversation\n` +
      `• 💻 Programming help\n` +
      `• 📝 Writing assistance\n` +
      `• 🌐 Translation\n\n` +
      `Commands:\n` +
      `/start - Start\n` +
      `/help - Help\n` +
      `/model - Switch AI model\n` +
      `/clear - Clear chat history`
    );
  }

  handleHelp(msg) {
    const chatId = msg.chat.id;
    this.bot.sendMessage(chatId,
      `📖 Available Commands:\n\n` +
      `/start - Start the bot\n` +
      `/help - Show this help\n` +
      `/model - Switch AI model\n` +
      `/clear - Clear chat history\n` +
      `/status - Show current status`
    );
  }
}

module.exports = new TelegramBotManager();
```

### 5.3 AI 对话模块

```javascript
// src/ai/index.js
const DeepSeekProvider = require('./providers/deepseek');
const QwenProvider = require('./providers/qwen');
const SessionManager = require('../storage/sessions');

class AIChat {
  constructor() {
    this.providers = {
      deepseek: new DeepSeekProvider(),
      qwen: new QwenProvider()
    };
    this.currentProvider = 'deepseek';
    this.sessions = new SessionManager();
  }

  async chat(userId, message) {
    // 获取会话历史
    const history = this.sessions.getHistory(userId);

    // 添加用户消息
    history.push({ role: 'user', content: message });

    // 调用 AI
    const provider = this.providers[this.currentProvider];
    const response = await provider.chat(history);

    // 保存 AI 回复
    history.push({ role: 'assistant', content: response });

    // 限制历史长度（保留最近 20 条）
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    return response;
  }

  switchModel(modelName) {
    if (this.providers[modelName]) {
      this.currentProvider = modelName;
      return true;
    }
    return false;
  }
}

module.exports = new AIChat();
```

### 5.4 DeepSeek 提供商

```javascript
// src/ai/providers/deepseek.js
const { OpenAI } = require('openai');
const config = require('../../utils/config');

class DeepSeekProvider {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.deepseek.apiKey,
      baseURL: 'https://api.deepseek.com'
    });
    this.model = config.deepseek.model || 'deepseek-chat';
  }

  async chat(messages) {
    const systemPrompt = `You are a helpful AI assistant. 
Please respond in the same language as the user.
Be concise and friendly.`;

    // 添加系统提示
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: false
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }
}

module.exports = DeepSeekProvider;
```

### 5.5 Qwen 提供商

```javascript
// src/ai/providers/qwen.js
const { OpenAI } = require('openai');
const config = require('../../utils/config');

class QwenProvider {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.qwen.apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    });
    this.model = config.qwen.model || 'qwen-turbo';
  }

  async chat(messages) {
    const systemPrompt = `You are a helpful AI assistant named Qwen. 
Please respond in the same language as the user.
Be concise, friendly, and accurate.`;

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: fullMessages,
        temperature: 0.8,
        max_tokens: 2048
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Qwen API Error:', error);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }
}

module.exports = QwenProvider;
```

### 5.6 会话管理

```javascript
// src/storage/sessions.js
const Database = require('sqlite3').verbose();
const path = require('path');

class SessionManager {
  constructor() {
    this.db = new Database(path.join(__dirname, '../../data/sessions.db'));
    this.initDatabase();
  }

  initDatabase() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          user_id INTEGER PRIMARY KEY,
          messages TEXT,
          model TEXT DEFAULT 'deepseek',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });
  }

  getHistory(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT messages FROM sessions WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row ? JSON.parse(row.messages) : []);
        }
      );
    });
  }

  saveHistory(userId, messages) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO sessions (user_id, messages, updated_at) 
         VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [userId, JSON.stringify(messages)],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  clearHistory(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM sessions WHERE user_id = ?',
        [userId],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }
}

module.exports = SessionManager;
```

---

## 6. AI 模型接入

### 6.1 DeepSeek 模型选择

| 模型 | 价格 | 特点 |
|------|------|------|
| `deepseek-chat` | $0.27/M | 对话能力强，推荐 |
| `deepseek-coder` | $0.27/M | 编程专用 |
| `deepseek-reasoner` | $0.27/M | 推理能力强 |

### 6.2 Qwen 模型选择

| 模型 | 价格 | 特点 |
|------|------|------|
| `qwen-turbo` | $0.2/M | 快速响应 |
| `qwen-plus` | $0.8/M | 能力更强 |
| `qwen-max` | $20/M | 最强能力 |

### 6.3 模型切换功能

```javascript
// src/bot/handlers/command.js
async function handleModel(msg) {
  const chatId = msg.chat.id;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🐳 DeepSeek Chat', callback_data: 'model_deepseek-chat' },
          { text: '💻 DeepSeek Coder', callback_data: 'model_deepseek-coder' }
        ],
        [
          { text: '🚀 Qwen Turbo', callback_data: 'model_qwen-turbo' },
          { text: '🧠 Qwen Plus', callback_data: 'model_qwen-plus' }
        ]
      ]
    }
  };

  await bot.sendMessage(chatId, '🤖 Select AI Model:', keyboard);
}

// 回调处理
bot.on('callback_query', async (callbackQuery) => {
  const { data, message } = callbackQuery;
  
  if (data.startsWith('model_')) {
    const model = data.replace('model_', '');
    // 解析提供商和模型
    const [provider, modelName] = model.split('_');
    
    ai.switchModel(provider);
    ai.setModelName(modelName);
    
    await bot.editMessageText(
      `✅ Switched to ${modelName} (${provider})`,
      { chat_id: message.chat.id, message_id: message.message_id }
    );
  }
});
```

---

## 7. 高级功能

### 7.1 定时提醒功能

```javascript
// src/features/scheduler.js
const nodeCron = require('node-cron');

class Scheduler {
  constructor(bot) {
    this.bot = bot;
    this.tasks = new Map();
  }

  // 每天早上 8 点提醒
  scheduleMorningReminder(userId, time = '0 8 * * *') {
    nodeCron.schedule(time, async () => {
      await this.bot.sendMessage(userId, 
        '☀️ Good morning! Ready to start your day?'
      );
    });
  }

  // 自定义定时任务
  scheduleTask(userId, cronExpression, message) {
    const taskId = `${userId}_${Date.now()}`;
    
    nodeCron.schedule(cronExpression, async () => {
      await this.bot.sendMessage(userId, message);
    });

    this.tasks.set(taskId, true);
    return taskId;
  }

  // 取消任务
  cancelTask(taskId) {
    this.tasks.delete(taskId);
  }
}

module.exports = Scheduler;
```

### 7.2 群组管理

```javascript
// src/bot/handlers/group.js
class GroupHandler {
  constructor(bot) {
    this.bot = bot;
    this.setup();
  }

  setup() {
    // 新成员加入
    this.bot.on('new_chat_members', async (msg) => {
      const chatId = msg.chat.id;
      await this.bot.sendMessage(chatId, 
        '👋 Welcome! Use /help to see available commands.'
      );
    });

    // 成员离开
    this.bot.on('left_chat_member', async (msg) => {
      const chatId = msg.chat.id;
      // 可以记录离开事件
    });

    // 监听群组消息（需要 @ 机器人）
    this.bot.on('message', async (msg) => {
      if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') return;
      
      const text = msg.text || '';
      const botUsername = (await this.bot.getMe()).username;
      
      // 检查是否 @ 了机器人
      if (text.includes(`@${botUsername}`)) {
        const cleanText = text.replace(`@${botUsername}`, '').trim();
        if (cleanText) {
          await this.handleGroupMessage(msg, cleanText);
        }
      }
    });
  }
}

module.exports = GroupHandler;
```

### 7.3 多语言支持

```javascript
// src/i18n/index.js
const messages = {
  en: {
    welcome: 'Welcome to AI Assistant!',
    help: 'Available commands...',
    error: 'An error occurred. Please try again.',
    thinking: '🤔 Thinking...'
  },
  zh: {
    welcome: '👋 欢迎使用 AI 助手！',
    help: '可用命令...\n/start - 开始\n/help - 帮助\n/model - 切换模型',
    error: '❌ 出错了，请重试。',
    thinking: '🤔 思考中...'
  },
  ja: {
    welcome: '👋 AIアシスタントへようこそ！',
    help: '利用可能なコマンド...',
    error: '❌ エラーが発生しました。',
    thinking: '🤔 考え中...'
  }
};

function t(lang, key) {
  return messages[lang]?.[key] || messages.en[key];
}

module.exports = { t, messages };
```

---

## 8. 部署上线

### 8.1 部署平台对比

| 平台 | 免费额度 | 优点 | 缺点 |
|------|----------|------|------|
| **Railway** | $5/月 | 简单易用 | 免费额度有限 |
| **Zeabur** | 免费层 | 一键部署 | 冷启动慢 |
| **Fly.io** | 3 台机器 | 全球部署 | 配置复杂 |
| **Cloudflare Workers** | 10 万次/天 | 免费 | 有访问限制 |

### 8.2 Railway 部署

1. **准备代码**
   ```bash
   # 确保有 Procfile
   echo "web: node server.js" > Procfile
   
   # 确保数据目录存在
   mkdir -p data
   ```

2. **部署步骤**
   ```bash
   # 安装 Railway CLI
   npm install -g @railway/cli

   # 登录
   railway login

   # 初始化项目
   railway init

   # 设置环境变量
   railway variable set TELEGRAM_BOT_TOKEN=xxx
   railway variable set DEEPSEEK_API_KEY=xxx

   # 部署
   railway up
   ```

### 8.3 Zeabur 部署

1. 访问 [Zeabur](https://zeabur.com)
2. 连接 GitHub 仓库
3. 一键部署
4. 设置环境变量

### 8.4 Docker 部署（可选）

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p data

EXPOSE 3000

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
    volumes:
      - ./data:/app/data
```

---

## 9. 构建桌面端 exe

> 使用 Tauri 框架，一套代码同时构建 Windows、macOS、Linux 桌面应用

### 9.1 为什么选择 Tauri？

| 特性 | Tauri | Electron |
|------|-------|----------|
| 安装包大小 | 10-15 MB | 100-200 MB |
| 内存占用 | 极低 | 较高 |
| 启动速度 | 快 | 较慢 |
| 安全性 | 高 | 中等 |
| 打包平台 | Windows/macOS/Linux/Android | Windows/macOS/Linux |

### 9.2 安装 Tauri

```bash
# 前置要求
# 1. Node.js 18+
# 2. Rust (https://rustup.rs/)

# 安装 Tauri CLI
npm install -g @tauri-apps/cli

# 创建 Tauri 项目
npm create tauri-app@latest my-ai-assistant
# 选择: Vanilla JS 或 Vue/React
# 选择: Yes, using NPM

cd my-ai-assistant
```

### 9.3 项目结构

```
my-ai-assistant/
├── src/                    # 前端代码 (HTML/CSS/JS 或 Vue/React)
│   ├── main.js            # 前端入口
│   ├── App.vue            # 主界面
│   └── styles.css         # 样式
├── src-tauri/             # Rust 后端
│   ├── src/
│   │   └── main.rs       # Rust 入口
│   ├── Cargo.toml        # Rust 依赖
│   └── tauri.conf.json   # Tauri 配置
├── package.json
└── vite.config.js
```

### 9.4 前端界面代码

```html
<!-- src/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Assistant</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #1a1a2e;
      color: #fff;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 20px;
      background: #16213e;
      border-bottom: 1px solid #0f3460;
    }
    .header h1 { font-size: 20px; }
    .chat-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }
    .message {
      max-width: 70%;
      margin-bottom: 15px;
      padding: 12px 16px;
      border-radius: 12px;
      line-height: 1.5;
    }
    .message.user {
      background: #0f3460;
      margin-left: auto;
    }
    .message.assistant {
      background: #16213e;
    }
    .input-area {
      padding: 20px;
      background: #16213e;
      display: flex;
      gap: 10px;
    }
    .input-area input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #0f3460;
      border-radius: 8px;
      background: #1a1a2e;
      color: #fff;
      font-size: 14px;
    }
    .input-area button {
      padding: 12px 24px;
      background: #e94560;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    }
    .input-area button:hover { background: #d63d56; }
    .input-area button:disabled { background: #555; }
    .typing { opacity: 0.5; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🤖 AI Assistant</h1>
  </div>
  <div class="chat-container" id="chat"></div>
  <div class="input-area">
    <input type="text" id="messageInput" placeholder="Type your message..." />
    <button id="sendBtn">Send</button>
  </div>

  <script>
    const chat = document.getElementById('chat');
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      
      // 添加用户消息
      addMessage('user', text);
      input.value = '';
      sendBtn.disabled = true;
      
      // 添加等待消息
      const waitingMsg = addMessage('assistant', '<span class="typing">Thinking...</span>');
      
      try {
        // 调用后端 API
        const response = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        
        const data = await response.json();
        waitingMsg.innerHTML = data.response;
      } catch (error) {
        waitingMsg.textContent = 'Error: ' + error.message;
      }
      
      sendBtn.disabled = false;
    }
    
    function addMessage(role, content) {
      const div = document.createElement('div');
      div.className = `message ${role}`;
      div.innerHTML = content;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
      return div;
    }
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  </script>
</body>
</html>
```

### 9.5 Rust 后端（可选自定义）

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 9.6 Tauri 配置

```json
// src-tauri/tauri.conf.json
{
  "build": {
    "devtools": true
  },
  "package": {
    "productName": "AI Assistant",
    "version": "1.0.0"
  },
  "tauri": {
    "windows": [
      {
        "title": "AI Assistant",
        "width": 800,
        "height": 600,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

### 9.7 打包桌面应用

```bash
# 开发模式测试
npm run tauri dev

# 打包 Windows exe
npm run tauri build

# 打包 macOS
npm run tauri build -- --target universal-apple-darwin

# 打包 Linux
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

**输出位置：** `src-tauri/target/release/bundle/nsis/*.exe`

---

## 10. 构建手机端 APK

> 使用 Capacitor 或 Tauri，一套代码构建 iOS + Android 应用

### 10.1 方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| **Capacitor** | 简单，兼容 Ionic | 需要 Ionic 基础 |
| **Tauri** | 轻量，性能好 | 较新，生态发展中 |
| **HBuilderX** | 中文社区，集成好 | 你已经在用 |

**推荐：使用 Tauri**（与桌面端共用代码）

### 10.2 使用 Tauri 构建 APK

```bash
# 确保已安装 Tauri
npm install -g @tauri-apps/cli

# 添加 Android 支持
npm run tauri add android

# 或者使用 Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
```

### 10.3 Android 配置

```json
// capacitor.config.json (如果用 Capacitor)
{
  "appId": "com.yourname.aiassistant",
  "appName": "AI Assistant",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "android": {
    "allowMixedContent": true
  }
}
```

### 10.4 打包 APK

```bash
# 开发模式（需要连接手机）
npm run tauri dev android
# 或
npx cap run android

# 发布模式打包
npm run tauri build android
# 或
npx cap build android
```

**输出位置：** `src-tauri/target/release/apk/*.apk` 或 `android/app/build/outputs/apk/debug/*.apk`

### 10.5 使用 HBuilderX 构建 APK（更简单）

如果你熟悉 HBuilderX：

1. 将前端代码打包成 `dist`
2. 在 HBuilderX 新建 `5+App` 项目
3. 替换为你的前端代码
4. 发行 → 原生 App-云打包 → Android

---

## 11. 网页版部署

> 无需下载，直接在浏览器使用

### 11.1 部署到 Zeabur（推荐）

```bash
# 1. 准备前端静态页面
# 将前端代码 build 到 dist 目录

# 2. 创建 Zeabur 项目
# 访问 https://zeabur.com

# 3. 部署静态网站
# 选择 "Static" 类型
# 填入 GitHub 仓库或直接上传 dist
```

### 11.2 部署到 Vercel

```bash
# 全局安装 Vercel CLI
npm i -g vercel

# 进入项目目录
cd your-project

# 部署
vercel
```

### 11.3 部署到 Cloudflare Pages

```bash
# 1. 推送代码到 GitHub
# 2. 访问 Cloudflare Dashboard → Pages
# 3. 连接 GitHub 仓库
# 4. 构建命令: npm run build
# 5. 输出目录: dist
```

### 11.4 一站式解决方案

| 平台 | 网址 | 特点 |
|------|------|------|
| **Zeabur** | zeabur.com | 简单，支持 Node.js |
| **Vercel** | vercel.com | 快速，CDN 全球 |
| **Netlify** | netlify.com | 静态网站首选 |
| **Cloudflare** | cloudflare.com | 免费额度大 |

---

## 12. 运维与监控

### 9.1 日志系统

```javascript
// src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = logger;
```

### 9.2 错误处理

```javascript
// src/middleware/error.js
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  logger.error('Unhandled Rejection', { reason: String(reason) });
});
```

### 9.3 健康检查

```javascript
// src/server.js
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/stats', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    users: sessionManager.getUserCount()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 10. 项目结构总览

```
telegram-ai-assistant/
├── .env                    # 环境变量（不上传）
├── .gitignore
├── Procfile                # Railway 部署
├── package.json
├── Dockerfile              # Docker 部署
├── docker-compose.yml
│
├── src/
│   ├── bot/
│   │   ├── index.js       # Bot 入口
│   │   ├── handlers/
│   │   │   ├── message.js
│   │   │   ├── command.js
│   │   │   └── callback.js
│   │   └── keyboards/
│   │       └── main.js
│   │
│   ├── ai/
│   │   ├── index.js       # AI 入口
│   │   └── providers/
│   │       ├── deepseek.js
│   │       ├── qwen.js
│   │       └── openai.js
│   │
│   ├── storage/
│   │   ├── database.js
│   │   └── sessions.js
│   │
│   ├── features/
│   │   ├── scheduler.js
│   │   ├── i18n.js
│   │   └── group.js
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   ├── config.js
│   │   └── helpers.js
│   │
│   ├── middleware/
│   │   └── error.js
│   │
│   └── server.js           # Express 服务
│
└── data/                   # SQLite 数据库目录
```

---

## 11. 快速启动

```bash
# 1. 克隆项目（如有模板）
git clone https://github.com/yourusername/telegram-ai-assistant.git
cd telegram-ai-assistant

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 API Keys

# 4. 启动开发模式
npm run dev

# 5. 测试
# 在 Telegram 中给你的机器人发送 /start
```

---

## 12. 常见问题

### Q1: 机器人没有响应

- 检查 Telegram Token 是否正确
- 检查是否开启 polling
- 查看日志输出

### Q2: AI 返回错误

- 检查 API Key 是否有效
- 检查余额是否充足
- 确认模型名称正确

### Q3: 消息延迟

- 网络问题
- API 调用超时
- 考虑添加缓存

### Q4: 如何实现语音对话？

- 需要额外的语音识别（ASR）和语音合成（TTS）
- 可以使用 OpenAI Whisper 或 Google Cloud Speech

---

## 相关资源

- [Telegram Bot API 文档](https://core.telegram.org/bots/api)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [Qwen API 文档](https://help.aliyun.com/document_detail/2400395.html)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
