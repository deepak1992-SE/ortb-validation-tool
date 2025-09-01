/**
 * Export Service Implementation
 * Provides export functionality for validation results and sample requests
 */

import { 
  ValidationResult, 
  BatchValidationResult,
  ValidationReport,
  ComplianceReport,
  ORTBRequest
} from '../models';

export type ExportFormat = 'json' | 'csv' | 'pdf' | 'txt' | 'html';

export interface ExportOptions {
  /** Export format */
  format: ExportFormat;
  /** Whether to anonymize sensitive data */
  anonymize?: boolean;
  /** Custom filename (without extension) */
  filename?: string;
  /** Include metadata in export */
  includeMetadata?: boolean;
  /** Custom fields to include/exclude */
  fieldFilter?: FieldFilter;
  /** Compression options */
  compression?: CompressionOptions;
}

export interface FieldFilter {
  /** Fields to include (if specified, only these fields are included) */
  include?: string[];
  /** Fields to exclude */
  exclude?: string[];
  /** Whether to include nested fields */
  includeNested?: boolean;
}

export interface CompressionOptions {
  /** Whether to compress the export */
  enabled: boolean;
  /** Compression format */
  format?: 'zip' | 'gzip';
  /** Compression level (1-9) */
  level?: number;
}

export interface ExportResult {
  /** Export success status */
  success: boolean;
  /** Exported data (base64 encoded for binary formats) */
  data: string;
  /** MIME type of exported data */
  mimeType: string;
  /** Suggested filename with extension */
  filename: string;
  /** Size of exported data in bytes */
  size: number;
  /** Export metadata */
  metadata: ExportMetadata;
  /** Any warnings during export */
  warnings?: string[];
  /** Error message if export failed */
  error?: string;
}

export interface ExportMetadata {
  /** Export timestamp */
  exportedAt: Date;
  /** Export format used */
  format: ExportFormat;
  /** Whether data was anonymized */
  anonymized: boolean;
  /** Number of records exported */
  recordCount: number;
  /** Tool version used for export */
  toolVersion: string;
  /** Additional metadata */
  additionalInfo?: Record<string, any>;
}

export interface AnonymizationConfig {
  /** Fields to anonymize */
  fieldsToAnonymize: string[];
  /** Anonymization strategy */
  strategy: AnonymizationStrategy;
  /** Custom anonymization rules */
  customRules?: AnonymizationRule[];
}

export type AnonymizationStrategy = 'mask' | 'hash' | 'remove' | 'replace';

export interface AnonymizationRule {
  /** Field path to apply rule to */
  fieldPath: string;
  /** Anonymization strategy for this field */
  strategy: AnonymizationStrategy;
  /** Replacement value (for 'replace' strategy) */
  replacementValue?: any;
  /** Mask character (for 'mask' strategy) */
  maskCharacter?: string;
}

export interface ExportService {
  exportValidationResult(result: ValidationResult, options: ExportOptions): Promise<ExportResult>;
  exportValidationReport(report: ValidationReport, options: ExportOptions): Promise<ExportResult>;
  exportBatchResults(batchResult: BatchValidationResult, options: ExportOptions): Promise<ExportResult>;
  exportSampleRequest(request: ORTBRequest, options: ExportOptions): Promise<ExportResult>;
  exportMultipleSamples(requests: ORTBRequest[], options: ExportOptions): Promise<ExportResult>;
  anonymizeData(data: any, config: AnonymizationConfig): any;
}

/**
 * Main export service implementation
 */
export class ORTBExportService implements ExportService {
  private readonly toolVersion = '1.0.0';
  private readonly defaultAnonymizationConfig: AnonymizationConfig = {
    fieldsToAnonymize: [
      'user.id',
      'user.buyeruid',
      'device.ifa',
      'device.didsha1',
      'device.didmd5',
      'device.dpidsha1',
      'device.dpidmd5',
      'device.macsha1',
      'device.macmd5',
      'device.ip',
      'device.ipv6',
      'site.domain',
      'site.page',
      'app.bundle',
      'app.storeurl'
    ],
    strategy: 'mask'
  };

  /**
   * Export validation result in specified format
   */
  async exportValidationResult(result: ValidationResult, options: ExportOptions): Promise<ExportResult> {
    try {
      let data = result;
      
      // Apply anonymization if requested
      if (options.anonymize) {
        data = this.anonymizeData(data, this.defaultAnonymizationConfig);
      }

      // Apply field filtering
      if (options.fieldFilter) {
        data = this.applyFieldFilter(data, options.fieldFilter);
      }

      // Generate export based on format
      const exportData = await this.generateExport(data, options);
      
      return {
        success: true,
        data: exportData.content,
        mimeType: exportData.mimeType,
        filename: this.generateFilename(options.filename || 'validation-result', options.format),
        size: exportData.content.length,
        metadata: {
          exportedAt: new Date(),
          format: options.format,
          anonymized: options.anonymize || false,
          recordCount: 1,
          toolVersion: this.toolVersion
        }
      };
    } catch (error) {
      return {
        success: false,
        data: '',
        mimeType: 'text/plain',
        filename: '',
        size: 0,
        metadata: {
          exportedAt: new Date(),
          format: options.format,
          anonymized: false,
          recordCount: 0,
          toolVersion: this.toolVersion
        },
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Export validation report in specified format
   */
  async exportValidationReport(report: ValidationReport, options: ExportOptions): Promise<ExportResult> {
    try {
      let data = report;
      
      // Apply anonymization if requested
      if (options.anonymize) {
        data = this.anonymizeData(data, this.defaultAnonymizationConfig);
      }

      // Apply field filtering
      if (options.fieldFilter) {
        data = this.applyFieldFilter(data, options.fieldFilter);
      }

      // Generate export based on format
      const exportData = await this.generateExport(data, options);
      
      return {
        success: true,
        data: exportData.content,
        mimeType: exportData.mimeType,
        filename: this.generateFilename(options.filename || 'validation-report', options.format),
        size: exportData.content.length,
        metadata: {
          exportedAt: new Date(),
          format: options.format,
          anonymized: options.anonymize || false,
          recordCount: 1,
          toolVersion: this.toolVersion
        }
      };
    } catch (error) {
      return {
        success: false,
        data: '',
        mimeType: 'text/plain',
        filename: '',
        size: 0,
        metadata: {
          exportedAt: new Date(),
          format: options.format,
          anonymized: false,
          recordCount: 0,
          toolVersion: this.toolVersion
        },
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Export batch validation results in specified format
   */
  async exportBatchResults(batchResult: BatchValidationResult, options: ExportOptions): Promise<ExportResult> {
    try {
      let data = batchResult;
      
      // Apply anonymization if requested
      if (options.anonymize) {
        data = this.anonymizeData(data, this.defaultAnonymizationConfig);
      }

      // Apply field filtering
      if (options.fieldFilter) {
        data = this.applyFieldFilter(data, options.fieldFilter);
      }

      // Generate export based on format
      const exportData = await this.generateExport(data, options);
      
      return {
        success: true,
        data: exportData.content,
        mimeType: exportData.mimeType,
        filename: this.generateFilename(options.filename || 'batch-validation-results', options.format),
        size: exportData.content.length,
        metadata: {
          exportedAt: new Date(),
          format: options.format,
          anonymized: options.anonymize || false,
          recordCount: batchResult.results.length,
          toolVersion: this.toolVersion
        }
      };
    } catch (error) {
      return {
        success: false,
        data: '',
        mimeType: 'text/plain',
        filename: '',
        size: 0,
        metadata: {
          exportedAt: new Date(),
          format: options.format,
          anonymized: false,
          recordCount: 0,
          toolVersion: this.toolVersion
        },
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Export sample ORTB request in specified format
   */
  async exportSampleRequest(request: ORTBRequest, options: ExportOptions): Promise<ExportResult> {
    try {
      let data = request;
      
      // Apply anonymization if requested
      if (options.anonymize) {
        data = this.anonymizeData(data, this.defaultAnonymizationConfig);
      }

      // Apply field filtering
      if (options.fieldFilter) {
        data = this.applyFieldFilter(data, options.fieldFilter);
      }

      // Generate export based on format
      const exportData = await this.generateExport(data, options);
      
      return {
        success: true,
        data: exportData.content,
        mimeType: exportData.mimeType,
        filename: this.generateFilename(options.filename || 'ortb-sample-request', options.format),
        size: exportData.content.length,
        metadata: {
          exportedAt: new Date(),
          format: options.format,
          anonymized: options.anonymize || false,
          recordCount: 1,
          toolVersion: this.toolVersion
        }
      };
    } catch (error) {
      return {
        success: false,
        data: '',
        mimeType: 'text/plain',
        filename: '',
        size: 0,
        metadata: {
          exportedAt: new Date(),
          format: options.format,
          anonymized: false,
          recordCount: 0,
          toolVersion: this.toolVersion
        },
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Export multiple sample requests in specified format
   */
  async exportMultipleSamples(requests: ORTBRequest[], options: ExportOptions): Promise<ExportResult> {
    try {
      let data = requests;
      
      // Apply anonymization if requested
      if (options.anonymize) {
        data = data.map(request => this.anonymizeData(request, this.defaultAnonymizationConfig));
      }

      // Apply field filtering
      if (options.fieldFilter) {
        data = data.map(request => this.applyFieldFilter(request, options.fieldFilter));
      }

      // Generate export based on format
      const exportData = await this.generateExport(data, options);
      
      return {
        success: true,
        data: exportData.content,
        mimeType: exportData.mimeType,
        filename: this.generateFilename(options.filename || 'ortb-sample-requests', options.format),
        size: exportData.content.length,
        metadata: {
          exportedAt: new Date(),
          format: options.format,
          anonymized: options.anonymize || false,
          recordCount: requests.length,
          toolVersion: this.toolVersion
        }
      };
    } catch (error) {
      return {
        success: false,
        data: '',
        mimeType: 'text/plain',
        filename: '',
        size: 0,
        metadata: {
          exportedAt: new Date(),
          format: options.format,
          anonymized: false,
          recordCount: 0,
          toolVersion: this.toolVersion
        },
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Anonymize sensitive data according to configuration
   */
  anonymizeData(data: any, config: AnonymizationConfig): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const anonymized = JSON.parse(JSON.stringify(data)); // Deep clone

    // Apply default field anonymization
    config.fieldsToAnonymize.forEach(fieldPath => {
      this.anonymizeField(anonymized, fieldPath, config.strategy);
    });

    // Apply custom rules
    if (config.customRules) {
      config.customRules.forEach(rule => {
        this.anonymizeField(anonymized, rule.fieldPath, rule.strategy, rule);
      });
    }

    return anonymized;
  }

  /**
   * Generate export content based on format
   */
  private async generateExport(data: any, options: ExportOptions): Promise<{ content: string; mimeType: string }> {
    switch (options.format) {
      case 'json':
        return {
          content: JSON.stringify(data, null, 2),
          mimeType: 'application/json'
        };

      case 'csv':
        return {
          content: this.convertToCSV(data),
          mimeType: 'text/csv'
        };

      case 'txt':
        return {
          content: this.convertToText(data),
          mimeType: 'text/plain'
        };

      case 'html':
        return {
          content: this.convertToHTML(data),
          mimeType: 'text/html'
        };

      case 'pdf':
        // For now, return HTML that can be converted to PDF
        return {
          content: this.convertToPDFHTML(data),
          mimeType: 'text/html'
        };

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      // Get all unique keys from all objects
      const allKeys = new Set<string>();
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          this.getAllKeys(item).forEach(key => allKeys.add(key));
        }
      });

      const headers = Array.from(allKeys);
      const csvRows = [headers.join(',')];

      data.forEach(item => {
        const row = headers.map(header => {
          const value = this.getNestedValue(item, header);
          return this.escapeCSVValue(value);
        });
        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    } else {
      // Single object - convert to key-value pairs
      const keys = this.getAllKeys(data);
      const csvRows = ['Field,Value'];
      
      keys.forEach(key => {
        const value = this.getNestedValue(data, key);
        csvRows.push(`${this.escapeCSVValue(key)},${this.escapeCSVValue(value)}`);
      });

      return csvRows.join('\n');
    }
  }

  /**
   * Convert data to plain text format
   */
  private convertToText(data: any): string {
    return this.formatObjectAsText(data, 0);
  }

  /**
   * Convert data to HTML format
   */
  private convertToHTML(data: any): string {
    const timestamp = new Date().toISOString();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>ORTB Validation Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .field { margin-left: 20px; }
        .error { color: #d32f2f; }
        .warning { color: #f57c00; }
        .success { color: #388e3c; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ORTB Validation Export</h1>
        <p>Generated on: ${timestamp}</p>
    </div>
    <div class="content">
        ${this.formatObjectAsHTML(data)}
    </div>
</body>
</html>`;
  }

  /**
   * Convert data to PDF-ready HTML format
   */
  private convertToPDFHTML(data: any): string {
    const timestamp = new Date().toISOString();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>ORTB Validation Export</title>
    <style>
        @page { margin: 1in; }
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 15px; page-break-inside: avoid; }
        .field { margin-left: 15px; }
        .error { color: #d32f2f; font-weight: bold; }
        .warning { color: #f57c00; font-weight: bold; }
        .success { color: #388e3c; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; font-size: 11px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        pre { background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-size: 10px; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ORTB Validation Export</h1>
        <p>Generated on: ${timestamp}</p>
    </div>
    <div class="content">
        ${this.formatObjectAsHTML(data)}
    </div>
</body>
</html>`;
  }

  /**
   * Apply field filtering to data
   */
  private applyFieldFilter(data: any, filter: FieldFilter): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const filtered = JSON.parse(JSON.stringify(data)); // Deep clone

    if (filter.include && filter.include.length > 0) {
      // Include only specified fields
      return this.includeFields(filtered, filter.include);
    }

    if (filter.exclude && filter.exclude.length > 0) {
      // Exclude specified fields
      return this.excludeFields(filtered, filter.exclude);
    }

    return filtered;
  }

  /**
   * Anonymize a specific field in the data
   */
  private anonymizeField(data: any, fieldPath: string, strategy: AnonymizationStrategy, rule?: AnonymizationRule): void {
    const pathParts = fieldPath.split('.');
    let current = data;

    // Navigate to the parent of the target field
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (current && typeof current === 'object' && pathParts[i] in current) {
        current = current[pathParts[i]];
      } else {
        return; // Path doesn't exist
      }
    }

    const fieldName = pathParts[pathParts.length - 1];
    if (current && typeof current === 'object' && fieldName in current) {
      const originalValue = current[fieldName];
      
      switch (strategy) {
        case 'mask':
          current[fieldName] = this.maskValue(originalValue, rule?.maskCharacter || '*');
          break;
        case 'hash':
          current[fieldName] = this.hashValue(originalValue);
          break;
        case 'remove':
          delete current[fieldName];
          break;
        case 'replace':
          current[fieldName] = rule?.replacementValue || '[ANONYMIZED]';
          break;
      }
    }
  }

  /**
   * Mask a value with specified character
   */
  private maskValue(value: any, maskChar: string): string {
    if (value === null || value === undefined) {
      return value;
    }
    
    const str = String(value);
    if (str.length <= 2) {
      return maskChar.repeat(str.length);
    }
    
    // Keep first and last character, mask the middle
    return str[0] + maskChar.repeat(str.length - 2) + str[str.length - 1];
  }

  /**
   * Hash a value (simple hash for demonstration)
   */
  private hashValue(value: any): string {
    if (value === null || value === undefined) {
      return value;
    }
    
    const str = String(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Generate filename with appropriate extension
   */
  private generateFilename(baseName: string, format: ExportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    return `${baseName}_${timestamp}.${format}`;
  }

  /**
   * Get all keys from an object (including nested)
   */
  private getAllKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = [];
    
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.push(fullKey);
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          keys.push(...this.getAllKeys(obj[key], fullKey));
        }
      });
    }
    
    return keys;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : undefined;
    }, obj);
  }

  /**
   * Escape CSV value
   */
  private escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  }

  /**
   * Format object as plain text
   */
  private formatObjectAsText(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    
    if (obj === null || obj === undefined) {
      return 'null';
    }
    
    if (typeof obj !== 'object') {
      return String(obj);
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      
      const items = obj.map(item => 
        `${spaces}  - ${this.formatObjectAsText(item, indent + 1)}`
      );
      return `[\n${items.join('\n')}\n${spaces}]`;
    }
    
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    
    const items = entries.map(([key, value]) => 
      `${spaces}  ${key}: ${this.formatObjectAsText(value, indent + 1)}`
    );
    return `{\n${items.join('\n')}\n${spaces}}`;
  }

  /**
   * Format object as HTML
   */
  private formatObjectAsHTML(obj: any): string {
    if (obj === null || obj === undefined) {
      return '<span class="null">null</span>';
    }
    
    if (typeof obj !== 'object') {
      return `<span>${this.escapeHTML(String(obj))}</span>`;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '<span>[]</span>';
      
      const items = obj.map((item, index) => 
        `<div class="field"><strong>[${index}]:</strong> ${this.formatObjectAsHTML(item)}</div>`
      );
      return `<div class="section">${items.join('')}</div>`;
    }
    
    const entries = Object.entries(obj);
    if (entries.length === 0) return '<span>{}</span>';
    
    const items = entries.map(([key, value]) => 
      `<div class="field"><strong>${this.escapeHTML(key)}:</strong> ${this.formatObjectAsHTML(value)}</div>`
    );
    return `<div class="section">${items.join('')}</div>`;
  }

  /**
   * Escape HTML characters
   */
  private escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Include only specified fields
   */
  private includeFields(data: any, fields: string[]): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const result: any = Array.isArray(data) ? [] : {};
    
    fields.forEach(field => {
      const value = this.getNestedValue(data, field);
      if (value !== undefined) {
        this.setNestedValue(result, field, value);
      }
    });

    return result;
  }

  /**
   * Exclude specified fields
   */
  private excludeFields(data: any, fields: string[]): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const result = JSON.parse(JSON.stringify(data)); // Deep clone
    
    fields.forEach(field => {
      this.deleteNestedValue(result, field);
    });

    return result;
  }

  /**
   * Set nested value using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const pathParts = path.split('.');
    let current = obj;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[pathParts[pathParts.length - 1]] = value;
  }

  /**
   * Delete nested value using dot notation
   */
  private deleteNestedValue(obj: any, path: string): void {
    const pathParts = path.split('.');
    let current = obj;

    for (let i = 0; i < pathParts.length - 1; i++) {
      if (current && typeof current === 'object' && pathParts[i] in current) {
        current = current[pathParts[i]];
      } else {
        return; // Path doesn't exist
      }
    }

    const fieldName = pathParts[pathParts.length - 1];
    if (current && typeof current === 'object' && fieldName in current) {
      delete current[fieldName];
    }
  }
}