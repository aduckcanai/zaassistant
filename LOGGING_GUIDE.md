# 🚀 Logging System Guide for AI Assistant

This guide explains how to implement and use server-side logging in your AI Assistant web application.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Client-Side Logging](#client-side-logging)
3. [Server-Side Logging](#server-side-logging)
4. [Configuration](#configuration)
5. [Usage Examples](#usage-examples)
6. [Deployment](#deployment)

## 🔍 Overview

The logging system provides:

- ✅ **Client-side logging** with different levels (DEBUG, INFO, WARN, ERROR, FATAL)
- ✅ **Server-side logging** via API calls
- ✅ **Performance monitoring** (page load times, API call durations)
- ✅ **Error tracking** (global errors, unhandled promises)
- ✅ **User activity logging** (feature usage, user actions)
- ✅ **Automatic batching** and retry mechanisms

## 💻 Client-Side Logging

### Basic Usage

```typescript
import { logger } from './lib/logger';

// Different log levels
logger.debug('Debug message', { data: 'debug info' });
logger.info('Info message', { user: 'john', action: 'login' });
logger.warn('Warning message', { warning: 'low memory' });
logger.error('Error message', { error: 'api failed' });
logger.fatal('Fatal error', { error: 'app crash' });

// User activity logging
logger.logUserAction('button_click', { button: 'submit', page: 'login' });
logger.logFeatureUsage('analysis_generate', { input: 'create login form' });

// Error logging
try {
  // some code
} catch (error) {
  logger.logError(error, { context: 'user registration' });
}
```

### Configuration

```typescript
// Update logger configuration
logger.updateConfig({
  enableConsoleLogging: true,
  enableServerLogging: true,
  enablePerformanceLogging: true,
  serverEndpoint: 'https://your-server.com/api/logs',
  logLevel: LogLevel.INFO,
  batchSize: 10,
  flushInterval: 5000,
});

// Set user ID for tracking
logger.setUserId('user123');
```

## 🖥️ Server-Side Logging

### Option 1: Use Your Existing API Endpoint

Update the logger configuration to use your existing API:

```typescript
logger.updateConfig({
  serverEndpoint: 'https://zah-2.123c.vn/hackathon/api/logs',
});
```

### Option 2: Set Up a Dedicated Logging Server

1. **Install dependencies:**

```bash
npm install express
```

2. **Run the logging server:**

```bash
node server-logging-example.js
```

3. **Update your frontend configuration:**

```typescript
logger.updateConfig({
  serverEndpoint: 'http://localhost:3001/api/logs',
});
```

### Server Endpoints

- `POST /api/logs` - Receive logs from frontend
- `GET /api/logs` - Retrieve logs (with filtering)
- `GET /api/logs/health` - Health check
- `DELETE /api/logs` - Clear all logs

## ⚙️ Configuration

### Environment Variables

Create a `.env` file:

```env
# Logging Configuration
VITE_LOG_LEVEL=info
VITE_LOG_SERVER_ENDPOINT=https://zah-2.123c.vn/hackathon/api/logs
VITE_ENABLE_PERFORMANCE_LOGGING=true
VITE_LOG_BATCH_SIZE=10
VITE_LOG_FLUSH_INTERVAL=5000
```

### Production Configuration

```typescript
// In your main.tsx or App.tsx
import { logger } from './lib/logger';

// Production configuration
if (import.meta.env.PROD) {
  logger.updateConfig({
    enableConsoleLogging: false, // Disable console logs in production
    enableServerLogging: true,
    logLevel: LogLevel.WARN, // Only log warnings and errors
    serverEndpoint: import.meta.env.VITE_LOG_SERVER_ENDPOINT,
  });
}
```

## 📝 Usage Examples

### 1. Logging User Actions

```typescript
// In your React components
const handleAnalysisGenerate = (input: string) => {
  logger.logUserAction('analysis_generate', {
    input,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });

  // Your existing code...
};
```

### 2. Logging API Calls

```typescript
async function sendIdeaToAnalysis(inputIdea: string, context: string) {
  logger.info('API call started', { inputIdea, context });

  try {
    const response = await fetch('/api/analysis', {
      method: 'POST',
      body: JSON.stringify({ idea: inputIdea, context }),
    });

    const data = await response.json();

    logger.info('API call successful', {
      status: response.status,
      responseSize: JSON.stringify(data).length,
    });

    return data;
  } catch (error) {
    logger.error('API call failed', {
      inputIdea,
      context,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

### 3. Logging Feature Usage

```typescript
// Track which features users are using
logger.logFeatureUsage('ui_generator', {
  feature: 'mobile_prototype',
  variant: 'cards',
  userType: 'premium',
});
```

### 4. Performance Monitoring

The logger automatically tracks:

- Page load times
- API call durations
- Memory usage (if available)
- Error occurrences

### 5. Error Tracking

```typescript
// Global error handler
window.addEventListener('error', event => {
  logger.error('Global error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
  });
});
```

## 🚀 Deployment

### 1. Deploy Your Web App

```bash
# Build and deploy
npm run build
vercel --prod
```

### 2. Set Up Logging Server (Optional)

If you want a dedicated logging server:

```bash
# Deploy to Vercel, Netlify, or your preferred platform
# Update the serverEndpoint in your frontend config
```

### 3. Monitor Logs

You can monitor logs by:

1. **Browser Console** - During development
2. **Server Logs** - Check your server console/logs
3. **Log Files** - If configured to write to files
4. **Database** - Store logs in a database for analysis

### 4. Log Analysis

Example queries for log analysis:

```javascript
// Get all errors
GET /api/logs?level=error

// Get logs for specific session
GET /api/logs?sessionId=session_123

// Get recent logs
GET /api/logs?limit=50
```

## 🔧 Advanced Features

### Custom Log Levels

```typescript
// Add custom log levels
logger.updateConfig({
  logLevel: LogLevel.DEBUG, // Show all logs
});
```

### Batch Processing

```typescript
// Configure batch processing
logger.updateConfig({
  batchSize: 20, // Send logs in batches of 20
  flushInterval: 3000, // Flush every 3 seconds
});
```

### Performance Monitoring

```typescript
// Monitor specific performance metrics
const startTime = performance.now();
// ... your code ...
const endTime = performance.now();

logger.info('Custom performance metric', {
  operation: 'data_processing',
  duration: Math.round(endTime - startTime),
});
```

## 🛠️ Troubleshooting

### Common Issues

1. **Logs not appearing on server**
   - Check network connectivity
   - Verify server endpoint URL
   - Check CORS settings

2. **Performance impact**
   - Reduce batch size
   - Increase flush interval
   - Disable console logging in production

3. **Memory usage**
   - Monitor log queue size
   - Clear logs periodically
   - Use log rotation

### Debug Mode

```typescript
// Enable debug mode
logger.updateConfig({
  logLevel: LogLevel.DEBUG,
  enableConsoleLogging: true,
});

// Check queue size
console.log('Log queue size:', logger.getQueueSize());

// Force flush logs
await logger.forceFlush();
```

## 📊 Log Data Structure

Each log entry contains:

```typescript
{
  timestamp: "2024-01-15T10:30:00.000Z",
  level: "info",
  message: "User action: analysis_generate",
  data: {
    input: "create login form",
    userId: "user123"
  },
  userId: "user123",
  sessionId: "session_123456789",
  userAgent: "Mozilla/5.0...",
  url: "https://your-app.com/analysis",
  performance: {
    loadTime: 1500,
    memoryUsage: 45
  }
}
```

This comprehensive logging system will help you monitor your AI Assistant application, track user behavior, and debug issues effectively! 🎉
