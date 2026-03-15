const { t } = require('../../i18n');

async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  const welcomeMsg = `
👋 Welcome to AI Assistant!

I can help you with:
• 💬 General conversation
• 💻 Programming help
• 📝 Writing assistance
• 🌐 Translation

Commands:
/start - Start
/help - Help
/model - Switch AI model
/clear - Clear chat history
  `.trim();

  bot.sendMessage(chatId, welcomeMsg, {
    parse_mode: 'Markdown'
  });
}

async function handleHelp(bot, msg) {
  const chatId = msg.chat.id;
  const helpMsg = `
📖 Available Commands:

/start - Start the bot
/help - Show this help
/model - Switch AI model
/clear - Clear chat history
/status - Show current status
  `.trim();

  bot.sendMessage(chatId, helpMsg, {
    parse_mode: 'Markdown'
  });
}

module.exports = {
  handleStart,
  handleHelp
};
