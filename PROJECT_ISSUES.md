# Telegram AI Assistant - 项目问题清单

> 审查日期：2026-05-01
> 审查范围：全部源码、配置文件、Electron 桌面端

---

## 🔴 严重问题（会导致功能异常或数据错误）

### 1. AIChat 全局状态导致多用户互相影响
- **文件**: `src/ai/index.js`
- **问题**: `AIChat` 以单例模式导出（`module.exports = new AIChat()`），`currentProvider` 和 `currentModel` 是全局共享状态。当用户 A 切换模型后，用户 B 也会受影响。
- **影响**: 多用户同时使用时，模型/提供商切换会互相干扰。
- **建议**: 将 provider/model 状态改为 per-user，存储在 SessionManager 中，chat 时根据 userId 获取对应用户的配置。

### 2. SessionManager 存在两个独立实例，数据不互通
- **文件**: `src/bot/index.js`（第 17 行）、`src/ai/index.js`（第 26 行）
- **问题**: `TelegramBotManager` 和 `AIChat` 各自 `new SessionManager()`，创建了两个完全独立的内存 Map。在 bot 中 `this.sessions.clearHistory(userId)` 清除的是 bot 实例的 session，而 AIChat 中的 session 数据仍然存在。
- **影响**: `/clear` 命令无法真正清除聊天历史；`/status` 显示的活跃用户数与实际不一致。
- **建议**: 统一使用同一个 SessionManager 实例，或让 AIChat 接受外部注入的 SessionManager。

### 3. handleMessage 逻辑重复且 handlers/message.js 从未被调用
- **文件**: `src/bot/index.js`（第 50-79 行）、`src/bot/handlers/message.js`
- **问题**: `TelegramBotManager.handleMessage` 自行处理消息，而 `handlers/message.js` 中的 `handleMessage` 被导入（第 8 行）但从未使用。两者逻辑相似但不完全相同——handlers 版本使用了 i18n，bot 版本没有。
- **影响**: i18n 国际化在私聊消息中完全失效；代码维护成本增加。
- **建议**: 删除 `bot/index.js` 中的 `handleMessage` 方法，改为调用 `handlers/message.js` 中的函数。

### 4. /model 命令缺少 NVIDIA 提供商选项
- **文件**: `src/bot/index.js`（第 82-107 行）
- **问题**: `handleModel` 的 inline keyboard 只列出了 DeepSeek、Qwen、Groq、OpenRouter，没有 NVIDIA。但 `src/ai/providers/nvidia.js` 已实现且在 AIChat 中注册。
- **影响**: 用户无法通过 /model 命令切换到 NVIDIA 提供商。
- **建议**: 在 keyboard 中添加 NVIDIA 模型选项。

### 5. callback_query 中 answerCallbackQuery 被重复调用
- **文件**: `src/bot/handlers/callback.js`（第 19 行和第 49 行）
- **问题**: 对于 `model_` 类型的回调查询，第 19 行已经调用了 `answerCallbackQuery`，但在 switch provider 失败时第 49 行又调用了一次。Telegram API 不允许对同一个 callback_query 回答两次，第二次会报错。
- **影响**: 切换模型失败时会产生 Telegram API 错误。
- **建议**: 将第 19 行的 `answerCallbackQuery` 移除，在各分支中按需调用；或在 model_ 分支开头 return 前不调用。

### 6. Markdown 解析模式与 AI 回复内容不兼容
- **文件**: `src/bot/index.js`（第 63 行）、`src/bot/handlers/message.js`（第 20 行）、`src/features/group.js`（第 65 行）
- **问题**: 所有 `sendMessage` 都使用 `parse_mode: 'Markdown'`，但 AI 的回复可能包含未转义的 `_`、`*`、`[`、`` ` `` 等字符，导致 Telegram Markdown 解析失败并抛出异常。
- **影响**: 当 AI 回复包含特殊字符时，消息发送失败，用户收不到回复。
- **建议**: 改用 `MarkdownV2` 并对回复内容做转义，或改用 `HTML` parse_mode，或添加 try-catch 在 Markdown 失败时回退到纯文本发送。

---

## 🟠 中等问题（功能缺陷或设计不合理）

### 7. Fallback 逻辑会尝试没有 API Key 的提供商
- **文件**: `src/ai/index.js`（第 50-64 行）
- **问题**: 当主提供商失败时，fallback 会依次尝试所有其他提供商，但未检查它们是否配置了 API Key。对空 API Key 的提供商发起请求必然失败，浪费时间且产生无意义的错误日志。
- **建议**: 在 fallback 循环中跳过没有配置 API Key 的提供商。

### 8. /cancel 命令未注册
- **文件**: `src/bot/index.js`（第 174 行）
- **问题**: `handleTasks` 的输出提示用户 "Use /cancel <taskId> to remove a task"，但代码中没有注册 `/cancel` 命令的处理器。
- **影响**: 用户无法取消已设置的定时任务。
- **建议**: 添加 `/cancel` 命令处理器。

### 9. detectLanguage 在 callback 中传入空字符串
- **文件**: `src/bot/handlers/callback.js`（第 16 行）
- **问题**: `detectLanguage('')` 永远返回 `'en'`，因为空字符串不包含中文/日文字符。callback 场景下应该从用户语言偏好或之前的消息中推断语言。
- **影响**: callback 响应的语言始终为英文，即使用户使用中文。
- **建议**: 从用户 session 或 Telegram 用户设置中获取语言偏好。

### 10. 定时任务和会话数据仅存内存，重启即丢失
- **文件**: `src/storage/sessions.js`、`src/features/scheduler.js`
- **问题**: SessionManager 使用 Map 存储会话，Scheduler 使用 Map 存储任务，均为纯内存存储。进程重启后所有数据丢失。
- **影响**: 用户重启 bot 后聊天历史和定时提醒全部消失。
- **建议**: 使用文件持久化（JSON）或轻量级数据库（如 SQLite、lowdb）存储会话和任务数据。

### 11. /remind 只支持每日重复，不支持一次性提醒
- **文件**: `src/bot/index.js`（第 138-161 行）
- **问题**: `convertToCron` 将时间转换为 cron 表达式（如 `30 7 * * *`），意味着提醒每天都会触发，无法设置一次性提醒。
- **建议**: 支持指定日期，或在任务触发后自动取消。

### 12. 群组消息处理器重复监听 message 事件
- **文件**: `src/bot/index.js`（第 25 行）、`src/features/group.js`（第 37 行）
- **问题**: `TelegramBotManager.setupHandlers` 注册了 `bot.on('message', ...)` 处理私聊消息，`GroupHandler.setup` 又注册了一个 `bot.on('message', ...)` 处理群组消息。node-telegram-bot-api 会按注册顺序触发所有监听器，私聊消息也会进入 GroupHandler 的处理逻辑（虽然会被 type 检查过滤），反之亦然。
- **影响**: 每条消息都会被两个监听器处理，虽然逻辑上被过滤，但增加了不必要的开销和潜在冲突。
- **建议**: 统一在一个 message 监听器中根据 chat.type 分发。

### 13. GroupHandler 每次消息都调用 getMe()
- **文件**: `src/features/group.js`（第 41 行）
- **问题**: 每收到一条群组消息都调用 `this.bot.getMe()` 获取 bot 信息，这是对 Telegram API 的无谓调用。
- **建议**: 在构造函数中调用一次 `getMe()` 并缓存结果。

---

## 🟡 轻度问题（代码质量、配置、安全）

### 14. 日志使用不一致：console.error 与 logger.error 混用
- **文件**: 多处（`src/bot/index.js`、`src/ai/providers/deepseek.js`、`src/ai/providers/groq.js`、`src/ai/providers/qwen.js`）
- **问题**: 部分文件使用 `console.error`，部分使用 `logger.error`，日志无法统一管理和收集。
- **建议**: 统一使用 winston logger。

### 15. logger.js 在开发模式下添加了重复的 Console transport
- **文件**: `src/utils/logger.js`（第 22 行和第 30-33 行）
- **问题**: 创建 logger 时已添加了一个 Console transport（第 22 行），在非 production 环境下又添加了一个（第 30 行），导致开发模式下每条日志输出两次。
- **建议**: 创建 logger 时不添加 Console transport，仅在非 production 环境下添加。

### 16. System Prompt 在 5 个 Provider 中重复定义
- **文件**: `src/ai/providers/` 下所有文件
- **问题**: 每个提供商的 `chat` 方法中都定义了几乎相同的 systemPrompt，修改时需要改 5 处。
- **建议**: 将 systemPrompt 提取为共享常量或配置项。

### 17. .gitignore 缺少重要条目
- **文件**: `.gitignore`
- **问题**: 缺少以下条目：
  - `dist-electron/` — Electron 构建产物（当前已提交到仓库）
  - `launcher_settings.json` — Python 启动器的本地设置
  - `.claude/` — Claude 工作树数据
- **影响**: 构建产物和本地配置可能被意外提交。
- **建议**: 添加上述条目到 `.gitignore`。

### 18. Electron 设置界面缺少 NVIDIA 配置项
- **文件**: `electron/renderer/index.html`、`electron/main.js`
- **问题**: Electron 桌面端的 Settings 界面和 `config:load`/`config:save` IPC 处理器都没有包含 NVIDIA_API_KEY、NVIDIA_BASE_URL、NVIDIA_MODEL 字段。用户无法在桌面端配置 NVIDIA 提供商。
- **建议**: 在 Settings 表单中添加 NVIDIA 相关字段，并更新 IPC 处理器。

### 19. Electron DEFAULT_PROVIDER 下拉缺少 nvidia 选项
- **文件**: `electron/renderer/index.html`（第 92-97 行）
- **问题**: `<select id="DEFAULT_PROVIDER">` 只有 groq、deepseek、qwen、openrouter 四个选项，缺少 nvidia。
- **建议**: 添加 `<option value="nvidia">nvidia</option>`。

### 20. Express 服务器缺少认证和限流
- **文件**: `src/server.js`
- **问题**: `/health` 和 `/stats` 端点没有任何认证，`/stats` 暴露了内存使用等信息。没有 rate limiting 中间件。
- **建议**: 对敏感端点添加认证，添加 express-rate-limit 中间件。

### 21. 测试脚本为空
- **文件**: `package.json`（第 11 行）
- **问题**: `"test": "echo \"Error: no test specified\" && exit 1"`，项目没有任何测试。
- **建议**: 添加单元测试框架（如 Jest）和核心模块的测试用例。

### 22. runtime.js 未被 server.js CLI 模式使用
- **文件**: `src/server.js`（第 55-58 行）、`src/runtime.js`
- **问题**: `server.js` 在 CLI 模式下直接调用 `startBot()` + `startServer()`，而 `runtime.js` 封装了同样的逻辑但未被 server.js 使用。只有 Electron 端通过 `runtime.js` 启动。
- **影响**: 两套启动路径可能导致行为不一致。
- **建议**: 统一使用 `runtime.js` 作为唯一入口。

### 23. 残留的 .claude/worktrees 目录
- **路径**: `.claude/worktrees/upbeat-robinson-d2b94f/`
- **问题**: 该目录包含一份旧版本的项目副本（含有 `PROJECT_ISSUES.md` 等文件），属于开发工具的工作残留。
- **建议**: 删除该目录，并将 `.claude/` 加入 `.gitignore`。

### 24. Procfile 配置不完整
- **文件**: `Procfile`
- **问题**: 只定义了 `web: node src/server.js`，没有启动 bot 进程。如果部署到 Heroku 等平台，只会启动 Express 服务器而不会启动 Telegram bot。
- **建议**: 改为 `worker: node src/server.js`（因为 Telegram bot 不需要 web 端口），或使用 `web: node src/runtime.js`。

### 25. AI 提供商错误处理不一致
- **文件**: `src/ai/providers/` 下所有文件
- **问题**: OpenRouter 和 NVIDIA 提供商有详细的 HTTP 状态码错误处理，但 DeepSeek、Groq、Qwen 只有简单的 catch 并抛出通用错误。不同提供商的错误信息格式和详细程度差异很大。
- **建议**: 统一所有提供商的错误处理逻辑，提取为公共方法。

---

## 📋 问题汇总

| 严重程度 | 数量 |
|---------|------|
| 🔴 严重 | 6 |
| 🟠 中等 | 7 |
| 🟡 轻度 | 12 |
| **合计** | **25** |

---

## 🎯 优先修复建议

1. **最优先**: 修复 SessionManager 双实例问题（#2）和 AIChat 全局状态问题（#1），这两个是核心架构缺陷。
2. **高优先**: 修复 Markdown 解析问题（#6）、handlers/message.js 未使用问题（#3）、/model 缺少 NVIDIA（#4）。
3. **中优先**: 添加数据持久化（#10）、修复 /cancel 命令缺失（#8）、统一日志使用（#14）。
4. **低优先**: 添加测试（#21）、统一错误处理（#25）、清理残留文件（#23）。
