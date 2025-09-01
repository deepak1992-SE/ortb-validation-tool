import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ORTBExportService } from '../../services/export-service';
import { ORTBSampleService } from '../../services/sample-service';
import { ORTBValidationService } from '../../services/validation-service';
import { ORTBReportingService } from '../../services/reporting-service';
import { ORTBRequest, ValidationResult, ExportFormat } from '../../models';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Export Data Integrity Tests', () => {
  let exportService: ORTBExportService;
  let sampleService: ORTBSampleService;
  let validationService: ORTBValidationService;
  let reportingService: ORTBReportingService;
  let testOutputDir: string;

  beforeEach(async () => {
    exportService = new ORTBExportService();
    sampleService = new ORTBSampleService();
    validationService = new ORTBValidationService();
    reportingService = new ORTBReportingService();
    
    // Create temporary test output directory
    testOutputDir = path.join(process.cwd(), 'test-exports');
    await fs.mkdir(testOutputDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Sample Export Data Integrity', () => {
    it('should maintain data integrity when exporting samples to JSON', async () => {
      const originalSample = await sampleService.generateSample({
        requestType: 'display',
        includeOptionalFields: true
      });

      const exportResult = await exportService.exportSample(originalSample, 'json');
      expect(exportResult.format).toBe('json');
      
      // Parse exported data and compare with original
      const exportedSample = JSON.parse(exportResult.data);
      expect(exportedSample).toEqual(originalSample);
      
      // Verify all nested objects are preserved
      expect(exportedSample.imp).toEqual(originalSample.imp);
      expect(exportedSample.site || exportedSample.app).toEqual(originalSample.site || originalSample.app);
      expect(exportedSample.device).toEqual(originalSample.device);
      
      // Verify data types are preserved
      expect(typeof exportedSample.id).toBe('string');
      expect(typeof exportedSample.at).toBe('number');
      expect(Array.isArray(exportedSample.imp)).toBe(true);
    });

    it('should maintain data integrity when exporting samples to CSV', async () => {
      const originalSample = await sampleService.generateSample({
        requestType: 'display',
        includeOptionalFields: false // Simpler structure for CSV
      });

      const exportResult = await exportService.exportSample(originalSample, 'csv');
      expect(exportResult.format).toBe('csv');
      
      // Parse CSV and verify key fields are present
      const csvLines = exportResult.data.split('\n');
      const headers = csvLines[0].split(',');
      const values = csvLines[1].split(',');
      
      expect(headers).toContain('id');
      expect(headers).toContain('at');
      expect(headers).toContain('imp.0.id');
      
      // Find and verify specific values
      const idIndex = headers.indexOf('id');
      const atIndex = headers.indexOf('at');
      
      expect(values[idIndex]).toBe(originalSample.id);
      expect(parseInt(values[atIndex])).toBe(originalSample.at);
    });

    it('should maintain data integrity when exporting samples to XML', async () => {
      const originalSample = await sampleService.generateSample({
        requestType: 'video',
        includeOptionalFields: true
      });

      const exportResult = await exportService.exportSample(originalSample, 'xml');
      expect(exportResult.format).toBe('xml');
      
      // Verify XML structure contains key elements
      expect(exportResult.data).toContain('<BidRequest>');
      expect(exportResult.data).toContain('<id>');
      expect(exportResult.data).toContain('<imp>');
      expect(exportResult.data).toContain('<video>');
      expect(exportResult.data).toContain('</BidRequest>');
      
      // Verify specific values are present
      expect(exportResult.data).toContain(`<id>${originalSample.id}</id>`);
      expect(exportResult.data).toContain(`<at>${originalSample.at}</at>`);
    });

    it('should handle special characters and encoding in exports', async () => {
      const sampleWithSpecialChars = await sampleService.generateSample({
        requestType: 'display',
        customFields: {
          site: {
            name: 'Test Site with "quotes" & <tags>',
            domain: 'test-site.com',
            keywords: 'keyword1,keyword2,keyword with spaces'
          }
        }
      });

      // Test JSON export with special characters
      const jsonExport = await exportService.exportSample(sampleWithSpecialChars, 'json');
      const parsedJson = JSON.parse(jsonExport.data);
      expect(parsedJson.site.name).toBe('Test Site with "quotes" & <tags>');
      
      // Test CSV export with special characters (should be properly escaped)
      const csvExport = await exportService.exportSample(sampleWithSpecialChars, 'csv');
      expect(csvExport.data).toContain('"Test Site with ""quotes"" & <tags>"');
      
      // Test XML export with special characters (should be properly encoded)
      const xmlExport = await exportService.exportSample(sampleWithSpecialChars, 'xml');
      expect(xmlExport.data).toContain('Test Site with &quot;quotes&quot; &amp; &lt;tags&gt;');
    });

    it('should preserve numeric precision in exports', async () => {
      const sampleWithPreciseNumbers = await sampleService.generateSample({
        requestType: 'display',
        customFields: {
          imp: [{
            bidfloor: 1.23456789,
            bidfloorcur: 'USD'
          }],
          device: {
            geo: {
              lat: 40.7128123456,
              lon: -74.0060987654
            }
          }
        }
      });

      const jsonExport = await exportService.exportSample(sampleWithPreciseNumbers, 'json');
      const parsedJson = JSON.parse(jsonExport.data);
      
      expect(parsedJson.imp[0].bidfloor).toBe(1.23456789);
      expect(parsedJson.device.geo.lat).toBe(40.7128123456);
      expect(parsedJson.device.geo.lon).toBe(-74.0060987654);
    });
  });

  describe('Validation Report Export Data Integrity', () => {
    it('should maintain validation result integrity in JSON export', async () => {
      const testRequest: ORTBRequest = {
        id: 'test-validation-export',
        imp: [{
          id: '1',
          banner: { w: 300, h: 250 }
        }],
        at: 1
      };

      const validationResult = await validationService.validateRequest(testRequest);
      const report = await reportingService.generateValidationReport([validationResult]);
      
      const exportResult = await exportService.exportValidationReport(report, 'json');
      const exportedReport = JSON.parse(exportResult.data);
      
      // Verify report structure is preserved
      expect(exportedReport.summary).toEqual(report.summary);
      expect(exportedReport.fieldResults).toEqual(report.fieldResults);
      expect(exportedReport.complianceScore).toBe(report.complianceScore);
      expect(exportedReport.recommendations).toEqual(report.recommendations);
      
      // Verify timestamp is preserved as ISO string
      expect(new Date(exportedReport.timestamp)).toEqual(report.timestamp);
    });

    it('should maintain batch validation report integrity', async () => {
      const samples = await sampleService.generateBatch([
        { requestType: 'display', includeOptionalFields: false },
        { requestType: 'video', includeOptionalFields: true },
        { requestType: 'native', includeOptionalFields: false }
      ]);

      const batchResults = await validationService.validateBatch(samples);
      const batchReport = await reportingService.generateBatchReport(batchResults);
      
      const exportResult = await exportService.exportBatchReport(batchReport, 'json');
      const exportedReport = JSON.parse(exportResult.data);
      
      // Verify batch report structure
      expect(exportedReport.summary.totalRequests).toBe(3);
      expect(exportedReport.individualResults).toHaveLength(3);
      expect(exportedReport.aggregateStatistics).toBeDefined();
      
      // Verify individual results are preserved
      exportedReport.individualResults.forEach((result: any, index: number) => {
        expect(result.requestId).toBe(samples[index].id);
        expect(result.isValid).toBeDefined();
        expect(result.errors).toBeDefined();
      });
    });

    it('should export validation reports to CSV with proper formatting', async () => {
      const testRequests = await Promise.all([
        sampleService.generateSample({ requestType: 'display' }),
        sampleService.generateSample({ requestType: 'video' })
      ]);

      const validationResults = await Promise.all(
        testRequests.map(req => validationService.validateRequest(req))
      );
      
      const report = await reportingService.generateValidationReport(validationResults);
      const csvExport = await exportService.exportValidationReport(report, 'csv');
      
      const csvLines = csvExport.data.split('\n');
      const headers = csvLines[0].split(',');
      
      // Verify CSV headers
      expect(headers).toContain('request_id');
      expect(headers).toContain('is_valid');
      expect(headers).toContain('error_count');
      expect(headers).toContain('warning_count');
      expect(headers).toContain('compliance_score');
      
      // Verify data rows
      expect(csvLines.length).toBe(validationResults.length + 1); // +1 for header
    });
  });

  describe('File Export Data Integrity', () => {
    it('should create valid files with correct content', async () => {
      const sample = await sampleService.generateSample({
        requestType: 'display',
        includeOptionalFields: true
      });

      const filePath = path.join(testOutputDir, 'test-sample.json');
      await exportService.exportSampleToFile(sample, filePath, 'json');
      
      // Verify file was created
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
      
      // Verify file content
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const parsedContent = JSON.parse(fileContent);
      expect(parsedContent).toEqual(sample);
    });

    it('should handle large file exports without corruption', async () => {
      // Generate a large batch of samples
      const largeBatch = await sampleService.generateBatch(
        Array(100).fill(null).map(() => ({
          requestType: 'display' as const,
          includeOptionalFields: true
        }))
      );

      const filePath = path.join(testOutputDir, 'large-batch.json');
      await exportService.exportBatchToFile(largeBatch, filePath, 'json');
      
      // Verify file integrity
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const parsedContent = JSON.parse(fileContent);
      
      expect(parsedContent).toHaveLength(100);
      expect(parsedContent[0]).toEqual(largeBatch[0]);
      expect(parsedContent[99]).toEqual(largeBatch[99]);
    });

    it('should maintain file permissions and metadata', async () => {
      const sample = await sampleService.generateSample({ requestType: 'display' });
      const filePath = path.join(testOutputDir, 'permissions-test.json');
      
      await exportService.exportSampleToFile(sample, filePath, 'json', {
        includeMetadata: true,
        permissions: 0o644
      });
      
      const stats = await fs.stat(filePath);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
      
      // Verify content includes metadata
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const parsedContent = JSON.parse(fileContent);
      expect(parsedContent.metadata).toBeDefined();
      expect(parsedContent.metadata.exportedAt).toBeDefined();
      expect(parsedContent.data).toEqual(sample);
    });
  });

  describe('Cross-Format Data Consistency', () => {
    it('should maintain data consistency across all export formats', async () => {
      const originalSample = await sampleService.generateSample({
        requestType: 'display',
        includeOptionalFields: true
      });

      const formats: ExportFormat[] = ['json', 'csv', 'xml'];
      const exports = await Promise.all(
        formats.map(format => exportService.exportSample(originalSample, format))
      );

      // Verify all exports contain the same core data
      const jsonData = JSON.parse(exports[0].data);
      expect(jsonData.id).toBe(originalSample.id);
      expect(jsonData.at).toBe(originalSample.at);

      // CSV should contain the same ID and AT values
      const csvLines = exports[1].data.split('\n');
      const csvHeaders = csvLines[0].split(',');
      const csvValues = csvLines[1].split(',');
      const idIndex = csvHeaders.indexOf('id');
      const atIndex = csvHeaders.indexOf('at');
      expect(csvValues[idIndex]).toBe(originalSample.id);
      expect(parseInt(csvValues[atIndex])).toBe(originalSample.at);

      // XML should contain the same values
      expect(exports[2].data).toContain(`<id>${originalSample.id}</id>`);
      expect(exports[2].data).toContain(`<at>${originalSample.at}</at>`);
    });

    it('should handle round-trip data integrity for JSON format', async () => {
      const originalSample = await sampleService.generateSample({
        requestType: 'video',
        includeOptionalFields: true
      });

      // Export to JSON
      const jsonExport = await exportService.exportSample(originalSample, 'json');
      
      // Import back from JSON
      const importedSample = JSON.parse(jsonExport.data);
      
      // Validate the imported sample
      const validationResult = await validationService.validateRequest(importedSample);
      expect(validationResult.isValid).toBe(true);
      
      // Verify complete data integrity
      expect(importedSample).toEqual(originalSample);
    });

    it('should preserve data types across format conversions', async () => {
      const sampleWithVariousTypes = await sampleService.generateSample({
        requestType: 'display',
        customFields: {
          imp: [{
            bidfloor: 1.5,        // number
            secure: 1,            // number (0 or 1)
            instl: 0             // number (0 or 1)
          }],
          at: 2,                  // number
          allimps: 0,            // number (0 or 1)
          cur: ['USD', 'EUR'],   // array of strings
          test: 1                // number (0 or 1)
        }
      });

      const jsonExport = await exportService.exportSample(sampleWithVariousTypes, 'json');
      const parsedJson = JSON.parse(jsonExport.data);
      
      // Verify number types
      expect(typeof parsedJson.imp[0].bidfloor).toBe('number');
      expect(typeof parsedJson.imp[0].secure).toBe('number');
      expect(typeof parsedJson.at).toBe('number');
      
      // Verify array types
      expect(Array.isArray(parsedJson.cur)).toBe(true);
      expect(Array.isArray(parsedJson.imp)).toBe(true);
      
      // Verify string types
      expect(typeof parsedJson.id).toBe('string');
      expect(typeof parsedJson.cur[0]).toBe('string');
    });
  });
});