/**
 * Basic API Endpoints Test
 * Tests core API functionality without complex middleware
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRoutes } from '../routes';
import { ORTBRequest } from '../../models/ortb';
import { SampleConfig } from '../../models/sample';

describe('Basic API Endpoints', () => {
  const app = express();
  
  // Basic setup
  app.use(express.json());
  app.use('/api', createRoutes());

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
      at: 1
    };

    it('should validate a single ORTB request', async () => {
      const response = await request(app)
        .post('/api/validate')
        .send({ request: validORTBRequest })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.isValid).toBeDefined();
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
    });

    it('should get available templates', async () => {
      const response = await request(app)
        .get('/api/templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
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
    });

    it('should get supported export formats', async () => {
      const response = await request(app)
        .get('/api/export/formats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
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

    it('should get report templates', async () => {
      const response = await request(app)
        .get('/api/reports/templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});