/**
 * API Middleware
 * Authentication, rate limiting, and request processing middleware
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest, APIResponse, APIError } from './types';
import { globalErrorHandler, ErrorMonitor, defaultMonitoringConfig } from '../errors';

import { apiAnalytics } from './analytics';

// Initialize error monitor
const errorMonitor = new ErrorMonitor(defaultMonitoringConfig);

// API Key Authentication Middleware
export const authenticateAPIKey = (apiKeys: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Skip authentication if not required
    if (!apiKeys || apiKeys.length === 0) {
      return next();
    }

    const apiKey = req.headers['x-api-key'] as string || req.query.apiKey as string;
    
    if (!apiKey) {
      apiAnalytics.trackAuthFailure(req, 'Missing API key');
      
      const authError = new Error('API key is required');
      authError.name = 'AuthenticationError';
      
      const appError = globalErrorHandler.handleError(authError, {
        requestId: req.headers['x-request-id'] as string,
        endpoint: `${req.method} ${req.path}`,
        metadata: { reason: 'missing-api-key' }
      });

      errorMonitor.recordError(appError);
      const userFriendlyError = globalErrorHandler.createUserFriendlyError(appError);

      return res.status(401).json({
        success: false,
        error: {
          code: appError.code,
          message: userFriendlyError.message,
          suggestions: userFriendlyError.suggestions,
          canRetry: userFriendlyError.canRetry,
          recoveryActions: userFriendlyError.recoveryActions,
          timestamp: appError.timestamp,
          requestId: req.headers['x-request-id']
        }
      } as APIResponse);
    }

    if (!apiKeys.includes(apiKey)) {
      apiAnalytics.trackAuthFailure(req, 'Invalid API key');
      
      const authError = new Error('Invalid API key provided');
      authError.name = 'AuthenticationError';
      
      const appError = globalErrorHandler.handleError(authError, {
        requestId: req.headers['x-request-id'] as string,
        endpoint: `${req.method} ${req.path}`,
        metadata: { reason: 'invalid-api-key' }
      });

      errorMonitor.recordError(appError);
      const userFriendlyError = globalErrorHandler.createUserFriendlyError(appError);

      return res.status(401).json({
        success: false,
        error: {
          code: appError.code,
          message: userFriendlyError.message,
          suggestions: userFriendlyError.suggestions,
          canRetry: userFriendlyError.canRetry,
          recoveryActions: userFriendlyError.recoveryActions,
          timestamp: appError.timestamp,
          requestId: req.headers['x-request-id']
        }
      } as APIResponse);
    }

    req.apiKey = apiKey;
    next();
  };
};

// Rate Limiting Middleware
export const createRateLimit = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        timestamp: new Date()
      }
    } as APIResponse,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: AuthenticatedRequest, res: Response) => {
      apiAnalytics.trackRateLimitHit(req);
      
      // Handle rate limit error through global error handler
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      
      const appError = globalErrorHandler.handleError(rateLimitError, {
        requestId: req.headers['x-request-id'] as string,
        endpoint: `${req.method} ${req.path}`,
        metadata: {
          rateLimitInfo: req.rateLimitInfo,
          userAgent: req.get('User-Agent'),
          apiKey: req.apiKey,
          ip: req.ip
        }
      });

      errorMonitor.recordError(appError);
      const userFriendlyError = globalErrorHandler.createUserFriendlyError(appError);

      res.status(429).json({
        success: false,
        error: {
          code: appError.code,
          message: userFriendlyError.message,
          suggestions: userFriendlyError.suggestions,
          canRetry: userFriendlyError.canRetry,
          recoveryActions: userFriendlyError.recoveryActions,
          timestamp: appError.timestamp,
          requestId: req.headers['x-request-id']
        }
      } as APIResponse);
    }
  });
};

// Request Validation Middleware
export const validateRequestBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = requiredFields.filter(field => {
      return !req.body || req.body[field] === undefined;
    });

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          details: { missingFields },
          timestamp: new Date()
        }
      } as APIResponse);
      return;
    }

    next();
  };
};

// Request ID Middleware
export const addRequestId = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('x-request-id', req.headers['x-request-id']);
  next();
};

// Response Time Middleware
export const addResponseTime = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Set header before response is sent
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    if (!res.headersSent) {
      res.setHeader('x-response-time', `${responseTime}ms`);
    }
    return originalSend.call(this, body);
  };
  
  next();
};

// Enhanced Error Handling Middleware
export const errorHandler = (error: Error, req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Handle error through global error handler
  const appError = globalErrorHandler.handleError(error, {
    requestId: req.headers['x-request-id'] as string,
    endpoint: `${req.method} ${req.path}`,
    inputData: req.body,
    metadata: {
      userAgent: req.get('User-Agent'),
      apiKey: req.apiKey,
      ip: req.ip
    }
  });

  // Record error for monitoring
  errorMonitor.recordError(appError);

  // Create user-friendly error response
  const userFriendlyError = globalErrorHandler.createUserFriendlyError(appError);

  // Determine HTTP status code
  const statusCode = appError.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: userFriendlyError.message,
      suggestions: userFriendlyError.suggestions,
      canRetry: userFriendlyError.canRetry,
      recoveryActions: userFriendlyError.recoveryActions,
      timestamp: appError.timestamp,
      requestId: req.headers['x-request-id']
    },
    metadata: {
      requestId: req.headers['x-request-id'] as string,
      timestamp: new Date(),
      processingTime: 0,
      version: '1.0.0'
    }
  } as APIResponse);
};

// CORS Headers Middleware
export const corsHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

// Request Logging Middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`[${timestamp}] ${method} ${url} - ${userAgent}`);
  next();
};

// Content Type Validation Middleware
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.get('Content-Type');
    
    if (!contentType || !contentType.includes('application/json')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type must be application/json',
          timestamp: new Date()
        }
      } as APIResponse);
      return;
    }
  }
  
  next();
};

// Helper Functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// API Statistics Middleware
export const statsCollector = (() => {
  const stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimeSum: 0,
    endpointStats: new Map<string, any>()
  };

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    
    stats.totalRequests++;
    
    // Update endpoint stats
    if (!stats.endpointStats.has(endpoint)) {
      stats.endpointStats.set(endpoint, {
        path: req.route?.path || req.path,
        method: req.method,
        requestCount: 0,
        responseTimeSum: 0,
        errorCount: 0,
        lastAccessed: new Date()
      });
    }
    
    const endpointStat = stats.endpointStats.get(endpoint);
    endpointStat.requestCount++;
    endpointStat.lastAccessed = new Date();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      stats.responseTimeSum += responseTime;
      endpointStat.responseTimeSum += responseTime;
      
      if (res.statusCode >= 200 && res.statusCode < 400) {
        stats.successfulRequests++;
      } else {
        stats.failedRequests++;
        endpointStat.errorCount++;
      }
    });

    // Attach stats getter to request for potential use
    (req as any).getStats = () => ({
      ...stats,
      averageResponseTime: stats.totalRequests > 0 ? stats.responseTimeSum / stats.totalRequests : 0,
      endpointStats: Array.from(stats.endpointStats.entries()).map(([key, value]) => ({
        ...value,
        averageResponseTime: value.requestCount > 0 ? value.responseTimeSum / value.requestCount : 0
      }))
    });

    next();
  };
})();
// Export error monitor for use in other parts of the application
export { errorMonitor };

// Helper function to get error monitoring data
export const getErrorMonitoringData = () => ({
  metrics: errorMonitor.getMetrics(),
  activeAlerts: errorMonitor.getActiveAlerts(),
  trends: errorMonitor.getErrorTrends()
});