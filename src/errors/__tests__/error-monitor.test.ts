/**
 * Error Monitor Tests
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ErrorMonitor, MonitoringConfig, ErrorAlert } from '../error-monitor';
import { ApplicationError } from '../error-handler';

describe('ErrorMonitor', () => {
  let monitor: ErrorMonitor;
  let mockAlertHandler: vi.Mock;
  let config: MonitoringConfig;

  beforeEach(() => {
    mockAlertHandler = vi.fn();
    config = {
      enabled: true,
      errorThreshold: 5,
      thresholdWindow: 15,
      errorRateThreshold: 2,
      enableTrendAnalysis: true,
      trendWindow: 24,
      alertHandlers: [
        {
          name: 'test-handler',
          handle: mockAlertHandler,
          enabled: true
        }
      ]
    };
    monitor = new ErrorMonitor(config);
  });

  const createTestError = (overrides: Partial<ApplicationError> = {}): ApplicationError => ({
    id: `error-${Date.now()}-${Math.random()}`,
    code: 'TEST_ERROR',
    message: 'Test error message',
    userMessage: 'Test user message',
    severity: 'error',
    category: 'validation',
    layer: 'api',
    timestamp: new Date(),
    recoverySuggestions: [],
    retryable: false,
    ...overrides
  });

  describe('recordError', () => {
    test('should record error when monitoring is enabled', () => {
      const error = createTestError();
      monitor.recordError(error);

      const metrics = monitor.getMetrics();
      expect(metrics.totalErrors).toBe(1);
    });

    test('should not record error when monitoring is disabled', () => {
      config.enabled = false;
      monitor = new ErrorMonitor(config);
      
      const error = createTestError();
      monitor.recordError(error);

      const metrics = monitor.getMetrics();
      expect(metrics.totalErrors).toBe(0);
    });

    test('should trigger alerts when thresholds are exceeded', async () => {
      // Record errors to exceed threshold
      for (let i = 0; i < 6; i++) {
        const error = createTestError({ id: `error-${i}` });
        monitor.recordError(error);
      }

      // Wait for alert processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockAlertHandler).toHaveBeenCalled();
      const alerts = monitor.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    });

    test('should trigger critical error alerts immediately', async () => {
      const criticalError = createTestError({
        severity: 'critical',
        message: 'Critical system failure'
      });

      monitor.recordError(criticalError);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockAlertHandler).toHaveBeenCalled();
      const alerts = monitor.getActiveAlerts();
      const criticalAlert = alerts.find(alert => alert.severity === 'critical');
      expect(criticalAlert).toBeDefined();
      expect(criticalAlert?.message).toContain('Critical error occurred');
    });
  });

  describe('getMetrics', () => {
    test('should calculate error metrics correctly', () => {
      const errors = [
        createTestError({ severity: 'error', category: 'validation', layer: 'api' }),
        createTestError({ severity: 'warning', category: 'authentication', layer: 'service' }),
        createTestError({ severity: 'error', category: 'validation', layer: 'api', code: 'DUPLICATE_ERROR' }),
        createTestError({ severity: 'critical', category: 'system', layer: 'service' })
      ];

      errors.forEach(error => monitor.recordError(error));

      const metrics = monitor.getMetrics();

      expect(metrics.totalErrors).toBe(4);
      expect(metrics.errorsBySeverity.error).toBe(2);
      expect(metrics.errorsBySeverity.warning).toBe(1);
      expect(metrics.errorsBySeverity.critical).toBe(1);
      expect(metrics.errorsByCategory.validation).toBe(2);
      expect(metrics.errorsByCategory.authentication).toBe(1);
      expect(metrics.errorsByCategory.system).toBe(1);
      expect(metrics.errorsByLayer.api).toBe(2);
      expect(metrics.errorsByLayer.service).toBe(2);
    });

    test('should calculate error rate correctly', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      
      // Record 3 errors in the last minute
      for (let i = 0; i < 3; i++) {
        const error = createTestError({
          timestamp: new Date(oneMinuteAgo.getTime() + i * 20 * 1000)
        });
        monitor.recordError(error);
      }

      const metrics = monitor.getMetrics(oneMinuteAgo, now);
      expect(metrics.errorRate).toBeCloseTo(3, 1); // 3 errors per minute
    });

    test('should identify common error codes', () => {
      const errors = [
        createTestError({ code: 'VALIDATION_ERROR' }),
        createTestError({ code: 'VALIDATION_ERROR' }),
        createTestError({ code: 'AUTH_ERROR' }),
        createTestError({ code: 'VALIDATION_ERROR' })
      ];

      errors.forEach(error => monitor.recordError(error));

      const metrics = monitor.getMetrics();
      const commonErrors = metrics.commonErrorCodes;

      expect(commonErrors[0].code).toBe('VALIDATION_ERROR');
      expect(commonErrors[0].count).toBe(3);
      expect(commonErrors[0].percentage).toBe(75);
      expect(commonErrors[1].code).toBe('AUTH_ERROR');
      expect(commonErrors[1].count).toBe(1);
      expect(commonErrors[1].percentage).toBe(25);
    });

    test('should cache metrics for performance', () => {
      const error = createTestError();
      monitor.recordError(error);

      const metrics1 = monitor.getMetrics();
      const metrics2 = monitor.getMetrics();

      // Should return the same object reference due to caching
      expect(metrics1).toBe(metrics2);
    });
  });

  describe('getErrorTrends', () => {
    test('should generate error trend data', () => {
      const now = new Date();
      const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);

      // Create errors at different times
      const errors = [
        createTestError({ timestamp: hoursAgo(2), severity: 'error' }),
        createTestError({ timestamp: hoursAgo(2), severity: 'warning' }),
        createTestError({ timestamp: hoursAgo(1), severity: 'error' }),
        createTestError({ timestamp: hoursAgo(0.5), severity: 'critical' })
      ];

      errors.forEach(error => monitor.recordError(error));

      const trends = monitor.getErrorTrends(3);
      expect(trends.length).toBeGreaterThan(0);
      
      // Check that trends are sorted by timestamp
      for (let i = 1; i < trends.length; i++) {
        expect(trends[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          trends[i - 1].timestamp.getTime()
        );
      }

      // Check that error counts are distributed across time buckets
      const totalTrendErrors = trends.reduce((sum, trend) => sum + trend.errorCount, 0);
      expect(totalTrendErrors).toBe(4);
    });
  });

  describe('alert management', () => {
    test('should get active alerts', async () => {
      const criticalError = createTestError({ severity: 'critical' });
      monitor.recordError(criticalError);
      
      await new Promise(resolve => setTimeout(resolve, 10));

      const activeAlerts = monitor.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);
      expect(activeAlerts.every(alert => alert.active)).toBe(true);
    });

    test('should dismiss alerts', async () => {
      const criticalError = createTestError({ severity: 'critical' });
      monitor.recordError(criticalError);
      
      await new Promise(resolve => setTimeout(resolve, 10));

      const activeAlerts = monitor.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);

      const alertId = activeAlerts[0].id;
      const dismissed = monitor.dismissAlert(alertId);
      expect(dismissed).toBe(true);

      const updatedActiveAlerts = monitor.getActiveAlerts();
      expect(updatedActiveAlerts.length).toBe(activeAlerts.length - 1);
    });

    test('should not create duplicate alerts', async () => {
      // Record multiple critical errors quickly
      for (let i = 0; i < 3; i++) {
        const criticalError = createTestError({ 
          severity: 'critical',
          timestamp: new Date()
        });
        monitor.recordError(criticalError);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const alerts = monitor.getAllAlerts();
      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
      
      // Should have fewer alerts than errors due to deduplication
      expect(criticalAlerts.length).toBeLessThan(3);
    });
  });

  describe('configuration updates', () => {
    test('should update monitoring configuration', () => {
      const newConfig = {
        errorThreshold: 10,
        thresholdWindow: 30
      };

      monitor.updateConfig(newConfig);

      // Record errors to test new threshold
      for (let i = 0; i < 8; i++) {
        monitor.recordError(createTestError());
      }

      // Should not trigger alert with new higher threshold
      const alerts = monitor.getActiveAlerts();
      const thresholdAlerts = alerts.filter(alert => alert.type === 'threshold');
      expect(thresholdAlerts.length).toBe(0);
    });
  });

  describe('data management', () => {
    test('should clear all monitoring data', () => {
      const error = createTestError();
      monitor.recordError(error);

      expect(monitor.getMetrics().totalErrors).toBe(1);

      monitor.clear();

      expect(monitor.getMetrics().totalErrors).toBe(0);
      expect(monitor.getAllAlerts()).toHaveLength(0);
    });

    test('should export monitoring data', () => {
      const error = createTestError();
      monitor.recordError(error);

      const exportedData = monitor.exportData();

      expect(exportedData.errors).toHaveLength(1);
      expect(exportedData.metrics.totalErrors).toBe(1);
      expect(exportedData.config).toBeDefined();
      expect(exportedData.alerts).toBeDefined();
    });
  });

  describe('pattern detection', () => {
    test('should detect repeated error patterns', async () => {
      const errorCode = 'REPEATED_ERROR';
      
      // Record the same error multiple times
      for (let i = 0; i < 6; i++) {
        const error = createTestError({ 
          code: errorCode,
          timestamp: new Date(Date.now() + i * 1000)
        });
        monitor.recordError(error);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      const alerts = monitor.getActiveAlerts();
      const patternAlert = alerts.find(alert => 
        alert.type === 'pattern' && 
        alert.message.includes(errorCode)
      );

      expect(patternAlert).toBeDefined();
      expect(patternAlert?.message).toContain('Repeated error pattern detected');
    });
  });
});