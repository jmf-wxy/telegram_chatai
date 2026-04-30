const AIChat = require('../ai/index');
const sessions = require('../storage/sessions');
const { sendMessageSafe } = require('../bot/index');
const logger = require('../utils/logger');

class GroupHandler {
  constructor(bot) {
    this.bot = bot;
    this.botInfo = null;
    this.initBotInfo();
  }

  async initBotInfo() {
    try {
      this.botInfo = await this.bot.getMe();
    } catch (error) {
      logger.error('Failed to get bot info:', { error: error.message });
    }
  }

  setup() {
    this.bot.on('new_chat_members', async (msg) => {
      const chatId = msg.chat.id;
      if (!this.botInfo) await this.initBotInfo();
      const newMembers = msg.new_chat_members.filter(member => member.id === this.botInfo.id);

      if (newMembers.length > 0) {
        await this.bot.sendMessage(chatId,
          '👋 Thanks for adding me to this group! I\'m here to help answer questions. Use /help to see available commands.'
        );
      }
    });

    this.bot.on('left_chat_member', async (msg) => {
      const chatId = msg.chat.id;
      const leftMember = msg.left_chat_member;
      if (!this.botInfo) await this.initBotInfo();

      if (leftMember.id === this.botInfo.id) {
        logger.info(`Bot removed from group ${chatId}`);
      }
    });

    this.bot.on('message', async (msg) => {
      if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') return;
      if (!this.botInfo) await this.initBotInfo();

      const text = msg.text || '';

      if (text.includes(`@${this.botInfo.username}`)) {
        const cleanText = text.replace(`@${this.botInfo.username}`, '').trim();
        if (cleanText) {
          await this.handleGroupMessage(msg, cleanText);
        }
      }
    });
  }

  async handleGroupMessage(msg, cleanText) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await this.bot.sendChatAction(chatId, 'typing');

      const response = await AIChat.chat(userId, cleanText);

      await sendMessageSafe(this.bot, chatId, response);
    } catch (error) {
      logger.error('Group message error:', { error: error.message });
      await this.bot.sendMessage(chatId, '❌ Sorry, I encountered an error processing your request.');
    }
  }
}

module.exports = GroupHandler;
