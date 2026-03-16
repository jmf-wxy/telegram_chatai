# 🤖 Telegram AI Assistant

一个基于 Telegram 的个人 AI 助手，支持 Groq、DeepSeek、Qwen 等多种 AI 模型。免费部署，开箱即用！

## ✨ 功能特点

- 💬 **自然语言对话** - 通过 Telegram 与 AI 助手进行流畅对话
- 🔥 **Groq 免费支持** - 使用 Groq API，完全免费，超快速度
- 🧠 **上下文记忆** - 记住对话历史，提供连贯交流体验
- ⚡ **多模型支持** - Groq / DeepSeek / Qwen / OpenRouter，随意切换
- ⏰ **定时任务** - 支持定时提醒和消息推送
- 👥 **群组管理** - 支持群组 @机器人 交互
- 🌍 **多语言** - 中文、英文，日语自动切换
- ☁️ **一键部署** - 支持 Zeabur/Railway 部署，24/7 在线

## 🔑 API Key 获取教程

### 1. TELEGRAM_BOT_TOKEN（必须）

1. 打开 Telegram，搜索 **@BotFather**
2. 发送 `/newbot` 创建新机器人
3. 按照提示设置名称和用户名
4. 获取 Token（格式：`123456:ABC-DEF...`）

### 2. GROQ_API_KEY（必须，免费）

1. 访问 [console.groq.com](https://console.groq.com)
2. 注册/登录账号（新用户自动获得免费额度）
3. 点击 **API Keys** → 创建新 Key
4. 复制 Key 即可

## 🚀 快速部署

### 方式一：Zeabur（推荐）

1. Fork 本项目
2. 访问 [Zeabur](https://zeabur.com)
3. 连接 GitHub，一键部署
4. 在服务设置中添加环境变量：
   - `TELEGRAM_BOT_TOKEN` = 你的 Telegram Token
   - `GROQ_API_KEY` = 你的 Groq API Key

### 方式二：Railway

```bash
npm i -g @railway/cli
railway login
railway init
railway variable set TELEGRAM_BOT_TOKEN=你的Token
railway variable set GROQ_API_KEY=你的Key
railway up
```

### 方式三：本地运行

```bash
# 克隆项目
git clone https://github.com/jmf-wxy/telegram_chatai.git
cd telegram_chatai

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 API Keys

# 启动
npm start
```

## 📋 环境变量说明

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Telegram Bot Token（@BotFather 获取）|
| `GROQ_API_KEY` | ✅ | Groq API Key（免费，从 console.groq.com 获取）|
| `GROQ_MODEL` | ❌ | 默认：`llama-3.3-70b-versatile` |

## 🤖 可用命令

- `/start` - 启动机器人
- `/help` - 查看帮助
- `/model` - 切换 AI 模型
- `/clear` - 清除聊天历史
- `/status` - 查看状态

## 💰 免费 AI 模型

| 提供商 | 模型 | 价格 |
|--------|------|------|
| **Groq** | Llama 3.3 70B | 🆓 免费 |
| OpenRouter | Gemma 3 | 🆓 免费 |

推荐使用 **Groq**，免费且速度极快（1000+ tokens/秒）！

## 📂 项目结构

```
telegram-ai-assistant/
├── src/
│   ├── bot/                 # Telegram Bot
│   ├── ai/                  # AI 提供商
│   ├── storage/             # 会话存储
│   ├── features/            # 高级功能
│   ├── utils/              # 工具函数
│   └── server.js           # 服务入口
├── .env                     # 环境变量
├── package.json
└── Procfile                 # 部署配置
```
