const $ = (id) => document.getElementById(id);

const el = {
  dot: $('dot'),
  statusText: $('statusText'),
  langZh: $('langZh'),
  langEn: $('langEn'),
  btnStart: $('btnStart'),
  btnStop: $('btnStop'),
  btnRestart: $('btnRestart'),
  btnSave: $('btnSave'),
  btnOpenLogs: $('btnOpenLogs'),
  autoScroll: $('autoScroll'),
  btnClearLogs: $('btnClearLogs'),
  btnCopyLogs: $('btnCopyLogs'),
  logbox: $('logbox'),
  envPath: $('envPath'),
  logDir: $('logDir'),
  themeBtns: document.querySelectorAll('.themeBtn'),
};

const fields = [
  'TELEGRAM_BOT_TOKEN',
  'GROQ_API_KEY',
  'DEEPSEEK_API_KEY',
  'QWEN_API_KEY',
  'OPENROUTER_API_KEY',
  'NVIDIA_API_KEY',
  'DEFAULT_PROVIDER',
  'DEFAULT_MODEL',
  'PORT',
  'NODE_ENV',
];

const I18N = {
  zh: {
    appTitle: 'Telegram AI Assistant',
    appSubtitle: '内嵌运行时 • 离线可分发 • 实时日志',
    statusIdle: '空闲',
    statusRunning: '运行中',
    runTitle: '运行',
    runHint: 'Start/Stop 控制内嵌的机器人与服务进程。',
    btnStart: '启动',
    btnStop: '停止',
    btnRestart: '重启',
    btnOpenLogs: '打开日志文件夹',
    kvEnv: '配置文件',
    kvLogs: '日志目录',
    settingsTitle: '设置',
    settingsHint: '配置会保存到当前用户目录下的 .env。',
    helpBotFather: '从 @BotFather 获取',
    helpGroq: '速度快、常有免费额度，推荐默认',
    helpOpenRouter: '可用免费模型，例如 qwen/qwen3-coder:free',
    btnSave: '保存',
    saveHint: '如果改了 Provider/Model/端口，建议重启。',
    logsTitle: '日志',
    logsHint: '从 combined.log 实时读取（tail）。',
    autoScroll: '自动滚动',
    btnClear: '清空',
    btnCopy: '复制',
    uiInvalidPort: '[ui] 端口无效：必须是 1-65535。\n',
    uiSaved: '[ui] 已保存。\n',
    uiStarting: '[ui] 正在启动…\n',
    uiStopping: '[ui] 正在停止…\n',
    uiRestarting: '[ui] 正在重启…\n',
    uiCopied: '[ui] 已复制日志到剪贴板。\n',
    uiCopyFailed: '[ui] 复制失败。\n',
  },
  en: {
    appTitle: 'Telegram AI Assistant',
    appSubtitle: 'Embedded runtime • Offline-ready packaging • Live logs',
    statusIdle: 'Idle',
    statusRunning: 'Running',
    runTitle: 'Run',
    runHint: 'Start/Stop controls the embedded bot + server runtime.',
    btnStart: 'Start',
    btnStop: 'Stop',
    btnRestart: 'Restart',
    btnOpenLogs: 'Open logs folder',
    kvEnv: 'Env file',
    kvLogs: 'Log dir',
    settingsTitle: 'Settings',
    settingsHint: 'Saved into a bundled .env under your Windows user profile.',
    helpBotFather: 'Get it from @BotFather',
    helpGroq: 'Fast + often free, recommended default',
    helpOpenRouter: 'Can use free models like qwen/qwen3-coder:free',
    btnSave: 'Save',
    saveHint: 'Restart if you changed provider/model/port.',
    logsTitle: 'Logs',
    logsHint: 'Streaming from combined.log (tail).',
    autoScroll: 'Auto-scroll',
    btnClear: 'Clear',
    btnCopy: 'Copy',
    uiInvalidPort: '[ui] Invalid PORT. Must be 1-65535.\n',
    uiSaved: '[ui] Saved.\n',
    uiStarting: '[ui] Starting…\n',
    uiStopping: '[ui] Stopping…\n',
    uiRestarting: '[ui] Restarting…\n',
    uiCopied: '[ui] Copied logs to clipboard.\n',
    uiCopyFailed: '[ui] Clipboard copy failed.\n',
  }
};

let currentLang = 'zh';

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || (I18N.en[key] || key);
}

function applyI18n() {
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const k = node.getAttribute('data-i18n');
    if (!k) return;
    node.textContent = t(k);
  });
  el.langZh.classList.toggle('active', currentLang === 'zh');
  el.langEn.classList.toggle('active', currentLang === 'en');
  // refresh status text based on current running flag by reading current content
}

function setStatus(running) {
  el.statusText.textContent = running ? t('statusRunning') : t('statusIdle');
  el.dot.classList.remove('good', 'bad');
  el.dot.classList.add(running ? 'good' : 'bad');
  el.btnStart.disabled = running;
  el.btnStop.disabled = !running;
  el.btnRestart.disabled = !running;
}

function appendLog(text) {
  el.logbox.textContent += text;
  if (el.autoScroll.checked) {
    el.logbox.scrollTop = el.logbox.scrollHeight;
  }
}

async function loadConfig() {
  const prefs = await window.api.loadPrefs();
  currentLang = (prefs && (prefs.lang === 'en' || prefs.lang === 'zh')) ? prefs.lang : 'zh';
  applyI18n();

  const cfg = await window.api.loadConfig();
  for (const k of fields) {
    const node = $(k);
    if (!node) continue;
    node.value = cfg[k] ?? '';
  }

  // cosmetic placeholders
  el.envPath.textContent = '用户数据目录\\.env';
  el.logDir.textContent = '用户数据目录\\logs';
}

async function saveConfig() {
  const cfg = {};
  for (const k of fields) {
    const node = $(k);
    if (!node) continue;
    cfg[k] = node.value;
  }
  // lightweight validation
  const port = Number(cfg.PORT || '3000');
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    appendLog(t('uiInvalidPort'));
    return;
  }
  await window.api.saveConfig(cfg);
  appendLog(t('uiSaved'));
}

async function refreshStatus() {
  const st = await window.api.runtimeStatus();
  setStatus(!!st.running);
}

async function start() {
  await saveConfig();
  appendLog(t('uiStarting'));
  await window.api.start();
  await refreshStatus();
}

async function stop() {
  appendLog(t('uiStopping'));
  await window.api.stop();
  await refreshStatus();
}

async function restart() {
  await saveConfig();
  appendLog(t('uiRestarting'));
  await window.api.restart();
  await refreshStatus();
}

async function setLang(lang) {
  currentLang = lang === 'en' ? 'en' : 'zh';
  applyI18n();
  await window.api.savePrefs({ lang: currentLang });
  await refreshStatus();
}

function setTheme(theme) {
  const validThemes = ['light', 'dark', 'system'];
  if (!validThemes.includes(theme)) theme = 'dark';

  let actualTheme = theme;
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    actualTheme = isDark ? 'dark' : 'light';
  }

  if (actualTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  el.themeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeValue === theme);
  });

  localStorage.setItem('theme', theme);
}

function loadTheme() {
  const saved = localStorage.getItem('theme');
  setTheme(saved || 'dark');

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = localStorage.getItem('theme') || 'dark';
    if (current === 'system') {
      setTheme('system');
    }
  });
}

el.btnStart.addEventListener('click', start);
el.btnStop.addEventListener('click', stop);
el.btnRestart.addEventListener('click', restart);
el.btnSave.addEventListener('click', saveConfig);
el.btnOpenLogs.addEventListener('click', () => window.api.openLogsFolder());
el.btnClearLogs.addEventListener('click', () => (el.logbox.textContent = ''));
el.btnCopyLogs.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(el.logbox.textContent);
    appendLog(t('uiCopied'));
  } catch {
    appendLog(t('uiCopyFailed'));
  }
});

el.langZh.addEventListener('click', () => setLang('zh'));
el.langEn.addEventListener('click', () => setLang('en'));

el.themeBtns.forEach(btn => {
  btn.addEventListener('click', () => setTheme(btn.dataset.themeValue));
});

window.api.onLog((line) => appendLog(line));

loadConfig().then(() => {
  refreshStatus();
  loadTheme();
  setupModals();
});

function setupModals() {
  const aiTone = $('aiTone');
  const userTitle = $('userTitle');
  const aiSettingsModal = $('aiSettingsModal');
  const helpModal = $('helpModal');
  const aboutModal = $('aboutModal');

  function openModal(modal) { modal.classList.add('active'); }
  function closeModal(modal) { modal.classList.remove('active'); }

  window.api.onMenuAiSettings(() => {
    window.api.loadPrefs().then(prefs => {
      aiTone.value = prefs.aiTone || '';
      userTitle.value = prefs.userTitle || '';
      openModal(aiSettingsModal);
    });
  });

  window.api.onMenuHelp(() => openModal(helpModal));
  window.api.onMenuAbout(() => openModal(aboutModal));

  $('closeAiSettings').addEventListener('click', () => closeModal(aiSettingsModal));
  $('cancelAiSettings').addEventListener('click', () => closeModal(aiSettingsModal));
  $('saveAiSettings').addEventListener('click', async () => {
    await window.api.savePrefs({ aiTone: aiTone.value, userTitle: userTitle.value });
    appendLog('[ui] AI 个性设置已保存。\n');
    closeModal(aiSettingsModal);
  });

  $('closeHelp').addEventListener('click', () => closeModal(helpModal));
  $('closeHelpBtn').addEventListener('click', () => closeModal(helpModal));
  $('closeAbout').addEventListener('click', () => closeModal(aboutModal));
  $('closeAboutBtn').addEventListener('click', () => closeModal(aboutModal));

  $('linkGithub').addEventListener('click', (e) => {
    e.preventDefault();
    window.open('https://github.com/jmf-wxy/telegram_chatai', '_blank');
  });

  [aiSettingsModal, helpModal, aboutModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });
}

