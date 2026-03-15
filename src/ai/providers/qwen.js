const { OpenAI } = require('openai');
const config = require('../../utils/config');

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
    const systemPrompt = `You are a helpful AI assistant named Qwen. 
Please respond in the same language as the user.
Be concise, friendly, and accurate.`;

    const fullMessages = [
      { role: 'system', content: systemPrompt },
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
      console.error('Qwen API Error:', error);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }
}

module.exports = QwenProvider;
