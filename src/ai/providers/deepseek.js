const { OpenAI } = require('openai');
const config = require('../../utils/config');
const logger = require('../../utils/logger');

class DeepSeekProvider {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.deepseek.apiKey,
      baseURL: 'https://api.deepseek.com'
    });
    this.model = config.deepseek.model || 'deepseek-chat';
  }

  setModel(modelName) {
    this.model = modelName;
  }

  async chat(messages) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: false
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('DeepSeek API Error:', { message: error.message, status: error.response?.status });
      throw new Error(`AI request failed: ${error.message}`);
    }
  }
}

module.exports = DeepSeekProvider;
