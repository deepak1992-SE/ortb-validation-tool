/**
 * Unit tests for validation result models
 * Tests validation interfaces, error structures, and reporting models
 */

import { describe, it, expect } from 'vitest';
import type {
  ValidationError,
  ValidationWarning,
  ValidationResult,
  BatchValidationResult,
  BatchValidationSummary,
  ErrorFrequency,
  WarningFrequency,
  FieldValidationResult,
  FieldDefinition,
  ValidationReport,
  ValidationSummary,
  ReportMetadata,
  ComplianceReport,
  CategoryCompliance,
  ComplianceRecommendation,
  ValidationSeverity,
  ComplianceLevel,
  ErrorType
} from '../validation';

describe('Validation Models', () => {
  describe('ValidationError Interface', () => {
    it('should accept a complete validation error', () => {
      const error: ValidationError = {
        field: 'imp.0.banner.w',
        message: 'Width must be a positive integer',
        severity: 'error',
        code: 'INVALID_WIDTH',
        suggestion: 'Provide a positive integer value for width',
        type: 'format',
        actualValue: -100,
        expectedValue: 'positive integer'
      };

      expect(error.field).toBe('imp.0.banner.w');
      expect(error.severity).toBe('error');
      expect(error.type).toBe('format');
      expect(error.actualValue).toBe(-100);
    });

    it('should accept minimal validation error', () => {
      const error: ValidationError = {
        field: 'id',
        message: 'ID is required',
        severity: 'error',
        code: 'MISSING_REQUIRED_FIELD',
        type: 'required-field'
      };

      expect(error.field).toBe('id');
      expect(error.code).toBe('MISSING_REQUIRED_FIELD');
      expect(error.type).toBe('required-field');
    });
  });

  describe('ValidationWarning Interface', () => {
    it('should accept validation warning', () => {
      const warning: ValidationWarning = {
        field: 'imp.0.bidfloor',
        message: 'Bid floor is very low, may not be competitive',
        code: 'LOW_BID_FLOOR',
        suggestion: 'Consider increasing bid floor to improve competitiveness',
        actualValue: 0.01,
        recommendedValue: 0.50
      };

      expect(warning.field).toBe('imp.0.bidfloor');
      expect(warning.actualValue).toBe(0.01);
      expect(warning.recommendedValue).toBe(0.50);
    });
  });

  describe('ValidationResult Interface', () => {
    it('should accept successful validation result', () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [{
          field: 'tmax',
          message: 'Timeout value is quite high',
          code: 'HIGH_TIMEOUT',
          actualValue: 5000,
          recommendedValue: 1000
        }],
        complianceLevel: 'compliant',
        validatedFields: ['id', 'imp', 'at', 'tmax'],
        complianceScore: 95,
        timestamp: new Date('2024-01-01T10:00:00Z'),
        validationId: 'val-123',
        specVersion: '2.6'
      };

      expect(result.isValid).toBe(true);
      expect(result.complianceLevel).toBe('compliant');
      expect(result.complianceScore).toBe(95);
      expect(result.warnings).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept failed validation result', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [{
          field: 'id',
          message: 'ID is required',
          severity: 'error',
          code: 'MISSING_ID',
          type: 'required-field'
        }],
        warnings: [],
        complianceLevel: 'non-compliant',
        validatedFields: ['imp', 'at'],
        complianceScore: 30,
        timestamp: new Date(),
        validationId: 'val-456',
        specVersion: '2.6'
      };

      expect(result.isValid).toBe(false);
      expect(result.complianceLevel).toBe('non-compliant');
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('BatchValidationResult Interface', () => {
    it('should accept batch validation results', () => {
      const batchResult: BatchValidationResult = {
        results: [
          {
            isValid: true,
            errors: [],
            warnings: [],
            complianceLevel: 'compliant',
            validatedFields: ['id', 'imp', 'at'],
            complianceScore: 100,
            timestamp: new Date(),
            validationId: 'val-1',
            specVersion: '2.6'
          },
          {
            isValid: false,
            errors: [{
              field: 'imp',
              message: 'At least one impression is required',
              severity: 'error',
              code: 'MISSING_IMPRESSIONS',
              type: 'required-field'
            }],
            warnings: [],
            complianceLevel: 'non-compliant',
            validatedFields: ['id', 'at'],
            complianceScore: 40,
            timestamp: new Date(),
            validationId: 'val-2',
            specVersion: '2.6'
          }
        ],
        summary: {
          totalRequests: 2,
          validRequests: 1,
          invalidRequests: 1,
          warningRequests: 0,
          commonErrors: [{
            code: 'MISSING_IMPRESSIONS',
            message: 'At least one impression is required',
            count: 1,
            percentage: 50
          }],
          commonWarnings: [],
          averageComplianceScore: 70
        },
        overallComplianceScore: 70,
        timestamp: new Date(),
        batchId: 'batch-123'
      };

      expect(batchResult.results).toHaveLength(2);
      expect(batchResult.summary.totalRequests).toBe(2);
      expect(batchResult.summary.validRequests).toBe(1);
      expect(batchResult.overallComplianceScore).toBe(70);
    });
  });

  describe('FieldValidationResult Interface', () => {
    it('should accept field validation result', () => {
      const fieldResult: FieldValidationResult = {
        fieldPath: 'imp.0.banner.w',
        isValid: true,
        errors: [],
        warnings: [],
        isRequired: true,
        isPresent: true,
        actualValue: 300,
        fieldDefinition: {
          name: 'w',
          description: 'Width of the banner in device independent pixels',
          type: 'integer',
          required: false,
          minimum: 1,
          examples: [300, 728, 320],
          defaultValue: undefined
        }
      };

      expect(fieldResult.fieldPath).toBe('imp.0.banner.w');
      expect(fieldResult.isValid).toBe(true);
      expect(fieldResult.isRequired).toBe(true);
      expect(fieldResult.fieldDefinition?.type).toBe('integer');
    });
  });

  describe('ValidationReport Interface', () => {
    it('should accept comprehensive validation report', () => {
      const report: ValidationReport = {
        summary: {
          totalFields: 10,
          validFields: 8,
          errorFields: 1,
          warningFields: 1,
          missingRequiredFields: 1,
          status: 'failed'
        },
        fieldResults: [{
          fieldPath: 'id',
          isValid: false,
          errors: [{
            field: 'id',
            message: 'ID is required',
            severity: 'error',
            code: 'MISSING_ID',
            type: 'required-field'
          }],
          warnings: [],
          isRequired: true,
          isPresent: false
        }],
        complianceScore: 75,
        recommendations: [
          'Add required ID field',
          'Consider adding optional tmax field for better performance'
        ],
        timestamp: new Date(),
        metadata: {
          generatedAt: new Date(),
          toolVersion: '1.0.0',
          specVersion: '2.6',
          reportVersion: '1.0'
        }
      };

      expect(report.summary.status).toBe('failed');
      expect(report.fieldResults).toHaveLength(1);
      expect(report.recommendations).toHaveLength(2);
      expect(report.metadata.toolVersion).toBe('1.0.0');
    });
  });

  describe('ComplianceReport Interface', () => {
    it('should accept compliance report', () => {
      const complianceReport: ComplianceReport = {
        overallCompliance: 'partial',
        complianceScore: 85,
        categoryCompliance: [{
          category: 'Required Fields',
          compliance: 'compliant',
          score: 100,
          issueCount: 0,
          issues: []
        }, {
          category: 'Format Validation',
          compliance: 'partial',
          score: 70,
          issueCount: 2,
          issues: [{
            field: 'imp.0.banner.w',
            message: 'Invalid width format',
            severity: 'error',
            code: 'INVALID_FORMAT',
            type: 'format'
          }]
        }],
        criticalIssues: [],
        recommendations: [{
          priority: 'high',
          title: 'Fix Banner Width Format',
          description: 'Ensure banner width is a positive integer',
          affectedFields: ['imp.0.banner.w'],
          impactScore: 15
        }],
        timestamp: new Date()
      };

      expect(complianceReport.overallCompliance).toBe('partial');
      expect(complianceReport.categoryCompliance).toHaveLength(2);
      expect(complianceReport.recommendations[0].priority).toBe('high');
    });
  });

  describe('Type Safety Tests', () => {
    it('should enforce ValidationSeverity enum values', () => {
      const severities: ValidationSeverity[] = ['error', 'warning', 'info'];
      
      severities.forEach(severity => {
        const error: ValidationError = {
          field: 'test',
          message: 'test message',
          severity: severity,
          code: 'TEST_CODE',
          type: 'schema'
        };
        
        expect(['error', 'warning', 'info']).toContain(error.severity);
      });
    });

    it('should enforce ComplianceLevel enum values', () => {
      const levels: ComplianceLevel[] = ['compliant', 'partial', 'non-compliant'];
      
      levels.forEach(level => {
        const result: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          complianceLevel: level,
          validatedFields: [],
          complianceScore: 100,
          timestamp: new Date(),
          validationId: 'test',
          specVersion: '2.6'
        };
        
        expect(['compliant', 'partial', 'non-compliant']).toContain(result.complianceLevel);
      });
    });

    it('should enforce ErrorType enum values', () => {
      const types: ErrorType[] = ['schema', 'required-field', 'format', 'value', 'logical'];
      
      types.forEach(type => {
        const error: ValidationError = {
          field: 'test',
          message: 'test message',
          severity: 'error',
          code: 'TEST_CODE',
          type: type
        };
        
        expect(['schema', 'required-field', 'format', 'value', 'logical']).toContain(error.type);
      });
    });
  });

  describe('Nested Structure Validation', () => {
    it('should handle complex nested validation structures', () => {
      const complexResult: ValidationResult = {
        isValid: false,
        errors: [{
          field: 'imp.0.banner.format.0.w',
          message: 'Width in format object must be positive',
          severity: 'error',
          code: 'INVALID_FORMAT_WIDTH',
          type: 'value',
          actualValue: 0,
          expectedValue: 'positive integer'
        }],
        warnings: [{
          field: 'imp.0.bidfloor',
          message: 'Bid floor seems low for this placement',
          code: 'LOW_BID_FLOOR',
          actualValue: 0.01,
          recommendedValue: 0.50
        }],
        complianceLevel: 'partial',
        validatedFields: [
          'id',
          'imp',
          'imp.0.id',
          'imp.0.banner',
          'imp.0.banner.format',
          'imp.0.banner.format.0.w',
          'imp.0.banner.format.0.h',
          'at'
        ],
        complianceScore: 75,
        timestamp: new Date(),
        validationId: 'complex-val-123',
        specVersion: '2.6'
      };

      expect(complexResult.errors[0].field).toBe('imp.0.banner.format.0.w');
      expect(complexResult.validatedFields).toContain('imp.0.banner.format.0.w');
      expect(complexResult.complianceScore).toBe(75);
    });
  });

  describe('Frequency and Statistics Models', () => {
    it('should accept error frequency data', () => {
      const errorFreq: ErrorFrequency = {
        code: 'MISSING_ID',
        message: 'Request ID is required',
        count: 15,
        percentage: 75
      };

      expect(errorFreq.count).toBe(15);
      expect(errorFreq.percentage).toBe(75);
    });

    it('should accept warning frequency data', () => {
      const warningFreq: WarningFrequency = {
        code: 'LOW_BID_FLOOR',
        message: 'Bid floor is below recommended minimum',
        count: 8,
        percentage: 40
      };

      expect(warningFreq.count).toBe(8);
      expect(warningFreq.percentage).toBe(40);
    });
  });
});