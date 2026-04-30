const AIChat = require('../../ai/index');
const sessions = require('../../storage/sessions');
const { detectLanguage, t } = require('../../i18n');
const { sendMessageSafe } = require('../../utils/telegram');

async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  const lang = detectLanguage(text || '');
  sessions.setUserLang(userId, lang);

  try {
    await bot.sendChatAction(chatId, 'typing');

    const response = await AIChat.chat(userId, text);

    await sendMessageSafe(bot, chatId, response, {
      reply_markup: {
        inline_keyboard: [
          [{ text: t(lang, 'newChat', {}), callback_data: 'new_chat' }],
          [{ text: t(lang, 'history', {}), callback_data: 'show_history' }]
        ]
      }
    });
  } catch (error) {
    const logger = require('../../utils/logger');
    logger.error('AI chat error:', { error: error.message });
    await bot.sendMessage(chatId, t(lang, 'error', {}));
  }
}

module.exports = { handleMessage };
