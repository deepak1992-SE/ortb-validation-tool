import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ORTBValidationService } from '../../services/validation-service';
import { ORTBSampleService } from '../../services/sample-service';
import { ORTBExportService } from '../../services/export-service';
import { ORTBSharingService } from '../../services/sharing-service';
import { ORTBReportingService } from '../../services/reporting-service';
import { ORTBSchemaService } from '../../services/schema-service';
import { ORTBRequest, SampleConfig, ValidationResult } from '../../models';

describe('End-to-End Scenarios', () => {
  let validationService: ORTBValidationService;
  let sampleService: ORTBSampleService;
  let exportService: ORTBExportService;
  let sharingService: ORTBSharingService;
  let reportingService: ORTBReportingService;
  let schemaService: ORTBSchemaService;

  beforeEach(() => {
    validationService = new ORTBValidationService();
    sampleService = new ORTBSampleService();
    exportService = new ORTBExportService();
    sharingService = new ORTBSharingService();
    reportingService = new ORTBReportingService();
    schemaService = new ORTBSchemaService();
  });

  afterEach(() => {
    // Clean up any test artifacts
  });

  describe('Publisher Integration Scenario', () => {
    it('should complete full publisher integration workflow', async () => {
      // Scenario: Business development team needs to provide publisher with ORTB samples
      
      // Step 1: Generate samples for different ad types
      const adTypes = ['display', 'video', 'native'] as const;
      const publisherSamples = await Promise.all(
        adTypes.map(type => sampleService.generateSample({
          requestType: type,
          includeOptionalFields: true,
          customFields: {
            site: {
              domain: 'publisher-example.com',
              name: 'Publisher Example Site'
            },
            device: {
              devicetype: 2, // Desktop
              ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        }))
      );

      expect(publisherSamples).toHaveLength(3);

      // Step 2: Validate all samples are compliant
      const validationResults = await Promise.all(
        publisherSamples.map(sample => validationService.validateRequest(sample))
      );

      validationResults.forEach((result, index) => {
        expect(result.isValid).toBe(true);
        expect(result.complianceLevel).toBeOneOf(['FULLY_COMPLIANT', 'MOSTLY_COMPLIANT']);
      });

      // Step 3: Generate comprehensive documentation report
      const documentationReport = await reportingService.generatePublisherDocumentation(
        publisherSamples,
        {
          includeFieldDescriptions: true,
          includeExamples: true,
          publisherFriendly: true
        }
      );

      expect(documentationReport.samples).toHaveLength(3);
      expect(documentationReport.fieldGuide).toBeDefined();
      expect(documentationReport.integrationNotes).toBeDefined();

      // Step 4: Export samples in publisher-friendly format
      const publisherPackage = await exportService.exportPublisherPackage(
        publisherSamples,
        documentationReport,
        {
          formats: ['json', 'xml'],
          includePostmanCollection: true,
          includeValidationGuide: true
        }
      );

      expect(publisherPackage.samples.json).toBeDefined();
      expect(publisherPackage.samples.xml).toBeDefined();
      expect(publisherPackage.postmanCollection).toBeDefined();
      expect(publisherPackage.validationGuide).toBeDefined();

      // Step 5: Create shareable links with expiration
      const shareableLinks = await Promise.all(
        publisherSamples.map(sample => 
          sharingService.createShareableSample(sample, {
            expirationDays: 30,
            includeDocumentation: true,
            allowDownload: true
          })
        )
      );

      shareableLinks.forEach(link => {
        expect(link.url).toMatch(/^https?:\/\//);
        expect(link.expiresAt).toBeInstanceOf(Date);
        expect(link.downloadEnabled).toBe(true);
      });
    });

    it('should handle publisher feedback and iteration cycle', async () => {
      // Scenario: Publisher provides feedback on initial samples
      
      // Step 1: Generate initial sample
      const initialSample = await sampleService.generateSample({
        requestType: 'display',
        includeOptionalFields: false
      });

      // Step 2: Simulate publisher feedback (needs video support)
      const publisherFeedback = {
        requestedChanges: ['add_video_support', 'include_user_data', 'add_geo_targeting'],
        customRequirements: {
          video: {
            minduration: 15,
            maxduration: 30,
            protocols: [2, 3, 5, 6]
          },
          user: {
            includeGeo: true,
            includeDemographics: true
          }
        }
      };

      // Step 3: Generate updated sample based on feedback
      const updatedSample = await sampleService.generateSample({
        requestType: 'video',
        includeOptionalFields: true,
        customFields: {
          imp: [{
            video: publisherFeedback.customRequirements.video
          }],
          user: {
            yob: 1985,
            gender: 'M',
            geo: {
              country: 'USA',
              region: 'CA',
              city: 'San Francisco'
            }
          }
        }
      });

      // Step 4: Validate updated sample
      const validation = await validationService.validateRequest(updatedSample);
      expect(validation.isValid).toBe(true);

      // Step 5: Generate comparison report
      const comparisonReport = await reportingService.generateComparisonReport(
        initialSample,
        updatedSample
      );

      expect(comparisonReport.differences).toBeDefined();
      expect(comparisonReport.improvements).toBeDefined();
      expect(comparisonReport.addedFields).toContain('video');
      expect(comparisonReport.addedFields).toContain('user.geo');

      // Step 6: Export iteration summary
      const iterationSummary = await exportService.exportIterationSummary(
        comparisonReport,
        publisherFeedback
      );

      expect(iterationSummary.changes).toBeDefined();
      expect(iterationSummary.rationale).toBeDefined();
    });
  });

  describe('Quality Assurance Scenario', () => {
    it('should complete comprehensive QA validation workflow', async () => {
      // Scenario: QA team validates multiple request variations
      
      // Step 1: Generate test suite with various scenarios
      const testScenarios = [
        { name: 'minimal_display', config: { requestType: 'display' as const, includeOptionalFields: false } },
        { name: 'full_video', config: { requestType: 'video' as const, includeOptionalFields: true } },
        { name: 'native_app', config: { requestType: 'native' as const, includeOptionalFields: true, contextType: 'app' } },
        { name: 'audio_podcast', config: { requestType: 'audio' as const, includeOptionalFields: true } },
        { name: 'mobile_banner', config: { requestType: 'display' as const, deviceType: 'mobile' } }
      ];

      const testSamples = await Promise.all(
        testScenarios.map(async scenario => ({
          name: scenario.name,
          sample: await sampleService.generateSample(scenario.config)
        }))
      );

      // Step 2: Run comprehensive validation on all samples
      const validationResults = await Promise.all(
        testSamples.map(async ({ name, sample }) => ({
          name,
          result: await validationService.validateRequest(sample),
          sample
        }))
      );

      // Step 3: Verify all samples pass validation
      validationResults.forEach(({ name, result }) => {
        expect(result.isValid, `${name} should be valid`).toBe(true);
        expect(result.errors, `${name} should have no errors`).toHaveLength(0);
      });

      // Step 4: Generate QA report with detailed analysis
      const qaReport = await reportingService.generateQAReport(validationResults);
      
      expect(qaReport.summary.totalTests).toBe(5);
      expect(qaReport.summary.passedTests).toBe(5);
      expect(qaReport.summary.failedTests).toBe(0);
      expect(qaReport.coverageAnalysis).toBeDefined();
      expect(qaReport.riskAssessment).toBeDefined();

      // Step 5: Test edge cases and boundary conditions
      const edgeCases = [
        { name: 'max_impressions', sample: await sampleService.generateSample({ 
          requestType: 'display',
          customFields: { imp: Array(10).fill(null).map((_, i) => ({ id: `${i+1}`, banner: { w: 300, h: 250 } })) }
        })},
        { name: 'min_required_fields', sample: await sampleService.generateSample({
          requestType: 'display',
          includeOptionalFields: false,
          minimalMode: true
        })},
        { name: 'unicode_content', sample: await sampleService.generateSample({
          requestType: 'display',
          customFields: {
            site: { name: '测试网站 🌟', domain: 'test-中文.com' }
          }
        })}
      ];

      const edgeCaseResults = await Promise.all(
        edgeCases.map(async ({ name, sample }) => ({
          name,
          result: await validationService.validateRequest(sample)
        }))
      );

      edgeCaseResults.forEach(({ name, result }) => {
        expect(result.isValid, `Edge case ${name} should be valid`).toBe(true);
      });

      // Step 6: Export comprehensive test report
      const testReport = await exportService.exportQATestReport({
        standardTests: validationResults,
        edgeCaseTests: edgeCaseResults,
        qaReport,
        timestamp: new Date()
      });

      expect(testReport.format).toBe('json');
      expect(testReport.data).toContain('standardTests');
      expect(testReport.data).toContain('edgeCaseTests');
    });

    it('should detect and report compliance issues', async () => {
      // Scenario: QA discovers compliance issues that need reporting
      
      // Step 1: Create intentionally problematic requests
      const problematicRequests = [
        {
          name: 'missing_required_at',
          request: {
            id: 'test-missing-at',
            imp: [{ id: '1', banner: { w: 300, h: 250 } }]
            // Missing 'at' field
          } as ORTBRequest
        },
        {
          name: 'invalid_site_app_both',
          request: {
            id: 'test-both-site-app',
            imp: [{ id: '1', banner: { w: 300, h: 250 } }],
            site: { id: 'site1', domain: 'example.com' },
            app: { id: 'app1', bundle: 'com.example.app' },
            at: 1
          } as ORTBRequest
        },
        {
          name: 'invalid_impression_id_duplicate',
          request: {
            id: 'test-duplicate-imp-id',
            imp: [
              { id: '1', banner: { w: 300, h: 250 } },
              { id: '1', banner: { w: 728, h: 90 } } // Duplicate ID
            ],
            at: 1
          } as ORTBRequest
        }
      ];

      // Step 2: Validate problematic requests
      const problemResults = await Promise.all(
        problematicRequests.map(async ({ name, request }) => ({
          name,
          result: await validationService.validateRequest(request)
        }))
      );

      // Step 3: Verify issues are detected
      problemResults.forEach(({ name, result }) => {
        expect(result.isValid, `${name} should be invalid`).toBe(false);
        expect(result.errors.length, `${name} should have errors`).toBeGreaterThan(0);
      });

      // Step 4: Generate compliance issue report
      const complianceReport = await reportingService.generateComplianceIssueReport(problemResults);
      
      expect(complianceReport.criticalIssues).toBeDefined();
      expect(complianceReport.recommendations).toBeDefined();
      expect(complianceReport.impactAssessment).toBeDefined();

      // Step 5: Export issue tracking report
      const issueReport = await exportService.exportIssueTrackingReport(complianceReport);
      expect(issueReport.format).toBe('json');
      expect(issueReport.data).toContain('criticalIssues');
    });
  });

  describe('Developer Integration Scenario', () => {
    it('should support complete developer workflow', async () => {
      // Scenario: Developer integrating ORTB validation into their system
      
      // Step 1: Test schema loading and validation setup
      const schemaVersion = await schemaService.getCurrentSchemaVersion();
      expect(schemaVersion).toBe('2.6');

      const schema = await schemaService.loadSchema('2.6');
      expect(schema).toBeDefined();
      expect(schema.properties).toBeDefined();

      // Step 2: Test batch validation for developer's existing requests
      const developerRequests = [
        await sampleService.generateSample({ requestType: 'display' }),
        await sampleService.generateSample({ requestType: 'video' }),
        await sampleService.generateSample({ requestType: 'native' })
      ];

      const batchValidation = await validationService.validateBatch(developerRequests);
      expect(batchValidation.results).toHaveLength(3);
      expect(batchValidation.summary.validRequests).toBe(3);

      // Step 3: Test custom validation rules
      const customValidationResult = await validationService.validateWithCustomRules(
        developerRequests[0],
        {
          requireSSL: true,
          minimumBidFloor: 0.1,
          allowedDomains: ['example.com', 'test.com']
        }
      );

      expect(customValidationResult.customRuleResults).toBeDefined();

      // Step 4: Test API integration patterns
      const apiValidationResult = await validationService.validateForAPI(
        developerRequests[0],
        {
          includeWarnings: true,
          detailedErrors: true,
          suggestionLevel: 'comprehensive'
        }
      );

      expect(apiValidationResult.apiResponse).toBeDefined();
      expect(apiValidationResult.apiResponse.status).toBe('success');
      expect(apiValidationResult.apiResponse.data.isValid).toBe(true);

      // Step 5: Test performance monitoring
      const performanceMetrics = await validationService.getPerformanceMetrics();
      expect(performanceMetrics.averageValidationTime).toBeDefined();
      expect(performanceMetrics.throughput).toBeDefined();
      expect(performanceMetrics.cacheHitRate).toBeDefined();

      // Step 6: Export integration guide
      const integrationGuide = await exportService.exportDeveloperIntegrationGuide({
        includeCodeExamples: true,
        includeAPIDocumentation: true,
        includePerformanceTips: true
      });

      expect(integrationGuide.codeExamples).toBeDefined();
      expect(integrationGuide.apiDocumentation).toBeDefined();
      expect(integrationGuide.performanceTips).toBeDefined();
    });

    it('should handle high-volume validation scenarios', async () => {
      // Scenario: Developer needs to validate large batches of requests
      
      // Step 1: Generate large batch of requests
      const largeBatch = await sampleService.generateBatch(
        Array(50).fill(null).map(() => ({
          requestType: 'display' as const,
          includeOptionalFields: Math.random() > 0.5
        }))
      );

      expect(largeBatch).toHaveLength(50);

      // Step 2: Test batch validation performance
      const startTime = Date.now();
      const batchResults = await validationService.validateBatch(largeBatch, {
        parallel: true,
        maxConcurrency: 10
      });
      const endTime = Date.now();

      expect(batchResults.results).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Step 3: Test streaming validation for very large datasets
      const streamingResults: ValidationResult[] = [];
      const streamProcessor = validationService.createValidationStream({
        batchSize: 10,
        onBatch: (results) => {
          streamingResults.push(...results);
        }
      });

      // Process requests in streaming fashion
      for (let i = 0; i < largeBatch.length; i += 10) {
        const batch = largeBatch.slice(i, i + 10);
        await streamProcessor.processBatch(batch);
      }

      expect(streamingResults).toHaveLength(50);

      // Step 4: Generate performance report
      const performanceReport = await reportingService.generatePerformanceReport({
        batchSize: 50,
        processingTime: endTime - startTime,
        validationResults: batchResults,
        streamingResults
      });

      expect(performanceReport.throughputMetrics).toBeDefined();
      expect(performanceReport.resourceUtilization).toBeDefined();
      expect(performanceReport.recommendations).toBeDefined();
    });
  });

  describe('Error Recovery and Resilience Scenarios', () => {
    it('should handle system failures gracefully', async () => {
      // Scenario: System encounters various failure conditions
      
      // Step 1: Test schema loading failure recovery
      const originalSchemaLoader = schemaService.loadSchema;
      schemaService.loadSchema = () => Promise.reject(new Error('Schema load failed'));

      try {
        const result = await validationService.validateRequest({
          id: 'test-schema-failure',
          imp: [{ id: '1', banner: { w: 300, h: 250 } }],
          at: 1
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.code === 'SCHEMA_LOAD_FAILED')).toBe(true);
        expect(result.fallbackValidation).toBeDefined();
      } finally {
        schemaService.loadSchema = originalSchemaLoader;
      }

      // Step 2: Test export service failure recovery
      const originalExport = exportService.exportSample;
      exportService.exportSample = () => Promise.reject(new Error('Export failed'));

      try {
        const sample = await sampleService.generateSample({ requestType: 'display' });
        const result = await exportService.exportSampleWithFallback(sample, 'json');
        
        expect(result.success).toBe(false);
        expect(result.fallbackData).toBeDefined();
        expect(result.error).toBeDefined();
      } finally {
        exportService.exportSample = originalExport;
      }

      // Step 3: Test network failure in sharing service
      const originalCreateShare = sharingService.createShareableSample;
      sharingService.createShareableSample = () => Promise.reject(new Error('Network error'));

      try {
        const sample = await sampleService.generateSample({ requestType: 'display' });
        const result = await sharingService.createShareableSampleWithFallback(sample);
        
        expect(result.success).toBe(false);
        expect(result.localFallback).toBeDefined();
        expect(result.retryOptions).toBeDefined();
      } finally {
        sharingService.createShareableSample = originalCreateShare;
      }
    });

    it('should maintain data consistency during partial failures', async () => {
      // Scenario: Partial system failures should not corrupt data
      
      // Step 1: Test partial batch validation failure
      const mixedBatch = [
        await sampleService.generateSample({ requestType: 'display' }),
        { invalid: 'request' } as any, // Intentionally invalid
        await sampleService.generateSample({ requestType: 'video' })
      ];

      const batchResults = await validationService.validateBatchWithErrorHandling(mixedBatch);
      
      expect(batchResults.results).toHaveLength(3);
      expect(batchResults.results[0].isValid).toBe(true);
      expect(batchResults.results[1].isValid).toBe(false);
      expect(batchResults.results[2].isValid).toBe(true);
      expect(batchResults.partialFailure).toBe(true);

      // Step 2: Test export consistency during failures
      const samples = await sampleService.generateBatch([
        { requestType: 'display' },
        { requestType: 'video' }
      ]);

      const exportResults = await exportService.exportBatchWithErrorHandling(samples, 'json');
      
      expect(exportResults.successfulExports).toBeDefined();
      expect(exportResults.failedExports).toBeDefined();
      expect(exportResults.partialSuccess).toBeDefined();

      // Step 3: Verify data integrity after recovery
      const recoveryReport = await reportingService.generateRecoveryReport({
        batchResults,
        exportResults,
        timestamp: new Date()
      });

      expect(recoveryReport.dataIntegrityCheck).toBe('PASSED');
      expect(recoveryReport.recoveredItems).toBeDefined();
      expect(recoveryReport.lostItems).toHaveLength(0);
    });
  });
});