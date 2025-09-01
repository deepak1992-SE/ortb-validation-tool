/**
 * Export Service Tests
 * Comprehensive tests for validation result and sample request export functionality
 */

import { ORTBExportService, ExportOptions, AnonymizationConfig } from '../export-service';
import { ValidationResult, ValidationReport, BatchValidationResult, ORTBRequest } from '../../models';

describe('ORTBExportService', () => {
  let exportService: ORTBExportService;
  let mockValidationResult: ValidationResult;
  let mockValidationReport: ValidationReport;
  let mockBatchResult: BatchValidationResult;
  let mockORTBRequest: ORTBRequest;

  beforeEach(() => {
    exportService = new ORTBExportService();

    // Mock validation result
    mockValidationResult = {
      isValid: false,
      errors: [
        {
          field: 'imp.0.banner.w',
          message: 'Width is required for banner impressions',
          severity: 'error',
          code: 'REQUIRED_FIELD_MISSING',
          type: 'required-field',
          actualValue: undefined,
          expectedValue: 'positive integer'
        }
      ],
      warnings: [
        {
          field: 'imp.0.banner.h',
          message: 'Height should be specified for better targeting',
          code: 'RECOMMENDED_FIELD_MISSING',
          actualValue: undefined,
          recommendedValue: 'positive integer'
        }
      ],
      complianceLevel: 'non-compliant',
      validatedFields: ['id', 'imp.0.id', 'imp.0.banner'],
      complianceScore: 65,
      timestamp: new Date('2024-01-01T00:00:00Z'),
      validationId: 'val_123',
      specVersion: '2.6'
    };

    // Mock validation report
    mockValidationReport = {
      summary: {
        totalFields: 10,
        validFields: 7,
        errorFields: 1,
        warningFields: 1,
        missingRequiredFields: 1,
        status: 'failed'
      },
      fieldResults: [
        {
          fieldPath: 'imp.0.banner.w',
          isValid: false,
          errors: [mockValidationResult.errors[0]],
          warnings: [],
          isRequired: true,
          isPresent: false
        }
      ],
      complianceScore: 65,
      recommendations: ['Add missing required fields', 'Consider addressing warnings'],
      timestamp: new Date('2024-01-01T00:00:00Z'),
      metadata: {
        generatedAt: new Date('2024-01-01T00:00:00Z'),
        toolVersion: '1.0.0',
        specVersion: '2.6',
        reportVersion: '1.0'
      }
    };

    // Mock batch result
    mockBatchResult = {
      results: [mockValidationResult],
      summary: {
        totalRequests: 1,
        validRequests: 0,
        invalidRequests: 1,
        warningRequests: 0,
        commonErrors: [
          {
            code: 'REQUIRED_FIELD_MISSING',
            message: 'Width is required for banner impressions',
            count: 1,
            percentage: 100
          }
        ],
        commonWarnings: [],
        averageComplianceScore: 65
      },
      overallComplianceScore: 65,
      timestamp: new Date('2024-01-01T00:00:00Z'),
      batchId: 'batch_123'
    };

    // Mock ORTB request
    mockORTBRequest = {
      id: 'test-request-123',
      imp: [
        {
          id: '1',
          banner: {
            w: 300,
            h: 250,
            format: [{ w: 300, h: 250 }]
          },
          bidfloor: 0.5,
          bidfloorcur: 'USD'
        }
      ],
      site: {
        id: 'site-123',
        domain: 'example.com',
        page: 'https://example.com/page',
        cat: ['IAB1']
      },
      device: {
        ua: 'Mozilla/5.0...',
        ip: '192.168.1.1',
        devicetype: 2,
        make: 'Apple',
        model: 'iPhone'
      },
      user: {
        id: 'user-123',
        buyeruid: 'buyer-456'
      },
      at: 1,
      tmax: 100,
      cur: ['USD']
    };
  });

  describe('exportValidationResult', () => {
    it('should export validation result as JSON', async () => {
      const options: ExportOptions = { format: 'json' };
      const result = await exportService.exportValidationResult(mockValidationResult, options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toMatch(/validation-result_\d{4}-\d{2}-\d{2}\.json/);
      expect(result.metadata.format).toBe('json');
      expect(result.metadata.recordCount).toBe(1);

      const exportedData = JSON.parse(result.data);
      expect(exportedData.isValid).toBe(false);
      expect(exportedData.errors).toHaveLength(1);
      expect(exportedData.complianceScore).toBe(65);
    });

    it('should export validation result as CSV', async () => {
      const options: ExportOptions = { format: 'csv' };
      const result = await exportService.exportValidationResult(mockValidationResult, options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toMatch(/validation-result_\d{4}-\d{2}-\d{2}\.csv/);

      const lines = result.data.split('\n');
      expect(lines[0]).toBe('Field,Value');
      expect(lines.some(line => line.includes('isValid,false'))).toBe(true);
      expect(lines.some(line => line.includes('complianceScore,65'))).toBe(true);
    });

    it('should export validation result as HTML', async () => {
      const options: ExportOptions = { format: 'html' };
      const result = await exportService.exportValidationResult(mockValidationResult, options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/html');
      expect(result.data).toContain('<!DOCTYPE html>');
      expect(result.data).toContain('ORTB Validation Export');
      expect(result.data).toContain('isValid');
      expect(result.data).toContain('complianceScore');
    });

    it('should export validation result as plain text', async () => {
      const options: ExportOptions = { format: 'txt' };
      const result = await exportService.exportValidationResult(mockValidationResult, options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/plain');
      expect(result.data).toContain('isValid: false');
      expect(result.data).toContain('complianceScore: 65');
      expect(result.data).toContain('errors:');
    });

    it('should anonymize sensitive data when requested', async () => {
      const sensitiveResult = {
        ...mockValidationResult,
        user: { id: 'sensitive-user-123', buyeruid: 'sensitive-buyer-456' },
        device: { ip: '192.168.1.100', ifa: 'device-id-123' }
      };

      const options: ExportOptions = { format: 'json', anonymize: true };
      const result = await exportService.exportValidationResult(sensitiveResult, options);

      expect(result.success).toBe(true);
      expect(result.metadata.anonymized).toBe(true);

      const exportedData = JSON.parse(result.data);
      expect(exportedData.user?.id).not.toBe('sensitive-user-123');
      expect(exportedData.device?.ip).not.toBe('192.168.1.100');
    });

    it('should apply field filtering when specified', async () => {
      const options: ExportOptions = {
        format: 'json',
        fieldFilter: {
          include: ['isValid', 'complianceScore', 'errors']
        }
      };
      const result = await exportService.exportValidationResult(mockValidationResult, options);

      expect(result.success).toBe(true);
      const exportedData = JSON.parse(result.data);
      expect(exportedData.isValid).toBeDefined();
      expect(exportedData.complianceScore).toBeDefined();
      expect(exportedData.errors).toBeDefined();
      expect(exportedData.warnings).toBeUndefined();
      expect(exportedData.validatedFields).toBeUndefined();
    });

    it('should use custom filename when provided', async () => {
      const options: ExportOptions = { format: 'json', filename: 'custom-validation-result' };
      const result = await exportService.exportValidationResult(mockValidationResult, options);

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/custom-validation-result_\d{4}-\d{2}-\d{2}\.json/);
    });

    it('should handle export errors gracefully', async () => {
      const invalidOptions: ExportOptions = { format: 'invalid' as any };
      const result = await exportService.exportValidationResult(mockValidationResult, invalidOptions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported export format');
      expect(result.data).toBe('');
    });
  });

  describe('exportValidationReport', () => {
    it('should export validation report as JSON', async () => {
      const options: ExportOptions = { format: 'json' };
      const result = await exportService.exportValidationReport(mockValidationReport, options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toMatch(/validation-report_\d{4}-\d{2}-\d{2}\.json/);

      const exportedData = JSON.parse(result.data);
      expect(exportedData.summary).toBeDefined();
      expect(exportedData.fieldResults).toBeDefined();
      expect(exportedData.complianceScore).toBe(65);
    });

    it('should export validation report as CSV', async () => {
      const options: ExportOptions = { format: 'csv' };
      const result = await exportService.exportValidationReport(mockValidationReport, options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/csv');
      expect(result.data).toContain('Field,Value');
      expect(result.data).toContain('summary');
      expect(result.data).toContain('complianceScore');
    });
  });

  describe('exportBatchResults', () => {
    it('should export batch results as JSON', async () => {
      const options: ExportOptions = { format: 'json' };
      const result = await exportService.exportBatchResults(mockBatchResult, options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toMatch(/batch-validation-results_\d{4}-\d{2}-\d{2}\.json/);
      expect(result.metadata.recordCount).toBe(1);

      const exportedData = JSON.parse(result.data);
      expect(exportedData.results).toHaveLength(1);
      expect(exportedData.summary).toBeDefined();
      expect(exportedData.overallComplianceScore).toBe(65);
    });

    it('should export batch results as CSV', async () => {
      const options: ExportOptions = { format: 'csv' };
      const result = await exportService.exportBatchResults(mockBatchResult, options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/csv');
      expect(result.data).toContain('Field,Value');
      expect(result.data).toContain('results');
      expect(result.data).toContain('summary');
    });
  });

  describe('exportSampleRequest', () => {
    it('should export ORTB request as JSON', async () => {
      const options: ExportOptions = { format: 'json' };
      const result = await exportService.exportSampleRequest(mockORTBRequest, options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toMatch(/ortb-sample-request_\d{4}-\d{2}-\d{2}\.json/);

      const exportedData = JSON.parse(result.data);
      expect(exportedData.id).toBe('test-request-123');
      expect(exportedData.imp).toHaveLength(1);
      expect(exportedData.site).toBeDefined();
    });

    it('should anonymize ORTB request when requested', async () => {
      const options: ExportOptions = { format: 'json', anonymize: true };
      const result = await exportService.exportSampleRequest(mockORTBRequest, options);

      expect(result.success).toBe(true);
      expect(result.metadata.anonymized).toBe(true);

      const exportedData = JSON.parse(result.data);
      expect(exportedData.user?.id).not.toBe('user-123');
      expect(exportedData.device?.ip).not.toBe('192.168.1.1');
      expect(exportedData.site?.domain).not.toBe('example.com');
    });

    it('should export ORTB request as CSV', async () => {
      const options: ExportOptions = { format: 'csv' };
      const result = await exportService.exportSampleRequest(mockORTBRequest, options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/csv');
      expect(result.data).toContain('Field,Value');
      expect(result.data).toContain('id,test-request-123');
    });
  });

  describe('exportMultipleSamples', () => {
    it('should export multiple ORTB requests as JSON', async () => {
      const requests = [mockORTBRequest, { ...mockORTBRequest, id: 'test-request-456' }];
      const options: ExportOptions = { format: 'json' };
      const result = await exportService.exportMultipleSamples(requests, options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toMatch(/ortb-sample-requests_\d{4}-\d{2}-\d{2}\.json/);
      expect(result.metadata.recordCount).toBe(2);

      const exportedData = JSON.parse(result.data);
      expect(exportedData).toHaveLength(2);
      expect(exportedData[0].id).toBe('test-request-123');
      expect(exportedData[1].id).toBe('test-request-456');
    });

    it('should anonymize multiple ORTB requests when requested', async () => {
      const requests = [mockORTBRequest, { ...mockORTBRequest, id: 'test-request-456' }];
      const options: ExportOptions = { format: 'json', anonymize: true };
      const result = await exportService.exportMultipleSamples(requests, options);

      expect(result.success).toBe(true);
      expect(result.metadata.anonymized).toBe(true);

      const exportedData = JSON.parse(result.data);
      expect(exportedData).toHaveLength(2);
      exportedData.forEach((request: any) => {
        expect(request.user?.id).not.toContain('user-123');
        expect(request.device?.ip).not.toBe('192.168.1.1');
      });
    });
  });

  describe('anonymizeData', () => {
    it('should mask sensitive fields by default', () => {
      const sensitiveData = {
        user: { id: 'user-123456', buyeruid: 'buyer-789' },
        device: { ip: '192.168.1.100', ifa: 'device-id-123' },
        site: { domain: 'example.com', page: 'https://example.com/page' }
      };

      const config: AnonymizationConfig = {
        fieldsToAnonymize: ['user.id', 'device.ip', 'site.domain'],
        strategy: 'mask'
      };

      const anonymized = exportService.anonymizeData(sensitiveData, config);

      expect(anonymized.user.id).toMatch(/^u\*+6$/); // First and last char, rest masked
      expect(anonymized.device.ip).toMatch(/^1\*+0$/);
      expect(anonymized.site.domain).toMatch(/^e\*+m$/);
      expect(anonymized.user.buyeruid).toBe('buyer-789'); // Not in anonymization list
    });

    it('should hash sensitive fields when strategy is hash', () => {
      const sensitiveData = {
        user: { id: 'user-123', buyeruid: 'buyer-456' }
      };

      const config: AnonymizationConfig = {
        fieldsToAnonymize: ['user.id', 'user.buyeruid'],
        strategy: 'hash'
      };

      const anonymized = exportService.anonymizeData(sensitiveData, config);

      expect(anonymized.user.id).toMatch(/^hash_[a-f0-9]+$/);
      expect(anonymized.user.buyeruid).toMatch(/^hash_[a-f0-9]+$/);
      expect(anonymized.user.id).not.toBe('user-123');
      expect(anonymized.user.buyeruid).not.toBe('buyer-456');
    });

    it('should remove sensitive fields when strategy is remove', () => {
      const sensitiveData = {
        user: { id: 'user-123', buyeruid: 'buyer-456' },
        device: { ip: '192.168.1.1' }
      };

      const config: AnonymizationConfig = {
        fieldsToAnonymize: ['user.id', 'device.ip'],
        strategy: 'remove'
      };

      const anonymized = exportService.anonymizeData(sensitiveData, config);

      expect(anonymized.user.id).toBeUndefined();
      expect(anonymized.device.ip).toBeUndefined();
      expect(anonymized.user.buyeruid).toBe('buyer-456'); // Not removed
    });

    it('should replace sensitive fields when strategy is replace', () => {
      const sensitiveData = {
        user: { id: 'user-123' },
        device: { ip: '192.168.1.1' }
      };

      const config: AnonymizationConfig = {
        fieldsToAnonymize: ['user.id', 'device.ip'],
        strategy: 'replace',
        customRules: [
          { fieldPath: 'user.id', strategy: 'replace', replacementValue: '[USER_ID]' },
          { fieldPath: 'device.ip', strategy: 'replace', replacementValue: '[IP_ADDRESS]' }
        ]
      };

      const anonymized = exportService.anonymizeData(sensitiveData, config);

      expect(anonymized.user.id).toBe('[USER_ID]');
      expect(anonymized.device.ip).toBe('[IP_ADDRESS]');
    });

    it('should handle nested objects correctly', () => {
      const nestedData = {
        level1: {
          level2: {
            sensitiveField: 'secret-value'
          }
        }
      };

      const config: AnonymizationConfig = {
        fieldsToAnonymize: ['level1.level2.sensitiveField'],
        strategy: 'mask'
      };

      const anonymized = exportService.anonymizeData(nestedData, config);

      expect(anonymized.level1.level2.sensitiveField).toMatch(/^s\*+e$/);
    });

    it('should handle arrays in data', () => {
      const arrayData = {
        items: [
          { id: 'item-1', value: 'value-1' },
          { id: 'item-2', value: 'value-2' }
        ]
      };

      const config: AnonymizationConfig = {
        fieldsToAnonymize: ['items.0.id', 'items.1.id'],
        strategy: 'mask'
      };

      const anonymized = exportService.anonymizeData(arrayData, config);

      // The current implementation actually does anonymize these fields
      // because it treats 'items.0.id' as a valid field path
      expect(anonymized.items[0].id).toMatch(/^i\*+1$/); // Masked
      expect(anonymized.items[1].id).toMatch(/^i\*+2$/); // Masked
    });

    it('should not modify original data', () => {
      const originalData = {
        user: { id: 'user-123' },
        device: { ip: '192.168.1.1' }
      };

      const config: AnonymizationConfig = {
        fieldsToAnonymize: ['user.id', 'device.ip'],
        strategy: 'mask'
      };

      const anonymized = exportService.anonymizeData(originalData, config);

      // Original data should remain unchanged
      expect(originalData.user.id).toBe('user-123');
      expect(originalData.device.ip).toBe('192.168.1.1');

      // Anonymized data should be different
      expect(anonymized.user.id).not.toBe('user-123');
      expect(anonymized.device.ip).not.toBe('192.168.1.1');
    });
  });

  describe('CSV export format', () => {
    it('should handle empty arrays', async () => {
      const options: ExportOptions = { format: 'csv' };
      const result = await exportService.exportMultipleSamples([], options);

      expect(result.success).toBe(true);
      expect(result.data).toBe('');
    });

    it('should handle arrays with different object structures', async () => {
      const mixedRequests = [
        { id: '1', imp: [{ id: 'imp1' }] },
        { id: '2', site: { domain: 'example.com' } },
        { id: '3', app: { bundle: 'com.example.app' } }
      ];

      const options: ExportOptions = { format: 'csv' };
      const result = await exportService.exportMultipleSamples(mixedRequests, options);

      expect(result.success).toBe(true);
      // The CSV includes all nested fields as separate columns
      expect(result.data).toContain('id');
      expect(result.data).toContain('imp');
      expect(result.data).toContain('site');
      expect(result.data).toContain('app');
      expect(result.data.split('\n')).toHaveLength(4); // Header + 3 data rows
    });

    it('should escape CSV special characters', async () => {
      const requestWithSpecialChars = {
        id: 'test,with"comma',
        description: 'Line 1\nLine 2',
        value: 'Contains "quotes"'
      };

      const options: ExportOptions = { format: 'csv' };
      const result = await exportService.exportSampleRequest(requestWithSpecialChars, options);

      expect(result.success).toBe(true);
      expect(result.data).toContain('"test,with""comma"');
      expect(result.data).toContain('"Line 1\nLine 2"');
      expect(result.data).toContain('"Contains ""quotes"""');
    });
  });

  describe('HTML export format', () => {
    it('should escape HTML special characters', async () => {
      const requestWithHTML = {
        id: 'test<script>alert("xss")</script>',
        description: 'Contains & ampersand',
        value: 'Has "quotes" and \'apostrophes\''
      };

      const options: ExportOptions = { format: 'html' };
      const result = await exportService.exportSampleRequest(requestWithHTML, options);

      expect(result.success).toBe(true);
      expect(result.data).toContain('&lt;script&gt;');
      expect(result.data).toContain('&amp; ampersand');
      expect(result.data).toContain('&quot;quotes&quot;');
      expect(result.data).toContain('&#39;apostrophes&#39;');
    });

    it('should include proper HTML structure', async () => {
      const options: ExportOptions = { format: 'html' };
      const result = await exportService.exportValidationResult(mockValidationResult, options);

      expect(result.success).toBe(true);
      expect(result.data).toContain('<!DOCTYPE html>');
      expect(result.data).toContain('<html>');
      expect(result.data).toContain('<head>');
      expect(result.data).toContain('<body>');
      expect(result.data).toContain('</html>');
      expect(result.data).toContain('<style>');
    });
  });

  describe('Field filtering', () => {
    it('should include only specified fields', async () => {
      const options: ExportOptions = {
        format: 'json',
        fieldFilter: {
          include: ['id', 'imp.0.id', 'site.domain']
        }
      };

      const result = await exportService.exportSampleRequest(mockORTBRequest, options);
      expect(result.success).toBe(true);

      const exportedData = JSON.parse(result.data);
      expect(exportedData.id).toBeDefined();
      expect(exportedData.imp).toBeDefined();
      expect(exportedData.site?.domain).toBeDefined();
      expect(exportedData.device).toBeUndefined();
      expect(exportedData.user).toBeUndefined();
    });

    it('should exclude specified fields', async () => {
      const options: ExportOptions = {
        format: 'json',
        fieldFilter: {
          exclude: ['user', 'device.ip', 'site.page']
        }
      };

      const result = await exportService.exportSampleRequest(mockORTBRequest, options);
      expect(result.success).toBe(true);

      const exportedData = JSON.parse(result.data);
      expect(exportedData.id).toBeDefined();
      expect(exportedData.imp).toBeDefined();
      expect(exportedData.site?.domain).toBeDefined();
      expect(exportedData.site?.page).toBeUndefined();
      expect(exportedData.user).toBeUndefined();
      expect(exportedData.device?.make).toBeDefined();
      expect(exportedData.device?.ip).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should handle null/undefined data gracefully', async () => {
      const options: ExportOptions = { format: 'json' };
      const result = await exportService.exportValidationResult(null as any, options);

      expect(result.success).toBe(true);
      expect(result.data).toBe('null');
    });

    it('should handle circular references in data', async () => {
      const circularData: any = { id: 'test' };
      circularData.self = circularData;

      const options: ExportOptions = { format: 'json' };
      
      // This should not throw an error due to JSON.stringify handling
      const result = await exportService.exportValidationResult(circularData, options);
      
      // The result will depend on how JSON.stringify handles circular references
      // In most cases, it will throw an error which our service should catch
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});