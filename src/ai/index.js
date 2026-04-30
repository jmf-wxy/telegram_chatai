const DeepSeekProvider = require('./providers/deepseek');
const QwenProvider = require('./providers/qwen');
const OpenRouterProvider = require('./providers/openrouter');
const GroqProvider = require('./providers/groq');
const NvidiaProvider = require('./providers/nvidia');
const sessions = require('../storage/sessions');
const config = require('../utils/config');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are a helpful AI assistant.
Please respond in the same language as the user.
Be concise and friendly.`;

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
    const history = await sessions.getHistory(userId);
    history.push({ role: 'user', content: message });

    const providerName = this._getUserProvider(userId);
    const modelName = this._getUserModel(userId);
    const provider = this.providers[providerName];

    let response;
    try {
      if (provider.setModel) provider.setModel(modelName);
      response = await provider.chat(history);
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
          response = await altProvider.chat(history);
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
