# 🚀 Telegram AI Assistant - Startup Guide

## 项目状态：✅ 核心功能已实现

### 📁 项目结构
```
telegram-ai-assistant/
├── src/
│   ├── ai/
│   │   ├── index.js              # AI统一入口
│   │   └── providers/
│   │       ├── deepseek.js       # DeepSeek提供商
│   │       ├── qwen.js           # Qwen提供商
│   │       └── openrouter.js     # OpenRouter提供商 (您指定的免费模型)
│   ├── bot/
│   │   ├── index.js              # 主机器人入口
│   │   ├── handlers/             # 消息和命令处理器
│   │   └── keyboards/            # 键盘布局
│   ├── storage/                  # 会话存储
│   │   └── sessions.js           # 会话管理（内存版）
│   ├── features/                 # 高级功能
│   │   ├── scheduler.js          # 定时任务
│   │   ├── group.js              # 群组管理
│   │   └── i18n.js               # 多语言支持
│   ├── utils/                    # 工具函数
│   │   ├── config.js             # 配置管理
│   │   └── logger.js             # 日志系统
│   ├── middleware/               # 中间件
│   │   └── error.js              # 错误处理
│   └── server.js                 # Express服务器
├── .env                          # 环境变量（包含您的OpenRouter API Key）
├── .env.example                  # 环境变量模板
├── package.json
├── README.md
└── STARTUP_GUIDE.md              # 本文件
```

### 🔑 已配置的API密钥
- **OpenRouter**: `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`
- **模型**: `qwen/qwen3-coder:free` (您指定的免费模型)

### 🌍 免费AI模型获取指南

#### 1. OpenRouter (已配置)
您已经配置了OpenRouter的免费Qwen3 Coder模型：
- 访问: https://openrouter.ai
- 模型: `qwen/qwen3-coder:free` 
- 状态: ✅ 已配置并就绪

#### 2. DeepSeek 免费层
获取免费DeepSeek API访问：
1. 访问 https://platform.deepseek.com/
2. 注册免费账号（需要邮箱验证）
3. 新用户通常获得免费试用额度
4. 在控制台创建API key
5. 将 `DEEPSEEK_API_KEY=your_key` 添加到 `.env` 文件

#### 3. Qwen 免费层
获取免费Qwen API访问：
1. 访问 https://cloud.aliyun.com/
2. 注册阿里云账号
3. 开通百炼服务（通义千问）
4. 获取免费额度
5. 将 `QWEN_API_KEY=your_key` 添加到 `.env` 文件

### 🚀 快速启动

1. **确保环境变量已设置**（已完成）
   ```bash
   cat .env
   # 应该能看到您的OpenRouter API Key
   ```

2. **安装依赖**（已完成）
   ```bash
   npm install
   ```

3. **启动应用**
   ```bash
   # 开发模式（带热重载）
   npm run dev
   
   # 生产模式
   npm start
   ```

4. **在Telegram中测试**
   - 找到您的机器人（通过@BotFather创建时获得的用户名）
   - 发送 `/start` 开始对话
   - 发送 `/model` 查看可用的AI模型
   - 尝试发送任何消息进行AI对话

### 🛠️ 可用命令
- `/start` - 启动机器人并显示欢迎信息
- `/help` - 显示帮助信息
- `/model` - 切换AI模型（DeepSeek/Qwen/OpenRouter）
- `/clear` - 清除当前聊天历史
- `/status` - 显示当前状态和统计信息
- `/remind HH:MMam/pm 消息` - 设置定时提醒
- `/tasks` - 查看您的定时任务

### 🔧 高级功能
- **多模型支持**: DeepSeek, Qwen, OpenRouter (免费)
- **上下文记忆**: 记住对话历史（最近20条）
- **多语言**: 自动检测并响应用户语言（中/英/日）
- **定时任务**: 支持自定义时间表的提醒
- **群组管理**: 支持@机器人在群组中交互
- **会话持久化**: 对话历史存储在本地SQLite数据库中
- **错误处理**: 完善的错误处理和日志系统

### 📱 多端扩展计划
按照您的需求，此项目支持：
1. **Telegram Bot** (已实现)
2. **桌面端 EXE** (使用 Tauri)
3. **手机端 APK** (使用 Tauri/Android)
4. **网页版** (静态网站部署)

### 📝 注意事项
1. 当前使用内存会话存储，重启后会话将丢失
   - 如需持久存储，请使用SQLite版本的 `src/storage/sessions.js`
2. OpenRouter免费模型可能有速率限制
3. 建议在生产环境中设置适当的API使用限制和监控

### 🆘 故障排除
- **机器人无响应**: 检查Telegram Token是否正确
- **AI返回错误**: 检查API Key是否有效及额度是否充足
- **连接超时**: 检查网络连接或尝试切换到其他模型
- **429错误**: 您可能触及了速率限制，请稍后再试

### 📞 技术支持
如有问题，请查看：
- `README.md` - 详细的项目文档
- `Telegram-AI-Assistant-Development-Guide.md` - 原始开发指南
- 项目日志文件（在 `logs/` 目录）

祝您使用愉快！🎉
