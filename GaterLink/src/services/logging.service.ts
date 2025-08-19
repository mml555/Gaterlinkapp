import AsyncStorage from '@react-native-async-storage/async-storage';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

class LoggingService {
  private readonly MAX_LOGS = 1000;
  private readonly LOG_KEY = '@gaterlink_logs';
  private logs: LogEntry[] = [];
  private isDevelopment = __DEV__;

  constructor() {
    this.loadLogs();
  }

  /**
   * Load logs from storage
   */
  private async loadLogs(): Promise<void> {
    try {
      const storedLogs = await AsyncStorage.getItem(this.LOG_KEY);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  /**
   * Save logs to storage
   */
  private async saveLogs(): Promise<void> {
    try {
      // Keep only the most recent logs
      if (this.logs.length > this.MAX_LOGS) {
        this.logs = this.logs.slice(-this.MAX_LOGS);
      }
      await AsyncStorage.setItem(this.LOG_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  /**
   * Log a message
   */
  private log(level: LogLevel, message: string, context?: string, data?: any, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data,
      error,
    };

    // Add to logs array
    this.logs.push(entry);

    // Console output in development
    if (this.isDevelopment) {
      const prefix = `[${level.toUpperCase()}] ${context ? `[${context}] ` : ''}`;
      const logMessage = `${prefix}${message}`;

      switch (level) {
        case 'debug':
          console.log(logMessage, data);
          break;
        case 'info':
          console.info(logMessage, data);
          break;
        case 'warn':
          console.warn(logMessage, data);
          break;
        case 'error':
          console.error(logMessage, data, error);
          break;
      }
    }

    // Save logs asynchronously
    this.saveLogs();
  }

  /**
   * Debug log
   */
  debug(message: string, context?: string, data?: any): void {
    this.log('debug', message, context, data);
  }

  /**
   * Info log
   */
  info(message: string, context?: string, data?: any): void {
    this.log('info', message, context, data);
  }

  /**
   * Warning log
   */
  warn(message: string, context?: string, data?: any): void {
    this.log('warn', message, context, data);
  }

  /**
   * Error log
   */
  error(message: string, context?: string, error?: Error, data?: any): void {
    this.log('error', message, context, data, error);
  }

  /**
   * Log API request
   */
  logApiRequest(method: string, url: string, data?: any): void {
    this.info(`API Request: ${method} ${url}`, 'API', data);
  }

  /**
   * Log API response
   */
  logApiResponse(method: string, url: string, status: number, data?: any): void {
    if (status >= 200 && status < 300) {
      this.info(`API Response: ${method} ${url} - ${status}`, 'API', data);
    } else {
      this.error(`API Error: ${method} ${url} - ${status}`, 'API', undefined, data);
    }
  }

  /**
   * Log navigation
   */
  logNavigation(from: string, to: string, params?: any): void {
    this.info(`Navigation: ${from} → ${to}`, 'Navigation', params);
  }

  /**
   * Log authentication event
   */
  logAuth(event: string, userId?: string, data?: any): void {
    this.info(`Auth: ${event}`, 'Auth', { userId, ...data });
  }

  /**
   * Log database operation
   */
  logDatabase(operation: string, table: string, data?: any): void {
    this.debug(`Database: ${operation} on ${table}`, 'Database', data);
  }

  /**
   * Log performance metric
   */
  logPerformance(metric: string, duration: number, data?: any): void {
    this.info(`Performance: ${metric} took ${duration}ms`, 'Performance', data);
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by context
   */
  getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter(log => log.context === context);
  }

  /**
   * Clear all logs
   */
  async clearLogs(): Promise<void> {
    this.logs = [];
    await AsyncStorage.removeItem(this.LOG_KEY);
  }

  /**
   * Export logs as string
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Track user action
   */
  trackAction(action: string, category: string, data?: any): void {
    this.info(`User Action: ${action}`, category, data);
  }

  /**
   * Track error with context
   */
  trackError(error: Error, context: string, data?: any): void {
    this.error(error.message, context, error, data);
    
    // In production, you might want to send this to a crash reporting service
    if (!this.isDevelopment) {
      // Example: Sentry, Bugsnag, etc.
      // Sentry.captureException(error, { extra: data });
    }
  }
}

export default new LoggingService();