const TelegramBot = require('node-telegram-bot-api');
const config = require('../utils/config');
const AIChat = require('../ai/index');
const SessionManager = require('../storage/sessions');
const Scheduler = require('../features/scheduler');
const GroupHandler = require('../features/group');
const { handleStart, handleHelp } = require('./handlers/command');
const { handleMessage } = require('./handlers/message');
const { handleCallback } = require('./handlers/callback');

class TelegramBotManager {
  constructor() {
    this.bot = new TelegramBot(config.telegram.token, { polling: true });
    this.sessions = new SessionManager();
    this.scheduler = new Scheduler(this.bot);
    this.groupHandler = new GroupHandler(this.bot);
    this.setupHandlers();
  }

  setupHandlers() {
    // 监听消息
    this.bot.on('message', async (msg) => {
      const { text, chat, from } = msg;
      
      // 忽略命令（命令单独处理）
      if (text && text.startsWith('/')) return;
      
      if (chat.type === 'private') {
        await this.handleMessage(msg);
      }
      // 群组消息在 GroupHandler 中处理（通过 @ 提及）
    });

    // 命令处理
    this.bot.onText(/\/start/, (msg) => handleStart(this.bot, msg));
    this.bot.onText(/\/help/, (msg) => handleHelp(this.bot, msg));
    this.bot.onText(/\/model/, (msg) => this.handleModel(msg));
    this.bot.onText(/\/clear/, (msg) => this.handleClear(msg));
    this.bot.onText(/\/status/, (msg) => this.handleStatus(msg));
    this.bot.onText(/\/remind/, (msg) => this.handleRemind(msg));
    this.bot.onText(/\/tasks/, (msg) => this.handleTasks(msg));
    
    // 回调查询处理
    this.bot.on('callback_query', (callbackQuery) => handleCallback(this.bot, callbackQuery));
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    try {
      // 显示"正在输入"状态
      await this.bot.sendChatAction(chatId, 'typing');

      // 调用 AI 处理
      const response = await AIChat.chat(userId, text);

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
      console.error('Message handling error:', error);
      // 发送友好的错误消息
      const errorMessage = error.message.includes('429') 
        ? '⏳ Rate limit exceeded. Please wait a moment and try again.'
        : `❌ Error: ${error.message}`;
      await this.bot.sendMessage(chatId, errorMessage).catch(() => {});
    }
  }

  handleModel(msg) {
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
          ],
          [
            { text: '🔗 OpenRouter Qwen3 Coder', callback_data: 'model_openrouter_qwen-qwen3-coder:free' }
          ]
        ]
      }
    };

    this.bot.sendMessage(chatId, '🤖 Select AI Model:', keyboard);
  }

  handleClear(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    this.sessions.clearHistory(userId);
    this.bot.sendMessage(chatId, '🗑️ Chat history cleared');
  }

  handleStatus(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const provider = AIChat.getCurrentProvider();
    const model = AIChat.getCurrentModel();
    const sessionCount = this.sessions.getUserCount();
    
    const statusMsg = `
📊 Bot Status:

• AI Provider: ${provider}
• Current Model: ${model}
• Active Users: ${sessionCount}
• Server Time: ${new Date().toLocaleString()}
    `.trim();

    this.bot.sendMessage(chatId, statusMsg, {
      parse_mode: 'Markdown'
    });
  }

  handleRemind(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text.trim();
    
    // 简单解析 /remind 7:30am Drink water
    const match = text.match(/^\/remind\s+(\d{1,2}:\d{2}\s*[ap]m)\s+(.+)$/i);
    if (!match) {
      this.bot.sendMessage(chatId, 'Usage: /remind HH:MMam/pm Your reminder message\nExample: /remind 7:30am Drink water');
      return;
    }
    
    const [, timeStr, message] = match;
    // 转换时间格式为 cron 表达式 (简化处理)
    // 这里我们只做演示，实际需要更复杂的时间解析
    const cronTime = this.convertToCron(timeStr);
    if (!cronTime) {
      this.bot.sendMessage(chatId, 'Invalid time format. Use HH:MMam/pm');
      return;
    }
    
    const taskId = this.scheduler.scheduleTask(userId, cronTime, message);
    this.bot.sendMessage(chatId, `⏰ Reminder set for ${timeStr}\nTask ID: ${taskId}`);
  }

  handleTasks(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userTasks = this.scheduler.getUserTasks(userId);
    
    if (userTasks.length === 0) {
      this.bot.sendMessage(chatId, '📭 No active tasks');
      return;
    }
    
    const tasksList = userTasks.map((id, index) => `${index + 1}. ${id}`).join('\n');
    this.bot.sendMessage(chatId, `📋 Your active tasks:\n${tasksList}\n\nUse /cancel <taskId> to remove a task`);
  }

  // 简单的时间转 cron 表达式 (实际应用中应使用更完整的解析库)
  convertToCron(timeStr) {
    // 简单实现：只支持 HH:MMam/pm 格式，转换为对应的小时:分钟 * * *
    const match = timeStr.toLowerCase().match(/^(\d{1,2}):(\d{2})\s*([ap])m$/);
    if (!match) return null;
    
    let [, hourStr, minuteStr, ampm] = match;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    if (ampm === 'p' && hour !== 12) hour += 12;
    if (ampm === 'a' && hour === 12) hour = 0;
    
    // cron 格式: 分 时 日 月 周
    return `${minute} ${hour} * * *`;
  }
}

module.exports = new TelegramBotManager();
