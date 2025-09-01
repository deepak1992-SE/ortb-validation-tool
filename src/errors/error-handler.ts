/**
 * Global Error Handler
 * Centralized error handling for all application layers
 */

import { ValidationError, ValidationWarning } from '../models/validation';

export type ApplicationLayer = 'api' | 'service' | 'validation' | 'ui' | 'export' | 'sample';
export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';
export type ErrorCategory = 'validation' | 'authentication' | 'rate-limit' | 'network' | 'system' | 'user-input' | 'business-logic';

export interface ApplicationError {
  /** Unique error identifier */
  id: string;
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** User-friendly error message */
  userMessage: string;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Error category */
  category: ErrorCategory;
  /** Application layer where error occurred */
  layer: ApplicationLayer;
  /** Original error object if available */
  originalError?: Error;
  /** Additional context data */
  context?: Record<string, any>;
  /** Timestamp when error occurred */
  timestamp: Date;
  /** Stack trace */
  stack?: string;
  /** Recovery suggestions */
  recoverySuggestions: string[];
  /** Whether error is retryable */
  retryable: boolean;
  /** HTTP status code for API errors */
  statusCode?: number;
}

export interface ErrorRecoveryAction {
  /** Action identifier */
  id: string;
  /** Action description */
  description: string;
  /** Action type */
  type: 'retry' | 'fallback' | 'user-action' | 'system-action';
  /** Function to execute the recovery action */
  execute?: () => Promise<void> | void;
  /** Whether this action requires user intervention */
  requiresUserAction: boolean;
}

export interface ErrorContext {
  /** Request ID for tracing */
  requestId?: string;
  /** User ID if available */
  userId?: string;
  /** API endpoint */
  endpoint?: string;
  /** Input data that caused the error */
  inputData?: any;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorListeners: ((error: ApplicationError) => void)[] = [];
  private errorLog: ApplicationError[] = [];
  private maxLogSize = 1000;

  private constructor() {}

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * Handle an error from any application layer
   */
  handleError(error: Error | ApplicationError, context?: ErrorContext): ApplicationError {
    let appError: ApplicationError;

    if (this.isApplicationError(error)) {
      appError = error;
    } else {
      appError = this.createApplicationError(error, context);
    }

    // Add to error log
    this.addToErrorLog(appError);

    // Notify listeners
    this.notifyListeners(appError);

    // Log error
    this.logError(appError);

    return appError;
  }

  /**
   * Create user-friendly error response
   */
  createUserFriendlyError(error: ApplicationError): {
    message: string;
    suggestions: string[];
    canRetry: boolean;
    recoveryActions: ErrorRecoveryAction[];
  } {
    return {
      message: error.userMessage,
      suggestions: error.recoverySuggestions,
      canRetry: error.retryable,
      recoveryActions: this.generateRecoveryActions(error)
    };
  }

  /**
   * Handle validation errors specifically
   */
  handleValidationErrors(
    validationErrors: ValidationError[],
    validationWarnings: ValidationWarning[],
    context?: ErrorContext
  ): ApplicationError[] {
    const appErrors: ApplicationError[] = [];

    // Convert validation errors
    validationErrors.forEach(validationError => {
      const appError = this.createApplicationError(
        new Error(validationError.message),
        {
          ...context,
          metadata: {
            field: validationError.field,
            code: validationError.code,
            actualValue: validationError.actualValue,
            expectedValue: validationError.expectedValue,
            validationType: validationError.type
          }
        }
      );

      appError.code = validationError.code;
      appError.category = 'validation';
      appError.layer = 'validation';
      appError.severity = validationError.severity === 'error' ? 'error' : 'warning';
      appError.userMessage = this.createUserFriendlyValidationMessage(validationError);
      appError.recoverySuggestions = validationError.suggestion ? [validationError.suggestion] : [];

      appErrors.push(appError);
    });

    // Convert validation warnings
    validationWarnings.forEach(validationWarning => {
      const appError = this.createApplicationError(
        new Error(validationWarning.message),
        {
          ...context,
          metadata: {
            field: validationWarning.field,
            code: validationWarning.code,
            actualValue: validationWarning.actualValue,
            recommendedValue: validationWarning.recommendedValue
          }
        }
      );

      appError.code = validationWarning.code;
      appError.category = 'validation';
      appError.layer = 'validation';
      appError.severity = 'warning';
      appError.userMessage = this.createUserFriendlyValidationMessage(validationWarning);
      appError.recoverySuggestions = validationWarning.suggestion ? [validationWarning.suggestion] : [];

      appErrors.push(appError);
    });

    return appErrors;
  }

  /**
   * Add error listener
   */
  addErrorListener(listener: (error: ApplicationError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  removeErrorListener(listener: (error: ApplicationError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 50): ApplicationError[] {
    return this.errorLog.slice(-count);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): ApplicationError[] {
    return this.errorLog.filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ApplicationError[] {
    return this.errorLog.filter(error => error.severity === severity);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Create application error from generic error
   */
  private createApplicationError(error: Error, context?: ErrorContext): ApplicationError {
    const errorId = this.generateErrorId();
    const timestamp = new Date();

    // Determine error category and layer from error message and context
    const { category, layer, severity, statusCode } = this.categorizeError(error, context);

    // Generate user-friendly message
    const userMessage = this.generateUserFriendlyMessage(error, category);

    // Generate recovery suggestions
    const recoverySuggestions = this.generateRecoverySuggestions(error, category);

    // Determine if error is retryable
    const retryable = this.isRetryableError(error, category);

    return {
      id: errorId,
      code: this.generateErrorCode(error, category),
      message: error.message,
      userMessage,
      severity,
      category,
      layer,
      originalError: error,
      context,
      timestamp,
      stack: error.stack,
      recoverySuggestions,
      retryable,
      statusCode
    };
  }

  /**
   * Check if error is already an ApplicationError
   */
  private isApplicationError(error: any): error is ApplicationError {
    return error && typeof error === 'object' && 'id' in error && 'code' in error && 'severity' in error;
  }

  /**
   * Add error to log with size management
   */
  private addToErrorLog(error: ApplicationError): void {
    this.errorLog.push(error);
    
    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Notify all error listeners
   */
  private notifyListeners(error: ApplicationError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Log error to console with appropriate level
   */
  private logError(error: ApplicationError): void {
    const logMessage = `[${error.severity.toUpperCase()}] ${error.layer}/${error.category}: ${error.message}`;
    
    switch (error.severity) {
      case 'critical':
      case 'error':
        console.error(logMessage, {
          id: error.id,
          code: error.code,
          context: error.context,
          stack: error.stack
        });
        break;
      case 'warning':
        console.warn(logMessage, {
          id: error.id,
          code: error.code,
          context: error.context
        });
        break;
      case 'info':
        console.info(logMessage, {
          id: error.id,
          code: error.code
        });
        break;
    }
  }

  /**
   * Categorize error based on error message and context
   */
  private categorizeError(error: Error, context?: ErrorContext): {
    category: ErrorCategory;
    layer: ApplicationLayer;
    severity: ErrorSeverity;
    statusCode?: number;
  } {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // API layer errors
    if (context?.endpoint || message.includes('api') || message.includes('request')) {
      if (message.includes('unauthorized') || message.includes('api key')) {
        return { category: 'authentication', layer: 'api', severity: 'error', statusCode: 401 };
      }
      if (message.includes('rate limit') || message.includes('too many requests')) {
        return { category: 'rate-limit', layer: 'api', severity: 'warning', statusCode: 429 };
      }
      if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
        return { category: 'network', layer: 'api', severity: 'error', statusCode: 503 };
      }
      return { category: 'system', layer: 'api', severity: 'error', statusCode: 500 };
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return { category: 'validation', layer: 'validation', severity: 'error', statusCode: 400 };
    }

    // User input errors
    if (message.includes('json') || message.includes('parse') || message.includes('syntax')) {
      return { category: 'user-input', layer: 'api', severity: 'error', statusCode: 400 };
    }

    // System errors
    if (name.includes('system') || message.includes('internal') || message.includes('server')) {
      return { category: 'system', layer: 'service', severity: 'critical', statusCode: 500 };
    }

    // Default categorization
    return { category: 'system', layer: 'service', severity: 'error', statusCode: 500 };
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserFriendlyMessage(error: Error, category: ErrorCategory): string {
    const message = error.message;

    switch (category) {
      case 'validation':
        return `There's an issue with your ORTB request: ${message}`;
      case 'authentication':
        return 'Authentication failed. Please check your API key.';
      case 'rate-limit':
        return 'You\'ve made too many requests. Please wait a moment before trying again.';
      case 'network':
        return 'Network connection issue. Please check your connection and try again.';
      case 'user-input':
        return `There's an issue with your input: ${message}`;
      case 'business-logic':
        return `Business rule violation: ${message}`;
      case 'system':
        return 'An unexpected system error occurred. Please try again or contact support.';
      default:
        return message;
    }
  }

  /**
   * Generate recovery suggestions
   */
  private generateRecoverySuggestions(error: Error, category: ErrorCategory): string[] {
    const suggestions: string[] = [];

    switch (category) {
      case 'validation':
        suggestions.push('Check the OpenRTB 2.6 specification for field requirements');
        suggestions.push('Use the sample generator to see valid request examples');
        suggestions.push('Validate your JSON structure');
        break;
      case 'authentication':
        suggestions.push('Verify your API key is correct');
        suggestions.push('Check that your API key has the necessary permissions');
        suggestions.push('Contact support if you need a new API key');
        break;
      case 'rate-limit':
        suggestions.push('Wait a few minutes before making more requests');
        suggestions.push('Consider implementing request throttling in your application');
        suggestions.push('Contact support if you need higher rate limits');
        break;
      case 'network':
        suggestions.push('Check your internet connection');
        suggestions.push('Try again in a few moments');
        suggestions.push('Contact support if the issue persists');
        break;
      case 'user-input':
        suggestions.push('Check your JSON syntax');
        suggestions.push('Ensure all required fields are present');
        suggestions.push('Use the validation tool to identify specific issues');
        break;
      case 'system':
        suggestions.push('Try again in a few moments');
        suggestions.push('Contact support if the issue persists');
        break;
    }

    return suggestions;
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: Error, category: ErrorCategory): boolean {
    switch (category) {
      case 'network':
      case 'rate-limit':
        return true;
      case 'system':
        return !error.message.toLowerCase().includes('critical');
      case 'validation':
      case 'authentication':
      case 'user-input':
      case 'business-logic':
        return false;
      default:
        return false;
    }
  }

  /**
   * Generate recovery actions
   */
  private generateRecoveryActions(error: ApplicationError): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    if (error.retryable) {
      actions.push({
        id: 'retry',
        description: 'Try the operation again',
        type: 'retry',
        requiresUserAction: true
      });
    }

    if (error.category === 'validation') {
      actions.push({
        id: 'use-sample-generator',
        description: 'Generate a valid sample request',
        type: 'fallback',
        requiresUserAction: true
      });
      
      actions.push({
        id: 'view-field-help',
        description: 'Get help with specific fields',
        type: 'user-action',
        requiresUserAction: true
      });
    }

    if (error.category === 'user-input') {
      actions.push({
        id: 'validate-json',
        description: 'Validate your JSON syntax',
        type: 'user-action',
        requiresUserAction: true
      });
    }

    return actions;
  }

  /**
   * Create user-friendly validation message
   */
  private createUserFriendlyValidationMessage(error: ValidationError | ValidationWarning): string {
    const field = error.field;
    const message = error.message;

    if (field && field !== 'root') {
      return `Issue with field "${field}": ${message}`;
    }

    return message;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate error code
   */
  private generateErrorCode(error: Error, category: ErrorCategory): string {
    const categoryPrefix = category.toUpperCase().replace('-', '_');
    const errorName = error.name.toUpperCase().replace('ERROR', '');
    return `${categoryPrefix}_${errorName || 'UNKNOWN'}`;
  }
}

// Export singleton instance
export const globalErrorHandler = GlobalErrorHandler.getInstance();