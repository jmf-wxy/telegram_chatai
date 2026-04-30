const AIChat = require('../../ai/index');
const sessions = require('../../storage/sessions');
const { detectLanguage, t } = require('../../i18n');
const { sendMessageSafe } = require('../../utils/telegram');

function decodeBase64UrlToUtf8(b64url) {
  try {
    return Buffer.from(String(b64url || ''), 'base64url').toString('utf8');
  } catch (e) {
    return '';
  }
}

async function handleCallback(bot, callbackQuery) {
  const { data, message, from } = callbackQuery;
  const chatId = message.chat.id;
  const userId = from.id;
  const lang = sessions.getUserLang(userId) || detectLanguage(from.language_code || '') || 'en';

  try {
    if (data.startsWith('model_')) {
      const parts = data.split('_');
      const provider = parts[1] || '';
      const rest = parts.slice(2).join('_');
      const decodedModel = decodeBase64UrlToUtf8(rest);

      let targetProvider = provider;
      let modelName = decodedModel || rest || '';

      if (!decodedModel && (!targetProvider || !AIChat.switchProvider(userId, targetProvider))) {
        targetProvider = '';
        if (modelName.startsWith('deepseek-')) targetProvider = 'deepseek';
        else if (modelName.startsWith('qwen-')) targetProvider = 'qwen';
        else if (modelName.startsWith('llama-')) targetProvider = 'groq';
        else if (modelName.includes('/')) targetProvider = 'openrouter';
      }

      const switched = AIChat.switchProvider(userId, targetProvider);
      if (switched) {
        AIChat.setModel(userId, modelName);
        await bot.answerCallbackQuery(callbackQuery.id);
        await bot.editMessageText(
          t(lang, 'modelSwitched', { model: modelName, provider: targetProvider }),
          { chat_id: chatId, message_id: message.message_id }
        );
      } else {
        await bot.answerCallbackQuery(callbackQuery.id, { text: t(lang, 'error', {}), show_alert: true });
      }
    } else if (data === 'new_chat') {
      AIChat.clearHistory(userId);
      await bot.answerCallbackQuery(callbackQuery.id, { text: '🔄 New chat started', show_alert: false });
      try {
        await bot.sendMessage(chatId, '✅ New chat started. Send a message to begin.');
      } catch (_) {}
    } else if (data === 'show_history') {
      const history = AIChat.getHistory(userId) || [];
      const last = history.slice(-10).filter(m => m && typeof m.content === 'string');
      if (last.length === 0) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: '📭 No history yet', show_alert: false });
        return;
      }
      await bot.answerCallbackQuery(callbackQuery.id);
      const preview = last.map((m) => {
        const role = m.role === 'assistant' ? '🤖' : '👤';
        const text = String(m.content || '').replace(/\s+/g, ' ').slice(0, 180);
        return `${role} ${text}`;
      }).join('\n\n');
      await bot.sendMessage(chatId, `📖 Recent history (last ${last.length}):\n\n${preview}`);
    } else {
      await bot.answerCallbackQuery(callbackQuery.id);
    }
  } catch (error) {
    console.error('Callback error:', error);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Error processing request', show_alert: true });
    } catch (_) {}
  }
}

module.exports = { handleCallback };
