import { describe, it, expect, beforeEach } from 'vitest';
import { ORTBValidationService } from '../../services/validation-service';
import { DefaultSampleService } from '../../services/sample-service';
import { ORTBExportService } from '../../services/export-service';
import { ORTBRequest } from '../../models';
import { TestDataGenerator } from './test-data-generator';

describe('Basic Integration Tests', () => {
  let validationService: ORTBValidationService;
  let sampleService: DefaultSampleService;
  let exportService: ORTBExportService;

  beforeEach(() => {
    validationService = new ORTBValidationService();
    sampleService = new DefaultSampleService();
    exportService = new ORTBExportService();
  });

  describe('Sample Generation and Validation Integration', () => {
    it('should generate valid display samples that pass validation', async () => {
      // Generate a display sample
      const displaySample = await sampleService.generateSample({
        requestType: 'display',
        includeOptionalFields: false
      });

      expect(displaySample).toBeDefined();
      expect(displaySample.id).toBeDefined();
      expect(displaySample.imp).toBeDefined();
      expect(displaySample.imp.length).toBeGreaterThan(0);
      expect(displaySample.at).toBeDefined();

      // Validate the generated sample
      const validationResult = await validationService.validateSingle(displaySample);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should generate valid video samples that pass validation', async () => {
      // Generate a video sample
      const videoSample = await sampleService.generateSample({
        requestType: 'video',
        includeOptionalFields: false
      });

      expect(videoSample).toBeDefined();
      expect(videoSample.id).toBeDefined();
      expect(videoSample.imp).toBeDefined();
      expect(videoSample.imp[0].video).toBeDefined();

      // Validate the generated sample
      const validationResult = await validationService.validateSingle(videoSample);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should handle batch sample generation and validation', async () => {
      // Generate multiple samples
      const samples = await sampleService.generateBatch([
        { requestType: 'display', includeOptionalFields: false },
        { requestType: 'video', includeOptionalFields: false }
      ]);

      expect(samples).toHaveLength(2);
      expect(samples[0].imp[0].banner).toBeDefined();
      expect(samples[1].imp[0].video).toBeDefined();

      // Validate all samples
      const batchResults = await validationService.validateBatch(samples);
      expect(batchResults.results).toHaveLength(2);
      expect(batchResults.results.every(r => r.isValid)).toBe(true);
    });
  });

  describe('IAB Compliance Testing', () => {
    it('should validate IAB compliant display sample', async () => {
      const iabSamples = TestDataGenerator.getIABCompliantSamples();
      const displaySample = iabSamples.displayBanner;

      const validationResult = await validationService.validateSingle(displaySample);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should detect validation errors in invalid samples', async () => {
      const invalidSamples = TestDataGenerator.getInvalidSamples();
      const invalidSample = invalidSamples.missingRequiredAt;

      const validationResult = await validationService.validateSingle(invalidSample as ORTBRequest);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });

    it('should handle edge cases correctly', async () => {
      const edgeCases = TestDataGenerator.getEdgeCaseSamples();
      const minimalSample = edgeCases.minimalRequired;

      const validationResult = await validationService.validateSingle(minimalSample);
      expect(validationResult.isValid).toBe(true);
    });
  });

  describe('Export Functionality Integration', () => {
    it('should export samples to JSON format', async () => {
      const sample = await sampleService.generateSample({
        requestType: 'display',
        includeOptionalFields: false
      });

      const exportResult = await exportService.exportSample(sample, 'json');
      expect(exportResult.format).toBe('json');
      expect(exportResult.data).toBeDefined();

      // Verify exported data can be parsed back
      const parsedSample = JSON.parse(exportResult.data);
      expect(parsedSample.id).toBe(sample.id);
      expect(parsedSample.at).toBe(sample.at);
    });

    it('should export validation results', async () => {
      const sample = await sampleService.generateSample({
        requestType: 'display',
        includeOptionalFields: false
      });

      const validationResult = await validationService.validateSingle(sample);
      const exportResult = await exportService.exportValidationResult(validationResult, 'json');
      
      expect(exportResult.format).toBe('json');
      expect(exportResult.data).toBeDefined();

      const parsedResult = JSON.parse(exportResult.data);
      expect(parsedResult.isValid).toBe(validationResult.isValid);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle malformed JSON gracefully', async () => {
      const malformedJson = '{"id": "test", "imp": [{"id": "1"'; // Incomplete JSON

      try {
        const result = await validationService.validateJsonString(malformedJson);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.code === 'INVALID_JSON')).toBe(true);
      } catch (error) {
        // Should not throw, should return validation result
        expect.fail('Should handle malformed JSON gracefully without throwing');
      }
    });

    it('should handle empty requests', async () => {
      const emptyRequest = {} as ORTBRequest;

      const validationResult = await validationService.validateSingle(emptyRequest);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });

    it('should handle null/undefined inputs', async () => {
      try {
        const result = await validationService.validateSingle(null as any);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.code === 'INVALID_INPUT')).toBe(true);
      } catch (error) {
        // Should handle gracefully
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle moderate batch sizes efficiently', async () => {
      const batchSize = 10;
      const samples = await sampleService.generateBatch(
        Array(batchSize).fill(null).map(() => ({
          requestType: 'display' as const,
          includeOptionalFields: false
        }))
      );

      expect(samples).toHaveLength(batchSize);

      const startTime = Date.now();
      const batchResults = await validationService.validateBatch(samples);
      const endTime = Date.now();

      expect(batchResults.results).toHaveLength(batchSize);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should maintain data integrity across operations', async () => {
      const originalSample = await sampleService.generateSample({
        requestType: 'display',
        includeOptionalFields: true
      });

      // Validate
      const validationResult = await validationService.validateSingle(originalSample);
      expect(validationResult.isValid).toBe(true);

      // Export
      const exportResult = await exportService.exportSample(originalSample, 'json');
      const exportedSample = JSON.parse(exportResult.data);

      // Verify data integrity
      expect(exportedSample).toEqual(originalSample);

      // Re-validate exported sample
      const revalidationResult = await validationService.validateSingle(exportedSample);
      expect(revalidationResult.isValid).toBe(true);
    });
  });

  describe('Cross-Feature Integration', () => {
    it('should support end-to-end workflow: generate -> validate -> export', async () => {
      // Step 1: Generate sample
      const sample = await sampleService.generateSample({
        requestType: 'video',
        includeOptionalFields: true
      });

      expect(sample.imp[0].video).toBeDefined();

      // Step 2: Validate sample
      const validationResult = await validationService.validateSingle(sample);
      expect(validationResult.isValid).toBe(true);

      // Step 3: Export both sample and validation result
      const sampleExport = await exportService.exportSample(sample, 'json');
      const validationExport = await exportService.exportValidationResult(validationResult, 'json');

      expect(sampleExport.data).toBeDefined();
      expect(validationExport.data).toBeDefined();

      // Verify exported data integrity
      const exportedSample = JSON.parse(sampleExport.data);
      const exportedValidation = JSON.parse(validationExport.data);

      expect(exportedSample.id).toBe(sample.id);
      expect(exportedValidation.isValid).toBe(true);
    });

    it('should handle template-based generation workflow', async () => {
      // Get available templates
      const templates = await sampleService.getAvailableTemplates();
      expect(templates.length).toBeGreaterThan(0);

      // Use first template
      const template = templates[0];
      const sample = await sampleService.generateFromTemplate({
        templateId: template.id,
        customFields: {
          site: {
            domain: 'custom-test.com'
          }
        }
      });

      expect(sample).toBeDefined();
      expect(sample.site?.domain).toBe('custom-test.com');

      // Validate template-generated sample
      const validationResult = await validationService.validateSingle(sample);
      expect(validationResult.isValid).toBe(true);
    });
  });
});