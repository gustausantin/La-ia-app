import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getConfig } from '../config/environment.js';

// Configuración de formatos
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let output = `${timestamp} [${level}]: ${message}`;
    
    if (stack) {
      output += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      output += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return output;
  })
);

// Función para crear logger según el entorno
const createLogger = async () => {
  const config = await getConfig();
  
  const transports = [];
  
  // Console transport (solo en desarrollo)
  if (config.logging.enableConsole) {
    transports.push(
      new winston.transports.Console({
        level: config.logging.level,
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true
      })
    );
  }
  
  // File transports (producción y staging)
  if (config.logging.enableFile) {
    // Logs generales con rotación
    transports.push(
      new DailyRotateFile({
        filename: 'logs/app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: config.logging.maxFileSize,
        maxFiles: config.logging.maxFiles,
        level: config.logging.level,
        format: logFormat,
        handleExceptions: true,
        handleRejections: true
      })
    );
    
    // Logs de errores separados
    transports.push(
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: config.logging.maxFileSize,
        maxFiles: config.logging.maxFiles,
        level: 'error',
        format: logFormat
      })
    );
  }
  
  return winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    transports,
    exitOnError: false
  });
};

// Logger global
let logger = null;

// Función para inicializar el logger
export const initializeLogger = async () => {
  if (!logger) {
    logger = await createLogger();
    logger.info('🔧 Sistema de logging inicializado');
  }
  return logger;
};

// Función para obtener el logger (con lazy loading)
export const getLogger = async () => {
  if (!logger) {
    await initializeLogger();
  }
  return logger;
};

// Logger síncrono con fallback a console
export const log = {
  debug: (message, meta = {}) => {
    if (logger) {
      logger.debug(message, meta);
    } else {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  },
  
  info: (message, meta = {}) => {
    if (logger) {
      logger.info(message, meta);
    } else {
      console.info(`[INFO] ${message}`, meta);
    }
  },
  
  warn: (message, meta = {}) => {
    if (logger) {
      logger.warn(message, meta);
    } else {
      console.warn(`[WARN] ${message}`, meta);
    }
  },
  
  error: (message, meta = {}) => {
    if (logger) {
      logger.error(message, meta);
    } else {
      console.error(`[ERROR] ${message}`, meta);
    }
  }
};

// Middleware para Express (opcional)
export const expressLogger = () => {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };
      
      if (res.statusCode >= 400) {
        log.error(`HTTP ${res.statusCode} ${req.method} ${req.url}`, logData);
      } else {
        log.info(`HTTP ${res.statusCode} ${req.method} ${req.url}`, logData);
      }
    });
    
    next();
  };
};

export default log;