/**
 * Error Reporting System
 * Provides detailed error reporting with categorization and suggestions
 */

import {
  ValidationError,
  ValidationWarning,
  ValidationResult,
  ValidationReport,
  ValidationSummary,
  FieldValidationResult,
  ReportMetadata,
  ComplianceReport,
  ComplianceLevel,
  CategoryCompliance,
  ComplianceRecommendation,
  ErrorType
} from '../models';

export interface ErrorReporter {
  generateValidationReport(result: ValidationResult): ValidationReport;
  generateComplianceReport(result: ValidationResult): ComplianceReport;
  categorizeErrors(errors: ValidationError[]): Map<string, ValidationError[]>;
  generateSuggestions(errors: ValidationError[]): string[];
  formatErrorMessage(error: ValidationError): string;
  formatWarningMessage(warning: ValidationWarning): string;
}

/**
 * Detailed error reporting system implementation
 */
export class ORTBErrorReporter implements ErrorReporter {
  private readonly toolVersion = '1.0.0';

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport(result: ValidationResult): ValidationReport {
    const summary = this.generateValidationSummary(result);
    const fieldResults = this.generateFieldValidationResults(result);
    const recommendations = this.generateSuggestions(result.errors);
    const metadata = this.generateReportMetadata();

    return {
      summary,
      fieldResults,
      complianceScore: result.complianceScore,
      recommendations,
      timestamp: new Date(),
      metadata
    };
  }

  /**
   * Generate compliance report with detailed analysis
   */
  generateComplianceReport(result: ValidationResult): ComplianceReport {
    const categoryCompliance = this.generateCategoryCompliance(result.errors, result.warnings);
    const criticalIssues = this.identifyCriticalIssues(result.errors);
    const recommendations = this.generateComplianceRecommendations(result.errors, result.warnings);

    return {
      overallCompliance: result.complianceLevel,
      complianceScore: result.complianceScore,
      categoryCompliance,
      criticalIssues,
      recommendations,
      timestamp: new Date()
    };
  }

  /**
   * Categorize errors by type and severity
   */
  categorizeErrors(errors: ValidationError[]): Map<string, ValidationError[]> {
    const categories = new Map<string, ValidationError[]>();

    errors.forEach(error => {
      const category = this.getCategoryForError(error);
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(error);
    });

    return categories;
  }

  /**
   * Generate actionable suggestions based on errors
   */
  generateSuggestions(errors: ValidationError[]): string[] {
    const suggestions = new Set<string>();

    // Group errors by type for better suggestions
    const errorsByType = new Map<ErrorType, ValidationError[]>();
    errors.forEach(error => {
      if (!errorsByType.has(error.type)) {
        errorsByType.set(error.type, []);
      }
      errorsByType.get(error.type)!.push(error);
    });

    // Generate type-specific suggestions
    errorsByType.forEach((typeErrors, type) => {
      const typeSuggestions = this.generateSuggestionsForErrorType(type, typeErrors);
      typeSuggestions.forEach(suggestion => suggestions.add(suggestion));
    });

    // Add general suggestions based on error patterns
    const generalSuggestions = this.generateGeneralSuggestions(errors);
    generalSuggestions.forEach(suggestion => suggestions.add(suggestion));

    return Array.from(suggestions);
  }

  /**
   * Format error message with context and suggestions
   */
  formatErrorMessage(error: ValidationError): string {
    let message = `[${error.code}] ${error.message}`;
    
    if (error.field && error.field !== 'root') {
      message += ` (Field: ${error.field})`;
    }

    if (error.actualValue !== undefined || error.expectedValue !== undefined) {
      const expected = error.expectedValue !== undefined ? this.formatValue(error.expectedValue) : 'undefined';
      const actual = error.actualValue !== undefined ? this.formatValue(error.actualValue) : 'undefined';
      message += ` - Expected: ${expected}, Got: ${actual}`;
    }

    if (error.suggestion) {
      message += ` | Suggestion: ${error.suggestion}`;
    }

    return message;
  }

  /**
   * Format warning message with context
   */
  formatWarningMessage(warning: ValidationWarning): string {
    let message = `[${warning.code}] ${warning.message}`;
    
    if (warning.field) {
      message += ` (Field: ${warning.field})`;
    }

    if (warning.actualValue !== undefined || warning.recommendedValue !== undefined) {
      const current = warning.actualValue !== undefined ? this.formatValue(warning.actualValue) : 'undefined';
      const recommended = warning.recommendedValue !== undefined ? this.formatValue(warning.recommendedValue) : 'undefined';
      message += ` - Current: ${current}, Recommended: ${recommended}`;
    }

    if (warning.suggestion) {
      message += ` | Suggestion: ${warning.suggestion}`;
    }

    return message;
  }

  /**
   * Generate validation summary
   */
  private generateValidationSummary(result: ValidationResult): ValidationSummary {
    const totalFields = result.validatedFields.length;
    const errorFields = new Set(result.errors.map(e => e.field)).size;
    const warningFields = new Set(result.warnings.map(w => w.field)).size;
    const validFields = totalFields - errorFields;
    
    const missingRequiredFields = result.errors.filter(e => 
      e.type === 'required-field' || e.code.includes('REQUIRED')
    ).length;

    const status = result.isValid ? 
      (result.warnings.length > 0 ? 'warning' : 'passed') : 
      'failed';

    return {
      totalFields,
      validFields,
      errorFields,
      warningFields,
      missingRequiredFields,
      status: status as 'passed' | 'failed' | 'warning'
    };
  }

  /**
   * Generate field-level validation results
   */
  private generateFieldValidationResults(result: ValidationResult): FieldValidationResult[] {
    const fieldResults = new Map<string, FieldValidationResult>();

    // Initialize all validated fields
    result.validatedFields.forEach(fieldPath => {
      fieldResults.set(fieldPath, {
        fieldPath,
        isValid: true,
        errors: [],
        warnings: [],
        isRequired: false,
        isPresent: true,
        fieldDefinition: undefined as any
      });
    });

    // Add errors to field results
    result.errors.forEach(error => {
      const fieldPath = error.field;
      if (!fieldResults.has(fieldPath)) {
        fieldResults.set(fieldPath, {
          fieldPath,
          isValid: false,
          errors: [],
          warnings: [],
          isRequired: error.type === 'required-field',
          isPresent: error.type !== 'required-field',
          actualValue: error.actualValue,
          fieldDefinition: undefined as any
        });
      }
      
      const fieldResult = fieldResults.get(fieldPath)!;
      fieldResult.errors.push(error);
      fieldResult.isValid = false;
      fieldResult.actualValue = error.actualValue;
    });

    // Add warnings to field results
    result.warnings.forEach(warning => {
      const fieldPath = warning.field;
      if (!fieldResults.has(fieldPath)) {
        fieldResults.set(fieldPath, {
          fieldPath,
          isValid: true,
          errors: [],
          warnings: [],
          isRequired: false,
          isPresent: true,
          actualValue: warning.actualValue,
          fieldDefinition: undefined as any
        });
      }
      
      const fieldResult = fieldResults.get(fieldPath)!;
      fieldResult.warnings.push(warning);
      fieldResult.actualValue = warning.actualValue;
    });

    return Array.from(fieldResults.values());
  }

  /**
   * Generate report metadata
   */
  private generateReportMetadata(): ReportMetadata {
    return {
      generatedAt: new Date(),
      toolVersion: this.toolVersion,
      specVersion: '2.6',
      reportVersion: '1.0',
      additionalInfo: {
        generator: 'ORTB Validation Tool',
        format: 'detailed-validation-report'
      }
    };
  }

  /**
   * Generate category compliance analysis
   */
  private generateCategoryCompliance(errors: ValidationError[], warnings: ValidationWarning[]): CategoryCompliance[] {
    const categories = new Map<string, { errors: ValidationError[], warnings: ValidationWarning[] }>();

    // Categorize errors
    errors.forEach(error => {
      const category = this.getCategoryForError(error);
      if (!categories.has(category)) {
        categories.set(category, { errors: [], warnings: [] });
      }
      categories.get(category)!.errors.push(error);
    });

    // Categorize warnings
    warnings.forEach(warning => {
      const category = this.getCategoryForWarning(warning);
      if (!categories.has(category)) {
        categories.set(category, { errors: [], warnings: [] });
      }
      categories.get(category)!.warnings.push(warning);
    });

    // Generate compliance for each category
    return Array.from(categories.entries()).map(([category, issues]) => {
      const totalIssues = issues.errors.length + issues.warnings.length;
      const errorWeight = issues.errors.length * 10;
      const warningWeight = issues.warnings.length * 3;
      const totalWeight = errorWeight + warningWeight;
      
      let compliance: ComplianceLevel;
      let score: number;

      if (issues.errors.length === 0) {
        compliance = issues.warnings.length === 0 ? 'compliant' : 'partial';
        score = issues.warnings.length === 0 ? 100 : Math.max(70, 100 - warningWeight);
      } else {
        compliance = 'non-compliant';
        score = Math.max(0, 100 - totalWeight);
      }

      return {
        category,
        compliance,
        score: Math.round(score),
        issueCount: totalIssues,
        issues: issues.errors
      };
    });
  }

  /**
   * Identify critical issues that must be addressed
   */
  private identifyCriticalIssues(errors: ValidationError[]): ValidationError[] {
    return errors.filter(error => 
      error.severity === 'error' && (
        error.type === 'required-field' ||
        error.type === 'schema' ||
        error.code.includes('REQUIRED') ||
        error.code.includes('MISSING') ||
        error.code.includes('INVALID_AUCTION_TYPE')
      )
    );
  }

  /**
   * Generate compliance recommendations
   */
  private generateComplianceRecommendations(errors: ValidationError[], warnings: ValidationWarning[]): ComplianceRecommendation[] {
    const recommendations: ComplianceRecommendation[] = [];

    // High priority recommendations for critical errors
    const criticalErrors = this.identifyCriticalIssues(errors);
    if (criticalErrors.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Fix Critical Validation Errors',
        description: 'Address required field errors and schema violations that prevent request processing.',
        affectedFields: criticalErrors.map(e => e.field),
        impactScore: criticalErrors.length * 25
      });
    }

    // Medium priority for business logic errors
    const businessLogicErrors = errors.filter(e => e.type === 'logical');
    if (businessLogicErrors.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Resolve Business Logic Issues',
        description: 'Fix business rule violations that may affect bid processing.',
        affectedFields: businessLogicErrors.map(e => e.field),
        impactScore: businessLogicErrors.length * 15
      });
    }

    // Low priority for warnings and optimizations
    if (warnings.length > 0) {
      recommendations.push({
        priority: 'low',
        title: 'Address Optimization Opportunities',
        description: 'Consider addressing warnings to improve request quality and fill rates.',
        affectedFields: warnings.map(w => w.field),
        impactScore: warnings.length * 5
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get category for error
   */
  private getCategoryForError(error: ValidationError): string {
    switch (error.type) {
      case 'required-field':
        return 'Required Fields';
      case 'schema':
        return 'Schema Validation';
      case 'format':
        return 'Format Validation';
      case 'value':
        return 'Value Validation';
      case 'logical':
        return 'Business Logic';
      default:
        return 'General Validation';
    }
  }

  /**
   * Get category for warning
   */
  private getCategoryForWarning(warning: ValidationWarning): string {
    if (warning.code.includes('CURRENCY')) return 'Currency and Pricing';
    if (warning.code.includes('BANNER') || warning.code.includes('SIZE')) return 'Ad Format';
    if (warning.code.includes('DEVICE')) return 'Device Targeting';
    if (warning.code.includes('TIMEOUT')) return 'Performance';
    return 'Best Practices';
  }

  /**
   * Generate suggestions for specific error types
   */
  private generateSuggestionsForErrorType(type: ErrorType, _errors: ValidationError[]): string[] {
    const suggestions: string[] = [];

    switch (type) {
      case 'required-field':
        suggestions.push('Ensure all required fields are present in your request');
        suggestions.push('Check the OpenRTB 2.6 specification for mandatory fields');
        break;
      case 'schema':
        suggestions.push('Validate your JSON structure against the OpenRTB 2.6 schema');
        suggestions.push('Check for correct data types and field formats');
        break;
      case 'logical':
        suggestions.push('Review business logic rules and field relationships');
        suggestions.push('Ensure mutually exclusive fields are not both present');
        break;
      case 'value':
        suggestions.push('Check that field values are within acceptable ranges');
        suggestions.push('Use standard enumerated values where applicable');
        break;
      case 'format':
        suggestions.push('Verify field formats match OpenRTB specifications');
        suggestions.push('Check string patterns and numeric constraints');
        break;
    }

    return suggestions;
  }

  /**
   * Generate general suggestions based on error patterns
   */
  private generateGeneralSuggestions(errors: ValidationError[]): string[] {
    const suggestions: string[] = [];

    // Check for common patterns
    const hasImpressionErrors = errors.some(e => e.field.includes('imp'));
    const hasSiteAppConflict = errors.some(e => e.code === 'ORTB_SITE_APP_MUTUAL_EXCLUSION');
    const hasDuplicateIds = errors.some(e => e.code === 'ORTB_DUPLICATE_IMPRESSION_ID');

    if (hasImpressionErrors) {
      suggestions.push('Review impression configuration and ensure all required impression fields are present');
    }

    if (hasSiteAppConflict) {
      suggestions.push('Choose either site or app object based on your inventory type - they cannot both be present');
    }

    if (hasDuplicateIds) {
      suggestions.push('Generate unique IDs for all impressions within a single request');
    }

    if (errors.length > 5) {
      suggestions.push('Consider using a validation tool during development to catch issues early');
    }

    return suggestions;
  }

  /**
   * Format value for display
   */
  private formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value; // Don't add quotes for expected test format
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}