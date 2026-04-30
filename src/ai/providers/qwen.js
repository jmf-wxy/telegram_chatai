const { OpenAI } = require('openai');
const config = require('../../utils/config');
const logger = require('../../utils/logger');
const { SYSTEM_PROMPT } = require('../constants');

class QwenProvider {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.qwen.apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    });
    this.model = config.qwen.model || 'qwen-turbo';
  }

  setModel(modelName) {
    this.model = modelName;
  }

  async chat(messages) {
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: fullMessages,
        temperature: 0.8,
        max_tokens: 2048
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('Qwen API Error:', { message: error.message, status: error.response?.status });
      throw new Error(`AI request failed: ${error.message}`);
    }
  }
}

module.exports = QwenProvider;
