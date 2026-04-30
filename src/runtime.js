const path = require('path');
const { startBot, stopBot } = require('./bot');
const { startServer, stopServer } = require('./server');

let started = false;

function startRuntime(options = {}) {
  const { withServer = true } = options;
  if (started) return;
  startBot();
  if (withServer) startServer();
  started = true;
}

async function stopRuntime() {
  if (!started) return;
  try {
    stopServer();
  } catch (_) {}
  try {
    await stopBot();
  } catch (_) {}
  started = false;
}

module.exports = { startRuntime, stopRuntime };

