const path = require('path');
require('dotenv').config({
  path: process.env.DOTENV_PATH ? path.resolve(process.env.DOTENV_PATH) : undefined
});

const config = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || ''
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  },
  qwen: {
    apiKey: process.env.QWEN_API_KEY || '',
    model: process.env.QWEN_MODEL || 'qwen-turbo'
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'qwen/qwen3-coder:free'
  },
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY || '',
    baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    model: process.env.NVIDIA_MODEL || 'z-ai/glm5'
  },
  ai: {
    defaultProvider: process.env.DEFAULT_PROVIDER || 'groq',
    defaultModel: process.env.DEFAULT_MODEL || '',
    tone: process.env.AI_TONE || '',
    userTitle: process.env.AI_USER_TITLE || ''
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  }
};

module.exports = config;
