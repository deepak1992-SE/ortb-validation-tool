/**
 * Express Server Configuration
 * Main server setup with middleware and route configuration
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { APIConfig } from './types';
import { createRoutes } from './routes';
import {
  authenticateAPIKey,
  createRateLimit,
  addRequestId,
  addResponseTime,
  errorHandler,
  requestLogger,
  validateContentType,
  statsCollector
} from './middleware';
import { apiAnalytics } from './analytics';

export class APIServer {
  private app: Application;
  private config: APIConfig;

  constructor(config: Partial<APIConfig> = {}) {
    this.app = express();
    this.config = this.mergeConfig(config);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Merge user config with defaults
   */
  private mergeConfig(userConfig: Partial<APIConfig>): APIConfig {
    return {
      port: userConfig.port || 3000,
      host: userConfig.host || '0.0.0.0',
      cors: {
        origin: userConfig.cors?.origin || '*',
        credentials: userConfig.cors?.credentials || false
      },
      rateLimit: {
        windowMs: userConfig.rateLimit?.windowMs || 15 * 60 * 1000, // 15 minutes
        max: userConfig.rateLimit?.max || 100, // 100 requests per window
        message: userConfig.rateLimit?.message || 'Too many requests, please try again later'
      },
      auth: {
        required: userConfig.auth?.required || false,
        apiKeys: userConfig.auth?.apiKeys || []
      },
      logging: {
        enabled: userConfig.logging?.enabled !== false,
        level: userConfig.logging?.level || 'info'
      }
    };
  }

  /**
   * Setup middleware stack
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    }));

    // CORS middleware
    this.app.use(cors({
      origin: this.config.cors.origin,
      credentials: this.config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-request-id']
    }));

    // Request parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request processing middleware
    this.app.use(addRequestId);
    this.app.use(addResponseTime);
    this.app.use(statsCollector);
    
    // Analytics tracking
    this.app.use(apiAnalytics.trackUsage());

    // Logging middleware
    if (this.config.logging.enabled) {
      this.app.use(morgan('combined'));
      this.app.use(requestLogger);
    }

    // Content type validation for POST/PUT requests
    this.app.use(validateContentType);

    // Rate limiting
    this.app.use(createRateLimit(
      this.config.rateLimit.windowMs,
      this.config.rateLimit.max
    ));

    // Authentication
    if (this.config.auth.required) {
      this.app.use(authenticateAPIKey(this.config.auth.apiKeys));
    }
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // API routes
    this.app.use('/api', createRoutes());

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        data: {
          name: 'ORTB Validation Tool API',
          version: '1.0.0',
          description: 'REST API for OpenRTB 2.6 validation and sample generation',
          status: 'running',
          endpoints: {
            info: '/api/info',
            health: '/api/health',
            documentation: 'https://github.com/your-org/ortb-validation-tool/blob/main/API.md'
          }
        },
        metadata: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date(),
          version: '1.0.0'
        }
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Endpoint ${req.method} ${req.originalUrl} not found`,
          timestamp: new Date()
        }
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const server = this.app.listen(this.config.port, this.config.host, () => {
          console.log(`🚀 ORTB Validation API Server running on http://${this.config.host}:${this.config.port}`);
          console.log(`📚 API Documentation: http://${this.config.host}:${this.config.port}/api/info`);
          console.log(`❤️  Health Check: http://${this.config.host}:${this.config.port}/api/health`);
          
          if (this.config.auth.required) {
            console.log(`🔐 Authentication: Required (${this.config.auth.apiKeys.length} API keys configured)`);
          } else {
            console.log(`🔓 Authentication: Disabled`);
          }
          
          console.log(`⚡ Rate Limiting: ${this.config.rateLimit.max} requests per ${this.config.rateLimit.windowMs / 1000}s`);
          resolve();
        });

        server.on('error', (error: Error) => {
          console.error('❌ Server startup error:', error);
          reject(error);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
          console.log('🛑 SIGTERM received, shutting down gracefully');
          server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
          });
        });

        process.on('SIGINT', () => {
          console.log('🛑 SIGINT received, shutting down gracefully');
          server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
          });
        });

      } catch (error) {
        console.error('❌ Failed to start server:', error);
        reject(error);
      }
    });
  }

  /**
   * Get Express app instance
   */
  public getApp(): Application {
    return this.app;
  }

  /**
   * Get server configuration
   */
  public getConfig(): APIConfig {
    return { ...this.config };
  }
}

/**
 * Create and configure API server
 */
export function createAPIServer(config?: Partial<APIConfig>): APIServer {
  return new APIServer(config);
}

/**
 * Start API server with default configuration
 */
export async function startAPIServer(config?: Partial<APIConfig>): Promise<APIServer> {
  const server = createAPIServer(config);
  await server.start();
  return server;
}