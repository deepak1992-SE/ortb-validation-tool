/**
 * Validation Engine Implementation
 * Provides JSON schema validation against OpenRTB 2.6 structure
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { 
  ORTBRequest, 
  ValidationResult, 
  BatchValidationResult, 
  ValidationError, 
  ValidationWarning,
  ComplianceLevel,
  ErrorType,
  ValidationSeverity,
  BatchValidationSummary,
  ErrorFrequency,
  WarningFrequency
} from '../models';
import { SchemaManager, ORTBSchema } from './schema-manager';
import { ORTBValidationRules } from './validation-rules';
import { ORTBErrorReporter } from './error-reporter';

export interface ValidationEngine {
  validateRequest(request: ORTBRequest): Promise<ValidationResult>;
  validateBatch(requests: ORTBRequest[]): Promise<BatchValidationResult>;
  generateValidationReport(result: ValidationResult): any;
  generateComplianceReport(result: ValidationResult): any;
}

/**
 * Core validation engine for OpenRTB 2.6 requests
 */
export class ORTBValidationEngine implements ValidationEngine {
  private ajv: Ajv;
  private schemaManager: SchemaManager;
  private validationRules: ORTBValidationRules;
  private errorReporter: ORTBErrorReporter;
  private ortbSchema: ORTBSchema | null = null;

  constructor() {
    // Initialize AJV with formats support
    this.ajv = new Ajv({ 
      allErrors: true, 
      verbose: true,
      strict: false,
      validateFormats: true
    });
    addFormats(this.ajv);
    
    this.schemaManager = new SchemaManager();
    this.validationRules = new ORTBValidationRules();
    this.errorReporter = new ORTBErrorReporter();
  }

  /**
   * Validate a single ORTB request
   */
  async validateRequest(request: ORTBRequest): Promise<ValidationResult> {
    const validationId = this.generateValidationId();
    const timestamp = new Date();

    try {
      // Ensure schema is loaded
      await this.ensureSchemaLoaded();

      // Perform schema validation
      const schemaResult = this.schemaManager.validateAgainstSchema(request, this.ortbSchema!);
      
      // Convert schema validation results to our format
      const errors = this.convertSchemaErrorsToValidationErrors(schemaResult.errors);
      let warnings: ValidationWarning[] = [];

      // Perform OpenRTB-specific validation rules if request is a valid object
      // (even if it has some schema errors, we can still check business logic)
      if (typeof request === 'object' && request !== null) {
        const businessLogicResult = this.validationRules.validateBusinessLogic(request);
        const crossFieldResult = this.validationRules.validateCrossFieldRules(request);
        const enumeratedValuesResult = this.validationRules.validateEnumeratedValues(request);
        const constraintsResult = this.validationRules.validateConstraints(request);

        // Combine all validation results
        errors.push(
          ...businessLogicResult.errors,
          ...crossFieldResult.errors,
          ...enumeratedValuesResult.errors,
          ...constraintsResult.errors
        );

        warnings.push(
          ...businessLogicResult.warnings,
          ...crossFieldResult.warnings,
          ...enumeratedValuesResult.warnings,
          ...constraintsResult.warnings
        );
      }
      
      // Calculate compliance
      const complianceLevel = this.calculateComplianceLevel(errors, warnings);
      const complianceScore = this.calculateComplianceScore(errors, warnings, schemaResult.validatedPaths);

      // Overall validity is based on both schema and business logic errors
      const isValid = schemaResult.isValid && errors.length === 0;

      return {
        isValid,
        errors,
        warnings,
        complianceLevel,
        validatedFields: schemaResult.validatedPaths,
        complianceScore,
        timestamp,
        validationId,
        specVersion: '2.6'
      };
    } catch (error) {
      // Handle validation errors gracefully
      const validationError: ValidationError = {
        field: 'root',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
        code: 'VALIDATION_ENGINE_ERROR',
        type: 'schema',
        actualValue: request,
        expectedValue: 'valid ORTB request'
      };

      return {
        isValid: false,
        errors: [validationError],
        warnings: [],
        complianceLevel: 'non-compliant',
        validatedFields: [],
        complianceScore: 0,
        timestamp,
        validationId,
        specVersion: '2.6'
      };
    }
  }

  /**
   * Validate multiple ORTB requests in batch
   */
  async validateBatch(requests: ORTBRequest[]): Promise<BatchValidationResult> {
    const batchId = this.generateBatchId();
    const timestamp = new Date();

    if (!requests || requests.length === 0) {
      return {
        results: [],
        summary: this.createEmptyBatchSummary(),
        overallComplianceScore: 0,
        timestamp,
        batchId
      };
    }

    // Validate each request
    const results: ValidationResult[] = [];
    for (const request of requests) {
      try {
        const result = await this.validateRequest(request);
        results.push(result);
      } catch (error) {
        // Create error result for failed validation
        const errorResult: ValidationResult = {
          isValid: false,
          errors: [{
            field: 'root',
            message: `Batch validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
            code: 'BATCH_VALIDATION_ERROR',
            type: 'schema',
            actualValue: request,
            expectedValue: 'valid ORTB request'
          }],
          warnings: [],
          complianceLevel: 'non-compliant',
          validatedFields: [],
          complianceScore: 0,
          timestamp: new Date(),
          validationId: this.generateValidationId(),
          specVersion: '2.6'
        };
        results.push(errorResult);
      }
    }

    // Generate batch summary
    const summary = this.generateBatchSummary(results);
    const overallComplianceScore = this.calculateOverallComplianceScore(results);

    return {
      results,
      summary,
      overallComplianceScore,
      timestamp,
      batchId
    };
  }

  /**
   * Ensure OpenRTB schema is loaded
   */
  private async ensureSchemaLoaded(): Promise<void> {
    if (!this.ortbSchema) {
      this.ortbSchema = await this.schemaManager.loadSchema('2.6');
    }
  }

  /**
   * Convert schema validation errors to our validation error format
   */
  private convertSchemaErrorsToValidationErrors(schemaErrors: any[]): ValidationError[] {
    return schemaErrors.map(error => {
      const errorType = this.determineErrorType(error);
      const severity = this.determineSeverity(error);
      
      return {
        field: error.path || 'root',
        message: this.formatErrorMessage(error),
        severity,
        code: this.generateErrorCode(error),
        type: errorType,
        actualValue: error.actual,
        expectedValue: error.expected,
        suggestion: this.generateSuggestion(error) || ''
      };
    });
  }

  /**
   * Determine error type from schema validation error
   */
  private determineErrorType(error: any): ErrorType {
    if (error.rule === 'required-field') return 'required-field';
    if (error.rule === 'type-validation') return 'schema';
    if (error.rule?.includes('ortb-')) return 'logical';
    if (error.rule === 'schema-validation') return 'schema';
    return 'value';
  }

  /**
   * Determine severity from schema validation error
   */
  private determineSeverity(error: any): ValidationSeverity {
    if (error.rule === 'required-field') return 'error';
    if (error.rule?.includes('ortb-required')) return 'error';
    if (error.rule === 'type-validation') return 'error';
    return 'warning';
  }

  /**
   * Format error message for better readability
   */
  private formatErrorMessage(error: any): string {
    if (error.message) return error.message;
    
    switch (error.rule) {
      case 'required-field':
        return `Required field '${error.path}' is missing`;
      case 'type-validation':
        return `Field '${error.path}' has incorrect type. Expected ${error.expected}, got ${error.actual}`;
      default:
        return `Validation error at '${error.path}': ${error.rule}`;
    }
  }

  /**
   * Generate error code for programmatic handling
   */
  private generateErrorCode(error: any): string {
    const prefix = 'ORTB_';
    
    switch (error.rule) {
      case 'required-field':
        return `${prefix}REQUIRED_FIELD_MISSING`;
      case 'type-validation':
        return `${prefix}INVALID_TYPE`;
      case 'ortb-required-id':
        return `${prefix}INVALID_REQUEST_ID`;
      case 'ortb-required-impressions':
        return `${prefix}MISSING_IMPRESSIONS`;
      case 'ortb-required-impression-id':
        return `${prefix}MISSING_IMPRESSION_ID`;
      case 'ortb-site-app-exclusivity':
        return `${prefix}SITE_APP_CONFLICT`;
      default:
        return `${prefix}VALIDATION_ERROR`;
    }
  }

  /**
   * Generate suggestion for fixing the error
   */
  private generateSuggestion(error: any): string | undefined {
    switch (error.rule) {
      case 'required-field':
        return `Add the required field '${error.path}' to your request`;
      case 'type-validation':
        return `Change '${error.path}' to type ${error.expected}`;
      case 'ortb-required-id':
        return 'Provide a unique, non-empty string ID for the request';
      case 'ortb-required-impressions':
        return 'Add at least one impression object to the imp array';
      case 'ortb-required-impression-id':
        return 'Provide a unique ID for each impression';
      case 'ortb-site-app-exclusivity':
        return 'Include either site OR app object, not both';
      default:
        return undefined;
    }
  }

  /**
   * Calculate compliance level based on errors and warnings
   */
  private calculateComplianceLevel(errors: ValidationError[], warnings: ValidationWarning[]): ComplianceLevel {
    if (errors.length === 0) {
      return warnings.length === 0 ? 'compliant' : 'partial';
    }
    
    // Any error makes it non-compliant for basic schema validation
    // In later tasks, we might be more lenient for certain error types
    return 'non-compliant';
  }

  /**
   * Calculate compliance score (0-100)
   */
  private calculateComplianceScore(
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    validatedFields: string[]
  ): number {
    if (validatedFields.length === 0) return 0;

    // Base score starts at 100
    let score = 100;
    
    // Heavy penalty for errors
    const errorPenalty = errors.length * 25; // Each error costs 25 points
    const warningPenalty = warnings.length * 5; // Each warning costs 5 points
    
    score -= errorPenalty + warningPenalty;
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate batch summary from individual results
   */
  private generateBatchSummary(results: ValidationResult[]): BatchValidationSummary {
    const totalRequests = results.length;
    const validRequests = results.filter(r => r.isValid).length;
    const invalidRequests = results.filter(r => !r.isValid).length;
    const warningRequests = results.filter(r => r.isValid && r.warnings.length > 0).length;

    // Calculate common errors
    const errorCounts = new Map<string, { message: string; count: number }>();
    results.forEach(result => {
      result.errors.forEach(error => {
        const existing = errorCounts.get(error.code);
        if (existing) {
          existing.count++;
        } else {
          errorCounts.set(error.code, { message: error.message, count: 1 });
        }
      });
    });

    const commonErrors: ErrorFrequency[] = Array.from(errorCounts.entries())
      .map(([code, data]) => ({
        code,
        message: data.message,
        count: data.count,
        percentage: Math.round((data.count / totalRequests) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 most common errors

    // Calculate common warnings
    const warningCounts = new Map<string, { message: string; count: number }>();
    results.forEach(result => {
      result.warnings.forEach(warning => {
        const existing = warningCounts.get(warning.code);
        if (existing) {
          existing.count++;
        } else {
          warningCounts.set(warning.code, { message: warning.message, count: 1 });
        }
      });
    });

    const commonWarnings: WarningFrequency[] = Array.from(warningCounts.entries())
      .map(([code, data]) => ({
        code,
        message: data.message,
        count: data.count,
        percentage: Math.round((data.count / totalRequests) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 most common warnings

    const averageComplianceScore = totalRequests > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.complianceScore, 0) / totalRequests)
      : 0;

    return {
      totalRequests,
      validRequests,
      invalidRequests,
      warningRequests,
      commonErrors,
      commonWarnings,
      averageComplianceScore
    };
  }

  /**
   * Calculate overall compliance score for batch
   */
  private calculateOverallComplianceScore(results: ValidationResult[]): number {
    if (results.length === 0) return 0;
    
    const totalScore = results.reduce((sum, result) => sum + result.complianceScore, 0);
    return Math.round(totalScore / results.length);
  }

  /**
   * Create empty batch summary for edge cases
   */
  private createEmptyBatchSummary(): BatchValidationSummary {
    return {
      totalRequests: 0,
      validRequests: 0,
      invalidRequests: 0,
      warningRequests: 0,
      commonErrors: [],
      commonWarnings: [],
      averageComplianceScore: 0
    };
  }

  /**
   * Generate unique validation ID
   */
  private generateValidationId(): string {
    return `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate detailed validation report
   */
  generateValidationReport(result: ValidationResult): any {
    return this.errorReporter.generateValidationReport(result);
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(result: ValidationResult): any {
    return this.errorReporter.generateComplianceReport(result);
  }



  /**
   * Format warning message with context
   */
  formatWarningMessage(warning: ValidationWarning): string {
    return this.errorReporter.formatWarningMessage(warning);
  }

  /**
   * Categorize errors for analysis
   */
  categorizeErrors(errors: ValidationError[]): Map<string, ValidationError[]> {
    return this.errorReporter.categorizeErrors(errors);
  }

  /**
   * Generate actionable suggestions
   */
  generateSuggestions(errors: ValidationError[]): string[] {
    return this.errorReporter.generateSuggestions(errors);
  }
}