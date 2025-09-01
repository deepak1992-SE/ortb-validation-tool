/**
 * API Analytics and Monitoring
 * Tracks API usage, performance, and security metrics
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, APIStats, EndpointStats } from './types';

export interface APIUsageMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsByEndpoint: Map<string, EndpointStats>;
  requestsByApiKey: Map<string, ApiKeyStats>;
  rateLimitHits: number;
  authFailures: number;
  errorsByType: Map<string, number>;
  requestsByHour: Map<string, number>;
  lastReset: Date;
}

export interface ApiKeyStats {
  apiKey: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastUsed: Date;
  rateLimitHits: number;
  averageResponseTime: number;
  endpointsUsed: Set<string>;
}

export interface SecurityMetrics {
  authFailures: number;
  rateLimitHits: number;
  suspiciousActivity: SuspiciousActivity[];
  blockedIPs: Set<string>;
  lastSecurityEvent: Date;
}

export interface SuspiciousActivity {
  ip: string;
  userAgent: string;
  endpoint: string;
  timestamp: Date;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * API Analytics Manager
 */
export class APIAnalytics {
  private metrics: APIUsageMetrics;
  private securityMetrics: SecurityMetrics;
  private readonly maxSuspiciousActivities = 1000;

  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsByEndpoint: new Map(),
      requestsByApiKey: new Map(),
      rateLimitHits: 0,
      authFailures: 0,
      errorsByType: new Map(),
      requestsByHour: new Map(),
      lastReset: new Date()
    };

    this.securityMetrics = {
      authFailures: 0,
      rateLimitHits: 0,
      suspiciousActivity: [],
      blockedIPs: new Set(),
      lastSecurityEvent: new Date()
    };
  }

  /**
   * Middleware to track API usage
   */
  trackUsage = () => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const endpoint = `${req.method} ${req.route?.path || req.path}`;
      const apiKey = req.apiKey || 'anonymous';
      const ip = req.ip || req.connection.remoteAddress || 'unknown';

      // Track request start
      this.metrics.totalRequests++;
      this.updateHourlyStats();

      // Track endpoint usage
      if (!this.metrics.requestsByEndpoint.has(endpoint)) {
        this.metrics.requestsByEndpoint.set(endpoint, {
          path: req.route?.path || req.path,
          method: req.method,
          requestCount: 0,
          averageResponseTime: 0,
          errorCount: 0,
          lastAccessed: new Date()
        });
      }

      const endpointStats = this.metrics.requestsByEndpoint.get(endpoint)!;
      endpointStats.requestCount++;
      endpointStats.lastAccessed = new Date();

      // Track API key usage
      if (apiKey !== 'anonymous') {
        if (!this.metrics.requestsByApiKey.has(apiKey)) {
          this.metrics.requestsByApiKey.set(apiKey, {
            apiKey,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            lastUsed: new Date(),
            rateLimitHits: 0,
            averageResponseTime: 0,
            endpointsUsed: new Set()
          });
        }

        const apiKeyStats = this.metrics.requestsByApiKey.get(apiKey)!;
        apiKeyStats.totalRequests++;
        apiKeyStats.lastUsed = new Date();
        apiKeyStats.endpointsUsed.add(endpoint);
      }

      // Track response
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        // Get the actual API key at response time (might be set by auth middleware)
        const finalApiKey = req.apiKey || 'anonymous';

        // Update response time metrics
        this.updateResponseTimeMetrics(responseTime, endpoint, finalApiKey);

        // Track success/failure
        if (statusCode >= 200 && statusCode < 400) {
          this.metrics.successfulRequests++;
          if (finalApiKey !== 'anonymous') {
            const apiKeyStats = this.metrics.requestsByApiKey.get(finalApiKey);
            if (apiKeyStats) {
              apiKeyStats.successfulRequests++;
            }
          }
        } else {
          this.metrics.failedRequests++;
          endpointStats.errorCount++;
          
          if (finalApiKey !== 'anonymous') {
            const apiKeyStats = this.metrics.requestsByApiKey.get(finalApiKey);
            if (apiKeyStats) {
              apiKeyStats.failedRequests++;
            }
          }

          // Track error types
          const errorType = this.getErrorType(statusCode);
          this.metrics.errorsByType.set(
            errorType,
            (this.metrics.errorsByType.get(errorType) || 0) + 1
          );

          // Check for suspicious activity
          this.checkSuspiciousActivity(req, statusCode, ip);
        }

        // Update average response time
        this.updateAverageResponseTime(responseTime);
      });

      next();
    };
  };

  /**
   * Track authentication failures
   */
  trackAuthFailure(req: Request, reason: string): void {
    this.metrics.authFailures++;
    this.securityMetrics.authFailures++;
    this.securityMetrics.lastSecurityEvent = new Date();

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    this.addSuspiciousActivity({
      ip,
      userAgent,
      endpoint: `${req.method} ${req.path}`,
      timestamp: new Date(),
      reason: `Authentication failure: ${reason}`,
      severity: 'medium'
    });
  }

  /**
   * Track rate limit hits
   */
  trackRateLimitHit(req: AuthenticatedRequest): void {
    this.metrics.rateLimitHits++;
    this.securityMetrics.rateLimitHits++;
    this.securityMetrics.lastSecurityEvent = new Date();

    const apiKey = req.apiKey || 'anonymous';
    if (apiKey !== 'anonymous') {
      const apiKeyStats = this.metrics.requestsByApiKey.get(apiKey);
      if (apiKeyStats) {
        apiKeyStats.rateLimitHits++;
      }
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    this.addSuspiciousActivity({
      ip,
      userAgent,
      endpoint: `${req.method} ${req.path}`,
      timestamp: new Date(),
      reason: 'Rate limit exceeded',
      severity: 'low'
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): APIUsageMetrics {
    return {
      ...this.metrics,
      requestsByEndpoint: new Map(this.metrics.requestsByEndpoint),
      requestsByApiKey: new Map(this.metrics.requestsByApiKey),
      errorsByType: new Map(this.metrics.errorsByType),
      requestsByHour: new Map(this.metrics.requestsByHour)
    };
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    return {
      ...this.securityMetrics,
      suspiciousActivity: [...this.securityMetrics.suspiciousActivity],
      blockedIPs: new Set(this.securityMetrics.blockedIPs)
    };
  }

  /**
   * Get API key statistics
   */
  getApiKeyStats(apiKey: string): ApiKeyStats | undefined {
    const stats = this.metrics.requestsByApiKey.get(apiKey);
    if (stats) {
      return {
        ...stats,
        endpointsUsed: new Set(stats.endpointsUsed)
      };
    }
    return undefined;
  }

  /**
   * Get endpoint statistics
   */
  getEndpointStats(): EndpointStats[] {
    return Array.from(this.metrics.requestsByEndpoint.values());
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsByEndpoint: new Map(),
      requestsByApiKey: new Map(),
      rateLimitHits: 0,
      authFailures: 0,
      errorsByType: new Map(),
      requestsByHour: new Map(),
      lastReset: new Date()
    };
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): any {
    const metrics = this.getMetrics();
    const securityMetrics = this.getSecurityMetrics();

    return {
      timestamp: new Date().toISOString(),
      usage: {
        totalRequests: metrics.totalRequests,
        successfulRequests: metrics.successfulRequests,
        failedRequests: metrics.failedRequests,
        successRate: metrics.totalRequests > 0 
          ? Math.round((metrics.successfulRequests / metrics.totalRequests) * 100) 
          : 0,
        averageResponseTime: metrics.averageResponseTime,
        requestsPerHour: this.calculateRequestsPerHour(),
        topEndpoints: this.getTopEndpoints(5),
        topApiKeys: this.getTopApiKeys(5)
      },
      security: {
        authFailures: securityMetrics.authFailures,
        rateLimitHits: securityMetrics.rateLimitHits,
        suspiciousActivityCount: securityMetrics.suspiciousActivity.length,
        blockedIPsCount: securityMetrics.blockedIPs.size,
        recentSuspiciousActivity: securityMetrics.suspiciousActivity
          .slice(-10)
          .map(activity => ({
            ...activity,
            ip: this.maskIP(activity.ip)
          }))
      },
      errors: Object.fromEntries(metrics.errorsByType),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  // Private helper methods

  private updateHourlyStats(): void {
    const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    this.metrics.requestsByHour.set(
      hour,
      (this.metrics.requestsByHour.get(hour) || 0) + 1
    );

    // Keep only last 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 13);
    for (const [hour] of this.metrics.requestsByHour) {
      if (hour < cutoff) {
        this.metrics.requestsByHour.delete(hour);
      }
    }
  }

  private updateResponseTimeMetrics(responseTime: number, endpoint: string, apiKey: string): void {
    // Update endpoint response time
    const endpointStats = this.metrics.requestsByEndpoint.get(endpoint);
    if (endpointStats) {
      const totalTime = endpointStats.averageResponseTime * (endpointStats.requestCount - 1);
      endpointStats.averageResponseTime = Math.round((totalTime + responseTime) / endpointStats.requestCount);
    }

    // Update API key response time
    if (apiKey !== 'anonymous') {
      const apiKeyStats = this.metrics.requestsByApiKey.get(apiKey);
      if (apiKeyStats) {
        const totalTime = apiKeyStats.averageResponseTime * (apiKeyStats.totalRequests - 1);
        apiKeyStats.averageResponseTime = Math.round((totalTime + responseTime) / apiKeyStats.totalRequests);
      }
    }
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1);
    this.metrics.averageResponseTime = Math.round((totalTime + responseTime) / this.metrics.totalRequests);
  }

  private getErrorType(statusCode: number): string {
    if (statusCode >= 400 && statusCode < 500) {
      return 'client_error';
    } else if (statusCode >= 500) {
      return 'server_error';
    }
    return 'unknown_error';
  }

  private checkSuspiciousActivity(req: Request, statusCode: number, ip: string): void {
    const userAgent = req.get('User-Agent') || 'unknown';
    const endpoint = `${req.method} ${req.path}`;

    // Check for suspicious patterns
    if (statusCode === 401 || statusCode === 403) {
      // Multiple auth failures from same IP
      const recentAuthFailures = this.securityMetrics.suspiciousActivity
        .filter(activity => 
          activity.ip === ip && 
          activity.reason.includes('Authentication') &&
          Date.now() - activity.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
        ).length;

      if (recentAuthFailures >= 5) {
        this.addSuspiciousActivity({
          ip,
          userAgent,
          endpoint,
          timestamp: new Date(),
          reason: 'Multiple authentication failures',
          severity: 'high'
        });
      }
    }

    // Check for unusual user agents
    if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('spider')) {
      this.addSuspiciousActivity({
        ip,
        userAgent,
        endpoint,
        timestamp: new Date(),
        reason: 'Bot/crawler detected',
        severity: 'low'
      });
    }
  }

  private addSuspiciousActivity(activity: SuspiciousActivity): void {
    this.securityMetrics.suspiciousActivity.push(activity);

    // Keep only recent activities
    if (this.securityMetrics.suspiciousActivity.length > this.maxSuspiciousActivities) {
      this.securityMetrics.suspiciousActivity = this.securityMetrics.suspiciousActivity
        .slice(-this.maxSuspiciousActivities);
    }

    // Auto-block IPs with high severity activities
    if (activity.severity === 'high') {
      this.securityMetrics.blockedIPs.add(activity.ip);
    }
  }

  private calculateRequestsPerHour(): number {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    let requestsInLastHour = 0;
    for (const [hour, count] of this.metrics.requestsByHour) {
      const hourDate = new Date(hour + ':00:00Z');
      if (hourDate >= oneHourAgo) {
        requestsInLastHour += count;
      }
    }
    
    return requestsInLastHour;
  }

  private getTopEndpoints(limit: number): Array<{ endpoint: string; requests: number; avgResponseTime: number }> {
    return Array.from(this.metrics.requestsByEndpoint.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        requests: stats.requestCount,
        avgResponseTime: stats.averageResponseTime
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, limit);
  }

  private getTopApiKeys(limit: number): Array<{ apiKey: string; requests: number; successRate: number }> {
    return Array.from(this.metrics.requestsByApiKey.entries())
      .map(([apiKey, stats]) => ({
        apiKey: this.maskApiKey(apiKey),
        requests: stats.totalRequests,
        successRate: stats.totalRequests > 0 
          ? Math.round((stats.successfulRequests / stats.totalRequests) * 100)
          : 0
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, limit);
  }

  private maskIP(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return 'xxx.xxx.xxx.xxx';
  }

  private maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) {
      return '*'.repeat(apiKey.length);
    }
    return apiKey.slice(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.slice(-4);
  }
}

// Global analytics instance
export const apiAnalytics = new APIAnalytics();