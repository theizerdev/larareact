const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Configuración de formatos
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Configuración de transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  }),

  // Error log file
  new DailyRotateFile({
    filename: path.join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '5d',
    zippedArchive: true
  }),

  // Combined log file
  new DailyRotateFile({
    filename: path.join('logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '5d',
    zippedArchive: true
  }),

  // WhatsApp specific log
  new DailyRotateFile({
    filename: path.join('logs', 'whatsapp-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '5d',
    zippedArchive: true,
    level: 'info'
  })
];

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'whatsapp-api-v2',
    version: process.env.API_VERSION || 'v2'
  },
  transports,
  exitOnError: false
});

// Métodos adicionales para logging específico
logger.whatsapp = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'whatsapp' });
};

logger.message = (action, data = {}) => {
  logger.info(`Message ${action}`, { 
    ...data, 
    category: 'message',
    timestamp: new Date().toISOString()
  });
};

logger.session = (sessionId, action, data = {}) => {
  logger.info(`Session ${sessionId}: ${action}`, {
    ...data,
    sessionId,
    category: 'session'
  });
};

logger.queue = (action, data = {}) => {
  logger.info(`Queue ${action}`, {
    ...data,
    category: 'queue'
  });
};

logger.security = (action, data = {}) => {
  logger.warn(`Security: ${action}`, {
    ...data,
    category: 'security'
  });
};

// Manejo de errores del logger
logger.on('error', (error) => {
  console.error('Error en logger:', error);
});

module.exports = logger;