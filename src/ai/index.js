const DeepSeekProvider = require('./providers/deepseek');
const QwenProvider = require('./providers/qwen');
const OpenRouterProvider = require('./providers/openrouter');
const GroqProvider = require('./providers/groq');
const NvidiaProvider = require('./providers/nvidia');
const sessions = require('../storage/sessions');
const config = require('../utils/config');
const logger = require('../utils/logger');

const TONE_PROMPTS = {
  formal: 'You must respond in a formal, professional, and academic tone. Use proper grammar and avoid slang.',
  casual: 'Respond in a relaxed, casual, conversational tone. Be friendly and approachable like chatting with a friend.',
  humorous: 'Respond with humor and wit. Use jokes, puns, or lighthearted comments when appropriate while still being helpful.',
  gentle: 'Respond in a gentle, warm, caring tone. Be empathetic, patient, and supportive in your answers.',
  energetic: 'Respond with energy and enthusiasm! Use exclamation marks (sparingly), be upbeat, and show excitement when helping.',
  academic: 'Respond as an expert academic. Provide detailed, well-structured answers with citations and technical depth where appropriate.',
  poetic: 'Respond with artistic flair. Use metaphors, vivid imagery, and elegant language. Make your responses feel like poetry.',
};

function buildSystemPrompt() {
  const aiTone = (config.ai && config.ai.tone) || '';
  const userTitle = (config.ai && config.ai.userTitle) || '';

  let prompt = 'You are a helpful AI assistant.\nPlease respond in the same language as the user.\n';

  if (userTitle) {
    prompt += `When addressing the user, call them "${userTitle}".\n`;
  }

  if (aiTone && TONE_PROMPTS[aiTone]) {
    prompt += TONE_PROMPTS[aiTone] + '\n';
  }

  prompt += 'Be concise and friendly.';
  return prompt;
}

let cachedSystemPrompt = null;

function getSystemPrompt() {
  const currentTone = (config.ai && config.ai.tone) || '';
  const currentUserTitle = (config.ai && config.ai.userTitle) || '';

  if (!cachedSystemPrompt) {
    cachedSystemPrompt = { tone: currentTone, userTitle: currentUserTitle, prompt: buildSystemPrompt() };
    return cachedSystemPrompt.prompt;
  }

  if (cachedSystemPrompt.tone !== currentTone || cachedSystemPrompt.userTitle !== currentUserTitle) {
    cachedSystemPrompt = { tone: currentTone, userTitle: currentUserTitle, prompt: buildSystemPrompt() };
  }

  return cachedSystemPrompt.prompt;
}

class AIChat {
  constructor() {
    this.providers = {
      deepseek: new DeepSeekProvider(),
      qwen: new QwenProvider(),
      openrouter: new OpenRouterProvider(),
      groq: new GroqProvider(),
      nvidia: new NvidiaProvider(),
    };
    this.defaultProvider = (config.ai && config.ai.defaultProvider) ? config.ai.defaultProvider : 'groq';
    this.defaultModel = (config.ai && config.ai.defaultModel) ? config.ai.defaultModel : '';
  }

  _getUserProvider(userId) {
    return sessions.getUserProvider(userId) || this.defaultProvider;
  }

  _getUserModel(userId) {
    const model = sessions.getUserModel(userId);
    if (model) return model;
    if (this.defaultModel) return this.defaultModel;
    const providerName = this._getUserProvider(userId);
    const providerConfig = config[providerName] || {};
    return providerConfig.model || 'llama-3.3-70b-versatile';
  }

  _hasApiKey(providerName) {
    const providerConfig = config[providerName] || {};
    return !!(providerConfig.apiKey && providerConfig.apiKey.trim() !== '');
  }

  async chat(userId, message) {
    let history = await sessions.getHistory(userId);
    
    const systemPrompt = getSystemPrompt();
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    const providerName = this._getUserProvider(userId);
    const modelName = this._getUserModel(userId);
    const provider = this.providers[providerName];

    let response;
    try {
      if (provider.setModel) provider.setModel(modelName);
      response = await provider.chat(messages);
    } catch (error) {
      logger.error(`AI provider ${providerName} failed:`, { error: error.message });

      const providers = ['nvidia', 'groq', 'deepseek', 'qwen', 'openrouter'];
      const currentIndex = providers.indexOf(providerName);

      for (let i = 1; i <= 4; i++) {
        const altProviderName = providers[(currentIndex + i) % 5];
        if (!this._hasApiKey(altProviderName)) continue;
        const altProvider = this.providers[altProviderName];
        logger.info(`Trying fallback provider: ${altProviderName}`);
        try {
          const altModel = config[altProviderName]?.model || '';
          if (altModel && altProvider.setModel) altProvider.setModel(altModel);
          response = await altProvider.chat(messages);
          logger.info(`Fallback to ${altProviderName} succeeded`);
          break;
        } catch (altError) {
          logger.error(`Fallback provider ${altProviderName} also failed:`, { error: altError.message });
        }
      }

      if (!response) {
        throw new Error('All AI providers failed. Please check your API keys and try again later.');
      }
    }

    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: response });

    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    sessions.saveHistory(userId, history);
    return response;
  }

  switchProvider(userId, providerName) {
    if (this.providers[providerName]) {
      sessions.setUserProvider(userId, providerName);
      return true;
    }
    return false;
  }

  setModel(userId, modelName) {
    sessions.setUserModel(userId, modelName);
    return true;
  }

  getCurrentProvider(userId) {
    return this._getUserProvider(userId);
  }

  getCurrentModel(userId) {
    return this._getUserModel(userId);
  }

  clearHistory(userId) {
    sessions.clearHistory(userId);
    return true;
  }

  getHistory(userId) {
    return sessions.getHistory(userId);
  }
}

module.exports = new AIChat();
