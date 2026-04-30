function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

async function sendMessageSafe(bot, chatId, text, extra = {}) {
  try {
    return await bot.sendMessage(chatId, text, { ...extra, parse_mode: 'Markdown' });
  } catch (_) {
    try {
      const { parse_mode, ...rest } = extra;
      return await bot.sendMessage(chatId, text, rest);
    } catch (__) {
      return await bot.sendMessage(chatId, '❌ Failed to send message');
    }
  }
}

module.exports = { escapeMarkdown, sendMessageSafe };
