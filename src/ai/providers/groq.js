const Groq = require('groq-sdk');
const config = require('../../utils/config');
const logger = require('../../utils/logger');
const { SYSTEM_PROMPT } = require('../constants');

class GroqProvider {
  constructor() {
    this.client = new Groq({
      apiKey: config.groq.apiKey
    });
    this.model = config.groq.model || 'llama-3.3-70b-versatile';
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
        temperature: 0.7,
        max_tokens: 2048,
        stream: false
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('Groq API Error:', { message: error.message, status: error.response?.status });
      throw new Error(`AI request failed: ${error.message}`);
    }
  }
}

module.exports = GroqProvider;
