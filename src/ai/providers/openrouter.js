const { OpenAI } = require('openai');
const config = require('../../utils/config');
const logger = require('../../utils/logger');

class OpenRouterProvider {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openrouter.apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      // Optional: Add timeout and retry configurations
      timeout: 30000, // 30 seconds
    });
    this.model = config.openrouter.model || 'qwen/qwen3-coder:free';
  }

  setModel(modelName) {
    this.model = modelName;
  }

  async chat(messages) {
    const systemPrompt = `You are a helpful AI assistant. 
Please respond in the same language as the user.
Be concise and friendly.`;

    // 添加系统提示
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    try {
      logger.info(`Calling OpenRouter API with model: ${this.model}`);
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: false
      });

      logger.info('OpenRouter API call successful');
      return response.choices[0].message.content;
    } catch (error) {
      logger.error('OpenRouter API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Provide more specific error messages based on status code
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Invalid OpenRouter API key. Please check your configuration.');
          case 429:
            throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
          case 402:
            throw new Error('Insufficient credits. Please check your OpenRouter account balance.');
          case 403:
            throw new Error('Access denied. Your account may not have access to this model.');
          case 404:
            throw new Error(`Model not found: ${this.model}. Please check the model name.`);
          case 500:
          case 502:
          case 503:
            throw new Error('OpenRouter service is temporarily unavailable. Please try again later.');
          default:
            throw new Error(`OpenRouter API error: ${error.response.status}`);
        }
      } else {
        throw new Error(`Failed to connect to OpenRouter: ${error.message}`);
      }
    }
  }
}

module.exports = OpenRouterProvider;
