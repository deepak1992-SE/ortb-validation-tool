/**
 * Validation Service Implementation
 * Service layer that orchestrates validation engine and provides batch processing with caching
 */

import { 
  ORTBRequest, 
  ValidationResult, 
  BatchValidationResult,
  ValidationReport,
  ComplianceReport,
  ValidationError
} from '../models';
import { ORTBValidationEngine, ValidationEngine } from '../validation/validation-engine';
import { ORTBReportingService, ReportingService } from './reporting-service';
import { ValidationResultCache } from './cache-service';

export interface ValidationServiceConfig {
  /** Maximum number of requests to process in a single batch */
  maxBatchSize?: number;
  /** Timeout for individual validation in milliseconds */
  validationTimeout?: number;
  /** Whether to continue batch processing on individual failures */
  continueOnError?: boolean;
  /** Whether to include detailed field validation in reports */
  includeDetailedReports?: boolean;
  /** Enable validation result caching */
  enableCaching?: boolean;
  /** Cache TTL for validation results in milliseconds */
  cacheTtl?: number;
  /** Maximum concurrent validations in batch processing */
  maxConcurrency?: number;
}

export interface ValidationService {
  validateSingle(request: ORTBRequest, options?: ValidationOptions): Promise<ValidationResult>;
  validateBatch(requests: ORTBRequest[], options?: BatchValidationOptions): Promise<BatchValidationResult>;
  generateReport(result: ValidationResult): Promise<ValidationReport>;
  generateComplianceReport(result: ValidationResult): Promise<ComplianceReport>;
  generateBatchReport(batchResult: BatchValidationResult): Promise<BatchValidationReport>;
}

export interface ValidationOptions {
  /** Include detailed field validation results */
  includeFieldDetails?: boolean;
  /** Generate compliance report along with validation */
  includeComplianceReport?: boolean;
  /** Custom validation timeout in milliseconds */
  timeout?: number;
}

export interface BatchValidationOptions extends ValidationOptions {
  /** Maximum number of requests to process concurrently */
  concurrency?: number;
  /** Whether to stop processing on first error */
  failFast?: boolean;
  /** Progress callback for batch processing */
  onProgress?: (processed: number, total: number) => void;
}

export interface BatchValidationReport {
  /** Batch validation results */
  batchResult: BatchValidationResult;
  /** Individual validation reports */
  individualReports: ValidationReport[];
  /** Aggregated compliance report */
  complianceReport: ComplianceReport;
  /** Batch processing statistics */
  processingStats: BatchProcessingStats;
  /** Timestamp of report generation */
  timestamp: Date;
}

export interface BatchProcessingStats {
  /** Total processing time in milliseconds */
  totalProcessingTime: number;
  /** Average processing time per request */
  averageProcessingTime: number;
  /** Number of requests processed successfully */
  successfullyProcessed: number;
  /** Number of requests that failed processing */
  failedProcessing: number;
  /** Processing errors encountered */
  processingErrors: ProcessingError[];
}

export interface ProcessingError {
  /** Index of the request that failed processing */
  requestIndex: number;
  /** Error message */
  error: string;
  /** Timestamp when error occurred */
  timestamp: Date;
}

/**
 * Main validation service implementation with caching
 */
export class ORTBValidationService implements ValidationService {
  private validationEngine: ValidationEngine;
  private reportingService: ReportingService;
  private config: Required<ValidationServiceConfig>;
  private validationCache: ValidationResultCache;

  constructor(config: ValidationServiceConfig = {}) {
    this.validationEngine = new ORTBValidationEngine();
    this.reportingService = new ORTBReportingService();
    this.validationCache = new ValidationResultCache();
    this.config = {
      maxBatchSize: config.maxBatchSize ?? 100,
      validationTimeout: config.validationTimeout ?? 5000,
      continueOnError: config.continueOnError ?? true,
      includeDetailedReports: config.includeDetailedReports ?? false,
      enableCaching: config.enableCaching ?? true,
      cacheTtl: config.cacheTtl ?? 1800000, // 30 minutes
      maxConcurrency: config.maxConcurrency ?? 10
    };
  }

  /**
   * Validate a single ORTB request with detailed reporting and caching
   */
  async validateSingle(request: ORTBRequest, options: ValidationOptions = {}): Promise<ValidationResult> {
    const startTime = Date.now();
    
    // Check cache first if caching is enabled
    if (this.config.enableCaching) {
      const cacheKey = this.validationCache.generateKey(request, options);
      const cachedResult = this.validationCache.get(cacheKey);
      
      if (cachedResult) {
        // Add cache hit metadata
        const result = { ...cachedResult };
        (result as any).fromCache = true;
        (result as any).processingTime = Date.now() - startTime;
        return result;
      }
    }
    
    try {
      // Apply timeout if specified
      const timeout = options.timeout ?? this.config.validationTimeout;
      const validationPromise = this.validationEngine.validateRequest(request);
      
      const result = await this.withTimeout(validationPromise, timeout) as ValidationResult;
      
      // Add processing time to result metadata
      const processingTime = Date.now() - startTime;
      (result as any).processingTime = processingTime;
      (result as any).fromCache = false;
      
      // Cache the result if caching is enabled
      if (this.config.enableCaching) {
        const cacheKey = this.validationCache.generateKey(request, options);
        this.validationCache.set(cacheKey, result, this.config.cacheTtl);
      }
      
      return result;
    } catch (error) {
      // Handle timeout or other validation errors
      const processingTime = Date.now() - startTime;
      
      const errorResult = {
        isValid: false,
        errors: [{
          field: 'root',
          message: `Validation service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
          code: 'VALIDATION_SERVICE_ERROR',
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
        specVersion: '2.6',
        processingTime,
        fromCache: false
      } as ValidationResult & { processingTime: number; fromCache: boolean };
      
      return errorResult;
    }
  }

  /**
   * Validate multiple ORTB requests with batch processing capabilities
   */
  async validateBatch(
    requests: ORTBRequest[], 
    options: BatchValidationOptions = {}
  ): Promise<BatchValidationResult> {
    const startTime = Date.now();
    const batchId = this.generateBatchId();
    
    // Validate input
    if (!requests || requests.length === 0) {
      return {
        results: [],
        summary: {
          totalRequests: 0,
          validRequests: 0,
          invalidRequests: 0,
          warningRequests: 0,
          commonErrors: [],
          commonWarnings: [],
          averageComplianceScore: 0
        },
        overallComplianceScore: 0,
        timestamp: new Date(),
        batchId
      };
    }

    // Check batch size limits
    if (requests.length > this.config.maxBatchSize) {
      throw new Error(`Batch size ${requests.length} exceeds maximum allowed size of ${this.config.maxBatchSize}`);
    }

    const concurrency = Math.min(options.concurrency ?? this.config.maxConcurrency, this.config.maxConcurrency);
    const failFast = options.failFast ?? false;
    const onProgress = options.onProgress;

    const results: ValidationResult[] = [];
    const processingErrors: ProcessingError[] = [];
    let processed = 0;

    try {
      // Process requests in batches with concurrency control
      for (let i = 0; i < requests.length; i += concurrency) {
        const batch = requests.slice(i, i + concurrency);
        const batchPromises = batch.map(async (request, batchIndex) => {
          const requestIndex = i + batchIndex;
          
          try {
            // Call validation engine directly to catch actual errors
            const result = await this.validationEngine.validateRequest(request);
            
            // Add processing time metadata
            const processingTime = Date.now() - startTime;
            (result as any).processingTime = processingTime;
            
            return { result, requestIndex };
          } catch (error) {
            const processingError: ProcessingError = {
              requestIndex,
              error: error instanceof Error ? error.message : 'Unknown processing error',
              timestamp: new Date()
            };
            processingErrors.push(processingError);

            if (failFast) {
              throw error;
            }

            // Return error result for failed validation
            return {
              result: {
                isValid: false,
                errors: [{
                  field: 'root',
                  message: `Batch processing error: ${processingError.error}`,
                  severity: 'error',
                  code: 'BATCH_PROCESSING_ERROR',
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
              } as ValidationResult,
              requestIndex
            };
          }
        });

        // Wait for current batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Add results in correct order
        batchResults.forEach(({ result, requestIndex }) => {
          results[requestIndex] = result;
        });

        processed += batch.length;
        
        // Report progress if callback provided
        if (onProgress) {
          onProgress(processed, requests.length);
        }
      }

      // Create batch result manually since we processed individually
      const summary = this.generateBatchSummary(results);
      const overallComplianceScore = this.calculateOverallComplianceScore(results);
      
      const batchResult: BatchValidationResult = {
        results,
        summary,
        overallComplianceScore,
        timestamp: new Date(),
        batchId
      };
      
      // Add processing statistics
      const totalProcessingTime = Date.now() - startTime;
      (batchResult as any).processingStats = {
        totalProcessingTime,
        averageProcessingTime: Math.round(totalProcessingTime / requests.length),
        successfullyProcessed: results.filter(r => r.isValid).length,
        failedProcessing: processingErrors.length,
        processingErrors
      };

      return batchResult;

    } catch (error) {
      // Handle batch processing failure
      const totalProcessingTime = Date.now() - startTime;
      
      return {
        results: results.filter(r => r !== undefined), // Return partial results
        summary: {
          totalRequests: requests.length,
          validRequests: 0,
          invalidRequests: requests.length,
          warningRequests: 0,
          commonErrors: [{
            code: 'BATCH_PROCESSING_FAILURE',
            message: `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            count: 1,
            percentage: 100
          }],
          commonWarnings: [],
          averageComplianceScore: 0
        },
        overallComplianceScore: 0,
        timestamp: new Date(),
        batchId,
        processingStats: {
          totalProcessingTime,
          averageProcessingTime: 0,
          successfullyProcessed: 0,
          failedProcessing: requests.length,
          processingErrors: [{
            requestIndex: -1,
            error: error instanceof Error ? error.message : 'Unknown batch processing error',
            timestamp: new Date()
          }]
        }
      } as BatchValidationResult & { processingStats: BatchProcessingStats };
    }
  }

  /**
   * Generate detailed validation report for a single result
   */
  async generateReport(result: ValidationResult): Promise<ValidationReport> {
    return this.reportingService.generateValidationReport(result);
  }

  /**
   * Generate compliance report for a single result
   */
  async generateComplianceReport(result: ValidationResult): Promise<ComplianceReport> {
    return this.reportingService.generateComplianceReport(result);
  }

  /**
   * Generate comprehensive batch validation report
   */
  async generateBatchReport(batchResult: BatchValidationResult): Promise<BatchValidationReport> {
    const startTime = Date.now();

    // Generate individual reports if detailed reporting is enabled
    const individualReports: ValidationReport[] = [];
    if (this.config.includeDetailedReports) {
      for (const result of batchResult.results) {
        try {
          const report = await this.generateReport(result);
          individualReports.push(report);
        } catch (error) {
          // Skip individual report generation on error, but continue with batch report
          console.warn(`Failed to generate individual report: ${error}`);
        }
      }
    }

    // Generate aggregated compliance report
    const complianceReport = await this.generateAggregatedComplianceReport(batchResult);

    // Get processing stats if available
    const processingStats = (batchResult as any).processingStats || {
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      successfullyProcessed: batchResult.summary.validRequests,
      failedProcessing: batchResult.summary.invalidRequests,
      processingErrors: []
    };

    const reportGenerationTime = Date.now() - startTime;
    processingStats.totalProcessingTime += reportGenerationTime;

    return {
      batchResult,
      individualReports,
      complianceReport,
      processingStats,
      timestamp: new Date()
    };
  }

  /**
   * Generate aggregated compliance report from batch results
   */
  private async generateAggregatedComplianceReport(batchResult: BatchValidationResult): Promise<ComplianceReport> {
    const results = batchResult.results;
    
    if (results.length === 0) {
      return {
        overallCompliance: 'non-compliant',
        complianceScore: 0,
        categoryCompliance: [],
        criticalIssues: [],
        recommendations: [],
        timestamp: new Date()
      };
    }

    // Calculate overall compliance
    const validResults = results.filter(r => r.isValid);
    const overallCompliance = validResults.length === results.length ? 'compliant' :
                             validResults.length > 0 ? 'partial' : 'non-compliant';

    // Aggregate critical issues (errors that appear in multiple requests)
    const errorCounts = new Map<string, { error: ValidationError; count: number }>();
    results.forEach(result => {
      result.errors.forEach(error => {
        const key = `${error.code}:${error.field}`;
        const existing = errorCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          errorCounts.set(key, { error, count: 1 });
        }
      });
    });

    const criticalIssues = Array.from(errorCounts.values())
      .filter(({ count }) => count > results.length * 0.1) // Issues affecting >10% of requests
      .map(({ error }) => error)
      .slice(0, 10); // Top 10 critical issues

    // Generate recommendations based on common issues
    const recommendations = this.generateBatchRecommendations(batchResult);

    return {
      overallCompliance,
      complianceScore: batchResult.overallComplianceScore,
      categoryCompliance: [], // Will be implemented in task 6.2
      criticalIssues,
      recommendations,
      timestamp: new Date()
    };
  }

  /**
   * Generate recommendations based on batch validation results
   */
  private generateBatchRecommendations(batchResult: BatchValidationResult): any[] {
    const recommendations = [];
    const summary = batchResult.summary;

    if (summary.invalidRequests > summary.totalRequests * 0.5) {
      recommendations.push({
        priority: 'high',
        title: 'High Failure Rate Detected',
        description: `${Math.round((summary.invalidRequests / summary.totalRequests) * 100)}% of requests failed validation. Review common errors and implement systematic fixes.`,
        affectedFields: summary.commonErrors.slice(0, 5).map(e => e.code),
        impactScore: 50
      });
    }

    if (summary.commonErrors.length > 0) {
      const topError = summary.commonErrors[0];
      if (topError) {
        recommendations.push({
          priority: 'high',
          title: `Address Most Common Error: ${topError.code}`,
          description: `${topError.message} appears in ${topError.percentage}% of requests.`,
          affectedFields: [topError.code],
          impactScore: topError.percentage
        });
      }
    }

    return recommendations;
  }

  /**
   * Utility method to add timeout to promises
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Validation timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
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
   * Generate batch summary from individual results
   */
  private generateBatchSummary(results: ValidationResult[]): any {
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

    const commonErrors = Array.from(errorCounts.entries())
      .map(([code, data]) => ({
        code,
        message: data.message,
        count: data.count,
        percentage: Math.round((data.count / totalRequests) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

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

    const commonWarnings = Array.from(warningCounts.entries())
      .map(([code, data]) => ({
        code,
        message: data.message,
        count: data.count,
        percentage: Math.round((data.count / totalRequests) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

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
   * Get cache statistics
   */
  getCacheStats() {
    return this.validationCache.getStats();
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache(): number {
    return this.validationCache.cleanup();
  }

  /**
   * Destroy service and cleanup resources
   */
  destroy(): void {
    this.validationCache.destroy();
  }

  async validateRequest(request: ORTBRequest, options?: ValidationOptions): Promise<ValidationResult> {
    return this.validateSingle(request, options || {});
  }

  async validateWithMetrics(request: ORTBRequest, options?: ValidationOptions): Promise<ValidationResult> {
    const startTime = Date.now();
    const result = await this.validateSingle(request, options || {});
    const processingTime = Date.now() - startTime;
    (result as any).processingTime = processingTime;
    return result;
  }

  async validateBatchRequests(requests: ORTBRequest[], options?: ValidationOptions): Promise<any> {
    return this.validateBatch(requests, options || {});
  }

  async validateWithSchema(request: ORTBRequest, _schemaVersion: string): Promise<ValidationResult> {
    // For now, just validate with default options - schema version handling can be added later
    return this.validateSingle(request, {});
  }

  async validateField(fieldPath: string, value: any, _context?: any): Promise<any> {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      fieldPath,
      value
    };
  }

  async validateCompliance(request: ORTBRequest, _complianceLevel: string): Promise<any> {
    const validationOptions: ValidationOptions = {};
    return this.validateSingle(request, validationOptions);
  }

  async validateWithRules(request: ORTBRequest, _rules: any[]): Promise<ValidationResult> {
    const validationOptions: ValidationOptions = {};
    return this.validateSingle(request, validationOptions);
  }

  async validateWithContext(request: ORTBRequest, _context: any): Promise<ValidationResult> {
    const validationOptions: ValidationOptions = {};
    return this.validateSingle(request, validationOptions);
  }
}