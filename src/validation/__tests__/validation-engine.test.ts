/**
 * Validation Engine Tests
 * Comprehensive unit tests for basic JSON schema validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ORTBValidationEngine } from '../validation-engine';
import { ORTBRequest } from '../../models';

describe('ORTBValidationEngine', () => {
  let validationEngine: ORTBValidationEngine;

  beforeEach(() => {
    validationEngine = new ORTBValidationEngine();
  });

  describe('validateRequest', () => {
    it('should validate a minimal valid ORTB request', async () => {
      const validRequest: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          {
            id: 'imp-1',
            banner: {
              w: 300,
              h: 250
            }
          }
        ],
        at: 2
      };

      const result = await validationEngine.validateRequest(validRequest);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.complianceLevel).toBe('compliant');
      expect(result.complianceScore).toBeGreaterThan(80);
      expect(result.validationId).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.specVersion).toBe('2.6');
      expect(result.validatedFields).toContain('id');
      expect(result.validatedFields).toContain('imp');
    });

    it('should reject request with missing required ID', async () => {
      const invalidRequest = {
        imp: [
          {
            id: 'imp-1',
            banner: { w: 300, h: 250 }
          }
        ],
        at: 2
      } as any;

      const result = await validationEngine.validateRequest(invalidRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('id');
      expect(result.errors[0].code).toBe('ORTB_REQUIRED_FIELD_MISSING');
      expect(result.errors[0].type).toBe('required-field');
      expect(result.errors[0].severity).toBe('error');
      expect(result.complianceLevel).toBe('non-compliant');
      expect(result.complianceScore).toBeLessThan(80);
    });

    it('should reject request with empty ID', async () => {
      const invalidRequest: ORTBRequest = {
        id: '',
        imp: [
          {
            id: 'imp-1',
            banner: { w: 300, h: 250 }
          }
        ],
        at: 2
      };

      const result = await validationEngine.validateRequest(invalidRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'ORTB_INVALID_REQUEST_ID')).toBe(true);
      expect(result.complianceLevel).toBe('non-compliant');
    });

    it('should reject request with missing impressions', async () => {
      const invalidRequest = {
        id: 'test-request-123',
        at: 2
      } as any;

      const result = await validationEngine.validateRequest(invalidRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('imp');
      expect(result.errors[0].code).toBe('ORTB_REQUIRED_FIELD_MISSING');
      expect(result.errors[0].type).toBe('required-field');
      expect(result.complianceLevel).toBe('non-compliant');
    });

    it('should reject request with empty impressions array', async () => {
      const invalidRequest: ORTBRequest = {
        id: 'test-request-123',
        imp: [],
        at: 2
      };

      const result = await validationEngine.validateRequest(invalidRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'ORTB_MISSING_IMPRESSIONS')).toBe(true);
      expect(result.complianceLevel).toBe('non-compliant');
    });

    it('should reject impression without ID', async () => {
      const invalidRequest: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          {
            id: '',
            banner: { w: 300, h: 250 }
          }
        ],
        at: 2
      };

      const result = await validationEngine.validateRequest(invalidRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'ORTB_MISSING_IMPRESSION_ID')).toBe(true);
      expect(result.complianceLevel).toBe('non-compliant');
    });

    it('should validate request with site object', async () => {
      const validRequest: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          {
            id: 'imp-1',
            banner: { w: 300, h: 250 }
          }
        ],
        site: {
          id: 'site-123',
          domain: 'example.com',
          page: 'https://example.com/page'
        },
        at: 2
      };

      const result = await validationEngine.validateRequest(validRequest);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.complianceLevel).toBe('compliant');
    });

    it('should validate request with app object', async () => {
      const validRequest: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          {
            id: 'imp-1',
            banner: { w: 300, h: 250 }
          }
        ],
        app: {
          id: 'app-123',
          name: 'Test App',
          bundle: 'com.example.testapp'
        },
        at: 2
      };

      const result = await validationEngine.validateRequest(validRequest);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.complianceLevel).toBe('compliant');
    });

    it('should reject request with both site and app objects', async () => {
      const invalidRequest: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          {
            id: 'imp-1',
            banner: { w: 300, h: 250 }
          }
        ],
        site: {
          id: 'site-123',
          domain: 'example.com'
        },
        app: {
          id: 'app-123',
          name: 'Test App'
        },
        at: 2
      };

      const result = await validationEngine.validateRequest(invalidRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'ORTB_SITE_APP_CONFLICT')).toBe(true);
      expect(result.complianceLevel).toBe('non-compliant');
    });

    it('should validate request with device information', async () => {
      const validRequest: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          {
            id: 'imp-1',
            banner: { w: 300, h: 250 }
          }
        ],
        device: {
          ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip: '192.168.1.1',
          devicetype: 2
        },
        at: 2
      };

      const result = await validationEngine.validateRequest(validRequest);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.complianceLevel).toBe('compliant');
    });

    it('should validate request with user information', async () => {
      const validRequest: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          {
            id: 'imp-1',
            banner: { w: 300, h: 250 }
          }
        ],
        user: {
          id: 'user-123',
          yob: 1990,
          gender: 'M'
        },
        at: 2
      };

      const result = await validationEngine.validateRequest(validRequest);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.complianceLevel).toBe('compliant');
    });

    it('should validate complex request with multiple impressions', async () => {
      const validRequest: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          {
            id: 'imp-1',
            banner: { w: 300, h: 250 },
            bidfloor: 0.5,
            bidfloorcur: 'USD'
          },
          {
            id: 'imp-2',
            video: {
              mimes: ['video/mp4'],
              minduration: 15,
              maxduration: 30
            },
            bidfloor: 1.0
          }
        ],
        site: {
          id: 'site-123',
          domain: 'example.com',
          page: 'https://example.com/page'
        },
        device: {
          ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip: '192.168.1.1'
        },
        user: {
          id: 'user-123'
        },
        at: 2,
        tmax: 120,
        cur: ['USD']
      };

      const result = await validationEngine.validateRequest(validRequest);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.complianceLevel).toBe('compliant');
      expect(result.complianceScore).toBeGreaterThan(90);
      expect(result.validatedFields).toContain('id');
      expect(result.validatedFields).toContain('imp');
      expect(result.validatedFields).toContain('imp.0.id');
      expect(result.validatedFields).toContain('imp.1.id');
    });

    it('should handle null request gracefully', async () => {
      const result = await validationEngine.validateRequest(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('root');
      expect(result.errors[0].type).toBe('schema');
      expect(result.complianceLevel).toBe('non-compliant');
      expect(result.complianceScore).toBe(0);
    });

    it('should handle undefined request gracefully', async () => {
      const result = await validationEngine.validateRequest(undefined as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('root');
      expect(result.errors[0].type).toBe('schema');
      expect(result.complianceLevel).toBe('non-compliant');
      expect(result.complianceScore).toBe(0);
    });

    it('should provide helpful error suggestions', async () => {
      const invalidRequest = {
        imp: [
          {
            id: 'imp-1',
            banner: { w: 300, h: 250 }
          }
        ],
        at: 2
      } as any;

      const result = await validationEngine.validateRequest(invalidRequest);

      expect(result.errors[0].suggestion).toBeDefined();
      expect(result.errors[0].suggestion).toContain('Add the required field');
    });

    it('should include validation metadata', async () => {
      const validRequest: ORTBRequest = {
        id: 'test-request-123',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
        at: 2
      };

      const result = await validationEngine.validateRequest(validRequest);

      expect(result.validationId).toMatch(/^val_\d+_[a-z0-9]+$/);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.specVersion).toBe('2.6');
      expect(result.validatedFields).toBeInstanceOf(Array);
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple valid requests', async () => {
      const requests: ORTBRequest[] = [
        {
          id: 'request-1',
          imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
          at: 2
        },
        {
          id: 'request-2',
          imp: [{ id: 'imp-2', banner: { w: 728, h: 90 } }],
          at: 2
        }
      ];

      const result = await validationEngine.validateBatch(requests);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].isValid).toBe(true);
      expect(result.results[1].isValid).toBe(true);
      expect(result.summary.totalRequests).toBe(2);
      expect(result.summary.validRequests).toBe(2);
      expect(result.summary.invalidRequests).toBe(0);
      expect(result.overallComplianceScore).toBeGreaterThan(80);
      expect(result.batchId).toMatch(/^batch_\d+_[a-z0-9]+$/);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle mixed valid and invalid requests', async () => {
      const requests: ORTBRequest[] = [
        {
          id: 'request-1',
          imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
          at: 2
        },
        {
          id: '',
          imp: [{ id: 'imp-2', banner: { w: 728, h: 90 } }],
          at: 2
        }
      ];

      const result = await validationEngine.validateBatch(requests);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].isValid).toBe(true);
      expect(result.results[1].isValid).toBe(false);
      expect(result.summary.totalRequests).toBe(2);
      expect(result.summary.validRequests).toBe(1);
      expect(result.summary.invalidRequests).toBe(1);
      expect(result.summary.commonErrors).toHaveLength(1);
      expect(result.summary.commonErrors[0].code).toBe('ORTB_INVALID_REQUEST_ID');
      expect(result.summary.commonErrors[0].count).toBe(1);
      expect(result.summary.commonErrors[0].percentage).toBe(50);
    });

    it('should handle empty batch', async () => {
      const result = await validationEngine.validateBatch([]);

      expect(result.results).toHaveLength(0);
      expect(result.summary.totalRequests).toBe(0);
      expect(result.summary.validRequests).toBe(0);
      expect(result.summary.invalidRequests).toBe(0);
      expect(result.summary.commonErrors).toHaveLength(0);
      expect(result.overallComplianceScore).toBe(0);
    });

    it('should handle null batch', async () => {
      const result = await validationEngine.validateBatch(null as any);

      expect(result.results).toHaveLength(0);
      expect(result.summary.totalRequests).toBe(0);
      expect(result.overallComplianceScore).toBe(0);
    });

    it('should calculate batch statistics correctly', async () => {
      const requests: ORTBRequest[] = [
        // Valid request
        {
          id: 'request-1',
          imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
          at: 2
        },
        // Invalid request - missing ID
        {
          id: '',
          imp: [{ id: 'imp-2', banner: { w: 728, h: 90 } }],
          at: 2
        },
        // Invalid request - missing impressions
        {
          id: 'request-3',
          imp: [],
          at: 2
        }
      ];

      const result = await validationEngine.validateBatch(requests);

      expect(result.summary.totalRequests).toBe(3);
      expect(result.summary.validRequests).toBe(1);
      expect(result.summary.invalidRequests).toBe(2);
      expect(result.summary.averageComplianceScore).toBeLessThan(90);
      expect(result.summary.commonErrors).toHaveLength(2);
      
      // Check that error frequencies are calculated correctly
      const errorCodes = result.summary.commonErrors.map(e => e.code);
      expect(errorCodes).toContain('ORTB_INVALID_REQUEST_ID');
      expect(errorCodes).toContain('ORTB_MISSING_IMPRESSIONS');
    });

    it('should limit common errors to top 10', async () => {
      // Create requests with many different error types
      const requests: ORTBRequest[] = [];
      for (let i = 0; i < 15; i++) {
        requests.push({
          id: i < 5 ? '' : `request-${i}`, // First 5 have empty ID
          imp: i >= 5 && i < 10 ? [] : [{ id: `imp-${i}`, banner: { w: 300, h: 250 } }], // Next 5 have empty imp
          at: 2
        });
      }

      const result = await validationEngine.validateBatch(requests);

      expect(result.summary.commonErrors.length).toBeLessThanOrEqual(10);
    });
  });

  describe('error handling', () => {
    it('should handle validation engine errors gracefully', async () => {
      // Create a request that might cause internal errors
      const problematicRequest = {
        id: 'test',
        imp: [{ id: 'imp-1' }],
        at: 2,
        // Add circular reference to test error handling
        circular: {} as any
      };
      problematicRequest.circular.self = problematicRequest;

      const result = await validationEngine.validateRequest(problematicRequest as any);

      // Should not throw, but return error result
      expect(result.isValid).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.validationId).toBeDefined();
    });
  });

  describe('OpenRTB-specific validation integration', () => {
    it('should detect duplicate impression IDs', async () => {
      const requestWithDuplicates: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          { id: 'imp-1', banner: { w: 300, h: 250 } },
          { id: 'imp-1', banner: { w: 728, h: 90 } } // Duplicate ID
        ],
        at: 2
      };

      const result = await validationEngine.validateRequest(requestWithDuplicates);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'ORTB_DUPLICATE_IMPRESSION_ID')).toBe(true);
      expect(result.complianceLevel).toBe('non-compliant');
    });

    it('should detect impressions without ad formats', async () => {
      const requestWithoutFormats: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          { id: 'imp-1', banner: { w: 300, h: 250 } }, // Valid
          { id: 'imp-2' } // Missing ad format
        ],
        at: 2
      };

      const result = await validationEngine.validateRequest(requestWithoutFormats);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'ORTB_MISSING_AD_FORMAT')).toBe(true);
      expect(result.complianceLevel).toBe('non-compliant');
    });

    it('should warn about non-standard banner sizes', async () => {
      const requestWithNonStandardSize: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          { id: 'imp-1', banner: { w: 123, h: 456 } } // Non-standard size
        ],
        at: 2
      };

      const result = await validationEngine.validateRequest(requestWithNonStandardSize);

      expect(result.isValid).toBe(true); // Valid but with warnings
      expect(result.warnings.some(w => w.code === 'ORTB_NON_STANDARD_BANNER_SIZE')).toBe(true);
      expect(result.complianceLevel).toBe('partial');
    });

    it('should detect invalid auction types', async () => {
      const requestWithInvalidAuctionType: ORTBRequest = {
        id: 'test-request-123',
        imp: [{ id: 'imp-1', banner: { w: 300, h: 250 } }],
        at: 5 // Invalid auction type
      };

      const result = await validationEngine.validateRequest(requestWithInvalidAuctionType);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'ORTB_INVALID_AUCTION_TYPE')).toBe(true);
      expect(result.complianceLevel).toBe('non-compliant');
    });

    it('should handle complex validation with multiple issues', async () => {
      const complexRequest: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          { id: 'imp-1', banner: { w: 300, h: 250 } },
          { id: 'imp-1' }, // Duplicate ID and missing format
          { id: 'imp-3', banner: { w: 0, h: 250 }, bidfloor: -1 } // Invalid dimensions and negative floor
        ],
        site: { id: 'site-1' },
        app: { id: 'app-1' }, // Site/app conflict
        device: { devicetype: 10 }, // Invalid device type
        at: 5, // Invalid auction type
        tmax: 30 // Low timeout
      };

      const result = await validationEngine.validateRequest(complexRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
      expect(result.warnings.length).toBeGreaterThanOrEqual(2);
      expect(result.complianceLevel).toBe('non-compliant');
      expect(result.complianceScore).toBeLessThan(30);
    });
  });

  describe('error reporting integration', () => {
    it('should generate detailed validation report', async () => {
      const requestWithIssues: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          { id: 'imp-1', banner: { w: 0, h: 250 } }, // Invalid width
          { id: 'imp-1' } // Duplicate ID and missing format
        ],
        at: 5, // Invalid auction type
        tmax: 30 // Low timeout
      };

      const result = await validationEngine.validateRequest(requestWithIssues);
      const report = validationEngine.generateValidationReport(result);

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.status).toBe('failed');
      expect(report.fieldResults).toBeDefined();
      expect(report.fieldResults.length).toBeGreaterThan(0);
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.metadata).toBeDefined();
      expect(report.metadata.specVersion).toBe('2.6');
    });

    it('should generate compliance report', async () => {
      const requestWithIssues: ORTBRequest = {
        id: 'test-request-123',
        imp: [
          { id: 'imp-1', banner: { w: 300, h: 250 } },
          { id: 'imp-2' } // Missing ad format
        ],
        at: 5 // Invalid auction type
      };

      const result = await validationEngine.validateRequest(requestWithIssues);
      const complianceReport = validationEngine.generateComplianceReport(result);

      expect(complianceReport).toBeDefined();
      expect(complianceReport.overallCompliance).toBe('non-compliant');
      expect(complianceReport.categoryCompliance).toBeDefined();
      expect(complianceReport.categoryCompliance.length).toBeGreaterThan(0);
      expect(complianceReport.criticalIssues).toBeDefined();
      expect(complianceReport.recommendations).toBeDefined();
      expect(complianceReport.recommendations.length).toBeGreaterThan(0);
    });

    it('should format error messages with context', async () => {
      const requestWithError: ORTBRequest = {
        id: 'test-request-123',
        imp: [{ id: 'imp-1', banner: { w: 0, h: 250 } }], // Invalid width
        at: 2
      };

      const result = await validationEngine.validateRequest(requestWithError);
      const errorMessage = validationEngine.formatErrorMessage(result.errors[0]);

      expect(errorMessage).toContain('[ORTB_INVALID_BANNER_WIDTH]');
      expect(errorMessage).toContain('Field: imp.0.banner.w');
      expect(errorMessage).toContain('Expected: positive integer');
      expect(errorMessage).toContain('Got: 0');
    });

    it('should categorize errors correctly', async () => {
      const requestWithMultipleErrors: ORTBRequest = {
        id: '',
        imp: [
          { id: 'imp-1', banner: { w: 0, h: 250 } }, // Invalid width
          { id: 'imp-1' } // Duplicate ID and missing format
        ],
        at: 5 // Invalid auction type
      };

      const result = await validationEngine.validateRequest(requestWithMultipleErrors);
      const categories = validationEngine.categorizeErrors(result.errors);

      expect(categories.size).toBeGreaterThan(1);
      expect(categories.has('Required Fields') || categories.has('Value Validation') || categories.has('Business Logic')).toBe(true);
    });

    it('should generate actionable suggestions', async () => {
      const requestWithIssues: ORTBRequest = {
        id: '',
        imp: [
          { id: 'imp-1', banner: { w: 300, h: 250 } },
          { id: 'imp-1' } // Duplicate ID and missing format
        ],
        at: 2
      };

      const result = await validationEngine.validateRequest(requestWithIssues);
      const suggestions = validationEngine.generateSuggestions(result.errors);

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('required') || s.includes('unique') || s.includes('format'))).toBe(true);
    });
  });

  describe('compliance scoring', () => {
    it('should give perfect score for fully compliant request', async () => {
      const perfectRequest: ORTBRequest = {
        id: 'perfect-request-123',
        imp: [
          {
            id: 'imp-1',
            banner: { w: 300, h: 250 },
            bidfloor: 0.5,
            bidfloorcur: 'USD'
          }
        ],
        site: {
          id: 'site-123',
          domain: 'example.com',
          page: 'https://example.com/page'
        },
        device: {
          ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip: '192.168.1.1'
        },
        at: 2,
        tmax: 120,
        cur: ['USD']
      };

      const result = await validationEngine.validateRequest(perfectRequest);

      expect(result.complianceScore).toBeGreaterThan(95);
      expect(result.complianceLevel).toBe('compliant');
    });

    it('should give lower score for request with errors', async () => {
      const flawedRequest: ORTBRequest = {
        id: '',
        imp: [],
        at: 2
      };

      const result = await validationEngine.validateRequest(flawedRequest);

      expect(result.complianceScore).toBeLessThan(60);
      expect(result.complianceLevel).toBe('non-compliant');
    });
  });
});