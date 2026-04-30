const winston = require('winston');
const path = require('path');

const logDir = process.env.LOG_DIR
  ? path.resolve(process.env.LOG_DIR)
  : path.join(__dirname, '../../logs');
const fs = require('fs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const transports = [
  new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
  new winston.transports.File({ filename: path.join(logDir, 'combined.log') })
];

if (process.env.NODE_ENV !== 'production') {
  transports.push(new winston.transports.Console({
    format: winston.format.simple()
  }));
} else {
  transports.push(new winston.transports.Console());
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports
});

module.exports = logger;
