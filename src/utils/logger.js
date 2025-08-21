// utils/logger.js - Sistema centralizado de logging para La-IA

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  constructor() {
    this.level = process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
    this.prefix = '🚀 La-IA';
  }

  setLevel(level) {
    this.level = level;
  }

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const levelEmoji = {
      [LOG_LEVELS.ERROR]: '❌',
      [LOG_LEVELS.WARN]: '⚠️',
      [LOG_LEVELS.INFO]: 'ℹ️',
      [LOG_LEVELS.DEBUG]: '🔍',
    }[level];

    return `${levelEmoji} ${this.prefix} [${timestamp}] ${message}`;
  }

  error(message, data = null) {
    if (this.level >= LOG_LEVELS.ERROR) {
      const formattedMessage = this.formatMessage(LOG_LEVELS.ERROR, message);
      if (data) {
        console.error(formattedMessage, data);
      } else {
        console.error(formattedMessage);
      }
    }
  }

  warn(message, data = null) {
    if (this.level >= LOG_LEVELS.WARN) {
      const formattedMessage = this.formatMessage(LOG_LEVELS.WARN, message);
      if (data) {
        console.warn(formattedMessage, data);
      } else {
        console.warn(formattedMessage);
      }
    }
  }

  info(message, data = null) {
    if (this.level >= LOG_LEVELS.INFO) {
      const formattedMessage = this.formatMessage(LOG_LEVELS.INFO, message);
      if (data) {
        console.info(formattedMessage, data);
      } else {
        console.info(formattedMessage);
      }
    }
  }

  debug(message, data = null) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      const formattedMessage = this.formatMessage(LOG_LEVELS.DEBUG, message);
      if (data) {
        console.log(formattedMessage, data);
      } else {
        console.log(formattedMessage);
      }
    }
  }

  // Métodos específicos para La-IA
  auth(message, data = null) {
    this.info(`🔐 Auth: ${message}`, data);
  }

  dashboard(message, data = null) {
    this.info(`📊 Dashboard: ${message}`, data);
  }

  api(message, data = null) {
    this.info(`🌐 API: ${message}`, data);
  }

  performance(message, data = null) {
    this.info(`⚡ Performance: ${message}`, data);
  }
}

// Instancia singleton
const logger = new Logger();

export default logger;
export { LOG_LEVELS };
