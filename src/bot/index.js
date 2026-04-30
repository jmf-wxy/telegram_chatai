const TelegramBot = require('node-telegram-bot-api');
const config = require('../utils/config');
const AIChat = require('../ai/index');
const sessions = require('../storage/sessions');
const Scheduler = require('../features/scheduler');
const GroupHandler = require('../features/group');
const { handleStart, handleHelp } = require('./handlers/command');
const { handleMessage } = require('./handlers/message');
const { handleCallback } = require('./handlers/callback');
const logger = require('../utils/logger');

const { sendMessageSafe } = require('../utils/telegram');

class TelegramBotManager {
  constructor() {
    if (!config.telegram.token) {
      throw new Error('Missing TELEGRAM_BOT_TOKEN. Please set it in .env before starting the bot.');
    }
    this.bot = new TelegramBot(config.telegram.token, { polling: true });
    this.scheduler = new Scheduler(this.bot);
    this.groupHandler = new GroupHandler(this.bot);
    this.setupHandlers();
  }

  setupHandlers() {
    this.bot.on('message', async (msg) => {
      const { text, chat } = msg;

      if (text && text.startsWith('/')) return;

      if (chat.type === 'private') {
        await handleMessage(this.bot, msg);
      }
    });

    this.bot.onText(/\/start/, (msg) => handleStart(this.bot, msg));
    this.bot.onText(/\/help/, (msg) => handleHelp(this.bot, msg));
    this.bot.onText(/\/model/, (msg) => this.handleModel(msg));
    this.bot.onText(/\/clear/, (msg) => this.handleClear(msg));
    this.bot.onText(/\/status/, (msg) => this.handleStatus(msg));
    this.bot.onText(/\/remind/, (msg) => this.handleRemind(msg));
    this.bot.onText(/\/tasks/, (msg) => this.handleTasks(msg));
    this.bot.onText(/\/cancel\s+(.+)/, (msg, match) => this.handleCancel(msg, match));

    this.bot.on('callback_query', (callbackQuery) => handleCallback(this.bot, callbackQuery));
  }

  handleModel(msg) {
    const chatId = msg.chat.id;
    const mk = (provider, model) => `model_${provider}_${Buffer.from(String(model), 'utf8').toString('base64url')}`;
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🐳 DeepSeek Chat', callback_data: mk('deepseek', 'deepseek-chat') },
            { text: '💻 DeepSeek Coder', callback_data: mk('deepseek', 'deepseek-coder') }
          ],
          [
            { text: '🚀 Qwen Turbo', callback_data: mk('qwen', 'qwen-turbo') },
            { text: '🧠 Qwen Plus', callback_data: mk('qwen', 'qwen-plus') }
          ],
          [
            { text: '🆓 Groq Llama 3.3 70B', callback_data: mk('groq', 'llama-3.3-70b-versatile') }
          ],
          [
            { text: '🔗 OpenRouter Qwen3 Coder (free)', callback_data: mk('openrouter', 'qwen/qwen3-coder:free') }
          ],
          [
            { text: '🟢 NVIDIA GLM5', callback_data: mk('nvidia', 'z-ai/glm5') },
            { text: '🟢 NVIDIA MiniMax M2.7', callback_data: mk('nvidia', 'minimaxai/minimax-m2.7') }
          ]
        ]
      }
    };

    this.bot.sendMessage(chatId, '🤖 Select AI Model:', keyboard);
  }

  handleClear(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    AIChat.clearHistory(userId);
    this.bot.sendMessage(chatId, '🗑️ Chat history cleared');
  }

  handleStatus(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const provider = AIChat.getCurrentProvider(userId);
    const model = AIChat.getCurrentModel(userId);
    const sessionCount = sessions.getUserCount();

    const statusMsg = `
📊 Bot Status:

• AI Provider: ${provider}
• Current Model: ${model}
• Active Users: ${sessionCount}
• Server Time: ${new Date().toLocaleString()}
    `.trim();

    sendMessageSafe(this.bot, chatId, statusMsg);
  }

  handleRemind(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text.trim();

    const match = text.match(/^\/remind\s+(\d{1,2}:\d{2}\s*[ap]m)\s+(.+)$/i);
    if (!match) {
      this.bot.sendMessage(chatId, 'Usage: /remind HH:MMam/pm Your reminder message\nExample: /remind 7:30am Drink water\nAdd "once" for one-time: /remind 7:30am once Drink water');
      return;
    }

    const [, timeStr, message] = match;
    const isOnce = text.toLowerCase().includes(' once');
    const cronTime = this.convertToCron(timeStr);
    if (!cronTime) {
      this.bot.sendMessage(chatId, 'Invalid time format. Use HH:MMam/pm');
      return;
    }

    const taskId = this.scheduler.scheduleTask(userId, cronTime, message, isOnce);
    const typeLabel = isOnce ? 'one-time' : 'daily';
    this.bot.sendMessage(chatId, `⏰ ${typeLabel} reminder set for ${timeStr}\nTask ID: ${taskId}`);
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

  handleCancel(msg, match) {
    const chatId = msg.chat.id;
    const taskId = match[1].trim();
    const cancelled = this.scheduler.cancelTask(taskId);
    if (cancelled) {
      this.bot.sendMessage(chatId, `✅ Task ${taskId} cancelled`);
    } else {
      this.bot.sendMessage(chatId, `❌ Task ${taskId} not found`);
    }
  }

  convertToCron(timeStr) {
    const match = timeStr.toLowerCase().match(/^(\d{1,2}):(\d{2})\s*([ap])m$/);
    if (!match) return null;

    let [, hourStr, minuteStr, ampm] = match;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (ampm === 'p' && hour !== 12) hour += 12;
    if (ampm === 'a' && hour === 12) hour = 0;

    return `${minute} ${hour} * * *`;
  }
}

let singleton = null;

function startBot() {
  if (singleton) return singleton;
  singleton = new TelegramBotManager();
  return singleton;
}

async function stopBot() {
  if (!singleton) return;
  try {
    if (singleton.bot && typeof singleton.bot.stopPolling === 'function') {
      await singleton.bot.stopPolling();
    }
  } catch (_) {}

  try {
    if (singleton.bot && typeof singleton.bot.close === 'function') {
      await singleton.bot.close();
    }
  } catch (_) {}

  singleton = null;
}

function getBotManager() {
  return singleton;
}

module.exports = { startBot, stopBot, getBotManager, TelegramBotManager };
