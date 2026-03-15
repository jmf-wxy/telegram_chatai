const Groq = require('groq-sdk');
const config = require('../../utils/config');

class GroqProvider {
  constructor() {
    // Groq API is free and very fast!
    this.client = new Groq({
      apiKey: config.groq.apiKey
    });
    this.model = config.groq.model || 'llama-3.3-70b-versatile';
  }

  setModel(modelName) {
    this.model = modelName;
  }

  async chat(messages) {
    const systemPrompt = `You are a helpful AI assistant. 
Please respond in the same language as the user.
Be concise and friendly.`;

    // Add system prompt
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
      console.error('Groq API Error:', error);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }
}

module.exports = GroqProvider;
