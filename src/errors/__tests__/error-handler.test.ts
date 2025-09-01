/**
 * Global Error Handler Tests
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { GlobalErrorHandler, ApplicationError, ErrorContext } from '../error-handler';
import { ValidationError, ValidationWarning } from '../../models/validation';

describe('GlobalErrorHandler', () => {
  let errorHandler: GlobalErrorHandler;
  let mockListener: vi.Mock;

  beforeEach(() => {
    errorHandler = GlobalErrorHandler.getInstance();
    errorHandler.clearErrorLog();
    mockListener = vi.fn();
  });

  describe('handleError', () => {
    test('should handle generic Error and convert to ApplicationError', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        requestId: 'test-123',
        endpoint: 'POST /validate'
      };

      const appError = errorHandler.handleError(error, context);

      expect(appError.id).toBeDefined();
      expect(appError.code).toBeDefined();
      expect(appError.message).toBe('Test error');
      expect(appError.userMessage).toBeDefined();
      expect(appError.severity).toBeDefined();
      expect(appError.category).toBeDefined();
      expect(appError.layer).toBeDefined();
      expect(appError.timestamp).toBeInstanceOf(Date);
      expect(appError.context).toBe(context);
    });

    test('should handle ApplicationError directly', () => {
      const appError: ApplicationError = {
        id: 'test-error-1',
        code: 'TEST_ERROR',
        message: 'Test application error',
        userMessage: 'Something went wrong',
        severity: 'error',
        category: 'validation',
        layer: 'api',
        timestamp: new Date(),
        recoverySuggestions: ['Try again'],
        retryable: false
      };

      const result = errorHandler.handleError(appError);

      expect(result).toBe(appError);
    });

    test('should categorize validation errors correctly', () => {
      const error = new Error('Invalid field value');
      const context: ErrorContext = {
        requestId: 'test-123',
        metadata: { field: 'imp.0.banner.w' }
      };

      const appError = errorHandler.handleError(error, context);

      expect(appError.category).toBe('validation');
      expect(appError.layer).toBe('validation');
      expect(appError.statusCode).toBe(400);
    });

    test('should categorize authentication errors correctly', () => {
      const error = new Error('Unauthorized access');
      const context: ErrorContext = {
        requestId: 'test-123',
        endpoint: 'POST /validate'
      };

      const appError = errorHandler.handleError(error, context);

      expect(appError.category).toBe('authentication');
      expect(appError.layer).toBe('api');
      expect(appError.statusCode).toBe(401);
    });

    test('should notify error listeners', () => {
      errorHandler.addErrorListener(mockListener);
      
      const error = new Error('Test error');
      const appError = errorHandler.handleError(error);

      expect(mockListener).toHaveBeenCalledWith(appError);
    });
  });

  describe('handleValidationErrors', () => {
    test('should convert validation errors to application errors', () => {
      const validationErrors: ValidationError[] = [
        {
          field: 'imp.0.banner.w',
          message: 'Width is required',
          severity: 'error',
          code: 'REQUIRED_FIELD',
          type: 'required-field',
          suggestion: 'Add width field to banner object'
        }
      ];

      const validationWarnings: ValidationWarning[] = [
        {
          field: 'imp.0.banner.h',
          message: 'Height should be specified',
          code: 'RECOMMENDED_FIELD',
          suggestion: 'Consider adding height field'
        }
      ];

      const appErrors = errorHandler.handleValidationErrors(
        validationErrors,
        validationWarnings,
        { requestId: 'test-123' }
      );

      expect(appErrors).toHaveLength(2);
      
      const errorResult = appErrors[0];
      expect(errorResult.code).toBe('REQUIRED_FIELD');
      expect(errorResult.category).toBe('validation');
      expect(errorResult.layer).toBe('validation');
      expect(errorResult.severity).toBe('error');
      expect(errorResult.recoverySuggestions).toContain('Add width field to banner object');

      const warningResult = appErrors[1];
      expect(warningResult.code).toBe('RECOMMENDED_FIELD');
      expect(warningResult.category).toBe('validation');
      expect(warningResult.layer).toBe('validation');
      expect(warningResult.severity).toBe('warning');
    });
  });

  describe('createUserFriendlyError', () => {
    test('should create user-friendly error for validation errors', () => {
      const appError: ApplicationError = {
        id: 'test-1',
        code: 'VALIDATION_ERROR',
        message: 'Field validation failed',
        userMessage: 'Field validation failed',
        severity: 'error',
        category: 'validation',
        layer: 'validation',
        timestamp: new Date(),
        recoverySuggestions: ['Check field format'],
        retryable: false
      };

      const userError = errorHandler.createUserFriendlyError(appError);

      expect(userError.message).toContain('ORTB request');
      expect(userError.suggestions).toContain('Check field format');
      expect(userError.canRetry).toBe(false);
      expect(userError.recoveryActions).toBeDefined();
    });

    test('should create user-friendly error for authentication errors', () => {
      const appError: ApplicationError = {
        id: 'test-2',
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        userMessage: 'Authentication failed',
        severity: 'error',
        category: 'authentication',
        layer: 'api',
        timestamp: new Date(),
        recoverySuggestions: ['Check API key'],
        retryable: false
      };

      const userError = errorHandler.createUserFriendlyError(appError);

      expect(userError.message).toBe('Authentication failed. Please check your API key.');
      expect(userError.suggestions).toContain('Check API key');
      expect(userError.canRetry).toBe(false);
    });

    test('should create user-friendly error for rate limit errors', () => {
      const appError: ApplicationError = {
        id: 'test-3',
        code: 'RATE_LIMIT_ERROR',
        message: 'Rate limit exceeded',
        userMessage: 'Rate limit exceeded',
        severity: 'warning',
        category: 'rate-limit',
        layer: 'api',
        timestamp: new Date(),
        recoverySuggestions: ['Wait before retrying'],
        retryable: true
      };

      const userError = errorHandler.createUserFriendlyError(appError);

      expect(userError.message).toContain('too many requests');
      expect(userError.canRetry).toBe(true);
      expect(userError.recoveryActions.some(action => action.id === 'retry')).toBe(true);
    });
  });

  describe('error listeners', () => {
    test('should add and remove error listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      errorHandler.addErrorListener(listener1);
      errorHandler.addErrorListener(listener2);

      const error = new Error('Test error');
      errorHandler.handleError(error);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      errorHandler.removeErrorListener(listener1);
      
      const error2 = new Error('Test error 2');
      errorHandler.handleError(error2);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(2);
    });
  });

  describe('error log management', () => {
    test('should maintain error log', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      errorHandler.handleError(error1);
      errorHandler.handleError(error2);

      const recentErrors = errorHandler.getRecentErrors();
      expect(recentErrors).toHaveLength(2);
      expect(recentErrors[0].message).toBe('Error 1');
      expect(recentErrors[1].message).toBe('Error 2');
    });

    test('should filter errors by category', () => {
      const validationError = new Error('Validation failed');
      const authError = new Error('Unauthorized');

      errorHandler.handleError(validationError, { 
        metadata: { field: 'test' } 
      });
      errorHandler.handleError(authError, { 
        endpoint: 'POST /validate' 
      });

      const validationErrors = errorHandler.getErrorsByCategory('validation');
      const authErrors = errorHandler.getErrorsByCategory('authentication');

      expect(validationErrors).toHaveLength(1);
      expect(authErrors).toHaveLength(1);
      expect(validationErrors[0].message).toBe('Validation failed');
      expect(authErrors[0].message).toBe('Unauthorized');
    });

    test('should filter errors by severity', () => {
      const criticalError = new Error('System failure');
      criticalError.name = 'SystemError';
      
      const warningError = new Error('Rate limit exceeded');

      errorHandler.handleError(criticalError);
      errorHandler.handleError(warningError, { 
        endpoint: 'POST /validate' 
      });

      const criticalErrors = errorHandler.getErrorsBySeverity('critical');
      const warningErrors = errorHandler.getErrorsBySeverity('warning');

      expect(criticalErrors).toHaveLength(1);
      expect(warningErrors).toHaveLength(1);
    });

    test('should clear error log', () => {
      errorHandler.handleError(new Error('Test error'));
      expect(errorHandler.getRecentErrors()).toHaveLength(1);

      errorHandler.clearErrorLog();
      expect(errorHandler.getRecentErrors()).toHaveLength(0);
    });
  });

  describe('recovery suggestions', () => {
    test('should generate appropriate recovery suggestions for validation errors', () => {
      const error = new Error('Invalid field');
      const appError = errorHandler.handleError(error, {
        metadata: { field: 'imp.0.banner.w' }
      });

      expect(appError.recoverySuggestions).toContain('Check the OpenRTB 2.6 specification for field requirements');
      expect(appError.recoverySuggestions).toContain('Use the sample generator to see valid request examples');
    });

    test('should generate appropriate recovery suggestions for authentication errors', () => {
      const error = new Error('Unauthorized');
      const appError = errorHandler.handleError(error, {
        endpoint: 'POST /validate'
      });

      expect(appError.recoverySuggestions).toContain('Verify your API key is correct');
      expect(appError.recoverySuggestions).toContain('Check that your API key has the necessary permissions');
    });

    test('should determine retryability correctly', () => {
      const networkError = new Error('Connection timeout');
      const validationError = new Error('Invalid field');

      const networkAppError = errorHandler.handleError(networkError, {
        endpoint: 'POST /validate'
      });
      const validationAppError = errorHandler.handleError(validationError, {
        metadata: { field: 'test' }
      });

      expect(networkAppError.retryable).toBe(true);
      expect(validationAppError.retryable).toBe(false);
    });
  });
});