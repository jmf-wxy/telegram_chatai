class SessionManager {
  constructor() {
    // In-memory storage: Map<userId, { messages: Array, model: String }>
    this.sessions = new Map();
    // Default model for new users
    this.defaultModel = 'deepseek';
  }

  getHistory(userId) {
    const session = this.sessions.get(userId);
    if (session) {
      return session.messages || [];
    }
    // Return empty array for new users
    return [];
  }

  saveHistory(userId, messages) {
    let session = this.sessions.get(userId);
    if (!session) {
      session = {
        messages: [],
        model: this.defaultModel
      };
      this.sessions.set(userId, session);
    }
    session.messages = messages;
    // Update timestamp if needed
    session.updatedAt = new Date();
  }

  clearHistory(userId) {
    this.sessions.delete(userId);
  }

  getUserModel(userId) {
    const session = this.sessions.get(userId);
    return session ? session.model : this.defaultModel;
  }

  setUserModel(userId, model) {
    let session = this.sessions.get(userId);
    if (!session) {
      session = {
        messages: [],
        model: this.defaultModel
      };
      this.sessions.set(userId, session);
    }
    session.model = model;
  }

  getUserCount() {
    return this.sessions.size;
  }
}

module.exports = SessionManager;
