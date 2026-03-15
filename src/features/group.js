const AIChat = require('../ai/index');

class GroupHandler {
  constructor(bot) {
    this.bot = bot;
    this.setup();
  }

  setup() {
    // 新成员加入
    this.bot.on('new_chat_members', async (msg) => {
      const chatId = msg.chat.id;
      const botInfo = await this.bot.getMe();
      const newMembers = msg.new_chat_members.filter(member => member.id === botInfo.id);
      
      if (newMembers.length > 0) {
        await this.bot.sendMessage(chatId, 
          '👋 Thanks for adding me to this group! I\'m here to help answer questions. Use /help to see available commands.'
        );
      }
    });

    // 成员离开
    this.bot.on('left_chat_member', async (msg) => {
      const chatId = msg.chat.id;
      const leftMember = msg.left_chat_member;
      const botInfo = await this.bot.getMe();
      
      if (leftMember.id === botInfo.id) {
        // Bot was removed from group
        console.log(`Bot removed from group ${chatId}`);
        // Optionally clean up any group-specific data
      }
    });

    // 监听群组消息（需要 @ 机器人）
    this.bot.on('message', async (msg) => {
      if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') return;
      
      const text = msg.text || '';
      const botInfo = await this.bot.getMe();
      
      // 检查是否 @ 了机器人
      if (text.includes(`@${botInfo.username}`)) {
        const cleanText = text.replace(`@${botInfo.username}`, '').trim();
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
      // 显示"正在输入"状态
      await this.bot.sendChatAction(chatId, 'typing');
      
      // 调用 AI 处理
      const response = await AIChat.chat(userId, cleanText);
      
      // 发送回复
      await this.bot.sendMessage(chatId, response, {
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Group message error:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, I encountered an error processing your request.');
    }
  }
}

module.exports = GroupHandler;
