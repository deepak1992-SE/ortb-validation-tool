/**
 * Simple Tests for Validation UI Components
 * Testing core functionality without complex DOM mocking
 */

import { describe, test, expect } from 'vitest';
import { SyntaxHighlighter } from '../components';
import { ValidationResult, ValidationError, ValidationWarning } from '../../models';

describe('SyntaxHighlighter', () => {
  test('should create instance', () => {
    const highlighter = new SyntaxHighlighter();
    expect(highlighter).toBeDefined();
  });

  test('should handle empty input', () => {
    const highlighter = new SyntaxHighlighter();
    
    expect(highlighter.highlight('')).toBe('');
    expect(highlighter.highlight('   ')).toBe('');
  });

  test('should highlight JSON keys', () => {
    const highlighter = new SyntaxHighlighter();
    
    const json = '{"key": "value"}';
    const highlighted = highlighter.highlight(json);
    
    expect(highlighted).toContain('json-key');
    expect(highlighted).toContain('"key":');
  });

  test('should handle malformed JSON without crashing', () => {
    const highlighter = new SyntaxHighlighter();
    
    const invalidJson = '{"invalid": json}';
    const result = highlighter.highlight(invalidJson);
    
    // Should not throw and should return some result
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});

describe('Validation UI Types', () => {
  test('should create validation result structure', () => {
    const validationResult: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      complianceLevel: 1.0,
      validatedFields: ['id', 'imp'],
      timestamp: new Date(),
      requestId: 'test-123'
    };

    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);
    expect(validationResult.warnings).toHaveLength(0);
    expect(validationResult.complianceLevel).toBe(1.0);
    expect(validationResult.validatedFields).toContain('id');
    expect(validationResult.validatedFields).toContain('imp');
  });

  test('should create validation error structure', () => {
    const error: ValidationError = {
      field: 'imp.0.banner.w',
      message: 'Width is required',
      code: 'REQUIRED_FIELD',
      severity: 'error',
      suggestion: 'Add width property'
    };

    expect(error.field).toBe('imp.0.banner.w');
    expect(error.message).toBe('Width is required');
    expect(error.code).toBe('REQUIRED_FIELD');
    expect(error.severity).toBe('error');
    expect(error.suggestion).toBe('Add width property');
  });

  test('should create validation warning structure', () => {
    const warning: ValidationWarning = {
      field: 'imp.0.banner.h',
      message: 'Height should be specified',
      code: 'RECOMMENDED_FIELD'
    };

    expect(warning.field).toBe('imp.0.banner.h');
    expect(warning.message).toBe('Height should be specified');
    expect(warning.code).toBe('RECOMMENDED_FIELD');
  });
});

describe('Component Integration', () => {
  test('should validate component exports exist', async () => {
    const components = await import('../components');
    
    expect(components.ValidationInputComponent).toBeDefined();
    expect(components.ValidationResultsComponent).toBeDefined();
    expect(components.ValidationInterface).toBeDefined();
    expect(components.SyntaxHighlighter).toBeDefined();
  });

  test('should validate type exports exist', async () => {
    const types = await import('../types');
    
    // Check that types module exports exist
    expect(types).toBeDefined();
  });
});