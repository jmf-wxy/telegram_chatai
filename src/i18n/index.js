const messages = {
  en: {
    welcome: 'Welcome to AI Assistant!',
    help: 'Available commands...',
    error: 'An error occurred. Please try again.',
    thinking: '🤔 Thinking...',
    modelSwitched: 'Switched to {model} ({provider})',
    historyCleared: 'Chat history cleared',
    newChat: '🆕 New Chat',
    history: '📜 History'
  },
  zh: {
    welcome: '👋 欢迎使用 AI 助手！',
    help: '可用命令...\n/start - 开始\n/help - 帮助\n/model - 切换模型',
    error: '❌ 出错了，请重试。',
    thinking: '🤔 思考中...',
    modelSwitched: '已切换到 {model} ({provider})',
    historyCleared: '聊天历史已清除',
    newChat: '🆕 新对话',
    history: '📜 历史记录'
  },
  ja: {
    welcome: '👋 AIアシスタントへようこそ！',
    help: '利用可能なコマンド...',
    error: '❌ エラーが発生しました。',
    thinking: '🤔 考え中...',
    modelSwitched: '{model} ({provider})に切り替えました',
    historyCleared: 'チャット履歴をクリアしました',
    newChat: '🆕 新しいチャット',
    history: '📜 履歴'
  }
};

function t(lang, key, vars = {}) {
  let text = messages[lang]?.[key] || messages.en[key];
  // Simple variable replacement
  Object.keys(vars).forEach(varName => {
    text = text.replace(`{${varName}}`, vars[varName]);
  });
  return text;
}

function detectLanguage(text) {
  // Simple detection: if contains Chinese characters, use zh
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  // If contains Japanese characters (Hiragana/Katakana), use ja
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  // Default to English
  return 'en';
}

module.exports = { t, detectLanguage, messages };
