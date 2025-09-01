/**
 * Analytics Tests
 * Tests for API usage analytics and monitoring
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRoutes } from '../routes';
import { 
  authenticateAPIKey, 
  addRequestId,
  errorHandler 
} from '../middleware';
import { APIAnalytics } from '../analytics';

describe('API Analytics', () => {
  let app: express.Application;
  let analytics: APIAnalytics;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(addRequestId);
    
    // Create fresh analytics instance for each test
    analytics = new APIAnalytics();
    
    // Add analytics tracking before authentication so it tracks all requests
    app.use(analytics.trackUsage());
    
    // Enable authentication for analytics testing
    app.use(authenticateAPIKey(['analytics-test-key']));
    
    app.use('/api', createRoutes());
    app.use(errorHandler);
  });

  describe('Usage Tracking', () => {
    it('should track successful requests', async () => {
      await request(app)
        .get('/api/templates')
        .set('x-api-key', 'analytics-test-key')
        .expect(200);

      const metrics = analytics.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(0);
    });

    it('should track failed requests', async () => {
      await request(app)
        .get('/api/templates')
        .expect(401); // No API key

      const metrics = analytics.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(1);
      expect(metrics.authFailures).toBe(1);
    });

    it('should track endpoint usage', async () => {
      await request(app)
        .get('/api/templates')
        .set('x-api-key', 'analytics-test-key')
        .expect(200);

      await request(app)
        .post('/api/generate')
        .set('x-api-key', 'analytics-test-key')
        .send({ 
          config: { 
            requestType: 'display', 
            complexity: 'minimal', 
            includeOptionalFields: false 
          } 
        })
        .expect(200);

      const endpointStats = analytics.getEndpointStats();
      expect(endpointStats.length).toBeGreaterThan(0);
      
      const templatesEndpoint = endpointStats.find(stat => 
        stat.path === '/templates' && stat.method === 'GET'
      );
      expect(templatesEndpoint).toBeDefined();
      expect(templatesEndpoint?.requestCount).toBe(1);
    });

    it('should track API key usage', async () => {
      await request(app)
        .get('/api/templates')
        .set('x-api-key', 'analytics-test-key')
        .expect(200);

      const apiKeyStats = analytics.getApiKeyStats('analytics-test-key');
      expect(apiKeyStats).toBeDefined();
      expect(apiKeyStats?.totalRequests).toBe(1);
      expect(apiKeyStats?.successfulRequests).toBe(1);
      expect(apiKeyStats?.endpointsUsed.size).toBe(1);
    });

    it('should track response times', async () => {
      await request(app)
        .get('/api/templates')
        .set('x-api-key', 'analytics-test-key')
        .expect(200);

      const metrics = analytics.getMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Security Tracking', () => {
    it('should track authentication failures', async () => {
      await request(app)
        .get('/api/templates')
        .expect(401);

      const securityMetrics = analytics.getSecurityMetrics();
      expect(securityMetrics.authFailures).toBe(1);
      expect(securityMetrics.suspiciousActivity.length).toBe(1);
      
      const activity = securityMetrics.suspiciousActivity[0];
      expect(activity.reason).toContain('Authentication failure');
      expect(activity.severity).toBe('medium');
    });

    it('should detect suspicious user agents', async () => {
      await request(app)
        .get('/api/templates')
        .set('User-Agent', 'malicious-bot/1.0')
        .expect(401);

      const securityMetrics = analytics.getSecurityMetrics();
      expect(securityMetrics.suspiciousActivity.length).toBeGreaterThan(0);
      
      const botActivity = securityMetrics.suspiciousActivity.find(activity => 
        activity.reason.includes('Bot/crawler detected')
      );
      expect(botActivity).toBeDefined();
    });
  });

  describe('Metrics Export', () => {
    it('should export comprehensive metrics', async () => {
      // Make some requests to generate data
      await request(app)
        .get('/api/templates')
        .set('x-api-key', 'analytics-test-key')
        .expect(200);

      await request(app)
        .get('/api/templates')
        .expect(401);

      const exportedMetrics = analytics.exportMetrics();
      
      expect(exportedMetrics).toHaveProperty('timestamp');
      expect(exportedMetrics).toHaveProperty('usage');
      expect(exportedMetrics).toHaveProperty('security');
      expect(exportedMetrics).toHaveProperty('errors');
      expect(exportedMetrics).toHaveProperty('uptime');
      expect(exportedMetrics).toHaveProperty('memoryUsage');

      expect(exportedMetrics.usage.totalRequests).toBe(2);
      expect(exportedMetrics.usage.successfulRequests).toBe(1);
      expect(exportedMetrics.usage.failedRequests).toBe(1);
      expect(exportedMetrics.usage.successRate).toBe(50);

      expect(exportedMetrics.security.authFailures).toBe(1);
      expect(exportedMetrics.security.suspiciousActivityCount).toBeGreaterThan(0);
    });

    it('should mask sensitive information in exports', async () => {
      await request(app)
        .get('/api/templates')
        .set('x-api-key', 'analytics-test-key')
        .expect(200);

      const exportedMetrics = analytics.exportMetrics();
      
      // Check that API keys are masked
      if (exportedMetrics.usage.topApiKeys.length > 0) {
        const apiKey = exportedMetrics.usage.topApiKeys[0].apiKey;
        expect(apiKey).not.toBe('analytics-test-key');
        expect(apiKey).toContain('*');
      }

      // Check that IPs are masked in suspicious activity
      if (exportedMetrics.security.recentSuspiciousActivity.length > 0) {
        const activity = exportedMetrics.security.recentSuspiciousActivity[0];
        expect(activity.ip).toContain('xxx');
      }
    });
  });

  describe('Analytics Reset', () => {
    it('should reset metrics correctly', async () => {
      // Generate some data
      await request(app)
        .get('/api/templates')
        .set('x-api-key', 'analytics-test-key')
        .expect(200);

      let metrics = analytics.getMetrics();
      expect(metrics.totalRequests).toBe(1);

      // Reset metrics
      analytics.resetMetrics();

      metrics = analytics.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.requestsByEndpoint.size).toBe(0);
      expect(metrics.requestsByApiKey.size).toBe(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate requests per hour', async () => {
      // Make multiple requests
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/api/templates')
          .set('x-api-key', 'analytics-test-key')
          .expect(200);
      }

      const exportedMetrics = analytics.exportMetrics();
      expect(exportedMetrics.usage.requestsPerHour).toBe(5);
    });

    it('should track top endpoints', async () => {
      // Make requests to different endpoints
      await request(app)
        .get('/api/templates')
        .set('x-api-key', 'analytics-test-key')
        .expect(200);

      await request(app)
        .get('/api/templates')
        .set('x-api-key', 'analytics-test-key')
        .expect(200);

      await request(app)
        .get('/api/export/formats')
        .set('x-api-key', 'analytics-test-key')
        .expect(200);

      const exportedMetrics = analytics.exportMetrics();
      expect(exportedMetrics.usage.topEndpoints.length).toBeGreaterThan(0);
      
      const topEndpoint = exportedMetrics.usage.topEndpoints[0];
      expect(topEndpoint.requests).toBe(2);
      expect(topEndpoint.endpoint).toContain('/templates');
    });
  });
});