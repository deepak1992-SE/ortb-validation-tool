/**
 * Validation Service Integration Tests
 * Tests the service layer orchestration and batch processing capabilities
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ORTBValidationService, ValidationServiceConfig, ValidationOptions, BatchValidationOptions } from '../validation-service';
import { ORTBRequest, ValidationResult, BatchValidationResult } from '../../models';

// Mock the validation engine
const mockValidationEngine = {
  validateRequest: vi.fn(),
  validateBatch: vi.fn(),
  generateValidationReport: vi.fn(),
  generateComplianceReport: vi.fn()
};

vi.mock('../../validation/validation-engine', () => ({
  ORTBValidationEngine: vi.fn().mockImplementation(() => mockValidationEngine)
}));

describe('ORTBValidationService', () => {
  let validationService: ORTBValidationService;

  const createValidRequest = (): ORTBRequest => ({
    id: 'test-request-1',
    imp: [{
      id: 'imp-1',
      banner: {
        w: 300,
        h: 250
      }
    }],
    site: {
      id: 'site-1',
      domain: 'example.com'
    },
    device: {
      ua: 'Mozilla/5.0...',
      ip: '192.168.1.1'
    },
    at: 1
  });

  const createValidationResult = (isValid: boolean = true): ValidationResult => ({
    isValid,
    errors: isValid ? [] : [{
      field: 'id',
      message: 'Request ID is required',
      severity: 'error',
      code: 'ORTB_REQUIRED_FIELD_MISSING',
      type: 'required-field',
      actualValue: undefined,
      expectedValue: 'string'
    }],
    warnings: [],
    complianceLevel: isValid ? 'compliant' : 'non-compliant',
    validatedFields: ['id', 'imp', 'site', 'device', 'at'],
    complianceScore: isValid ? 100 : 25,
    timestamp: new Date(),
    validationId: 'val_123',
    specVersion: '2.6'
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create service with default config
    validationService = new ORTBValidationService();
    
    // Setup default mock implementations
    mockValidationEngine.validateRequest.mockResolvedValue(createValidationResult(true));
    mockValidationEngine.validateBatch.mockResolvedValue({
      results: [createValidationResult(true)],
      summary: {
        totalRequests: 1,
        validRequests: 1,
        invalidRequests: 0,
        warningRequests: 0,
        commonErrors: [],
        commonWarnings: [],
        averageComplianceScore: 100
      },
      overallComplianceScore: 100,
      timestamp: new Date(),
      batchId: 'batch_123'
    });
    
    mockValidationEngine.generateValidationReport.mockResolvedValue({
      summary: {
        totalFields: 5,
        validFields: 5,
        errorFields: 0,
        warningFields: 0,
        missingRequiredFields: 0,
        status: 'passed'
      },
      fieldResults: [],
      complianceScore: 100,
      recommendations: [],
      timestamp: new Date(),
      metadata: {
        generatedAt: new Date(),
        toolVersion: '1.0.0',
        specVersion: '2.6',
        reportVersion: '1.0'
      }
    });
    
    mockValidationEngine.generateComplianceReport.mockResolvedValue({
      overallCompliance: 'compliant',
      complianceScore: 100,
      categoryCompliance: [],
      criticalIssues: [],
      recommendations: [],
      timestamp: new Date()
    });
  });

  describe('constructor', () => {
    it('should create service with default configuration', () => {
      const service = new ORTBValidationService();
      expect(service).toBeInstanceOf(ORTBValidationService);
    });

    it('should create service with custom configuration', () => {
      const config: ValidationServiceConfig = {
        maxBatchSize: 50,
        validationTimeout: 10000,
        continueOnError: false,
        includeDetailedReports: true
      };
      
      const service = new ORTBValidationService(config);
      expect(service).toBeInstanceOf(ORTBValidationService);
    });
  });

  describe('validateSingle', () => {
    it('should validate a single ORTB request successfully', async () => {
      const request = createValidRequest();
      const expectedResult = createValidationResult(true);
      
      mockValidationEngine.validateRequest.mockResolvedValue(expectedResult);
      
      const result = await validationService.validateSingle(request);
      
      expect(mockValidationEngine.validateRequest).toHaveBeenCalledWith(request);
      expect(result).toEqual(expect.objectContaining({
        isValid: true,
        errors: [],
        warnings: [],
        complianceLevel: 'compliant',
        complianceScore: 100
      }));
      expect(result).toHaveProperty('processingTime');
    });

    it('should handle validation errors gracefully', async () => {
      const request = createValidRequest();
      const error = new Error('Validation engine error');
      
      mockValidationEngine.validateRequest.mockRejectedValue(error);
      
      const result = await validationService.validateSingle(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('VALIDATION_SERVICE_ERROR');
      expect(result.errors[0].message).toContain('Validation service error');
    });

    it('should apply custom timeout option', async () => {
      const request = createValidRequest();
      const options: ValidationOptions = { timeout: 1000 };
      
      // Mock a slow validation that exceeds timeout
      mockValidationEngine.validateRequest.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );
      
      const result = await validationService.validateSingle(request, options);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('timeout');
    });

    it('should include processing time in result metadata', async () => {
      const request = createValidRequest();
      
      const result = await validationService.validateSingle(request);
      
      expect(result).toHaveProperty('processingTime');
      expect(typeof (result as any).processingTime).toBe('number');
      expect((result as any).processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple requests successfully', async () => {
      const requests = [createValidRequest(), createValidRequest()];
      const expectedBatchResult: BatchValidationResult = {
        results: [createValidationResult(true), createValidationResult(true)],
        summary: {
          totalRequests: 2,
          validRequests: 2,
          invalidRequests: 0,
          warningRequests: 0,
          commonErrors: [],
          commonWarnings: [],
          averageComplianceScore: 100
        },
        overallComplianceScore: 100,
        timestamp: new Date(),
        batchId: 'batch_123'
      };
      
      mockValidationEngine.validateBatch.mockResolvedValue(expectedBatchResult);
      
      const result = await validationService.validateBatch(requests);
      
      expect(result.results).toHaveLength(2);
      expect(result.summary.totalRequests).toBe(2);
      expect(result.summary.validRequests).toBe(2);
      expect(result).toHaveProperty('processingStats');
    });

    it('should handle empty request array', async () => {
      const result = await validationService.validateBatch([]);
      
      expect(result.results).toHaveLength(0);
      expect(result.summary.totalRequests).toBe(0);
      expect(result.overallComplianceScore).toBe(0);
    });

    it('should enforce batch size limits', async () => {
      const service = new ORTBValidationService({ maxBatchSize: 2 });
      const requests = [createValidRequest(), createValidRequest(), createValidRequest()];
      
      await expect(service.validateBatch(requests)).rejects.toThrow('exceeds maximum allowed size');
    });

    it('should process requests with concurrency control', async () => {
      const requests = Array(5).fill(null).map(() => createValidRequest());
      const options: BatchValidationOptions = { concurrency: 2 };
      
      // Mock individual validation calls
      mockValidationEngine.validateRequest = vi.fn()
        .mockResolvedValue(createValidationResult(true));
      
      await validationService.validateBatch(requests, options);
      
      // Should have called validateRequest for each request
      expect(mockValidationEngine.validateRequest).toHaveBeenCalledTimes(5);
    });

    it('should report progress during batch processing', async () => {
      const requests = Array(3).fill(null).map(() => createValidRequest());
      const progressCallback = vi.fn();
      const options: BatchValidationOptions = { 
        onProgress: progressCallback,
        concurrency: 1 
      };
      
      await validationService.validateBatch(requests, options);
      
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(expect.any(Number), 3);
    });

    it('should continue processing on individual errors when continueOnError is true', async () => {
      const requests = [createValidRequest(), createValidRequest()];
      
      // Mock first request to fail, second to succeed
      mockValidationEngine.validateRequest
        .mockRejectedValueOnce(new Error('First request failed'))
        .mockResolvedValueOnce(createValidationResult(true));
      
      const result = await validationService.validateBatch(requests);
      
      expect(result.results).toHaveLength(2);
      expect(result.results[0].isValid).toBe(false);
      expect(result.results[1].isValid).toBe(true);
      expect((result as any).processingStats.processingErrors).toHaveLength(1);
      expect((result as any).processingStats.failedProcessing).toBe(1);
    });

    it('should stop processing on first error when failFast is true', async () => {
      const requests = [createValidRequest(), createValidRequest()];
      const options: BatchValidationOptions = { failFast: true };
      
      // Mock first request to fail
      mockValidationEngine.validateRequest
        .mockRejectedValueOnce(new Error('First request failed'));
      
      const result = await validationService.validateBatch(requests, options);
      
      // Should have processing stats indicating failure
      expect((result as any).processingStats.processingErrors).toHaveLength(1);
      expect((result as any).processingStats.failedProcessing).toBeGreaterThan(0);
    });

    it('should include processing statistics in batch results', async () => {
      const requests = [createValidRequest()];
      
      const result = await validationService.validateBatch(requests);
      
      expect(result).toHaveProperty('processingStats');
      const stats = (result as any).processingStats;
      expect(stats).toHaveProperty('totalProcessingTime');
      expect(stats).toHaveProperty('averageProcessingTime');
      expect(stats).toHaveProperty('successfullyProcessed');
      expect(stats).toHaveProperty('failedProcessing');
      expect(stats).toHaveProperty('processingErrors');
    });
  });

  describe('generateReport', () => {
    it('should generate validation report for single result', async () => {
      const result = createValidationResult(true);
      const expectedReport = {
        summary: {
          totalFields: 5,
          validFields: 5,
          errorFields: 0,
          warningFields: 0,
          missingRequiredFields: 0,
          status: 'passed'
        },
        fieldResults: [],
        complianceScore: 100,
        recommendations: [],
        timestamp: new Date(),
        metadata: {
          generatedAt: new Date(),
          toolVersion: '1.0.0',
          specVersion: '2.6',
          reportVersion: '1.0'
        }
      };
      
      mockValidationEngine.generateValidationReport.mockResolvedValue(expectedReport);
      
      const report = await validationService.generateReport(result);
      
      // The service now uses reporting service internally, so we just verify the report structure
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('fieldResults');
      expect(report).toHaveProperty('complianceScore');
      expect(report).toHaveProperty('recommendations');
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate compliance report for single result', async () => {
      const result = createValidationResult(true);
      const expectedReport = {
        overallCompliance: 'compliant',
        complianceScore: 100,
        categoryCompliance: [],
        criticalIssues: [],
        recommendations: [],
        timestamp: new Date()
      };
      
      mockValidationEngine.generateComplianceReport.mockResolvedValue(expectedReport);
      
      const report = await validationService.generateComplianceReport(result);
      
      // The service now uses reporting service internally, so we just verify the report structure
      expect(report).toHaveProperty('overallCompliance');
      expect(report).toHaveProperty('complianceScore');
      expect(report).toHaveProperty('categoryCompliance');
      expect(report).toHaveProperty('criticalIssues');
    });
  });

  describe('generateBatchReport', () => {
    it('should generate comprehensive batch report', async () => {
      const batchResult: BatchValidationResult = {
        results: [createValidationResult(true)],
        summary: {
          totalRequests: 1,
          validRequests: 1,
          invalidRequests: 0,
          warningRequests: 0,
          commonErrors: [],
          commonWarnings: [],
          averageComplianceScore: 100
        },
        overallComplianceScore: 100,
        timestamp: new Date(),
        batchId: 'batch_123'
      };
      
      const report = await validationService.generateBatchReport(batchResult);
      
      expect(report).toHaveProperty('batchResult');
      expect(report).toHaveProperty('individualReports');
      expect(report).toHaveProperty('complianceReport');
      expect(report).toHaveProperty('processingStats');
      expect(report).toHaveProperty('timestamp');
      
      expect(report.batchResult).toEqual(batchResult);
      expect(report.complianceReport.overallCompliance).toBe('compliant');
    });

    it('should generate aggregated compliance report with critical issues', async () => {
      const batchResult: BatchValidationResult = {
        results: [
          createValidationResult(false),
          createValidationResult(false)
        ],
        summary: {
          totalRequests: 2,
          validRequests: 0,
          invalidRequests: 2,
          warningRequests: 0,
          commonErrors: [{
            code: 'ORTB_REQUIRED_FIELD_MISSING',
            message: 'Request ID is required',
            count: 2,
            percentage: 100
          }],
          commonWarnings: [],
          averageComplianceScore: 25
        },
        overallComplianceScore: 25,
        timestamp: new Date(),
        batchId: 'batch_123'
      };
      
      const report = await validationService.generateBatchReport(batchResult);
      
      expect(report.complianceReport.overallCompliance).toBe('non-compliant');
      expect(report.complianceReport.recommendations).toHaveLength(2); // High failure rate + common error
      expect(report.complianceReport.recommendations[0].priority).toBe('high');
    });

    it('should handle batch report generation with detailed reports disabled', async () => {
      const service = new ORTBValidationService({ includeDetailedReports: false });
      const batchResult: BatchValidationResult = {
        results: [createValidationResult(true)],
        summary: {
          totalRequests: 1,
          validRequests: 1,
          invalidRequests: 0,
          warningRequests: 0,
          commonErrors: [],
          commonWarnings: [],
          averageComplianceScore: 100
        },
        overallComplianceScore: 100,
        timestamp: new Date(),
        batchId: 'batch_123'
      };
      
      const report = await validationService.generateBatchReport(batchResult);
      
      expect(report.individualReports).toHaveLength(0);
      expect(report.complianceReport).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle validation engine initialization errors', async () => {
      // This test would require mocking the constructor differently
      // For now, we'll test that the service handles runtime errors from the engine
      const request = createValidRequest();
      
      mockValidationEngine.validateRequest.mockRejectedValue(new Error('Engine initialization failed'));
      
      const result = await validationService.validateSingle(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Engine initialization failed');
    });

    it('should handle timeout errors gracefully', async () => {
      const request = createValidRequest();
      const options: ValidationOptions = { timeout: 100 };
      
      // Mock validation to take longer than timeout
      mockValidationEngine.validateRequest.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(createValidationResult(true)), 200))
      );
      
      const result = await validationService.validateSingle(request, options);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('timeout');
    });

    it('should handle batch processing errors with partial results', async () => {
      const requests = [createValidRequest(), createValidRequest()];
      
      // Mock individual validations to fail
      mockValidationEngine.validateRequest
        .mockRejectedValue(new Error('Validation failed'));
      
      const result = await validationService.validateBatch(requests);
      
      expect(result.summary.totalRequests).toBe(2);
      expect(result.summary.invalidRequests).toBe(2);
      expect((result as any).processingStats.processingErrors).toHaveLength(2);
    });
  });

  describe('integration scenarios', () => {
    it('should handle mixed valid and invalid requests in batch', async () => {
      const requests = [createValidRequest(), createValidRequest()];
      
      // Mock mixed results
      mockValidationEngine.validateRequest
        .mockResolvedValueOnce(createValidationResult(true))
        .mockResolvedValueOnce(createValidationResult(false));
      
      const result = await validationService.validateBatch(requests);
      
      expect(result.results).toHaveLength(2);
      expect(result.results[0].isValid).toBe(true);
      expect(result.results[1].isValid).toBe(false);
      expect((result as any).processingStats.successfullyProcessed).toBe(1);
    });

    it('should maintain request order in batch processing', async () => {
      const requests = Array(5).fill(null).map((_, i) => ({
        ...createValidRequest(),
        id: `request-${i}`
      }));
      
      // Mock validation to return results with request IDs
      mockValidationEngine.validateRequest.mockImplementation((request: ORTBRequest) => 
        Promise.resolve({
          ...createValidationResult(true),
          validationId: `val-${request.id}`
        })
      );
      
      const result = await validationService.validateBatch(requests);
      
      expect(result.results).toHaveLength(5);
      result.results.forEach((validationResult, index) => {
        expect(validationResult.validationId).toBe(`val-request-${index}`);
      });
    });
  });
});