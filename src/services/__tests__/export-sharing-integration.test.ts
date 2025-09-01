/**
 * Export and Sharing Integration Tests
 * Tests the integration between export and sharing services
 */

import { ORTBExportService, ExportOptions } from '../export-service';
import { ORTBSharingService, ShareableData, BatchShareOptions } from '../sharing-service';
import { ValidationResult, ORTBRequest } from '../../models';

describe('Export and Sharing Integration', () => {
  let exportService: ORTBExportService;
  let sharingService: ORTBSharingService;
  let mockValidationResult: ValidationResult;
  let mockORTBRequest: ORTBRequest;

  beforeEach(() => {
    exportService = new ORTBExportService();
    sharingService = new ORTBSharingService();

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
      warnings: [],
      complianceLevel: 'non-compliant',
      validatedFields: ['id', 'imp.0.id'],
      complianceScore: 65,
      timestamp: new Date('2024-01-01T00:00:00Z'),
      validationId: 'val_123',
      specVersion: '2.6'
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

  describe('Export then Share workflow', () => {
    it('should export validation result and create shareable link', async () => {
      // First export the validation result
      const exportOptions: ExportOptions = {
        format: 'json',
        anonymize: true,
        filename: 'validation-result-for-sharing'
      };

      const exportResult = await exportService.exportValidationResult(mockValidationResult, exportOptions);
      expect(exportResult.success).toBe(true);
      expect(exportResult.metadata.anonymized).toBe(true);

      // Then create a shareable link for the exported data
      const shareableData: ShareableData = {
        type: 'validation-result',
        data: JSON.parse(exportResult.data),
        metadata: {
          title: 'Exported Validation Result',
          description: 'Validation result exported and shared for collaboration'
        }
      };

      const shareLink = await sharingService.createShareableLink(shareableData, {
        expirationHours: 48,
        allowDownload: true
      });

      expect(shareLink.shareId).toBeDefined();
      expect(shareLink.metadata.isAnonymized).toBe(false); // Data was already anonymized during export
      expect(shareLink.metadata.title).toBe('Exported Validation Result');

      // Verify we can retrieve the shared data
      const sharedData = await sharingService.getSharedData(shareLink.shareId);
      expect(sharedData.success).toBe(true);
      expect(sharedData.data.isValid).toBe(false);
    });

    it('should export multiple samples and share as batch', async () => {
      const samples = [
        mockORTBRequest,
        { ...mockORTBRequest, id: 'request-2' },
        { ...mockORTBRequest, id: 'request-3' }
      ];

      // Export samples individually
      const exportPromises = samples.map(sample => 
        exportService.exportSampleRequest(sample, { format: 'json', anonymize: true })
      );
      const exportResults = await Promise.all(exportPromises);

      // Verify all exports succeeded
      exportResults.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.metadata.anonymized).toBe(true);
      });

      // Share the batch
      const batchShareOptions: BatchShareOptions = {
        format: 'json',
        groupBy: 'adFormat',
        anonymize: true,
        metadata: {
          title: 'Exported Sample Batch',
          description: 'Multiple samples exported and shared',
          purpose: 'testing',
          targetAudience: ['publishers', 'developers'],
          createdBy: 'integration-test'
        }
      };

      const batchShareResult = await sharingService.exportBatchForSharing(samples, batchShareOptions);

      expect(batchShareResult.exportResult.success).toBe(true);
      expect(batchShareResult.shareableLink.metadata.isAnonymized).toBe(true);
      expect(batchShareResult.summary.totalSamples).toBe(3);
      expect(batchShareResult.summary.groupedSamples).toHaveLength(1); // All display ads
    });
  });

  describe('Anonymization consistency', () => {
    it('should maintain consistent anonymization between export and sharing', async () => {
      const sensitiveRequest = {
        ...mockORTBRequest,
        user: { id: 'sensitive-user-123', buyeruid: 'sensitive-buyer-456' },
        device: { ...mockORTBRequest.device, ip: '192.168.1.100', ifa: 'device-id-123' }
      };

      // Export with anonymization
      const exportResult = await exportService.exportSampleRequest(sensitiveRequest, {
        format: 'json',
        anonymize: true
      });

      const exportedData = JSON.parse(exportResult.data);
      const exportedUserId = exportedData.user?.id;
      const exportedDeviceIp = exportedData.device?.ip;

      // Share with anonymization
      const shareableData: ShareableData = {
        type: 'sample-request',
        data: sensitiveRequest
      };

      const shareLink = await sharingService.createShareableLink(shareableData, {
        anonymize: true
      });

      const sharedData = await sharingService.getSharedData(shareLink.shareId);
      const sharedUserId = sharedData.data?.user?.id;
      const sharedDeviceIp = sharedData.data?.device?.ip;

      // Both should be anonymized but may use different strategies
      expect(exportedUserId).not.toBe('sensitive-user-123');
      expect(exportedDeviceIp).not.toBe('192.168.1.100');
      expect(sharedUserId).not.toBe('sensitive-user-123');
      expect(sharedDeviceIp).not.toBe('192.168.1.100');
    });
  });

  describe('Format compatibility', () => {
    it('should handle different export formats in sharing workflow', async () => {
      const formats: Array<'json' | 'csv' | 'html' | 'txt'> = ['json', 'csv', 'html', 'txt'];

      for (const format of formats) {
        // Export in specific format
        const exportResult = await exportService.exportValidationResult(mockValidationResult, {
          format,
          filename: `validation-result-${format}`
        });

        expect(exportResult.success).toBe(true);
        expect(exportResult.metadata.format).toBe(format);

        // Create shareable link for the export
        const shareableData: ShareableData = {
          type: 'validation-result',
          data: mockValidationResult, // Use original data for sharing
          metadata: {
            title: `Validation Result (${format.toUpperCase()})`,
            description: `Exported in ${format} format`
          }
        };

        const shareLink = await sharingService.createShareableLink(shareableData);
        expect(shareLink.shareId).toBeDefined();
        expect(shareLink.metadata.title).toBe(`Validation Result (${format.toUpperCase()})`);

        // Verify retrieval works
        const sharedData = await sharingService.getSharedData(shareLink.shareId);
        expect(sharedData.success).toBe(true);
      }
    });
  });

  describe('Publisher template integration', () => {
    it('should create publisher template with exported samples', async () => {
      const samples = [mockORTBRequest];

      // Export samples first
      const exportResults = await Promise.all(
        samples.map(sample => exportService.exportSampleRequest(sample, { format: 'json' }))
      );

      expect(exportResults.every(r => r.success)).toBe(true);

      // Create publisher template
      const publisherTemplateData = {
        samples,
        publisherInfo: {
          name: 'Test Publisher',
          domain: 'test-publisher.com',
          contactEmail: 'integration@test-publisher.com',
          adFormats: [{ type: 'display' as const }]
        },
        integrationContext: {
          phase: 'testing' as const,
          expectedVolume: 5000
        },
        documentation: {
          overview: 'Integration guide with exported samples',
          integrationSteps: [
            'Review exported sample requests',
            'Implement ORTB endpoint',
            'Test with provided samples'
          ],
          testingGuidelines: [
            'Validate all sample requests',
            'Test response format compliance'
          ],
          contactInfo: {
            technicalContact: 'tech@company.com',
            businessContact: 'business@company.com',
            supportEmail: 'support@company.com'
          }
        }
      };

      const template = await sharingService.createPublisherTemplate(publisherTemplateData, {
        format: 'html',
        includeSampleValidation: true,
        branding: {
          companyName: 'Integration Test Company',
          primaryColor: '#007bff'
        }
      });

      expect(template.content).toContain('Test Publisher');
      expect(template.content).toContain('test-request-123');
      expect(template.content).toContain('Integration Test Company');
      expect(template.metadata.sampleCount).toBe(1);
      expect(template.metadata.includesValidation).toBe(true);
    });
  });

  describe('Error handling integration', () => {
    it('should handle export failures gracefully in sharing workflow', async () => {
      // Try to export invalid data
      const invalidData = null;

      const exportResult = await exportService.exportValidationResult(invalidData as any, {
        format: 'json'
      });

      // Export should succeed with null data
      expect(exportResult.success).toBe(true);
      expect(exportResult.data).toBe('null');

      // Sharing should also handle this gracefully
      const shareableData: ShareableData = {
        type: 'validation-result',
        data: invalidData,
        metadata: {
          title: 'Invalid Data Test'
        }
      };

      const shareLink = await sharingService.createShareableLink(shareableData);
      expect(shareLink.shareId).toBeDefined();

      const sharedData = await sharingService.getSharedData(shareLink.shareId);
      expect(sharedData.success).toBe(true);
      expect(sharedData.data).toBe(null);
    });

    it('should handle sharing service errors when export succeeds', async () => {
      // Export should succeed
      const exportResult = await exportService.exportValidationResult(mockValidationResult, {
        format: 'json'
      });

      expect(exportResult.success).toBe(true);

      // Try to retrieve non-existent share
      const sharedData = await sharingService.getSharedData('non-existent-share-id');
      expect(sharedData.success).toBe(false);
      expect(sharedData.error).toBe('Share not found');
    });
  });

  describe('Performance and scalability', () => {
    it('should handle large batch export and sharing efficiently', async () => {
      // Create a larger batch of samples
      const largeBatch = Array.from({ length: 50 }, (_, i) => ({
        ...mockORTBRequest,
        id: `request-${i + 1}`,
        imp: [{
          ...mockORTBRequest.imp[0],
          id: `imp-${i + 1}`
        }]
      }));

      const startTime = Date.now();

      // Export and share the batch
      const batchShareResult = await sharingService.exportBatchForSharing(largeBatch, {
        format: 'json',
        groupBy: 'adFormat',
        metadata: {
          title: 'Large Batch Test',
          description: 'Testing performance with 50 samples',
          purpose: 'testing',
          targetAudience: ['developers'],
          createdBy: 'performance-test'
        }
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(batchShareResult.exportResult.success).toBe(true);
      expect(batchShareResult.summary.totalSamples).toBe(50);
      expect(batchShareResult.shareableLink.shareId).toBeDefined();
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(processingTime).toBeLessThan(5000); // 5 seconds

      // Verify the shared data can be retrieved
      const sharedData = await sharingService.getSharedData(batchShareResult.shareableLink.shareId);
      expect(sharedData.success).toBe(true);
      expect(Array.isArray(sharedData.data)).toBe(true);
      expect(sharedData.data.length).toBe(50);
    });
  });

  describe('Data integrity', () => {
    it('should maintain data integrity through export-share-retrieve cycle', async () => {
      const originalData = {
        ...mockValidationResult,
        customField: 'test-value',
        nestedObject: {
          property1: 'value1',
          property2: 42,
          property3: true
        }
      };

      // Export the data
      const exportResult = await exportService.exportValidationResult(originalData, {
        format: 'json'
      });

      const exportedData = JSON.parse(exportResult.data);

      // Share the exported data
      const shareableData: ShareableData = {
        type: 'validation-result',
        data: exportedData
      };

      const shareLink = await sharingService.createShareableLink(shareableData);

      // Retrieve the shared data
      const sharedData = await sharingService.getSharedData(shareLink.shareId);

      // Verify data integrity
      expect(sharedData.success).toBe(true);
      expect(sharedData.data.isValid).toBe(originalData.isValid);
      expect(sharedData.data.complianceScore).toBe(originalData.complianceScore);
      expect(sharedData.data.customField).toBe(originalData.customField);
      expect(sharedData.data.nestedObject).toEqual(originalData.nestedObject);
      expect(sharedData.data.errors).toHaveLength(originalData.errors.length);
      expect(sharedData.data.validatedFields).toEqual(originalData.validatedFields);
    });
  });
});