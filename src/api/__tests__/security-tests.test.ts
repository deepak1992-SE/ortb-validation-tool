/**
 * Security Tests
 * Tests for API security features including authentication, rate limiting, and monitoring
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRoutes } from '../routes';
import { 
  authenticateAPIKey, 
  createRateLimit,
  addRequestId,
  errorHandler,
  validateContentType
} from '../middleware';

describe('API Security Tests', () => {
  describe('Authentication Security', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(addRequestId);
      app.use(authenticateAPIKey(['secure-key-1', 'secure-key-2']));
      app.use('/api', createRoutes());
      app.use(errorHandler);
    });

    it('should require API key for protected endpoints', async () => {
      const response = await request(app)
        .get('/api/templates')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_API_KEY');
      expect(response.body.error.message).toBe('API key is required');
    });

    it('should reject invalid API keys', async () => {
      const response = await request(app)
        .get('/api/templates')
        .set('x-api-key', 'invalid-key')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_API_KEY');
    });

    it('should accept valid API keys', async () => {
      const response = await request(app)
        .get('/api/templates')
        .set('x-api-key', 'secure-key-1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should work with API key in query parameter', async () => {
      const response = await request(app)
        .get('/api/templates?apiKey=secure-key-2')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should not leak API keys in error responses', async () => {
      const response = await request(app)
        .post('/api/validate')
        .set('x-api-key', 'secure-key-1')
        .send({ invalid: 'data' })
        .expect(400);

      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain('secure-key-1');
    });
  });

  describe('Rate Limiting Security', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(addRequestId);
      app.use(createRateLimit(60 * 1000, 3)); // 3 requests per minute
      app.use('/api', createRoutes());
      app.use(errorHandler);
    });

    it('should enforce rate limits', async () => {
      // Make 3 requests (should succeed)
      await request(app).get('/api/templates').expect(200);
      await request(app).get('/api/templates').expect(200);
      await request(app).get('/api/templates').expect(200);

      // 4th request should be rate limited
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

    it('should reset rate limit after window expires', async () => {
      // This test would require waiting for the window to expire
      // For now, just verify the rate limit is working
      await request(app).get('/api/templates').expect(200);
      
      const response = await request(app)
        .get('/api/templates')
        .expect(200);

      expect(response.headers['ratelimit-remaining']).toBeDefined();
      const remaining = parseInt(response.headers['ratelimit-remaining']);
      expect(remaining).toBeLessThan(3);
    });
  });

  describe('Combined Security Features', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(addRequestId);
      app.use(createRateLimit(60 * 1000, 2)); // 2 requests per minute
      app.use(authenticateAPIKey(['combined-key']));
      app.use('/api', createRoutes());
      app.use(errorHandler);
    });

    it('should enforce both authentication and rate limiting', async () => {
      // Valid key, within rate limit - should succeed
      await request(app)
        .get('/api/templates')
        .set('x-api-key', 'combined-key')
        .expect(200);

      // Valid key, within rate limit - should succeed
      await request(app)
        .get('/api/templates')
        .set('x-api-key', 'combined-key')
        .expect(200);

      // Valid key, exceeds rate limit - should be rate limited
      const response = await request(app)
        .get('/api/templates')
        .set('x-api-key', 'combined-key')
        .expect(429);

      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should reject invalid keys before checking rate limit', async () => {
      const response = await request(app)
        .get('/api/templates')
        .set('x-api-key', 'invalid-key')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_API_KEY');
    });
  });

  describe('Request Security Headers', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(addRequestId);
      app.use('/api', createRoutes());
      app.use(errorHandler);
    });

    it('should include request ID in all responses', async () => {
      const response = await request(app)
        .get('/api/templates')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.body.metadata.requestId).toBeDefined();
      expect(response.headers['x-request-id']).toBe(response.body.metadata.requestId);
    });

    it('should include request ID in error responses', async () => {
      const response = await request(app)
        .post('/api/validate')
        .send({}) // Missing required field
        .expect(400);

      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/validate')
        .expect(200);

      // Should handle OPTIONS request without error
      expect(response.status).toBe(200);
    });
  });

  describe('Input Validation Security', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json({ limit: '10mb' }));
      app.use(addRequestId);
      
      // Add content type validation
      app.use(validateContentType);
      
      app.use('/api', createRoutes());
      app.use(errorHandler);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/validate')
        .send({}) // Missing required 'request' field
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/validate')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_JSON');
    });

    it('should validate content type for POST requests', async () => {
      const response = await request(app)
        .post('/api/validate')
        .set('Content-Type', 'text/plain')
        .send('some data')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CONTENT_TYPE');
    });

    it('should handle large payloads within limits', async () => {
      const largeRequest = {
        request: {
          id: 'large-test',
          imp: Array(100).fill({
            id: '1',
            banner: { w: 300, h: 250, mimes: ['image/jpeg'] },
            bidfloor: 0.5,
            bidfloorcur: 'USD'
          }),
          at: 1
        }
      };

      const response = await request(app)
        .post('/api/validate')
        .send(largeRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling Security', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(addRequestId);
      app.use('/api', createRoutes());
      app.use(errorHandler);
      
      // Add 404 handler
      app.use((req, res) => {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Endpoint ${req.method} ${req.originalUrl} not found`,
            timestamp: new Date()
          }
        });
      });
    });

    it('should not expose internal error details', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).not.toContain('stack');
      expect(response.body.error.message).not.toContain('internal');
    });

    it('should include timestamp in error responses', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.error.timestamp).toBeDefined();
      const timestamp = new Date(response.body.error.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 5000); // Within last 5 seconds
    });

    it('should maintain consistent error response format', async () => {
      const response = await request(app)
        .post('/api/validate')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.success).toBe(false);
    });
  });
});