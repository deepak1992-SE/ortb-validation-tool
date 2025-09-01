/**
 * Authentication and Rate Limiting Tests
 * Tests for API security features
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRoutes } from '../routes';
import { 
  authenticateAPIKey, 
  createRateLimit,
  addRequestId,
  errorHandler 
} from '../middleware';

describe('Authentication and Rate Limiting', () => {
  describe('API Key Authentication', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(addRequestId);
      
      // Enable authentication with test API keys
      app.use(authenticateAPIKey(['test-key-1', 'test-key-2']));
      app.use('/api', createRoutes());
      app.use(errorHandler);
    });

    it('should allow access with valid API key in header', async () => {
      const response = await request(app)
        .get('/api/templates')
        .set('x-api-key', 'test-key-1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow access with valid API key in query', async () => {
      const response = await request(app)
        .get('/api/templates?apiKey=test-key-2')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject request without API key', async () => {
      const response = await request(app)
        .get('/api/templates')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_API_KEY');
    });

    it('should reject request with invalid API key', async () => {
      const response = await request(app)
        .get('/api/templates')
        .set('x-api-key', 'invalid-key')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_API_KEY');
    });

    it('should work with POST requests', async () => {
      const validORTBRequest = {
        id: 'test-request-1',
        imp: [{
          id: '1',
          banner: { w: 300, h: 250, mimes: ['image/jpeg'] },
          bidfloor: 0.5,
          bidfloorcur: 'USD'
        }],
        at: 1
      };

      const response = await request(app)
        .post('/api/validate')
        .set('x-api-key', 'test-key-1')
        .send({ request: validORTBRequest })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(addRequestId);
      
      // Enable rate limiting - 3 requests per minute for testing
      app.use(createRateLimit(60 * 1000, 3));
      app.use('/api', createRoutes());
      app.use(errorHandler);
    });

    it('should allow requests within rate limit', async () => {
      // First request
      const response1 = await request(app)
        .get('/api/templates')
        .expect(200);
      expect(response1.body.success).toBe(true);

      // Second request
      const response2 = await request(app)
        .get('/api/templates')
        .expect(200);
      expect(response2.body.success).toBe(true);

      // Third request
      const response3 = await request(app)
        .get('/api/templates')
        .expect(200);
      expect(response3.body.success).toBe(true);
    });

    it('should reject requests exceeding rate limit', async () => {
      // Make 3 requests to hit the limit
      await request(app).get('/api/templates').expect(200);
      await request(app).get('/api/templates').expect(200);
      await request(app).get('/api/templates').expect(200);

      // Fourth request should be rate limited
      const response = await request(app)
        .get('/api/templates')
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/templates')
        .expect(200);

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });
  });

  describe('Combined Authentication and Rate Limiting', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(addRequestId);
      
      // Enable both authentication and rate limiting
      app.use(createRateLimit(60 * 1000, 2));
      app.use(authenticateAPIKey(['test-key-1']));
      app.use('/api', createRoutes());
      app.use(errorHandler);
    });

    it('should require both valid API key and respect rate limits', async () => {
      // First request with valid key - should succeed
      const response1 = await request(app)
        .get('/api/templates')
        .set('x-api-key', 'test-key-1')
        .expect(200);
      expect(response1.body.success).toBe(true);

      // Second request with valid key - should succeed
      const response2 = await request(app)
        .get('/api/templates')
        .set('x-api-key', 'test-key-1')
        .expect(200);
      expect(response2.body.success).toBe(true);

      // Third request with valid key - should be rate limited
      const response3 = await request(app)
        .get('/api/templates')
        .set('x-api-key', 'test-key-1')
        .expect(429);
      expect(response3.body.success).toBe(false);
      expect(response3.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should reject invalid API key before checking rate limit', async () => {
      const response = await request(app)
        .get('/api/templates')
        .set('x-api-key', 'invalid-key')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_API_KEY');
    });
  });

  describe('API Usage Analytics', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(addRequestId);
      
      // Enable authentication for analytics
      app.use(authenticateAPIKey(['analytics-key']));
      app.use('/api', createRoutes());
      app.use(errorHandler);
    });

    it('should track API usage with valid key', async () => {
      // Make a few requests
      await request(app)
        .get('/api/templates')
        .set('x-api-key', 'analytics-key')
        .expect(200);

      await request(app)
        .post('/api/generate')
        .set('x-api-key', 'analytics-key')
        .send({ 
          config: { 
            requestType: 'display', 
            complexity: 'minimal', 
            includeOptionalFields: false 
          } 
        })
        .expect(200);

      // Check if stats endpoint works (if implemented)
      const statsResponse = await request(app)
        .get('/api/validate/stats')
        .set('x-api-key', 'analytics-key')
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(addRequestId);
      app.use('/api', createRoutes());
      app.use(errorHandler);
    });

    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/templates')
        .expect(200);

      // Check for request ID header
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/validate')
        .expect(200);

      // Should handle OPTIONS request
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling with Security', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(addRequestId);
      app.use(authenticateAPIKey(['secure-key']));
      app.use('/api', createRoutes());
      app.use(errorHandler);
    });

    it('should not leak sensitive information in error messages', async () => {
      const response = await request(app)
        .post('/api/validate')
        .set('x-api-key', 'secure-key')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
      expect(response.body.error.message).not.toContain('secure-key');
    });

    it('should include request ID in error responses', async () => {
      const response = await request(app)
        .get('/api/templates')
        .expect(401); // No API key

      expect(response.body.success).toBe(false);
      expect(response.headers['x-request-id']).toBeDefined();
    });
  });
});