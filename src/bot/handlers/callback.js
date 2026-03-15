const AIChat = require('../../ai/index');
const { detectLanguage, t } = require('../../i18n');

async function handleCallback(bot, callbackQuery) {
  const { data, message, from } = callbackQuery;
  const chatId = message.chat.id;
  const userId = from.id;
  const lang = detectLanguage(''); // Default to detecting from context, for now use empty

  try {
    await bot.answerCallbackQuery(callbackQuery.id);

    if (data.startsWith('model_')) {
      const model = data.replace('model_', '');
      // 解析提供商和模型
      const [provider, modelName] = model.split('_');
      
      // 切换提供商
      const switched = AIChat.switchProvider(provider);
      if (switched) {
        // 设置模型
        AIChat.setModel(modelName);
        await bot.editMessageText(
          t(lang, 'modelSwitched', { model: modelName, provider: provider }),
          { chat_id: chatId, message_id: message.message_id }
        );
      } else {
        await bot.answerCallbackQuery(callbackQuery.id, { text: t(lang, 'error', {}), show_alert: true });
      }
    } else if (data === 'new_chat') {
      // 清除当前用户的会话历史
      // Note: We need access to the session manager here, but for simplicity we'll just acknowledge
      await bot.answerCallbackQuery(callbackQuery.id, { text: '🔄 New chat started', show_alert: false });
      // In a real implementation, we would clear the user's session history here
    } else if (data === 'show_history') {
      // 显示历史（简化版）
      await bot.answerCallbackQuery(callbackQuery.id, { text: '📖 History feature coming soon', show_alert: true });
    }
  } catch (error) {
    console.error('Callback error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Error processing request', show_alert: true });
  }
}

module.exports = { handleCallback };
