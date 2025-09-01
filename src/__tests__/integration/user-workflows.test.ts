import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ORTBValidationService } from '../../services/validation-service';
import { ORTBSampleService } from '../../services/sample-service';
import { ORTBExportService } from '../../services/export-service';
import { ORTBSharingService } from '../../services/sharing-service';
import { ORTBReportingService } from '../../services/reporting-service';
import { ORTBRequest, ValidationResult, SampleConfig } from '../../models';

describe('User Workflows Integration Tests', () => {
  let validationService: ORTBValidationService;
  let sampleService: ORTBSampleService;
  let exportService: ORTBExportService;
  let sharingService: ORTBSharingService;
  let reportingService: ORTBReportingService;

  beforeEach(() => {
    validationService = new ORTBValidationService();
    sampleService = new ORTBSampleService();
    exportService = new ORTBExportService();
    sharingService = new ORTBSharingService();
    reportingService = new ORTBReportingService();
  });

  afterEach(() => {
    // Clean up any test artifacts
  });

  describe('Complete Validation Workflow', () => {
    it('should handle complete validation workflow from input to report', async () => {
      // Test data: Valid ORTB request
      const validRequest: ORTBRequest = {
        id: 'test-request-001',
        imp: [{
          id: '1',
          banner: {
            w: 300,
            h: 250,
            format: [{ w: 300, h: 250 }]
          },
          bidfloor: 0.5,
          bidfloorcur: 'USD'
        }],
        site: {
          id: 'test-site',
          domain: 'example.com',
          page: 'https://example.com/page'
        },
        device: {
          ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip: '192.168.1.1'
        },
        at: 1,
        tmax: 120
      };

      // Step 1: Validate the request
      const validationResult = await validationService.validateRequest(validRequest);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Step 2: Generate validation report
      const report = await reportingService.generateValidationReport([validationResult]);
      expect(report.summary.totalRequests).toBe(1);
      expect(report.summary.validRequests).toBe(1);

      // Step 3: Export validation results
      const exportedReport = await exportService.exportValidationReport(report, 'json');
      expect(exportedReport.format).toBe('json');
      expect(exportedReport.data).toBeDefined();

      // Step 4: Create shareable link
      const shareableLink = await sharingService.createShareableValidationResult(validationResult);
      expect(shareableLink.url).toMatch(/^https?:\/\//);
      expect(shareableLink.expiresAt).toBeInstanceOf(Date);
    });

    it('should handle validation workflow with errors and provide recovery suggestions', async () => {
      // Test data: Invalid ORTB request (missing required fields)
      const invalidRequest: Partial<ORTBRequest> = {
        id: 'test-request-002',
        imp: [{
          id: '1',
          banner: {
            w: 300,
            h: 250
          }
          // Missing bidfloor and other required fields
        }]
        // Missing required fields like 'at'
      };

      // Step 1: Validate the invalid request
      const validationResult = await validationService.validateRequest(invalidRequest as ORTBRequest);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);

      // Step 2: Verify error details include suggestions
      const missingAtError = validationResult.errors.find(e => e.field === 'at');
      expect(missingAtError).toBeDefined();
      expect(missingAtError?.suggestion).toContain('auction type');

      // Step 3: Generate error report with recommendations
      const report = await reportingService.generateValidationReport([validationResult]);
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);

      // Step 4: Export error report for sharing
      const exportedReport = await exportService.exportValidationReport(report, 'json');
      expect(exportedReport.data).toContain('errors');
    });
  });

  describe('Sample Generation and Validation Workflow', () => {
    it('should generate sample, validate it, and export for sharing', async () => {
      // Step 1: Generate a display ad sample
      const sampleConfig: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: true,
        customFields: {
          site: {
            domain: 'publisher-example.com'
          }
        }
      };

      const generatedSample = await sampleService.generateSample(sampleConfig);
      expect(generatedSample.id).toBeDefined();
      expect(generatedSample.imp).toBeDefined();
      expect(generatedSample.imp.length).toBeGreaterThan(0);

      // Step 2: Validate the generated sample
      const validationResult = await validationService.validateRequest(generatedSample);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Step 3: Export sample in multiple formats
      const jsonExport = await exportService.exportSample(generatedSample, 'json');
      expect(jsonExport.format).toBe('json');
      expect(JSON.parse(jsonExport.data)).toEqual(generatedSample);

      const csvExport = await exportService.exportSample(generatedSample, 'csv');
      expect(csvExport.format).toBe('csv');
      expect(csvExport.data).toContain('field,value');

      // Step 4: Create shareable sample with documentation
      const shareableSample = await sharingService.createShareableSample(generatedSample, {
        includeDocumentation: true,
        publisherFriendly: true
      });
      expect(shareableSample.url).toBeDefined();
      expect(shareableSample.documentation).toBeDefined();
    });

    it('should handle batch sample generation and validation', async () => {
      // Step 1: Generate multiple samples
      const configs: SampleConfig[] = [
        { requestType: 'display', includeOptionalFields: false },
        { requestType: 'video', includeOptionalFields: true },
        { requestType: 'native', includeOptionalFields: false }
      ];

      const samples = await sampleService.generateBatch(configs);
      expect(samples).toHaveLength(3);

      // Step 2: Batch validate all samples
      const validationResults = await validationService.validateBatch(samples);
      expect(validationResults.results).toHaveLength(3);
      expect(validationResults.results.every(r => r.isValid)).toBe(true);

      // Step 3: Generate batch report
      const batchReport = await reportingService.generateBatchReport(validationResults);
      expect(batchReport.summary.totalRequests).toBe(3);
      expect(batchReport.summary.validRequests).toBe(3);

      // Step 4: Export batch results
      const batchExport = await exportService.exportBatchSamples(samples, 'json');
      expect(batchExport.format).toBe('json');
      expect(JSON.parse(batchExport.data)).toHaveLength(3);
    });
  });

  describe('Cross-Feature Integration Workflows', () => {
    it('should support validation-to-sample-generation workflow', async () => {
      // Step 1: Start with a partially valid request
      const partialRequest: Partial<ORTBRequest> = {
        id: 'partial-request',
        imp: [{
          id: '1',
          banner: { w: 728, h: 90 }
        }],
        site: {
          domain: 'test.com'
        }
      };

      // Step 2: Validate and identify missing fields
      const validationResult = await validationService.validateRequest(partialRequest as ORTBRequest);
      expect(validationResult.isValid).toBe(false);

      // Step 3: Use validation errors to generate a complete sample
      const missingFields = validationResult.errors
        .filter(e => e.code === 'REQUIRED_FIELD_MISSING')
        .map(e => e.field);

      const sampleConfig: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: false,
        baseRequest: partialRequest
      };

      const completeSample = await sampleService.generateSample(sampleConfig);
      
      // Step 4: Validate the completed sample
      const finalValidation = await validationService.validateRequest(completeSample);
      expect(finalValidation.isValid).toBe(true);

      // Step 5: Export comparison report
      const comparisonReport = await reportingService.generateComparisonReport(
        partialRequest as ORTBRequest,
        completeSample
      );
      expect(comparisonReport.differences).toBeDefined();
      expect(comparisonReport.improvements).toBeDefined();
    });

    it('should handle template-based workflow with customization', async () => {
      // Step 1: Get available templates
      const templates = await sampleService.getAvailableTemplates();
      expect(templates.length).toBeGreaterThan(0);

      const displayTemplate = templates.find(t => t.requestType === 'display');
      expect(displayTemplate).toBeDefined();

      // Step 2: Customize template
      const customConfig: SampleConfig = {
        templateId: displayTemplate!.id,
        customFields: {
          imp: [{
            tagid: 'custom-tag-123',
            bidfloor: 1.5
          }]
        }
      };

      const customizedSample = await sampleService.generateFromTemplate(customConfig);
      expect(customizedSample.imp[0].tagid).toBe('custom-tag-123');
      expect(customizedSample.imp[0].bidfloor).toBe(1.5);

      // Step 3: Validate customized sample
      const validation = await validationService.validateRequest(customizedSample);
      expect(validation.isValid).toBe(true);

      // Step 4: Export with template attribution
      const exportWithMeta = await exportService.exportSampleWithMetadata(customizedSample, {
        templateUsed: displayTemplate!.id,
        customizations: Object.keys(customConfig.customFields || {})
      });
      expect(exportWithMeta.metadata.templateUsed).toBe(displayTemplate!.id);
    });
  });

  describe('Error Recovery and Resilience Workflows', () => {
    it('should handle malformed JSON gracefully', async () => {
      const malformedJson = '{"id": "test", "imp": [{"id": "1", "banner": {w: 300}}'; // Missing closing braces

      try {
        const result = await validationService.validateJsonString(malformedJson);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.code === 'INVALID_JSON')).toBe(true);
      } catch (error) {
        // Should not throw, should return validation result with errors
        expect.fail('Should handle malformed JSON gracefully');
      }
    });

    it('should handle network failures in sharing service', async () => {
      const sampleRequest: ORTBRequest = {
        id: 'test-network-failure',
        imp: [{ id: '1', banner: { w: 300, h: 250 } }],
        at: 1
      };

      // Mock network failure
      const originalFetch = global.fetch;
      global.fetch = () => Promise.reject(new Error('Network error'));

      try {
        const result = await sharingService.createShareableSample(sampleRequest);
        expect(result.error).toBeDefined();
        expect(result.fallbackOptions).toBeDefined();
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should provide fallback export options when primary export fails', async () => {
      const sampleRequest: ORTBRequest = {
        id: 'test-export-fallback',
        imp: [{ id: '1', banner: { w: 300, h: 250 } }],
        at: 1
      };

      // Test with unsupported format
      const result = await exportService.exportSample(sampleRequest, 'unsupported-format' as any);
      expect(result.format).toBe('json'); // Should fallback to JSON
      expect(result.warnings).toContain('Unsupported format, falling back to JSON');
    });
  });
});