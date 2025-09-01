/**
 * Error Reporter Tests
 * Comprehensive unit tests for detailed error reporting system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ORTBErrorReporter } from '../error-reporter';
import { ValidationResult, ValidationError, ValidationWarning, ComplianceLevel } from '../../models';

describe('ORTBErrorReporter', () => {
  let errorReporter: ORTBErrorReporter;

  beforeEach(() => {
    errorReporter = new ORTBErrorReporter();
  });

  describe('generateValidationReport', () => {
    it('should generate comprehensive validation report', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'id',
            message: 'Required field missing',
            severity: 'error',
            code: 'ORTB_REQUIRED_FIELD_MISSING',
            type: 'required-field',
            actualValue: undefined,
            expectedValue: 'non-empty string'
          },
          {
            field: 'imp.0.banner.w',
            message: 'Invalid banner width',
            severity: 'error',
            code: 'ORTB_INVALID_BANNER_WIDTH',
            type: 'value',
            actualValue: 0,
            expectedValue: 'positive integer'
          }
        ],
        warnings: [
          {
            field: 'imp.0.banner',
            message: 'Non-standard banner size',
            code: 'ORTB_NON_STANDARD_BANNER_SIZE',
            actualValue: '123x456',
            recommendedValue: 'Standard IAB banner size'
          }
        ],
        complianceLevel: 'non-compliant',
        validatedFields: ['id', 'imp', 'imp.0.banner.w', 'imp.0.banner.h'],
        complianceScore: 50,
        timestamp: new Date(),
        validationId: 'test-validation-123',
        specVersion: '2.6'
      };

      const report = errorReporter.generateValidationReport(validationResult);

      expect(report.summary).toBeDefined();
      expect(report.summary.totalFields).toBe(4);
      expect(report.summary.errorFields).toBe(2);
      expect(report.summary.warningFields).toBe(1);
      expect(report.summary.status).toBe('failed');

      expect(report.fieldResults).toBeDefined();
      expect(report.fieldResults.length).toBeGreaterThan(0);

      expect(report.complianceScore).toBe(50);
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);

      expect(report.metadata).toBeDefined();
      expect(report.metadata.toolVersion).toBeDefined();
      expect(report.metadata.specVersion).toBe('2.6');
    });

    it('should generate report for valid request', () => {
      const validationResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        complianceLevel: 'compliant',
        validatedFields: ['id', 'imp', 'imp.0.id', 'imp.0.banner.w', 'imp.0.banner.h'],
        complianceScore: 100,
        timestamp: new Date(),
        validationId: 'test-validation-456',
        specVersion: '2.6'
      };

      const report = errorReporter.generateValidationReport(validationResult);

      expect(report.summary.status).toBe('passed');
      expect(report.summary.errorFields).toBe(0);
      expect(report.summary.warningFields).toBe(0);
      expect(report.complianceScore).toBe(100);
      expect(report.recommendations).toHaveLength(0);
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate detailed compliance report', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'id',
            message: 'Required field missing',
            severity: 'error',
            code: 'ORTB_REQUIRED_FIELD_MISSING',
            type: 'required-field',
            actualValue: undefined,
            expectedValue: 'non-empty string'
          },
          {
            field: 'at',
            message: 'Invalid auction type',
            severity: 'error',
            code: 'ORTB_INVALID_AUCTION_TYPE',
            type: 'value',
            actualValue: 5,
            expectedValue: 'Valid auction type (1, 2, or 3)'
          }
        ],
        warnings: [
          {
            field: 'device.devicetype',
            message: 'Invalid device type',
            code: 'ORTB_INVALID_DEVICE_TYPE',
            actualValue: 10,
            recommendedValue: 'Valid device type (1-7)'
          }
        ],
        complianceLevel: 'non-compliant',
        validatedFields: ['id', 'at', 'device.devicetype'],
        complianceScore: 25,
        timestamp: new Date(),
        validationId: 'test-validation-789',
        specVersion: '2.6'
      };

      const report = errorReporter.generateComplianceReport(validationResult);

      expect(report.overallCompliance).toBe('non-compliant');
      expect(report.complianceScore).toBe(25);
      expect(report.categoryCompliance).toBeDefined();
      expect(report.categoryCompliance.length).toBeGreaterThan(0);
      expect(report.criticalIssues).toBeDefined();
      expect(report.criticalIssues.length).toBe(2); // Both errors are critical
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.timestamp).toBeInstanceOf(Date);
    });

    it('should identify critical issues correctly', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'id',
            message: 'Required field missing',
            severity: 'error',
            code: 'ORTB_REQUIRED_FIELD_MISSING',
            type: 'required-field'
          },
          {
            field: 'imp.0.banner.w',
            message: 'Invalid banner width',
            severity: 'error',
            code: 'ORTB_INVALID_BANNER_WIDTH',
            type: 'value',
            actualValue: 0
          }
        ],
        warnings: [],
        complianceLevel: 'non-compliant',
        validatedFields: ['id', 'imp.0.banner.w'],
        complianceScore: 50,
        timestamp: new Date(),
        validationId: 'test-validation-critical',
        specVersion: '2.6'
      };

      const report = errorReporter.generateComplianceReport(validationResult);

      expect(report.criticalIssues).toHaveLength(1); // Only required field error is critical
      expect(report.criticalIssues[0].type).toBe('required-field');
    });
  });

  describe('categorizeErrors', () => {
    it('should categorize errors by type', () => {
      const errors: ValidationError[] = [
        {
          field: 'id',
          message: 'Required field missing',
          severity: 'error',
          code: 'ORTB_REQUIRED_FIELD_MISSING',
          type: 'required-field'
        },
        {
          field: 'imp',
          message: 'Required field missing',
          severity: 'error',
          code: 'ORTB_REQUIRED_FIELD_MISSING',
          type: 'required-field'
        },
        {
          field: 'at',
          message: 'Invalid auction type',
          severity: 'error',
          code: 'ORTB_INVALID_AUCTION_TYPE',
          type: 'value'
        },
        {
          field: 'site/app',
          message: 'Site and app conflict',
          severity: 'error',
          code: 'ORTB_SITE_APP_CONFLICT',
          type: 'logical'
        }
      ];

      const categories = errorReporter.categorizeErrors(errors);

      expect(categories.has('Required Fields')).toBe(true);
      expect(categories.has('Value Validation')).toBe(true);
      expect(categories.has('Business Logic')).toBe(true);

      expect(categories.get('Required Fields')).toHaveLength(2);
      expect(categories.get('Value Validation')).toHaveLength(1);
      expect(categories.get('Business Logic')).toHaveLength(1);
    });
  });

  describe('generateSuggestions', () => {
    it('should generate actionable suggestions', () => {
      const errors: ValidationError[] = [
        {
          field: 'id',
          message: 'Required field missing',
          severity: 'error',
          code: 'ORTB_REQUIRED_FIELD_MISSING',
          type: 'required-field'
        },
        {
          field: 'imp[].id',
          message: 'Duplicate impression ID',
          severity: 'error',
          code: 'ORTB_DUPLICATE_IMPRESSION_ID',
          type: 'logical'
        },
        {
          field: 'site/app',
          message: 'Site and app conflict',
          severity: 'error',
          code: 'ORTB_SITE_APP_MUTUAL_EXCLUSION',
          type: 'logical'
        }
      ];

      const suggestions = errorReporter.generateSuggestions(errors);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('required fields'))).toBe(true);
      expect(suggestions.some(s => s.includes('business logic'))).toBe(true);
      expect(suggestions.some(s => s.includes('unique IDs'))).toBe(true);
      expect(suggestions.some(s => s.includes('site or app'))).toBe(true);
    });

    it('should generate general suggestions for many errors', () => {
      const manyErrors: ValidationError[] = Array.from({ length: 10 }, (_, i) => ({
        field: `field${i}`,
        message: `Error ${i}`,
        severity: 'error' as const,
        code: `ERROR_${i}`,
        type: 'value' as const
      }));

      const suggestions = errorReporter.generateSuggestions(manyErrors);

      expect(suggestions.some(s => s.includes('validation tool'))).toBe(true);
    });
  });

  describe('formatErrorMessage', () => {
    it('should format error message with all details', () => {
      const error: ValidationError = {
        field: 'imp.0.banner.w',
        message: 'Invalid banner width',
        severity: 'error',
        code: 'ORTB_INVALID_BANNER_WIDTH',
        type: 'value',
        actualValue: 0,
        expectedValue: 'positive integer',
        suggestion: 'Set banner width to a positive value'
      };

      const formatted = errorReporter.formatErrorMessage(error);

      expect(formatted).toContain('[ORTB_INVALID_BANNER_WIDTH]');
      expect(formatted).toContain('Invalid banner width');
      expect(formatted).toContain('Field: imp.0.banner.w');
      expect(formatted).toContain('Expected: positive integer');
      expect(formatted).toContain('Got: 0');
      expect(formatted).toContain('Suggestion: Set banner width to a positive value');
    });

    it('should format minimal error message', () => {
      const error: ValidationError = {
        field: 'root',
        message: 'General error',
        severity: 'error',
        code: 'GENERAL_ERROR',
        type: 'schema'
      };

      const formatted = errorReporter.formatErrorMessage(error);

      expect(formatted).toContain('[GENERAL_ERROR]');
      expect(formatted).toContain('General error');
      expect(formatted).not.toContain('Field:'); // root field is not shown
    });
  });

  describe('formatWarningMessage', () => {
    it('should format warning message with all details', () => {
      const warning: ValidationWarning = {
        field: 'device.devicetype',
        message: 'Invalid device type',
        code: 'ORTB_INVALID_DEVICE_TYPE',
        actualValue: 10,
        recommendedValue: 'Valid device type (1-7)',
        suggestion: 'Use standard device types'
      };

      const formatted = errorReporter.formatWarningMessage(warning);

      expect(formatted).toContain('[ORTB_INVALID_DEVICE_TYPE]');
      expect(formatted).toContain('Invalid device type');
      expect(formatted).toContain('Field: device.devicetype');
      expect(formatted).toContain('Current: 10');
      expect(formatted).toContain('Recommended: Valid device type (1-7)');
      expect(formatted).toContain('Suggestion: Use standard device types');
    });

    it('should format minimal warning message', () => {
      const warning: ValidationWarning = {
        field: 'test',
        message: 'General warning',
        code: 'GENERAL_WARNING'
      };

      const formatted = errorReporter.formatWarningMessage(warning);

      expect(formatted).toContain('[GENERAL_WARNING]');
      expect(formatted).toContain('General warning');
      expect(formatted).toContain('Field: test');
    });
  });

  describe('edge cases', () => {
    it('should handle empty validation result', () => {
      const emptyResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        complianceLevel: 'compliant',
        validatedFields: [],
        complianceScore: 100,
        timestamp: new Date(),
        validationId: 'empty-test',
        specVersion: '2.6'
      };

      const report = errorReporter.generateValidationReport(emptyResult);
      const complianceReport = errorReporter.generateComplianceReport(emptyResult);

      expect(report.summary.totalFields).toBe(0);
      expect(report.fieldResults).toHaveLength(0);
      expect(complianceReport.categoryCompliance).toHaveLength(0);
      expect(complianceReport.criticalIssues).toHaveLength(0);
    });

    it('should handle null and undefined values in formatting', () => {
      const errorWithNulls: ValidationError = {
        field: 'test',
        message: 'Test error',
        severity: 'error',
        code: 'TEST_ERROR',
        type: 'value',
        actualValue: null,
        expectedValue: undefined
      };

      const formatted = errorReporter.formatErrorMessage(errorWithNulls);

      expect(formatted).toContain('Expected: undefined');
      expect(formatted).toContain('Got: null');
    });

    it('should handle complex object values in formatting', () => {
      const errorWithObject: ValidationError = {
        field: 'test',
        message: 'Test error',
        severity: 'error',
        code: 'TEST_ERROR',
        type: 'value',
        actualValue: { complex: 'object', with: ['array'] },
        expectedValue: 'simple value'
      };

      const formatted = errorReporter.formatErrorMessage(errorWithObject);

      expect(formatted).toContain('Expected: simple value');
      expect(formatted).toContain('Got: {"complex":"object","with":["array"]}');
    });
  });
});