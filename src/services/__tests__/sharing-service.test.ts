/**
 * Sharing Service Tests
 * Comprehensive tests for sharing and collaboration features
 */

import { 
  ORTBSharingService, 
  ShareableData, 
  ShareOptions, 
  PublisherTemplateData, 
  PublisherTemplateOptions,
  BatchShareOptions,
  CollaborationData
} from '../sharing-service';
import { ValidationResult, ORTBRequest } from '../../models';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';

describe('ORTBSharingService', () => {
  let sharingService: ORTBSharingService;
  let mockValidationResult: ValidationResult;
  let mockORTBRequest: ORTBRequest;
  let mockPublisherTemplateData: PublisherTemplateData;
  let mockCollaborationData: CollaborationData;

  beforeEach(() => {
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

    // Mock publisher template data
    mockPublisherTemplateData = {
      samples: [mockORTBRequest],
      publisherInfo: {
        name: 'Example Publisher',
        domain: 'example.com',
        contactEmail: 'integration@example.com',
        integrationManager: 'John Doe',
        adFormats: [
          { type: 'display', sizes: [{ w: 300, h: 250 }, { w: 728, h: 90 }] },
          { type: 'video' }
        ],
        targetingCapabilities: ['geo', 'device', 'behavioral'],
        specialRequirements: ['GDPR compliance', 'Brand safety']
      },
      integrationContext: {
        phase: 'testing',
        expectedVolume: 10000,
        geoTargeting: ['US', 'CA', 'UK'],
        deviceTargeting: ['mobile', 'desktop'],
        timeline: {
          startDate: new Date('2024-01-01'),
          testingPhase: new Date('2024-01-15'),
          stagingPhase: new Date('2024-02-01'),
          productionLaunch: new Date('2024-02-15')
        }
      },
      documentation: {
        overview: 'This integration guide provides sample ORTB requests for Example Publisher.',
        integrationSteps: [
          'Review sample requests',
          'Implement ORTB endpoint',
          'Test with provided samples',
          'Validate responses',
          'Go live'
        ],
        testingGuidelines: [
          'Test all ad formats',
          'Verify targeting parameters',
          'Check response times'
        ],
        troubleshooting: [
          {
            issue: 'Invalid bid response format',
            solution: 'Ensure response follows OpenRTB 2.6 specification',
            category: 'validation'
          }
        ],
        contactInfo: {
          technicalContact: 'tech@example.com',
          businessContact: 'business@example.com',
          supportEmail: 'support@example.com',
          documentationUrl: 'https://docs.example.com'
        }
      }
    };

    // Mock collaboration data
    mockCollaborationData = {
      validationResults: [mockValidationResult],
      samples: [mockORTBRequest],
      context: {
        projectName: 'Publisher Integration Project',
        participants: [
          {
            name: 'Alice Developer',
            role: 'developer',
            email: 'alice@company.com',
            organization: 'Tech Company'
          },
          {
            name: 'Bob Publisher',
            role: 'publisher',
            email: 'bob@publisher.com',
            organization: 'Publisher Corp'
          }
        ],
        timeline: {
          startDate: new Date('2024-01-01'),
          milestones: [
            {
              name: 'Initial Setup',
              dueDate: new Date('2024-01-15'),
              status: 'completed',
              deliverables: ['Environment setup', 'Sample requests']
            },
            {
              name: 'Integration Testing',
              dueDate: new Date('2024-02-01'),
              status: 'in-progress',
              deliverables: ['Test results', 'Bug fixes']
            }
          ],
          currentMilestone: 'Integration Testing'
        },
        objectives: ['Successful ORTB integration', 'Performance optimization'],
        currentPhase: 'Testing'
      }
    };
  });

  describe('createShareableLink', () => {
    it('should create shareable link for validation result', async () => {
      const shareableData: ShareableData = {
        type: 'validation-result',
        data: mockValidationResult,
        metadata: {
          title: 'Test Validation Result',
          description: 'Sample validation result for testing'
        }
      };

      const options: ShareOptions = {
        expirationHours: 24,
        isPublic: true,
        allowDownload: true
      };

      const result = await sharingService.createShareableLink(shareableData, options);

      expect(result.shareId).toBeDefined();
      expect(result.url).toContain(result.shareId);
      expect(result.shortUrl).toContain('/s/');
      expect(result.qrCode).toContain('data:image/svg+xml');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.isPasswordProtected).toBe(false);
      expect(result.metadata.dataType).toBe('validation-result');
      expect(result.metadata.title).toBe('Test Validation Result');
      expect(result.metadata.recordCount).toBe(1);
      expect(result.metadata.isAnonymized).toBe(false);
    });

    it('should create password-protected shareable link', async () => {
      const shareableData: ShareableData = {
        type: 'sample-request',
        data: mockORTBRequest
      };

      const options: ShareOptions = {
        password: 'secret123',
        expirationHours: 48
      };

      const result = await sharingService.createShareableLink(shareableData, options);

      expect(result.isPasswordProtected).toBe(true);
      expect(result.metadata.dataType).toBe('sample-request');
    });

    it('should anonymize data when requested', async () => {
      const shareableData: ShareableData = {
        type: 'sample-request',
        data: mockORTBRequest
      };

      const options: ShareOptions = {
        anonymize: true
      };

      const result = await sharingService.createShareableLink(shareableData, options);

      expect(result.metadata.isAnonymized).toBe(true);
    });

    it('should handle batch results', async () => {
      const batchData = {
        results: [mockValidationResult],
        summary: {
          totalRequests: 1,
          validRequests: 0,
          invalidRequests: 1,
          warningRequests: 0,
          commonErrors: [],
          commonWarnings: [],
          averageComplianceScore: 65
        },
        overallComplianceScore: 65,
        timestamp: new Date(),
        batchId: 'batch_123'
      };

      const shareableData: ShareableData = {
        type: 'batch-results',
        data: batchData
      };

      const result = await sharingService.createShareableLink(shareableData);

      expect(result.metadata.dataType).toBe('batch-results');
      expect(result.metadata.recordCount).toBe(1);
    });
  });

  describe('getSharedData', () => {
    it('should retrieve shared data successfully', async () => {
      // First create a share
      const shareableData: ShareableData = {
        type: 'validation-result',
        data: mockValidationResult
      };

      const shareLink = await sharingService.createShareableLink(shareableData);
      
      // Then retrieve it
      const result = await sharingService.getSharedData(shareLink.shareId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockValidationResult);
      expect(result.metadata?.dataType).toBe('validation-result');
      expect(result.requiresPassword).toBeUndefined();
    });

    it('should return error for non-existent share', async () => {
      const result = await sharingService.getSharedData('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Share not found');
      expect(result.data).toBeUndefined();
    });

    it('should require password for protected shares', async () => {
      // Create password-protected share
      const shareableData: ShareableData = {
        type: 'sample-request',
        data: mockORTBRequest
      };

      const shareLink = await sharingService.createShareableLink(shareableData, {
        password: 'secret123'
      });

      // Try to retrieve without password
      const result = await sharingService.getSharedData(shareLink.shareId);

      expect(result.success).toBe(false);
      expect(result.requiresPassword).toBe(true);
      expect(result.error).toBe('Password required');
    });

    it('should handle expired shares', async () => {
      // Create share with very short expiration
      const shareableData: ShareableData = {
        type: 'sample-request',
        data: mockORTBRequest
      };

      const shareLink = await sharingService.createShareableLink(shareableData, {
        expirationHours: -1 // Already expired
      });

      const result = await sharingService.getSharedData(shareLink.shareId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Share has expired');
    });
  });

  describe('createPublisherTemplate', () => {
    it('should create HTML publisher template', async () => {
      const options: PublisherTemplateOptions = {
        format: 'html',
        includeSampleValidation: true,
        branding: {
          companyName: 'Test Company',
          primaryColor: '#007bff',
          secondaryColor: '#6c757d'
        }
      };

      const result = await sharingService.createPublisherTemplate(mockPublisherTemplateData, options);

      expect(result.content).toContain('<!DOCTYPE html>');
      expect(result.content).toContain('Example Publisher');
      expect(result.content).toContain('test-request-123');
      expect(result.content).toContain('Test Company');
      expect(result.metadata.format).toBe('html');
      expect(result.metadata.publisherName).toBe('Example Publisher');
      expect(result.metadata.sampleCount).toBe(1);
      expect(result.filename).toMatch(/ortb-integration-example-publisher-\d{4}-\d{2}-\d{2}\.html/);
      expect(result.mimeType).toBe('text/html');
    });

    it('should create Markdown publisher template', async () => {
      const options: PublisherTemplateOptions = {
        format: 'markdown'
      };

      const result = await sharingService.createPublisherTemplate(mockPublisherTemplateData, options);

      expect(result.content).toContain('# ORTB Integration Guide - Example Publisher');
      expect(result.content).toContain('## Publisher Information');
      expect(result.content).toContain('```json');
      expect(result.metadata.format).toBe('markdown');
      expect(result.filename).toMatch(/\.markdown$/);
      expect(result.mimeType).toBe('text/markdown');
    });

    it('should create JSON publisher template', async () => {
      const options: PublisherTemplateOptions = {
        format: 'json'
      };

      const result = await sharingService.createPublisherTemplate(mockPublisherTemplateData, options);

      const parsedContent = JSON.parse(result.content);
      expect(parsedContent.publisherInfo.name).toBe('Example Publisher');
      expect(parsedContent.samples).toHaveLength(1);
      expect(result.metadata.format).toBe('json');
      expect(result.mimeType).toBe('application/json');
    });

    it('should create PDF-optimized template', async () => {
      const options: PublisherTemplateOptions = {
        format: 'pdf',
        branding: {
          companyName: 'PDF Company',
          customCSS: 'body { font-size: 10px; }'
        }
      };

      const result = await sharingService.createPublisherTemplate(mockPublisherTemplateData, options);

      expect(result.content).toContain('@page { margin: 1in; }');
      expect(result.content).toContain('font-size: 10px;');
      expect(result.metadata.format).toBe('pdf');
      expect(result.mimeType).toBe('application/pdf');
    });

    it('should handle template with minimal data', async () => {
      const minimalData: PublisherTemplateData = {
        samples: [mockORTBRequest],
        publisherInfo: {
          name: 'Minimal Publisher',
          adFormats: [{ type: 'display' }]
        },
        integrationContext: {
          phase: 'testing'
        }
      };

      const result = await sharingService.createPublisherTemplate(minimalData);

      expect(result.content).toContain('Minimal Publisher');
      expect(result.metadata.publisherName).toBe('Minimal Publisher');
      expect(result.metadata.sampleCount).toBe(1);
    });
  });

  describe('exportBatchForSharing', () => {
    it('should export batch with default options', async () => {
      const requests = [mockORTBRequest, { ...mockORTBRequest, id: 'request-2' }];
      
      const result = await sharingService.exportBatchForSharing(requests);

      expect(result.exportResult.success).toBe(true);
      expect(result.exportResult.metadata.recordCount).toBe(2);
      expect(result.shareableLink.shareId).toBeDefined();
      expect(result.summary.totalSamples).toBe(2);
      expect(result.summary.groupedSamples).toHaveLength(1);
      expect(result.summary.groupedSamples[0].groupName).toBe('All Samples');
      expect(result.summary.recommendedActions).toContain('Test sample requests in your integration environment');
    });

    it('should group samples by ad format', async () => {
      const displayRequest = mockORTBRequest;
      const videoRequest = {
        ...mockORTBRequest,
        id: 'video-request',
        imp: [{ id: '1', video: { w: 640, h: 480, minduration: 5, maxduration: 30 } }]
      };

      const requests = [displayRequest, videoRequest];
      const options: BatchShareOptions = {
        format: 'json',
        groupBy: 'adFormat'
      };

      const result = await sharingService.exportBatchForSharing(requests, options);

      expect(result.summary.groupedSamples).toHaveLength(2);
      expect(result.summary.groupedSamples.some(g => g.groupName === 'Display')).toBe(true);
      expect(result.summary.groupedSamples.some(g => g.groupName === 'Video')).toBe(true);
    });

    it('should include validation when requested', async () => {
      const requests = [mockORTBRequest];
      const options: BatchShareOptions = {
        format: 'json',
        includeValidation: true
      };

      const result = await sharingService.exportBatchForSharing(requests, options);

      expect(result.summary.validationSummary).toBeDefined();
      expect(result.summary.validationSummary?.totalValidated).toBe(1);
      expect(result.summary.validationSummary?.validSamples).toBe(1);
    });

    it('should anonymize batch data when requested', async () => {
      const requests = [mockORTBRequest];
      const options: BatchShareOptions = {
        format: 'json',
        anonymize: true,
        metadata: {
          title: 'Anonymized Batch',
          description: 'Test batch with anonymized data',
          purpose: 'testing',
          targetAudience: ['publishers'],
          createdBy: 'test-user'
        }
      };

      const result = await sharingService.exportBatchForSharing(requests, options);

      expect(result.shareableLink.metadata.isAnonymized).toBe(true);
      expect(result.shareableLink.metadata.title).toBe('Anonymized Batch');
    });

    it('should handle large batches', async () => {
      const requests = Array.from({ length: 15 }, (_, i) => ({
        ...mockORTBRequest,
        id: `request-${i + 1}`
      }));

      const result = await sharingService.exportBatchForSharing(requests);

      expect(result.summary.totalSamples).toBe(15);
      expect(result.summary.recommendedActions).toContain('Consider grouping samples by ad format for easier review');
    });
  });

  describe('generateCollaborationReport', () => {
    it('should generate comprehensive collaboration report', async () => {
      const result = await sharingService.generateCollaborationReport(mockCollaborationData);

      expect(result.content).toContain('Publisher Integration Project');
      expect(result.content).toContain('Alice Developer');
      expect(result.content).toContain('Bob Publisher');
      expect(result.content).toContain('Initial Setup');
      expect(result.content).toContain('Integration Testing');
      expect(result.metadata.projectName).toBe('Publisher Integration Project');
      expect(result.metadata.participantCount).toBe(2);
      expect(result.metadata.currentPhase).toBe('Testing');
      expect(result.metadata.completionPercentage).toBe(50); // 1 of 2 milestones completed
    });

    it('should generate appropriate next steps', async () => {
      const result = await sharingService.generateCollaborationReport(mockCollaborationData);

      // Check that next steps are generated
      expect(result.nextSteps.length).toBeGreaterThan(0);
      expect(result.nextSteps.some(step => step.includes('validation'))).toBe(true);
      expect(result.nextSteps).toContain('Schedule next collaboration review meeting');
      expect(result.nextSteps).toContain('Update project documentation with latest findings');
    });

    it('should generate action items', async () => {
      const result = await sharingService.generateCollaborationReport(mockCollaborationData);

      expect(result.actionItems).toHaveLength(1);
      expect(result.actionItems[0].assignee).toBe('Alice Developer');
      expect(result.actionItems[0].task).toContain('Fix 1 validation errors');
      expect(result.actionItems[0].priority).toBe('high');
      expect(result.actionItems[0].category).toBe('validation');
    });

    it('should handle collaboration with no validation issues', async () => {
      const cleanCollaborationData = {
        ...mockCollaborationData,
        validationResults: [{
          ...mockValidationResult,
          isValid: true,
          errors: []
        }]
      };

      const result = await sharingService.generateCollaborationReport(cleanCollaborationData);

      expect(result.nextSteps).not.toContain('Address');
      expect(result.actionItems).toHaveLength(0);
    });

    it('should handle collaboration with delayed milestones', async () => {
      const delayedCollaborationData = {
        ...mockCollaborationData,
        context: {
          ...mockCollaborationData.context,
          timeline: {
            ...mockCollaborationData.context.timeline,
            milestones: [
              {
                name: 'Delayed Milestone',
                dueDate: new Date('2024-01-01'),
                status: 'delayed' as const,
                deliverables: ['Overdue deliverable']
              }
            ]
          }
        }
      };

      const result = await sharingService.generateCollaborationReport(delayedCollaborationData);

      expect(result.actionItems.some(item => item.task.includes('delayed milestone'))).toBe(true);
    });
  });

  describe('Ad format inference', () => {
    it('should correctly infer display ad format', () => {
      const displayRequest = {
        ...mockORTBRequest,
        imp: [{ id: '1', banner: { w: 300, h: 250 } }]
      };

      // Test through batch export to access the private method
      const result = sharingService.exportBatchForSharing([displayRequest], { groupBy: 'adFormat' });
      
      result.then(res => {
        expect(res.summary.groupedSamples.some(g => g.groupName === 'Display')).toBe(true);
      });
    });

    it('should correctly infer video ad format', () => {
      const videoRequest = {
        ...mockORTBRequest,
        imp: [{ id: '1', video: { w: 640, h: 480, minduration: 5, maxduration: 30 } }]
      };

      const result = sharingService.exportBatchForSharing([videoRequest], { groupBy: 'adFormat' });
      
      result.then(res => {
        expect(res.summary.groupedSamples.some(g => g.groupName === 'Video')).toBe(true);
      });
    });

    it('should handle unknown ad format', () => {
      const unknownRequest = {
        ...mockORTBRequest,
        imp: [{ id: '1' }] // No banner, video, native, or audio
      };

      const result = sharingService.exportBatchForSharing([unknownRequest], { groupBy: 'adFormat' });
      
      result.then(res => {
        expect(res.summary.groupedSamples.some(g => g.groupName === 'Unknown')).toBe(true);
      });
    });
  });

  describe('Template filename generation', () => {
    it('should generate valid filename for publisher template', async () => {
      const data = {
        ...mockPublisherTemplateData,
        publisherInfo: {
          ...mockPublisherTemplateData.publisherInfo,
          name: 'Test Publisher With Spaces & Special-Chars!'
        }
      };

      const result = await sharingService.createPublisherTemplate(data);

      expect(result.filename).toMatch(/ortb-integration-test-publisher-with-spaces---special-chars--\d{4}-\d{2}-\d{2}\.html/);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid template format gracefully', async () => {
      const options: PublisherTemplateOptions = {
        format: 'invalid' as any
      };

      const result = await sharingService.createPublisherTemplate(mockPublisherTemplateData, options);

      // Should default to HTML
      expect(result.content).toContain('<!DOCTYPE html>');
      expect(result.metadata.format).toBe('invalid');
    });

    it('should handle empty sample arrays', async () => {
      const result = await sharingService.exportBatchForSharing([]);

      expect(result.summary.totalSamples).toBe(0);
      expect(result.summary.groupedSamples).toHaveLength(1);
      expect(result.summary.groupedSamples[0].count).toBe(0);
    });
  });
});