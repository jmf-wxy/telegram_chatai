const { OpenAI } = require('openai');
const config = require('../../utils/config');

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
    const systemPrompt = `You are a helpful AI assistant. 
Please respond in the same language as the user.
Be concise and friendly.`;

    // 添加系统提示
    const fullMessages = [
      { role: 'system', content: systemPrompt },
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
      console.error('DeepSeek API Error:', error);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }
}

module.exports = DeepSeekProvider;
