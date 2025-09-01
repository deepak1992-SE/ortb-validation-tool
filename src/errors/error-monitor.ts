/**
 * Error Monitoring and Logging
 * Provides error tracking, metrics, and monitoring capabilities
 */

import { ApplicationError, ErrorSeverity, ErrorCategory, ApplicationLayer } from './error-handler';

export interface ErrorMetrics {
  /** Total number of errors */
  totalErrors: number;
  /** Errors by severity */
  errorsBySeverity: Record<ErrorSeverity, number>;
  /** Errors by category */
  errorsByCategory: Record<ErrorCategory, number>;
  /** Errors by layer */
  errorsByLayer: Record<ApplicationLayer, number>;
  /** Error rate (errors per minute) */
  errorRate: number;
  /** Most common error codes */
  commonErrorCodes: ErrorCodeFrequency[];
  /** Error trends over time */
  errorTrends: ErrorTrendData[];
  /** Time period for metrics */
  timePeriod: {
    start: Date;
    end: Date;
  };
}

export interface ErrorCodeFrequency {
  /** Error code */
  code: string;
  /** Number of occurrences */
  count: number;
  /** Percentage of total errors */
  percentage: number;
  /** Most recent occurrence */
  lastOccurrence: Date;
}

export interface ErrorTrendData {
  /** Time bucket */
  timestamp: Date;
  /** Number of errors in this time bucket */
  errorCount: number;
  /** Errors by severity in this time bucket */
  severityBreakdown: Record<ErrorSeverity, number>;
}

export interface ErrorAlert {
  /** Alert ID */
  id: string;
  /** Alert type */
  type: 'threshold' | 'spike' | 'pattern';
  /** Alert severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Alert message */
  message: string;
  /** Trigger condition */
  condition: string;
  /** Timestamp when alert was triggered */
  triggeredAt: Date;
  /** Related errors */
  relatedErrors: ApplicationError[];
  /** Whether alert is active */
  active: boolean;
}

export interface MonitoringConfig {
  /** Enable error monitoring */
  enabled: boolean;
  /** Error threshold for alerts */
  errorThreshold: number;
  /** Time window for threshold (minutes) */
  thresholdWindow: number;
  /** Error rate threshold (errors per minute) */
  errorRateThreshold: number;
  /** Enable trend analysis */
  enableTrendAnalysis: boolean;
  /** Trend analysis window (hours) */
  trendWindow: number;
  /** Alert handlers */
  alertHandlers: AlertHandler[];
}

export interface AlertHandler {
  /** Handler name */
  name: string;
  /** Handler function */
  handle: (alert: ErrorAlert) => Promise<void> | void;
  /** Whether handler is enabled */
  enabled: boolean;
}

export class ErrorMonitor {
  private errors: ApplicationError[] = [];
  private alerts: ErrorAlert[] = [];
  private config: MonitoringConfig;
  private metricsCache: { metrics: ErrorMetrics; timestamp: Date } | null = null;
  private readonly cacheTimeout = 60000; // 1 minute

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  /**
   * Record an error for monitoring
   */
  recordError(error: ApplicationError): void {
    if (!this.config.enabled) return;

    this.errors.push(error);
    this.invalidateMetricsCache();

    // Check for alert conditions
    this.checkAlertConditions(error);

    // Cleanup old errors to prevent memory issues
    this.cleanupOldErrors();
  }

  /**
   * Get error metrics for specified time period
   */
  getMetrics(startTime?: Date, endTime?: Date): ErrorMetrics {
    const now = new Date();
    const start = startTime || new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    const end = endTime || now;

    // Check cache
    if (this.metricsCache && 
        this.metricsCache.timestamp.getTime() > now.getTime() - this.cacheTimeout &&
        !startTime && !endTime) {
      return this.metricsCache.metrics;
    }

    const filteredErrors = this.errors.filter(error => 
      error.timestamp >= start && error.timestamp <= end
    );

    const metrics = this.calculateMetrics(filteredErrors, start, end);

    // Cache default metrics
    if (!startTime && !endTime) {
      this.metricsCache = { metrics, timestamp: now };
    }

    return metrics;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): ErrorAlert[] {
    return this.alerts.filter(alert => alert.active);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): ErrorAlert[] {
    return [...this.alerts];
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.active = false;
      return true;
    }
    return false;
  }

  /**
   * Get error trends
   */
  getErrorTrends(hours: number = 24): ErrorTrendData[] {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
    
    const bucketSize = Math.max(1, Math.floor(hours / 24)) * 60 * 60 * 1000; // Bucket size in ms
    const buckets = new Map<number, ErrorTrendData>();

    // Initialize buckets
    for (let time = startTime.getTime(); time <= now.getTime(); time += bucketSize) {
      const bucketTime = new Date(time);
      buckets.set(time, {
        timestamp: bucketTime,
        errorCount: 0,
        severityBreakdown: {
          critical: 0,
          error: 0,
          warning: 0,
          info: 0
        }
      });
    }

    // Fill buckets with error data
    this.errors
      .filter(error => error.timestamp >= startTime)
      .forEach(error => {
        const bucketKey = Math.floor(error.timestamp.getTime() / bucketSize) * bucketSize;
        const bucket = buckets.get(bucketKey);
        if (bucket) {
          bucket.errorCount++;
          bucket.severityBreakdown[error.severity]++;
        }
      });

    return Array.from(buckets.values()).sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    this.invalidateMetricsCache();
  }

  /**
   * Clear all monitoring data
   */
  clear(): void {
    this.errors = [];
    this.alerts = [];
    this.metricsCache = null;
  }

  /**
   * Export monitoring data
   */
  exportData(): {
    errors: ApplicationError[];
    alerts: ErrorAlert[];
    metrics: ErrorMetrics;
    config: MonitoringConfig;
  } {
    return {
      errors: [...this.errors],
      alerts: [...this.alerts],
      metrics: this.getMetrics(),
      config: { ...this.config }
    };
  }

  /**
   * Calculate error metrics
   */
  private calculateMetrics(errors: ApplicationError[], start: Date, end: Date): ErrorMetrics {
    const totalErrors = errors.length;
    const timePeriodMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const errorRate = timePeriodMinutes > 0 ? totalErrors / timePeriodMinutes : 0;

    // Count by severity
    const errorsBySeverity: Record<ErrorSeverity, number> = {
      critical: 0,
      error: 0,
      warning: 0,
      info: 0
    };

    // Count by category
    const errorsByCategory: Record<ErrorCategory, number> = {
      validation: 0,
      authentication: 0,
      'rate-limit': 0,
      network: 0,
      system: 0,
      'user-input': 0,
      'business-logic': 0
    };

    // Count by layer
    const errorsByLayer: Record<ApplicationLayer, number> = {
      api: 0,
      service: 0,
      validation: 0,
      ui: 0,
      export: 0,
      sample: 0
    };

    // Count error codes
    const errorCodeCounts = new Map<string, { count: number; lastOccurrence: Date }>();

    errors.forEach(error => {
      errorsBySeverity[error.severity]++;
      errorsByCategory[error.category]++;
      errorsByLayer[error.layer]++;

      const codeData = errorCodeCounts.get(error.code) || { count: 0, lastOccurrence: error.timestamp };
      codeData.count++;
      if (error.timestamp > codeData.lastOccurrence) {
        codeData.lastOccurrence = error.timestamp;
      }
      errorCodeCounts.set(error.code, codeData);
    });

    // Generate common error codes
    const commonErrorCodes: ErrorCodeFrequency[] = Array.from(errorCodeCounts.entries())
      .map(([code, data]) => ({
        code,
        count: data.count,
        percentage: totalErrors > 0 ? (data.count / totalErrors) * 100 : 0,
        lastOccurrence: data.lastOccurrence
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generate trend data
    const errorTrends = this.generateTrendData(errors, start, end);

    return {
      totalErrors,
      errorsBySeverity,
      errorsByCategory,
      errorsByLayer,
      errorRate,
      commonErrorCodes,
      errorTrends,
      timePeriod: { start, end }
    };
  }

  /**
   * Generate trend data for metrics
   */
  private generateTrendData(errors: ApplicationError[], start: Date, end: Date): ErrorTrendData[] {
    const bucketSize = 60 * 60 * 1000; // 1 hour buckets
    const buckets = new Map<number, ErrorTrendData>();

    // Initialize buckets
    for (let time = start.getTime(); time <= end.getTime(); time += bucketSize) {
      const bucketTime = new Date(time);
      buckets.set(time, {
        timestamp: bucketTime,
        errorCount: 0,
        severityBreakdown: {
          critical: 0,
          error: 0,
          warning: 0,
          info: 0
        }
      });
    }

    // Fill buckets
    errors.forEach(error => {
      const bucketKey = Math.floor(error.timestamp.getTime() / bucketSize) * bucketSize;
      const bucket = buckets.get(bucketKey);
      if (bucket) {
        bucket.errorCount++;
        bucket.severityBreakdown[error.severity]++;
      }
    });

    return Array.from(buckets.values()).sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  /**
   * Check for alert conditions
   */
  private checkAlertConditions(error: ApplicationError): void {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.thresholdWindow * 60 * 1000);
    
    const recentErrors = this.errors.filter(e => e.timestamp >= windowStart);

    // Check error threshold
    if (recentErrors.length >= this.config.errorThreshold) {
      this.createAlert({
        type: 'threshold',
        severity: 'high',
        message: `Error threshold exceeded: ${recentErrors.length} errors in ${this.config.thresholdWindow} minutes`,
        condition: `errors >= ${this.config.errorThreshold} in ${this.config.thresholdWindow}m`,
        relatedErrors: recentErrors.slice(-5) // Last 5 errors
      });
    }

    // Check error rate
    const errorRate = recentErrors.length / this.config.thresholdWindow;
    if (errorRate >= this.config.errorRateThreshold) {
      this.createAlert({
        type: 'threshold',
        severity: 'medium',
        message: `High error rate: ${errorRate.toFixed(2)} errors per minute`,
        condition: `error_rate >= ${this.config.errorRateThreshold}/min`,
        relatedErrors: [error]
      });
    }

    // Check for critical errors
    if (error.severity === 'critical') {
      this.createAlert({
        type: 'spike',
        severity: 'critical',
        message: `Critical error occurred: ${error.message}`,
        condition: 'severity == critical',
        relatedErrors: [error]
      });
    }

    // Check for error patterns (same error code multiple times)
    const sameCodeErrors = recentErrors.filter(e => e.code === error.code);
    if (sameCodeErrors.length >= 5) {
      this.createAlert({
        type: 'pattern',
        severity: 'medium',
        message: `Repeated error pattern detected: ${error.code} occurred ${sameCodeErrors.length} times`,
        condition: `error_code == ${error.code} count >= 5`,
        relatedErrors: sameCodeErrors.slice(-3)
      });
    }
  }

  /**
   * Create and handle alert
   */
  private createAlert(alertData: {
    type: ErrorAlert['type'];
    severity: ErrorAlert['severity'];
    message: string;
    condition: string;
    relatedErrors: ApplicationError[];
  }): void {
    const alert: ErrorAlert = {
      id: this.generateAlertId(),
      type: alertData.type,
      severity: alertData.severity,
      message: alertData.message,
      condition: alertData.condition,
      triggeredAt: new Date(),
      relatedErrors: alertData.relatedErrors,
      active: true
    };

    // Check if similar alert already exists and is active
    const existingAlert = this.alerts.find(a => 
      a.active && 
      a.type === alert.type && 
      a.condition === alert.condition &&
      a.triggeredAt.getTime() > Date.now() - 5 * 60 * 1000 // Within last 5 minutes
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    this.alerts.push(alert);

    // Handle alert
    this.handleAlert(alert);
  }

  /**
   * Handle alert by calling configured handlers
   */
  private async handleAlert(alert: ErrorAlert): Promise<void> {
    for (const handler of this.config.alertHandlers) {
      if (handler.enabled) {
        try {
          await handler.handle(alert);
        } catch (error) {
          console.error(`Error in alert handler ${handler.name}:`, error);
        }
      }
    }
  }

  /**
   * Clean up old errors to prevent memory issues
   */
  private cleanupOldErrors(): void {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const cutoff = new Date(Date.now() - maxAge);
    
    this.errors = this.errors.filter(error => error.timestamp > cutoff);
    
    // Also cleanup old inactive alerts
    this.alerts = this.alerts.filter(alert => 
      alert.active || alert.triggeredAt > cutoff
    );
  }

  /**
   * Invalidate metrics cache
   */
  private invalidateMetricsCache(): void {
    this.metricsCache = null;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Default monitoring configuration
export const defaultMonitoringConfig: MonitoringConfig = {
  enabled: true,
  errorThreshold: 10,
  thresholdWindow: 15,
  errorRateThreshold: 2,
  enableTrendAnalysis: true,
  trendWindow: 24,
  alertHandlers: [
    {
      name: 'console',
      handle: (alert: ErrorAlert) => {
        console.warn(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
      },
      enabled: true
    }
  ]
};