const DeepSeekProvider = require('./providers/deepseek');
const QwenProvider = require('./providers/qwen');
const OpenRouterProvider = require('./providers/openrouter');
const GroqProvider = require('./providers/groq');
const SessionManager = require('../storage/sessions');

class AIChat {
  constructor() {
    this.providers = {
      deepseek: new DeepSeekProvider(),
      qwen: new QwenProvider(),
      openrouter: new OpenRouterProvider(),
      groq: new GroqProvider()
    };
    this.currentProvider = 'groq';
    this.currentModel = 'llama-3.3-70b-versatile'; // default to fast free model
    this.sessions = new SessionManager();
  }

  async chat(userId, message) {
    // 获取会话历史
    const history = await this.sessions.getHistory(userId);

    // 添加用户消息
    history.push({ role: 'user', content: message });

    // 调用 AI
    const provider = this.providers[this.currentProvider];
    // 设置模型名称（如果提供商支持）
    if (provider.setModel) {
      provider.setModel(this.currentModel);
    }
    
    let response;
    try {
      response = await provider.chat(history);
    } catch (error) {
      console.error(`AI provider ${this.currentProvider} failed:`, error.message);
      
      // 如果当前提供商失败，尝试备用提供商
      const providers = ['groq', 'deepseek', 'qwen', 'openrouter'];
      const currentIndex = providers.indexOf(this.currentProvider);
      
      for (let i = 1; i <= 3; i++) {
        const altProviderName = providers[(currentIndex + i) % 4];
        const altProvider = this.providers[altProviderName];
        console.log(`Trying fallback provider: ${altProviderName}`);
        try {
          response = await altProvider.chat(history);
          console.log(`Fallback to ${altProviderName} succeeded`);
          break;
        } catch (altError) {
          console.error(`Fallback provider ${altProviderName} also failed:`, altError.message);
        }
      }
      
      if (!response) {
        throw new Error('All AI providers failed. Please check your API keys and try again later.');
      }
    }

    // 保存 AI 回复
    history.push({ role: 'assistant', content: response });

    // 限制历史长度（保留最近 20 条）
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    // 保存更新后的历史
    await this.sessions.saveHistory(userId, history);

    return response;
  }

  switchProvider(providerName) {
    if (this.providers[providerName]) {
      this.currentProvider = providerName;
      return true;
    }
    return false;
  }

  setModel(modelName) {
    this.currentModel = modelName;
    // 如果当前提供商支持设置模型，立即应用
    const provider = this.providers[this.currentProvider];
    if (provider && typeof provider.setModel === 'function') {
      provider.setModel(modelName);
    }
    return true;
  }

  getCurrentProvider() {
    return this.currentProvider;
  }

  getCurrentModel() {
    return this.currentModel;
  }
}

module.exports = new AIChat();
