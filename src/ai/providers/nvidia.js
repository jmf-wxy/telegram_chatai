const { OpenAI } = require('openai');
const config = require('../../utils/config');
const logger = require('../../utils/logger');

class NvidiaProvider {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.nvidia.apiKey,
      baseURL: config.nvidia.baseURL,
      timeout: 30000
    });

    // Examples from NVIDIA NIM docs:
    // - z-ai/glm5
    // - minimaxai/minimax-m2.7
    this.model = config.nvidia.model || 'z-ai/glm5';
  }

  setModel(modelName) {
    this.model = modelName;
  }

  async chat(messages) {
    const systemPrompt = `You are a helpful AI assistant. 
Please respond in the same language as the user.
Be concise and friendly.`;

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    try {
      logger.info(`Calling NVIDIA Integrate API with model: ${this.model}`);
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: false
      });

      logger.info('NVIDIA Integrate API call successful');
      return response.choices[0].message.content;
    } catch (error) {
      logger.error('NVIDIA Integrate API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Invalid NVIDIA API key. Please check NVIDIA_API_KEY.');
          case 429:
            throw new Error('NVIDIA rate limit exceeded. Please try again later.');
          case 403:
            throw new Error('Access denied. Your NVIDIA account may not have access to this model.');
          case 404:
            throw new Error(`Model not found: ${this.model}. Please check NVIDIA_MODEL.`);
          case 500:
          case 502:
          case 503:
            throw new Error('NVIDIA service is temporarily unavailable. Please try again later.');
          default:
            throw new Error(`NVIDIA API error: ${error.response.status}`);
        }
      }

      throw new Error(`Failed to connect to NVIDIA Integrate API: ${error.message}`);
    }
  }
}

module.exports = NvidiaProvider;

