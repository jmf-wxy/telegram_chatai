const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function resolveDataDir() {
  const explicitDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : null;
  if (explicitDir) return explicitDir;

  let dataDir = path.join(__dirname, '../../data');

  try {
    const stat = fs.statSync(dataDir);
    if (!stat.isDirectory()) {
      logger.warn(`SessionManager: "${dataDir}" exists but is not a directory, using fallback`);
      dataDir = path.join(__dirname, '../../sessions_data');
    }
  } catch (_) {
    // doesn't exist yet, will be created
  }

  return dataDir;
}

const DATA_DIR = resolveDataDir();
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.defaultProvider = process.env.DEFAULT_PROVIDER || 'groq';
    this.defaultModel = process.env.DEFAULT_MODEL || 'llama-3.3-70b-versatile';
    this._loadFromDisk();
  }

  _ensureSession(userId) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        messages: [],
        provider: this.defaultProvider,
        model: this.defaultModel,
        lang: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return this.sessions.get(userId);
  }

  _loadFromDisk() {
    try {
      if (!fs.existsSync(SESSIONS_FILE)) return;
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
      const obj = JSON.parse(raw);
      for (const [k, v] of Object.entries(obj)) {
        this.sessions.set(Number(k) || k, v);
      }
      logger.info(`SessionManager: loaded ${this.sessions.size} sessions from disk`);
    } catch (err) {
      logger.error('SessionManager: failed to load sessions from disk', { error: err.message });
    }
  }

  saveToDisk() {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const obj = {};
      for (const [k, v] of this.sessions.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      logger.error('SessionManager: failed to save sessions to disk', { error: err.message, dir: DATA_DIR });
    }
  }

  getHistory(userId) {
    const session = this.sessions.get(userId);
    return session ? session.messages || [] : [];
  }

  saveHistory(userId, messages) {
    const session = this._ensureSession(userId);
    session.messages = messages;
    session.updatedAt = new Date().toISOString();
    this.saveToDisk();
  }

  clearHistory(userId) {
    const session = this.sessions.get(userId);
    if (session) {
      session.messages = [];
      session.updatedAt = new Date().toISOString();
      this.saveToDisk();
    } else {
      this.sessions.delete(userId);
    }
  }

  getUserProvider(userId) {
    const session = this.sessions.get(userId);
    return session ? session.provider : this.defaultProvider;
  }

  setUserProvider(userId, provider) {
    const session = this._ensureSession(userId);
    session.provider = provider;
    session.updatedAt = new Date().toISOString();
    this.saveToDisk();
  }

  getUserModel(userId) {
    const session = this.sessions.get(userId);
    return session ? session.model : this.defaultModel;
  }

  setUserModel(userId, model) {
    const session = this._ensureSession(userId);
    session.model = model;
    session.updatedAt = new Date().toISOString();
    this.saveToDisk();
  }

  getUserLang(userId) {
    const session = this.sessions.get(userId);
    return session ? session.lang : 'en';
  }

  setUserLang(userId, lang) {
    const session = this._ensureSession(userId);
    session.lang = lang;
    session.updatedAt = new Date().toISOString();
    this.saveToDisk();
  }

  getUserCount() {
    return this.sessions.size;
  }

  removeUser(userId) {
    this.sessions.delete(userId);
    this.saveToDisk();
  }
}

const instance = new SessionManager();

module.exports = instance;
