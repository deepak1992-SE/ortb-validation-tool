/**
 * Sharing Service Implementation
 * Provides sharing and collaboration features for validation results and samples
 */

import { 
  ValidationResult, 
  BatchValidationResult,
  ValidationReport,
  ORTBRequest
} from '../models';
import { ORTBExportService, ExportOptions, ExportResult } from './export-service';

export interface SharingService {
  createShareableLink(data: ShareableData, options?: ShareOptions): Promise<ShareableLink>;
  getSharedData(shareId: string): Promise<SharedDataResult>;
  createPublisherTemplate(data: PublisherTemplateData, options?: PublisherTemplateOptions): Promise<PublisherTemplate>;
  exportBatchForSharing(requests: ORTBRequest[], options?: BatchShareOptions): Promise<BatchShareResult>;
  generateCollaborationReport(data: CollaborationData): Promise<CollaborationReport>;
}

export type ShareableDataType = 'validation-result' | 'validation-report' | 'sample-request' | 'batch-results';

export interface ShareableData {
  type: ShareableDataType;
  data: any;
  metadata?: ShareMetadata;
}

export interface ShareMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  createdBy?: string;
  organization?: string;
  expiresAt?: Date;
  isPublic?: boolean;
}

export interface ShareOptions {
  /** How long the share link should be valid (in hours) */
  expirationHours?: number;
  /** Whether the shared data should be publicly accessible */
  isPublic?: boolean;
  /** Password protection for the shared link */
  password?: string;
  /** Whether to allow downloads of the shared data */
  allowDownload?: boolean;
  /** Custom share URL slug */
  customSlug?: string;
  /** Anonymize sensitive data before sharing */
  anonymize?: boolean;
}

export interface ShareableLink {
  /** Unique share identifier */
  shareId: string;
  /** Full shareable URL */
  url: string;
  /** Short URL for easy sharing */
  shortUrl: string;
  /** QR code data URL for the link */
  qrCode: string;
  /** Share expiration date */
  expiresAt: Date;
  /** Whether the link is password protected */
  isPasswordProtected: boolean;
  /** Share creation timestamp */
  createdAt: Date;
  /** Share metadata */
  metadata: ShareLinkMetadata;
}

export interface ShareLinkMetadata {
  dataType: ShareableDataType;
  title: string;
  description?: string;
  recordCount: number;
  fileSize: number;
  isAnonymized: boolean;
  allowDownload: boolean;
}

export interface SharedDataResult {
  /** Whether the share was found and is valid */
  success: boolean;
  /** The shared data (if successful) */
  data?: any;
  /** Share metadata */
  metadata?: ShareLinkMetadata;
  /** Error message if unsuccessful */
  error?: string;
  /** Whether password is required */
  requiresPassword?: boolean;
}

export interface PublisherTemplateData {
  /** Sample ORTB requests */
  samples: ORTBRequest[];
  /** Publisher information */
  publisherInfo: PublisherInfo;
  /** Integration context */
  integrationContext: IntegrationContext;
  /** Additional documentation */
  documentation?: TemplateDocumentation;
}

export interface PublisherInfo {
  name: string;
  domain?: string;
  contactEmail?: string;
  integrationManager?: string;
  adFormats: AdFormat[];
  targetingCapabilities?: string[];
  specialRequirements?: string[];
}

export interface IntegrationContext {
  /** Integration phase (testing, staging, production) */
  phase: 'testing' | 'staging' | 'production';
  /** Expected traffic volume */
  expectedVolume?: number;
  /** Geographic targeting */
  geoTargeting?: string[];
  /** Device targeting */
  deviceTargeting?: string[];
  /** Integration timeline */
  timeline?: IntegrationTimeline;
}

export interface IntegrationTimeline {
  startDate: Date;
  testingPhase: Date;
  stagingPhase: Date;
  productionLaunch: Date;
}

export interface AdFormat {
  type: 'display' | 'video' | 'native' | 'audio';
  sizes?: Array<{ w: number; h: number }>;
  specifications?: Record<string, any>;
}

export interface TemplateDocumentation {
  overview: string;
  integrationSteps: string[];
  testingGuidelines: string[];
  troubleshooting: TroubleshootingItem[];
  contactInfo: ContactInfo;
}

export interface TroubleshootingItem {
  issue: string;
  solution: string;
  category: 'validation' | 'integration' | 'technical';
}

export interface ContactInfo {
  technicalContact: string;
  businessContact: string;
  supportEmail: string;
  documentationUrl?: string;
}

export interface PublisherTemplateOptions {
  /** Template format */
  format: 'html' | 'pdf' | 'markdown' | 'json';
  /** Include sample validation results */
  includeSampleValidation?: boolean;
  /** Branding options */
  branding?: BrandingOptions;
  /** Language for the template */
  language?: string;
}

export interface BrandingOptions {
  companyName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customCSS?: string;
}

export interface PublisherTemplate {
  /** Template content */
  content: string;
  /** Template metadata */
  metadata: TemplateMetadata;
  /** Suggested filename */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** Template size in bytes */
  size: number;
}

export interface TemplateMetadata {
  format: string;
  generatedAt: Date;
  publisherName: string;
  sampleCount: number;
  includesValidation: boolean;
  language: string;
}

export interface BatchShareOptions {
  /** Export format for the batch */
  format: 'json' | 'csv' | 'html';
  /** Group samples by criteria */
  groupBy?: 'adFormat' | 'publisher' | 'validation-status';
  /** Include validation results for each sample */
  includeValidation?: boolean;
  /** Anonymize sensitive data */
  anonymize?: boolean;
  /** Custom metadata for the batch */
  metadata?: BatchShareMetadata;
}

export interface BatchShareMetadata {
  title: string;
  description?: string;
  purpose: 'testing' | 'documentation' | 'integration' | 'training';
  targetAudience: string[];
  createdBy: string;
  tags?: string[];
}

export interface BatchShareResult {
  /** Export result */
  exportResult: ExportResult;
  /** Shareable link */
  shareableLink: ShareableLink;
  /** Batch summary */
  summary: BatchShareSummary;
}

export interface BatchShareSummary {
  totalSamples: number;
  groupedSamples: GroupedSamples[];
  validationSummary?: ValidationSummary;
  recommendedActions: string[];
}

export interface GroupedSamples {
  groupName: string;
  count: number;
  samples: ORTBRequest[];
}

export interface ValidationSummary {
  totalValidated: number;
  validSamples: number;
  invalidSamples: number;
  commonIssues: string[];
}

export interface CollaborationData {
  /** Shared validation results */
  validationResults: ValidationResult[];
  /** Shared samples */
  samples: ORTBRequest[];
  /** Collaboration context */
  context: CollaborationContext;
}

export interface CollaborationContext {
  projectName: string;
  participants: Participant[];
  timeline: CollaborationTimeline;
  objectives: string[];
  currentPhase: string;
}

export interface Participant {
  name: string;
  role: 'developer' | 'qa' | 'business' | 'publisher' | 'advertiser';
  email: string;
  organization: string;
}

export interface CollaborationTimeline {
  startDate: Date;
  milestones: Milestone[];
  currentMilestone: string;
}

export interface Milestone {
  name: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  deliverables: string[];
}

export interface CollaborationReport {
  /** Report content */
  content: string;
  /** Report metadata */
  metadata: CollaborationReportMetadata;
  /** Recommended next steps */
  nextSteps: string[];
  /** Action items by participant */
  actionItems: ActionItem[];
}

export interface CollaborationReportMetadata {
  projectName: string;
  generatedAt: Date;
  participantCount: number;
  currentPhase: string;
  completionPercentage: number;
}

export interface ActionItem {
  assignee: string;
  task: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: Date;
  category: 'validation' | 'integration' | 'testing' | 'documentation';
}

/**
 * Main sharing service implementation
 */
export class ORTBSharingService implements SharingService {
  private exportService: ORTBExportService;
  private shareStorage: Map<string, StoredShare> = new Map();
  private readonly baseUrl = 'https://ortb-validator.example.com/share';

  constructor() {
    this.exportService = new ORTBExportService();
  }

  /**
   * Create a shareable link for validation results or samples
   */
  async createShareableLink(data: ShareableData, options: ShareOptions = {}): Promise<ShareableLink> {
    const shareId = this.generateShareId();
    const expirationHours = options.expirationHours ?? 168; // Default 7 days
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

    // Anonymize data if requested
    let shareData = data.data;
    if (options.anonymize) {
      shareData = this.exportService.anonymizeData(shareData, {
        fieldsToAnonymize: [
          'user.id', 'user.buyeruid', 'device.ifa', 'device.ip', 
          'site.domain', 'site.page', 'app.bundle'
        ],
        strategy: 'mask'
      });
    }

    // Store the shared data
    const storedShare: StoredShare = {
      shareId,
      data: shareData,
      metadata: data.metadata || {},
      options,
      createdAt: new Date(),
      expiresAt,
      accessCount: 0
    };

    this.shareStorage.set(shareId, storedShare);

    // Generate URLs
    const url = `${this.baseUrl}/${shareId}`;
    const shortUrl = `${this.baseUrl}/s/${shareId.substring(0, 8)}`;
    const qrCode = this.generateQRCode(url);

    // Calculate metadata
    const recordCount = this.calculateRecordCount(data.data, data.type);
    const fileSize = JSON.stringify(shareData).length;

    return {
      shareId,
      url,
      shortUrl,
      qrCode,
      expiresAt,
      isPasswordProtected: !!options.password,
      createdAt: new Date(),
      metadata: {
        dataType: data.type,
        title: data.metadata?.title || this.getDefaultTitle(data.type),
        description: data.metadata?.description,
        recordCount,
        fileSize,
        isAnonymized: !!options.anonymize,
        allowDownload: options.allowDownload ?? true
      }
    };
  }

  /**
   * Retrieve shared data by share ID
   */
  async getSharedData(shareId: string): Promise<SharedDataResult> {
    const storedShare = this.shareStorage.get(shareId);

    if (!storedShare) {
      return {
        success: false,
        error: 'Share not found'
      };
    }

    // Check expiration
    if (storedShare.expiresAt < new Date()) {
      this.shareStorage.delete(shareId);
      return {
        success: false,
        error: 'Share has expired'
      };
    }

    // Check password protection
    if (storedShare.options.password) {
      return {
        success: false,
        requiresPassword: true,
        error: 'Password required'
      };
    }

    // Increment access count
    storedShare.accessCount++;

    return {
      success: true,
      data: storedShare.data,
      metadata: {
        dataType: this.inferDataType(storedShare.data),
        title: storedShare.metadata.title || 'Shared ORTB Data',
        description: storedShare.metadata.description,
        recordCount: this.calculateRecordCount(storedShare.data, this.inferDataType(storedShare.data)),
        fileSize: JSON.stringify(storedShare.data).length,
        isAnonymized: !!storedShare.options.anonymize,
        allowDownload: storedShare.options.allowDownload ?? true
      }
    };
  }

  /**
   * Create a publisher-optimized template
   */
  async createPublisherTemplate(
    data: PublisherTemplateData, 
    options: PublisherTemplateOptions = { format: 'html' }
  ): Promise<PublisherTemplate> {
    const content = await this.generatePublisherTemplateContent(data, options);
    const filename = this.generatePublisherTemplateFilename(data.publisherInfo.name, options.format);

    return {
      content,
      metadata: {
        format: options.format,
        generatedAt: new Date(),
        publisherName: data.publisherInfo.name,
        sampleCount: data.samples.length,
        includesValidation: !!options.includeSampleValidation,
        language: options.language || 'en'
      },
      filename,
      mimeType: this.getMimeTypeForFormat(options.format),
      size: content.length
    };
  }

  /**
   * Export batch of samples for sharing
   */
  async exportBatchForSharing(
    requests: ORTBRequest[], 
    options: BatchShareOptions = { format: 'json' }
  ): Promise<BatchShareResult> {
    // Group samples if requested
    const groupedSamples = options.groupBy ? this.groupSamples(requests, options.groupBy) : [
      { groupName: 'All Samples', count: requests.length, samples: requests }
    ];

    // Export the batch
    const exportOptions: ExportOptions = {
      format: options.format,
      anonymize: options.anonymize,
      filename: 'batch-samples'
    };

    const exportResult = await this.exportService.exportMultipleSamples(requests, exportOptions);

    // Create shareable link
    const shareableData: ShareableData = {
      type: 'batch-results',
      data: requests,
      metadata: {
        title: options.metadata?.title || 'ORTB Sample Batch',
        description: options.metadata?.description,
        tags: options.metadata?.tags,
        createdBy: options.metadata?.createdBy
      }
    };

    const shareableLink = await this.createShareableLink(shareableData, {
      anonymize: options.anonymize,
      allowDownload: true
    });

    // Generate validation summary if requested
    let validationSummary: ValidationSummary | undefined;
    if (options.includeValidation) {
      // This would integrate with the validation service
      validationSummary = {
        totalValidated: requests.length,
        validSamples: requests.length, // Simplified - would use actual validation
        invalidSamples: 0,
        commonIssues: []
      };
    }

    return {
      exportResult,
      shareableLink,
      summary: {
        totalSamples: requests.length,
        groupedSamples,
        validationSummary,
        recommendedActions: this.generateRecommendedActions(requests, options)
      }
    };
  }

  /**
   * Generate collaboration report
   */
  async generateCollaborationReport(data: CollaborationData): Promise<CollaborationReport> {
    const content = this.generateCollaborationReportContent(data);
    const nextSteps = this.generateNextSteps(data);
    const actionItems = this.generateActionItems(data);

    const completedMilestones = data.context.timeline.milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = data.context.timeline.milestones.length;
    const completionPercentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    return {
      content,
      metadata: {
        projectName: data.context.projectName,
        generatedAt: new Date(),
        participantCount: data.context.participants.length,
        currentPhase: data.context.currentPhase,
        completionPercentage
      },
      nextSteps,
      actionItems
    };
  }

  /**
   * Generate unique share ID
   */
  private generateShareId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${random}`;
  }

  /**
   * Generate QR code data URL (simplified implementation)
   */
  private generateQRCode(url: string): string {
    // In a real implementation, this would generate an actual QR code
    // For now, return a placeholder data URL
    return `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="white"/><text x="50" y="50" text-anchor="middle" font-size="8">QR Code for: ${url}</text></svg>`).toString('base64')}`;
  }

  /**
   * Calculate record count based on data type
   */
  private calculateRecordCount(data: any, type: ShareableDataType): number {
    switch (type) {
      case 'validation-result':
      case 'validation-report':
      case 'sample-request':
        return 1;
      case 'batch-results':
        return Array.isArray(data) ? data.length : (data.results ? data.results.length : 1);
      default:
        return 1;
    }
  }

  /**
   * Get default title for data type
   */
  private getDefaultTitle(type: ShareableDataType): string {
    switch (type) {
      case 'validation-result':
        return 'ORTB Validation Result';
      case 'validation-report':
        return 'ORTB Validation Report';
      case 'sample-request':
        return 'ORTB Sample Request';
      case 'batch-results':
        return 'ORTB Batch Results';
      default:
        return 'ORTB Data';
    }
  }

  /**
   * Infer data type from data structure
   */
  private inferDataType(data: any): ShareableDataType {
    if (!data || typeof data !== 'object') {
      return 'sample-request'; // Default for non-object data
    }
    
    if (data.isValid !== undefined && data.errors !== undefined) {
      return 'validation-result';
    }
    if (data.summary !== undefined && data.fieldResults !== undefined) {
      return 'validation-report';
    }
    if (data.results !== undefined && Array.isArray(data.results)) {
      return 'batch-results';
    }
    if (data.id !== undefined && data.imp !== undefined) {
      return 'sample-request';
    }
    return 'sample-request'; // Default
  }

  /**
   * Generate publisher template content
   */
  private async generatePublisherTemplateContent(
    data: PublisherTemplateData, 
    options: PublisherTemplateOptions
  ): Promise<string> {
    switch (options.format) {
      case 'html':
        return this.generateHTMLTemplate(data, options);
      case 'markdown':
        return this.generateMarkdownTemplate(data, options);
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'pdf':
        return this.generatePDFTemplate(data, options);
      default:
        return this.generateHTMLTemplate(data, options);
    }
  }

  /**
   * Generate HTML template for publishers
   */
  private generateHTMLTemplate(data: PublisherTemplateData, options: PublisherTemplateOptions): string {
    const branding = options.branding || { companyName: 'ORTB Validation Tool' };
    const timestamp = new Date().toISOString();

    return `
<!DOCTYPE html>
<html lang="${options.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ORTB Integration Guide - ${data.publisherInfo.name}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px; 
            color: #333;
            background-color: ${branding.primaryColor || '#f5f5f5'};
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
            border-bottom: 3px solid ${branding.primaryColor || '#007bff'}; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .header h1 { 
            color: ${branding.primaryColor || '#007bff'}; 
            margin: 0; 
        }
        .section { 
            margin-bottom: 30px; 
        }
        .section h2 { 
            color: ${branding.secondaryColor || '#333'}; 
            border-left: 4px solid ${branding.primaryColor || '#007bff'}; 
            padding-left: 15px; 
        }
        .sample-request { 
            background: #f8f9fa; 
            border: 1px solid #dee2e6; 
            border-radius: 4px; 
            padding: 15px; 
            margin: 10px 0; 
        }
        .sample-request h3 { 
            margin-top: 0; 
            color: #495057; 
        }
        pre { 
            background: #f1f3f4; 
            padding: 15px; 
            border-radius: 4px; 
            overflow-x: auto; 
            font-size: 12px; 
        }
        .info-box { 
            background: #e7f3ff; 
            border-left: 4px solid #007bff; 
            padding: 15px; 
            margin: 15px 0; 
        }
        .warning-box { 
            background: #fff3cd; 
            border-left: 4px solid #ffc107; 
            padding: 15px; 
            margin: 15px 0; 
        }
        .contact-info { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 4px; 
            margin-top: 30px; 
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
        }
        th, td { 
            border: 1px solid #dee2e6; 
            padding: 12px; 
            text-align: left; 
        }
        th { 
            background-color: #f8f9fa; 
            font-weight: bold; 
        }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #dee2e6; 
            text-align: center; 
            color: #6c757d; 
            font-size: 14px; 
        }
        ${options.branding?.customCSS || ''}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ORTB Integration Guide</h1>
            <h2>Publisher: ${data.publisherInfo.name}</h2>
            <p>Generated on: ${timestamp}</p>
            ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="${branding.companyName}" style="max-height: 60px;">` : ''}
        </div>

        <div class="section">
            <h2>Overview</h2>
            <p>${data.documentation?.overview || 'This document provides ORTB sample requests and integration guidance for ' + data.publisherInfo.name + '.'}</p>
            
            <div class="info-box">
                <strong>Integration Phase:</strong> ${data.integrationContext.phase}<br>
                <strong>Expected Volume:</strong> ${data.integrationContext.expectedVolume || 'Not specified'}<br>
                <strong>Ad Formats:</strong> ${data.publisherInfo.adFormats.map(f => f.type).join(', ')}
            </div>
        </div>

        <div class="section">
            <h2>Publisher Information</h2>
            <table>
                <tr><th>Property</th><th>Value</th></tr>
                <tr><td>Publisher Name</td><td>${data.publisherInfo.name}</td></tr>
                <tr><td>Domain</td><td>${data.publisherInfo.domain || 'Not specified'}</td></tr>
                <tr><td>Contact Email</td><td>${data.publisherInfo.contactEmail || 'Not specified'}</td></tr>
                <tr><td>Integration Manager</td><td>${data.publisherInfo.integrationManager || 'Not specified'}</td></tr>
                <tr><td>Supported Ad Formats</td><td>${data.publisherInfo.adFormats.map(f => f.type).join(', ')}</td></tr>
            </table>
        </div>

        <div class="section">
            <h2>Sample ORTB Requests</h2>
            <p>Below are ${data.samples.length} sample ORTB request(s) tailored for your integration:</p>
            
            ${data.samples.map((sample, index) => `
                <div class="sample-request">
                    <h3>Sample Request ${index + 1}</h3>
                    <p><strong>Request ID:</strong> ${sample.id}</p>
                    <p><strong>Ad Format:</strong> ${this.inferAdFormat(sample)}</p>
                    <pre><code>${JSON.stringify(sample, null, 2)}</code></pre>
                </div>
            `).join('')}
        </div>

        ${data.documentation?.integrationSteps ? `
        <div class="section">
            <h2>Integration Steps</h2>
            <ol>
                ${data.documentation.integrationSteps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
        ` : ''}

        ${data.documentation?.testingGuidelines ? `
        <div class="section">
            <h2>Testing Guidelines</h2>
            <ul>
                ${data.documentation.testingGuidelines.map(guideline => `<li>${guideline}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${data.documentation?.troubleshooting ? `
        <div class="section">
            <h2>Troubleshooting</h2>
            ${data.documentation.troubleshooting.map(item => `
                <div class="warning-box">
                    <strong>Issue:</strong> ${item.issue}<br>
                    <strong>Solution:</strong> ${item.solution}<br>
                    <strong>Category:</strong> ${item.category}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${data.documentation?.contactInfo ? `
        <div class="contact-info">
            <h2>Contact Information</h2>
            <p><strong>Technical Contact:</strong> ${data.documentation.contactInfo.technicalContact}</p>
            <p><strong>Business Contact:</strong> ${data.documentation.contactInfo.businessContact}</p>
            <p><strong>Support Email:</strong> ${data.documentation.contactInfo.supportEmail}</p>
            ${data.documentation.contactInfo.documentationUrl ? `<p><strong>Documentation:</strong> <a href="${data.documentation.contactInfo.documentationUrl}">${data.documentation.contactInfo.documentationUrl}</a></p>` : ''}
        </div>
        ` : ''}

        <div class="footer">
            <p>Generated by ${branding.companyName} ORTB Validation Tool</p>
            <p>This document contains ${data.samples.length} sample request(s) for integration testing.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate Markdown template for publishers
   */
  private generateMarkdownTemplate(data: PublisherTemplateData, options: PublisherTemplateOptions): string {
    const timestamp = new Date().toISOString();
    
    return `# ORTB Integration Guide - ${data.publisherInfo.name}

Generated on: ${timestamp}

## Overview

${data.documentation?.overview || `This document provides ORTB sample requests and integration guidance for ${data.publisherInfo.name}.`}

**Integration Details:**
- **Phase:** ${data.integrationContext.phase}
- **Expected Volume:** ${data.integrationContext.expectedVolume || 'Not specified'}
- **Ad Formats:** ${data.publisherInfo.adFormats.map(f => f.type).join(', ')}

## Publisher Information

| Property | Value |
|----------|-------|
| Publisher Name | ${data.publisherInfo.name} |
| Domain | ${data.publisherInfo.domain || 'Not specified'} |
| Contact Email | ${data.publisherInfo.contactEmail || 'Not specified'} |
| Integration Manager | ${data.publisherInfo.integrationManager || 'Not specified'} |
| Supported Ad Formats | ${data.publisherInfo.adFormats.map(f => f.type).join(', ')} |

## Sample ORTB Requests

Below are ${data.samples.length} sample ORTB request(s) tailored for your integration:

${data.samples.map((sample, index) => `
### Sample Request ${index + 1}

**Request ID:** ${sample.id}  
**Ad Format:** ${this.inferAdFormat(sample)}

\`\`\`json
${JSON.stringify(sample, null, 2)}
\`\`\`
`).join('')}

${data.documentation?.integrationSteps ? `
## Integration Steps

${data.documentation.integrationSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}
` : ''}

${data.documentation?.testingGuidelines ? `
## Testing Guidelines

${data.documentation.testingGuidelines.map(guideline => `- ${guideline}`).join('\n')}
` : ''}

${data.documentation?.troubleshooting ? `
## Troubleshooting

${data.documentation.troubleshooting.map(item => `
### ${item.issue}

**Category:** ${item.category}  
**Solution:** ${item.solution}
`).join('')}
` : ''}

${data.documentation?.contactInfo ? `
## Contact Information

- **Technical Contact:** ${data.documentation.contactInfo.technicalContact}
- **Business Contact:** ${data.documentation.contactInfo.businessContact}
- **Support Email:** ${data.documentation.contactInfo.supportEmail}
${data.documentation.contactInfo.documentationUrl ? `- **Documentation:** ${data.documentation.contactInfo.documentationUrl}` : ''}
` : ''}

---

*Generated by ${options.branding?.companyName || 'ORTB Validation Tool'}*  
*This document contains ${data.samples.length} sample request(s) for integration testing.*`;
  }

  /**
   * Generate PDF template (HTML version for PDF conversion)
   */
  private generatePDFTemplate(data: PublisherTemplateData, options: PublisherTemplateOptions): string {
    // Return HTML optimized for PDF conversion
    return this.generateHTMLTemplate(data, {
      ...options,
      branding: {
        ...options.branding,
        customCSS: `
          @page { margin: 1in; }
          body { font-size: 12px; }
          .container { box-shadow: none; }
          .sample-request { page-break-inside: avoid; }
          ${options.branding?.customCSS || ''}
        `
      }
    });
  }

  /**
   * Generate filename for publisher template
   */
  private generatePublisherTemplateFilename(publisherName: string, format: string): string {
    const sanitizedName = publisherName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    return `ortb-integration-${sanitizedName}-${timestamp}.${format}`;
  }

  /**
   * Get MIME type for format
   */
  private getMimeTypeForFormat(format: string): string {
    switch (format) {
      case 'html':
        return 'text/html';
      case 'markdown':
        return 'text/markdown';
      case 'json':
        return 'application/json';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'text/plain';
    }
  }

  /**
   * Group samples by specified criteria
   */
  private groupSamples(requests: ORTBRequest[], groupBy: string): GroupedSamples[] {
    const groups = new Map<string, ORTBRequest[]>();

    requests.forEach(request => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'adFormat':
          groupKey = this.inferAdFormat(request);
          break;
        case 'publisher':
          groupKey = request.site?.domain || request.app?.bundle || 'Unknown Publisher';
          break;
        case 'validation-status':
          groupKey = 'Valid'; // Simplified - would use actual validation
          break;
        default:
          groupKey = 'All';
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(request);
    });

    return Array.from(groups.entries()).map(([groupName, samples]) => ({
      groupName,
      count: samples.length,
      samples
    }));
  }

  /**
   * Infer ad format from ORTB request
   */
  private inferAdFormat(request: ORTBRequest): string {
    if (!request.imp || request.imp.length === 0) return 'Unknown';
    
    const imp = request.imp[0];
    if (imp.banner) return 'Display';
    if (imp.video) return 'Video';
    if (imp.native) return 'Native';
    if (imp.audio) return 'Audio';
    
    return 'Unknown';
  }

  /**
   * Generate recommended actions for batch sharing
   */
  private generateRecommendedActions(requests: ORTBRequest[], options: BatchShareOptions): string[] {
    const actions: string[] = [];

    if (requests.length > 10) {
      actions.push('Consider grouping samples by ad format for easier review');
    }

    if (options.includeValidation) {
      actions.push('Review validation results before sharing with publishers');
    }

    if (options.anonymize) {
      actions.push('Verify that all sensitive data has been properly anonymized');
    }

    actions.push('Test sample requests in your integration environment');
    actions.push('Share feedback and results with the development team');

    return actions;
  }

  /**
   * Generate collaboration report content
   */
  private generateCollaborationReportContent(data: CollaborationData): string {
    const timestamp = new Date().toISOString();
    
    return `# Collaboration Report: ${data.context.projectName}

Generated on: ${timestamp}

## Project Overview

**Current Phase:** ${data.context.currentPhase}  
**Participants:** ${data.context.participants.length}  
**Objectives:** ${data.context.objectives.join(', ')}

## Participants

${data.context.participants.map(p => `- **${p.name}** (${p.role}) - ${p.organization} - ${p.email}`).join('\n')}

## Timeline & Milestones

**Current Milestone:** ${data.context.timeline.currentMilestone}

${data.context.timeline.milestones.map(m => `
### ${m.name}
- **Due Date:** ${m.dueDate.toISOString().split('T')[0]}
- **Status:** ${m.status}
- **Deliverables:** ${m.deliverables.join(', ')}
`).join('')}

## Validation Results Summary

- **Total Results:** ${data.validationResults.length}
- **Valid Results:** ${data.validationResults.filter(r => r.isValid).length}
- **Invalid Results:** ${data.validationResults.filter(r => !r.isValid).length}

## Sample Requests Summary

- **Total Samples:** ${data.samples.length}
- **Ad Formats:** ${[...new Set(data.samples.map(s => this.inferAdFormat(s)))].join(', ')}

## Key Insights

${this.generateCollaborationInsights(data).map(insight => `- ${insight}`).join('\n')}

---

*This report was automatically generated to track collaboration progress.*`;
  }

  /**
   * Generate next steps for collaboration
   */
  private generateNextSteps(data: CollaborationData): string[] {
    const nextSteps: string[] = [];
    
    const pendingMilestones = data.context.timeline.milestones.filter(m => m.status === 'pending');
    if (pendingMilestones.length > 0) {
      nextSteps.push(`Complete ${pendingMilestones.length} pending milestone(s)`);
    }

    const invalidResults = data.validationResults.filter(r => !r.isValid);
    if (invalidResults.length > 0) {
      nextSteps.push(`Address ${invalidResults.length} validation issue(s)`);
    }

    nextSteps.push('Schedule next collaboration review meeting');
    nextSteps.push('Update project documentation with latest findings');

    return nextSteps;
  }

  /**
   * Generate action items for collaboration
   */
  private generateActionItems(data: CollaborationData): ActionItem[] {
    const actionItems: ActionItem[] = [];
    
    // Generate action items based on validation results
    const invalidResults = data.validationResults.filter(r => !r.isValid);
    if (invalidResults.length > 0) {
      const developer = data.context.participants.find(p => p.role === 'developer');
      if (developer) {
        actionItems.push({
          assignee: developer.name,
          task: `Fix ${invalidResults.length} validation errors`,
          priority: 'high',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          category: 'validation'
        });
      }
    }

    // Generate action items based on milestones
    const delayedMilestones = data.context.timeline.milestones.filter(m => m.status === 'delayed');
    delayedMilestones.forEach(milestone => {
      const assignee = data.context.participants[0]; // Simplified assignment
      actionItems.push({
        assignee: assignee.name,
        task: `Address delayed milestone: ${milestone.name}`,
        priority: 'high',
        dueDate: milestone.dueDate,
        category: 'integration'
      });
    });

    return actionItems;
  }

  /**
   * Generate collaboration insights
   */
  private generateCollaborationInsights(data: CollaborationData): string[] {
    const insights: string[] = [];
    
    const completedMilestones = data.context.timeline.milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = data.context.timeline.milestones.length;
    
    if (totalMilestones > 0) {
      const completionRate = Math.round((completedMilestones / totalMilestones) * 100);
      insights.push(`Project is ${completionRate}% complete (${completedMilestones}/${totalMilestones} milestones)`);
    }

    const validationRate = data.validationResults.length > 0 
      ? Math.round((data.validationResults.filter(r => r.isValid).length / data.validationResults.length) * 100)
      : 0;
    insights.push(`Validation success rate: ${validationRate}%`);

    const adFormats = [...new Set(data.samples.map(s => this.inferAdFormat(s)))];
    insights.push(`Testing ${adFormats.length} different ad format(s): ${adFormats.join(', ')}`);

    return insights;
  }
}

/**
 * Internal interface for stored shares
 */
interface StoredShare {
  shareId: string;
  data: any;
  metadata: ShareMetadata;
  options: ShareOptions;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
}