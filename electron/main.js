const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const { readEnv, writeEnvMerge } = require('./env');

let mainWindow = null;
let runtime = null;
let runtimeStarted = false;

let logTailTimer = null;
let logOffset = 0;

function getPrefsPath() {
  return path.join(app.getPath('userData'), 'prefs.json');
}

function readPrefs() {
  try {
    const p = getPrefsPath();
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) {
    return {};
  }
}

function writePrefs(prefs) {
  try {
    const p = getPrefsPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(prefs || {}, null, 2), 'utf8');
  } catch (_) {}
}

function writeMainLog(line) {
  try {
    const p = path.join(app.getPath('userData'), 'electron-main.log');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.appendFileSync(p, `[${new Date().toISOString()}] ${line}\n`, 'utf8');
  } catch (_) {}
}

process.on('uncaughtException', (err) => {
  writeMainLog(`uncaughtException: ${err && err.stack ? err.stack : String(err)}`);
});
process.on('unhandledRejection', (err) => {
  writeMainLog(`unhandledRejection: ${err && err.stack ? err.stack : String(err)}`);
});

function getUserEnvPath() {
  return path.join(app.getPath('userData'), '.env');
}

function getLogDir() {
  return path.join(app.getPath('userData'), 'logs');
}

function getCombinedLogPath() {
  return path.join(getLogDir(), 'combined.log');
}

function ensureEnvExists() {
  const envPath = getUserEnvPath();
  if (!fs.existsSync(envPath)) {
    fs.mkdirSync(path.dirname(envPath), { recursive: true });
    fs.writeFileSync(envPath, '# Created by Electron app\n', 'utf8');
  }
}

function loadRuntimeModule() {
  if (runtime) return runtime;

  // Ensure dotenv reads from userData
  ensureEnvExists();
  process.env.DOTENV_PATH = getUserEnvPath();
  process.env.LOG_DIR = getLogDir();

  // Now load the existing runtime (bot+server)
  runtime = require('../src/runtime');
  return runtime;
}

function startLogTail() {
  if (logTailTimer) return;
  const logPath = getCombinedLogPath();
  fs.mkdirSync(path.dirname(logPath), { recursive: true });

  const pump = () => {
    try {
      if (!fs.existsSync(logPath)) return;
      const stat = fs.statSync(logPath);
      if (stat.size < logOffset) logOffset = 0;
      if (stat.size === logOffset) return;

      const fd = fs.openSync(logPath, 'r');
      const buf = Buffer.alloc(stat.size - logOffset);
      fs.readSync(fd, buf, 0, buf.length, logOffset);
      fs.closeSync(fd);
      logOffset = stat.size;

      const text = buf.toString('utf8');
      if (mainWindow && text) {
        for (const line of text.split(/\r?\n/)) {
          if (line === '') continue;
          mainWindow.webContents.send('logs:line', line + '\n');
        }
      }
    } catch (_) {}
  };

  logTailTimer = setInterval(pump, 350);
}

async function stopLogTail() {
  if (!logTailTimer) return;
  clearInterval(logTailTimer);
  logTailTimer = null;
  logOffset = 0;
}

async function startRuntime() {
  const rt = loadRuntimeModule();
  rt.startRuntime({ withServer: true });
  runtimeStarted = true;
  startLogTail();
}

async function stopRuntime() {
  if (!runtime || !runtimeStarted) return;
  await runtime.stopRuntime();
  runtimeStarted = false;
  await stopLogTail();
}

function createWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 980,
      height: 720,
      minWidth: 880,
      minHeight: 640,
      backgroundColor: '#070b14',
      title: 'Telegram AI Assistant',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  } catch (e) {
    writeMainLog(`createWindow failed: ${e && e.stack ? e.stack : String(e)}`);
    throw e;
  }
}

app.whenReady().then(() => {
  writeMainLog('app ready');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await stopRuntime().catch(() => {});
    app.quit();
  }
});

ipcMain.handle('config:load', async () => {
  ensureEnvExists();
  const envPath = getUserEnvPath();
  const env = readEnv(envPath);

  // Defaults
  return {
    TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN || '',
    GROQ_API_KEY: env.GROQ_API_KEY || '',
    DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY || '',
    QWEN_API_KEY: env.QWEN_API_KEY || '',
    OPENROUTER_API_KEY: env.OPENROUTER_API_KEY || '',
    NVIDIA_API_KEY: env.NVIDIA_API_KEY || '',
    NVIDIA_BASE_URL: env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    NVIDIA_MODEL: env.NVIDIA_MODEL || 'z-ai/glm5',

    DEFAULT_PROVIDER: env.DEFAULT_PROVIDER || 'groq',
    DEFAULT_MODEL: env.DEFAULT_MODEL || (env.GROQ_MODEL || 'llama-3.3-70b-versatile'),
    PORT: env.PORT || '3000',
    NODE_ENV: env.NODE_ENV || 'development',
  };
});

ipcMain.handle('config:save', async (_e, cfg) => {
  ensureEnvExists();
  const envPath = getUserEnvPath();
  const updates = {
    TELEGRAM_BOT_TOKEN: cfg.TELEGRAM_BOT_TOKEN || '',
    GROQ_API_KEY: cfg.GROQ_API_KEY || '',
    DEEPSEEK_API_KEY: cfg.DEEPSEEK_API_KEY || '',
    QWEN_API_KEY: cfg.QWEN_API_KEY || '',
    OPENROUTER_API_KEY: cfg.OPENROUTER_API_KEY || '',
    NVIDIA_API_KEY: cfg.NVIDIA_API_KEY || '',
    NVIDIA_BASE_URL: cfg.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    NVIDIA_MODEL: cfg.NVIDIA_MODEL || 'z-ai/glm5',

    DEFAULT_PROVIDER: cfg.DEFAULT_PROVIDER || 'groq',
    DEFAULT_MODEL: cfg.DEFAULT_MODEL || '',
    PORT: String(cfg.PORT || '3000'),
    NODE_ENV: cfg.NODE_ENV || 'development',

    LOG_DIR: getLogDir(),
  };
  writeEnvMerge(envPath, updates);
  return { ok: true };
});

ipcMain.handle('prefs:load', async () => {
  const prefs = readPrefs();
  return {
    lang: prefs.lang || 'zh',
  };
});

ipcMain.handle('prefs:save', async (_e, prefs) => {
  const current = readPrefs();
  const next = {
    ...current,
    ...prefs,
  };
  writePrefs(next);
  return { ok: true };
});

ipcMain.handle('runtime:status', async () => {
  return { running: runtimeStarted };
});

ipcMain.handle('runtime:start', async () => {
  await startRuntime();
  return { ok: true, running: true };
});

ipcMain.handle('runtime:stop', async () => {
  await stopRuntime();
  return { ok: true, running: false };
});

ipcMain.handle('runtime:restart', async () => {
  await stopRuntime();
  await startRuntime();
  return { ok: true, running: true };
});

ipcMain.handle('logs:openFolder', async () => {
  const dir = getLogDir();
  fs.mkdirSync(dir, { recursive: true });
  await shell.openPath(dir);
  return { ok: true };
});

