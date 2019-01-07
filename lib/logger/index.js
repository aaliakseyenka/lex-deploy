const winston = require('winston');
const level = process.env.LOG_LEVEL || 'info';

const log = winston.createLogger({
  level,
  format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  transports: [new winston.transports.Console()],
});

module.exports = log;
