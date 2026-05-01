function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

const MAX_MESSAGE_LENGTH = 4090;

function splitMessage(text, maxLength = MAX_MESSAGE_LENGTH) {
  if (!text || text.length <= maxLength) return [text];
  
  const messages = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      messages.push(remaining);
      break;
    }
    
    let splitIndex = remaining.lastIndexOf('\n', maxLength);
    if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
      splitIndex = maxLength;
    }
    
    messages.push(remaining.substring(0, splitIndex).trim());
    remaining = remaining.substring(splitIndex).trim();
  }
  
  return messages.filter(msg => msg.length > 0);
}

async function sendMessageSafe(bot, chatId, text, extra = {}) {
  if (!text || typeof text !== 'string') {
    return await bot.sendMessage(chatId, '❌ Empty response from AI');
  }

  const logger = require('./logger');
  
  try {
    const cleanText = text.trim();
    
    if (cleanText.length <= MAX_MESSAGE_LENGTH) {
      return await bot.sendMessage(chatId, cleanText, { ...extra, parse_mode: 'Markdown' });
    }
    
    const parts = splitMessage(cleanText);
    let lastMessage = null;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      
      try {
        if (isLast && extra.reply_markup) {
          lastMessage = await bot.sendMessage(chatId, part, { ...extra, parse_mode: 'Markdown' });
        } else {
          lastMessage = await bot.sendMessage(chatId, part, { parse_mode: 'Markdown' });
        }
      } catch (markdownError) {
        try {
          if (isLast && extra.reply_markup) {
            const { parse_mode, ...rest } = extra;
            lastMessage = await bot.sendMessage(chatId, part, rest);
          } else {
            lastMessage = await bot.sendMessage(chatId, part);
          }
        } catch (plainError) {
          logger.error('Failed to send message part:', { 
            error: plainError.message, 
            partLength: part.length,
            partPreview: part.substring(0, 100)
          });
          
          const safePart = part
            .replace(/[_*[\]()~`>#+\|={}]/g, '')
            .substring(0, MAX_MESSAGE_LENGTH);
            
          lastMessage = await bot.sendMessage(chatId, safePart);
        }
      }
    }
    
    return lastMessage;
    
  } catch (error) {
    logger.error('sendMessageSafe failed completely:', { 
      error: error.message,
      textLength: text.length,
      chatId: chatId
    });
    
    try {
      const fallbackText = '⚠️ Response too long or contains invalid characters. Please check logs.';
      return await bot.sendMessage(chatId, fallbackText);
    } catch (_) {
      return null;
    }
  }
}

module.exports = { escapeMarkdown, sendMessageSafe, splitMessage };
