/**
 * API Integration Tests
 * Tests for all API endpoints and functionality
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRoutes } from '../routes';
import { 
  addRequestId, 
  addResponseTime, 
  errorHandler,
  validateContentType 
} from '../middleware';
import { ORTBRequest } from '../../models/ortb';
import { SampleConfig } from '../../models/sample';

describe('API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Create a simple Express app for testing
    app = express();
    
    // Add basic middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(addRequestId);
    app.use(addResponseTime);
    
    // Add routes
    app.use('/api', createRoutes());
    
    // Add error handling
    app.use(errorHandler);
  });

  afterAll(async () => {
    // Clean up if needed
  });

  describe('API Info and Health', () => {
    it('should return API info', async () => {
      const response = await request(app)
        .get('/api/info')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('ORTB Validation Tool API');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.metadata.requestId).toBeDefined();
    });

    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.services).toBeDefined();
    });

    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Validation Endpoints', () => {
    const validORTBRequest: ORTBRequest = {
      id: 'test-request-1',
      imp: [{
        id: '1',
        banner: {
          w: 300,
          h: 250,
          mimes: ['image/jpeg', 'image/png']
        },
        bidfloor: 0.5,
        bidfloorcur: 'USD'
      }],
      at: 1,
      site: {
        id: 'site-123',
        domain: 'example.com',
        page: 'https://example.com/page'
      }
    };

    it('should validate a single ORTB request', async () => {
      const response = await request(app)
        .post('/api/validate')
        .send({ request: validORTBRequest })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBeDefined();
      expect(response.body.data.errors).toBeDefined();
      expect(response.body.data.warnings).toBeDefined();
      expect(response.body.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should return error for missing request', async () => {
      const response = await request(app)
        .post('/api/validate')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should validate batch requests', async () => {
      const requests = [validORTBRequest, { ...validORTBRequest, id: 'test-request-2' }];
      
      const response = await request(app)
        .post('/api/validate-batch')
        .send({ requests })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(2);
      expect(response.body.data.summary).toBeDefined();
    });

    it('should return error for empty batch', async () => {
      const response = await request(app)
        .post('/api/validate-batch')
        .send({ requests: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMPTY_REQUESTS');
    });

    it('should return validation service health', async () => {
      const response = await request(app)
        .get('/api/validate/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
    });

    it('should return validation stats', async () => {
      const response = await request(app)
        .get('/api/validate/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.service).toBe('validation');
      expect(response.body.data.uptime).toBeGreaterThan(0);
    });
  });

  describe('Sample Generation Endpoints', () => {
    const validSampleConfig: SampleConfig = {
      requestType: 'display',
      complexity: 'minimal',
      includeOptionalFields: false
    };

    it('should generate a single sample', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({ config: validSampleConfig })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.request).toBeDefined();
      expect(response.body.data.config).toBeDefined();
      expect(response.body.data.metadata).toBeDefined();
    });

    it('should return error for missing config', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should generate batch samples', async () => {
      const batchConfig = {
        count: 3,
        baseConfig: validSampleConfig
      };

      const response = await request(app)
        .post('/api/generate-batch')
        .send({ config: batchConfig })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.samples).toHaveLength(3);
      expect(response.body.data.summary).toBeDefined();
    });

    it('should get available templates', async () => {
      const response = await request(app)
        .get('/api/templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter templates by type', async () => {
      const response = await request(app)
        .get('/api/templates?type=display')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should generate from template', async () => {
      const response = await request(app)
        .post('/api/generate/from-template')
        .send({ templateId: 'display-basic' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.request).toBeDefined();
    });

    it('should return error for unknown template', async () => {
      const response = await request(app)
        .post('/api/generate/from-template')
        .send({ templateId: 'unknown-template' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TEMPLATE_NOT_FOUND');
    });

    it('should return generation service health', async () => {
      const response = await request(app)
        .get('/api/generate/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
    });
  });

  describe('Export Endpoints', () => {
    const sampleData = {
      isValid: true,
      errors: [],
      warnings: [],
      complianceLevel: 'compliant',
      validatedFields: ['id', 'imp'],
      complianceScore: 100,
      timestamp: new Date(),
      validationId: 'test-validation',
      specVersion: '2.6'
    };

    it('should export validation result as JSON', async () => {
      const response = await request(app)
        .post('/api/export/validation-result')
        .send({
          data: sampleData,
          options: { format: 'json' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(true);
      expect(response.body.data.mimeType).toBe('application/json');
    });

    it('should export validation result as CSV', async () => {
      const response = await request(app)
        .post('/api/export/validation-result')
        .send({
          data: sampleData,
          options: { format: 'csv' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mimeType).toBe('text/csv');
    });

    it('should return error for invalid format', async () => {
      const response = await request(app)
        .post('/api/export/validation-result')
        .send({
          data: sampleData,
          options: { format: 'invalid' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FORMAT');
    });

    it('should get supported export formats', async () => {
      const response = await request(app)
        .get('/api/export/formats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should export sample request', async () => {
      const sampleRequest = {
        id: 'sample-1',
        imp: [{ id: '1', banner: { w: 300, h: 250, mimes: ['image/jpeg'] } }],
        at: 1
      };

      const response = await request(app)
        .post('/api/export/sample-request')
        .send({
          data: sampleRequest,
          options: { format: 'json' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(true);
    });

    it('should export multiple samples', async () => {
      const samples = [
        { id: 'sample-1', imp: [{ id: '1', banner: { w: 300, h: 250, mimes: ['image/jpeg'] } }], at: 1 },
        { id: 'sample-2', imp: [{ id: '1', banner: { w: 728, h: 90, mimes: ['image/jpeg'] } }], at: 1 }
      ];

      const response = await request(app)
        .post('/api/export/multiple-samples')
        .send({
          data: samples,
          options: { format: 'json' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recordCount).toBe(2);
    });
  });

  describe('Report Endpoints', () => {
    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      complianceLevel: 'compliant' as const,
      validatedFields: ['id', 'imp'],
      complianceScore: 100,
      timestamp: new Date(),
      validationId: 'test-validation',
      specVersion: '2.6'
    };

    it('should generate validation report', async () => {
      const response = await request(app)
        .post('/api/reports/validation')
        .send({ validationResult })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should generate compliance report', async () => {
      const response = await request(app)
        .post('/api/reports/compliance')
        .send({ validationResult })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should get report templates', async () => {
      const response = await request(app)
        .get('/api/reports/templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return reporting service health', async () => {
      const response = await request(app)
        .get('/api/reports/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
    });

    it('should return error for missing validation result', async () => {
      const response = await request(app)
        .post('/api/reports/validation')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/validate')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_JSON');
    });

    it('should handle missing content type', async () => {
      const response = await request(app)
        .post('/api/validate')
        .send({ request: {} })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CONTENT_TYPE');
    });

    it('should include request ID in responses', async () => {
      const response = await request(app)
        .get('/api/info')
        .expect(200);

      expect(response.body.metadata.requestId).toBeDefined();
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should include response time in headers', async () => {
      const response = await request(app)
        .get('/api/info')
        .expect(200);

      expect(response.headers['x-response-time']).toBeDefined();
      expect(response.headers['x-response-time']).toMatch(/\d+ms/);
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/info')
        .expect(200);

      // Rate limit headers should be present
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/validate')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/info')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});