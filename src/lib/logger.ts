/**
 * Comprehensive Logging Service for AI Assistant
 *
 * This service provides:
 * - Client-side logging with different levels
 * - Server-side logging via API calls
 * - Performance monitoring
 * - Error tracking
 * - User activity logging
 */

export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  performance?: {
    loadTime?: number;
    memoryUsage?: number;
  };
}

export interface LogConfig {
  enableConsoleLogging: boolean;
  enableServerLogging: boolean;
  enablePerformanceLogging: boolean;
  serverEndpoint: string;
  logLevel: LogLevel;
  batchSize: number;
  flushInterval: number;
}

class Logger {
  private config: LogConfig;
  private logQueue: LogEntry[] = [];
  private sessionId: string;
  private userId?: string;
  private isFlushing = false;

  constructor(config: Partial<LogConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableServerLogging: false,
      enablePerformanceLogging: true,
      serverEndpoint: 'https://zah-2.123c.vn/hackathon/api/logs',
      logLevel: LogLevel.INFO,
      batchSize: 10,
      flushInterval: 5000,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initializeLogger();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeLogger(): void {
    // Set up periodic flushing
    if (this.config.enableServerLogging) {
      setInterval(() => {
        this.flushLogs();
      }, this.config.flushInterval);
    }

    // Set up performance monitoring
    if (this.config.enablePerformanceLogging) {
      this.setupPerformanceMonitoring();
    }

    // Set up error tracking
    this.setupErrorTracking();

    // Log application start
    this.info('Application started', {
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }

  private setupPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      const memoryInfo = (performance as any).memory;

      this.info('Page loaded', {
        loadTime: Math.round(loadTime),
        memoryUsage: memoryInfo
          ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)
          : undefined,
        totalMemory: memoryInfo
          ? Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024)
          : undefined,
      });
    });

    // Monitor API call performance
    this.interceptFetch();
  }

  private setupErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', event => {
      this.error('Global error occurred', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
      });
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', event => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise,
      });
    });
  }

  private interceptFetch(): void {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url =
        typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();

        this.debug('API call completed', {
          url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: Math.round(endTime - startTime),
          success: response.ok,
        });

        return response;
      } catch (error) {
        const endTime = performance.now();

        this.error('API call failed', {
          url,
          method: args[1]?.method || 'GET',
          duration: Math.round(endTime - startTime),
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= configLevelIndex;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsoleLogging) return;

    const { level, message, data, timestamp } = entry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, data);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, message, data);
        break;
    }
  }

  private async logToServer(entry: LogEntry): Promise<void> {
    if (!this.config.enableServerLogging) return;

    this.logQueue.push(entry);

    // Flush immediately if queue is full
    if (this.logQueue.length >= this.config.batchSize) {
      await this.flushLogs();
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.isFlushing || this.logQueue.length === 0) return;

    this.isFlushing = true;
    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      const response = await fetch(this.config.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.warn('Failed to send logs to server:', response.status);
        // Re-add logs to queue for retry
        this.logQueue.unshift(...logsToSend);
      }
    } catch (error) {
      console.warn('Error sending logs to server:', error);
      // Re-add logs to queue for retry
      this.logQueue.unshift(...logsToSend);
    } finally {
      this.isFlushing = false;
    }
  }

  // Public logging methods
  public debug(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const entry = this.createLogEntry(LogLevel.DEBUG, message, data);
    this.logToConsole(entry);
    this.logToServer(entry);
  }

  public info(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.createLogEntry(LogLevel.INFO, message, data);
    this.logToConsole(entry);
    this.logToServer(entry);
  }

  public warn(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const entry = this.createLogEntry(LogLevel.WARN, message, data);
    this.logToConsole(entry);
    this.logToServer(entry);
  }

  public error(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry = this.createLogEntry(LogLevel.ERROR, message, data);
    this.logToConsole(entry);
    this.logToServer(entry);
  }

  public fatal(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    const entry = this.createLogEntry(LogLevel.FATAL, message, data);
    this.logToConsole(entry);
    this.logToServer(entry);
  }

  // User activity logging
  public logUserAction(action: string, data?: any): void {
    this.info(`User action: ${action}`, {
      action,
      ...data,
    });
  }

  public logFeatureUsage(feature: string, data?: any): void {
    this.info(`Feature used: ${feature}`, {
      feature,
      ...data,
    });
  }

  public logError(error: Error, context?: any): void {
    this.error('Application error', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  // Configuration methods
  public setUserId(userId: string): void {
    this.userId = userId;
    this.info('User ID set', { userId });
  }

  public updateConfig(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.info('Logger configuration updated', { newConfig });
  }

  public getConfig(): LogConfig {
    return { ...this.config };
  }

  // Utility methods
  public async forceFlush(): Promise<void> {
    await this.flushLogs();
  }

  public getQueueSize(): number {
    return this.logQueue.length;
  }

  public getSessionId(): string {
    return this.sessionId;
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, data?: any) => logger.debug(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  error: (message: string, data?: any) => logger.error(message, data),
  fatal: (message: string, data?: any) => logger.fatal(message, data),
  userAction: (action: string, data?: any) =>
    logger.logUserAction(action, data),
  featureUsage: (feature: string, data?: any) =>
    logger.logFeatureUsage(feature, data),
  logError: (error: Error, context?: any) => logger.logError(error, context),
};

export default logger;
