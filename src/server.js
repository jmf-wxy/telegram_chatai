const express = require('express');
const { startBot, stopBot } = require('./bot/index');
const logger = require('./utils/logger');
const errorMiddleware = require('./middleware/error');
const { startRuntime, stopRuntime } = require('./runtime');

const app = express();
let server = null;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/stats', (req, res) => {
  const sessions = require('./storage/sessions');
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    users: sessions.getUserCount()
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorMiddleware);

function startServer() {
  if (server) return server;
  const PORT = process.env.PORT || 3000;
  server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
  return server;
}

function stopServer() {
  if (!server) return;
  try {
    server.close();
  } catch (_) {}
  server = null;
}

module.exports = { app, startServer, stopServer };

if (require.main === module) {
  startRuntime({ withServer: true });
}
