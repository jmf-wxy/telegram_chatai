const AIChat = require('../../ai/index');
const { detectLanguage, t } = require('../../i18n');

async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // 检测用户语言
  const lang = detectLanguage(text || '');

  try {
    // 显示"正在输入"状态
    await bot.sendChatAction(chatId, 'typing');

    // 调用 AI 处理
    const response = await AIChat.chat(userId, text);

    // 发送回复
    await bot.sendMessage(chatId, response, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: t(lang, 'newChat', {}), callback_data: 'new_chat' }],
          [{ text: t(lang, 'history', {}), callback_data: 'show_history' }]
        ]
      }
    });
  } catch (error) {
    console.error('AI chat error:', error);
    await bot.sendMessage(chatId, t(lang, 'error', {}));
  }
}

module.exports = { handleMessage };
