const fs = require('fs');
const path = require('path');

function readEnv(envPath) {
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    env[k] = v;
  }
  return env;
}

function writeEnvMerge(envPath, updates) {
  const env = readEnv(envPath);
  for (const [k, v] of Object.entries(updates || {})) {
    if (v === undefined || v === null) continue;
    env[k] = String(v).trim();
  }

  const preferred = [
    'TELEGRAM_BOT_TOKEN',
    'GROQ_API_KEY', 'GROQ_MODEL',
    'DEEPSEEK_API_KEY', 'DEEPSEEK_MODEL',
    'QWEN_API_KEY', 'QWEN_MODEL',
    'OPENROUTER_API_KEY', 'OPENROUTER_MODEL',
    'NVIDIA_API_KEY', 'NVIDIA_BASE_URL', 'NVIDIA_MODEL',
    'DEFAULT_PROVIDER', 'DEFAULT_MODEL',
    'PORT', 'NODE_ENV',
    'LOG_DIR',
  ];

  const used = new Set();
  const lines = [];
  lines.push('# Generated/updated by Electron app');
  lines.push('');

  for (const k of preferred) {
    if (k in env && env[k] !== '') {
      lines.push(`${k}=${env[k]}`);
      used.add(k);
    }
  }

  const rest = Object.keys(env).filter(k => !used.has(k)).sort();
  if (rest.length) {
    lines.push('');
    for (const k of rest) lines.push(`${k}=${env[k]}`);
  }
  lines.push('');

  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
}

module.exports = { readEnv, writeEnvMerge };

