/**
 * Reporting Service Implementation
 * Provides comprehensive validation report generation and analytics
 */

import { 
  ValidationResult, 
  BatchValidationResult,
  ValidationReport,
  ComplianceReport,
  ValidationSummary,
  FieldValidationResult,
  CategoryCompliance,
  ComplianceRecommendation,
  ReportMetadata,
  ValidationError,
  ValidationWarning,
  ErrorFrequency,
  ComplianceLevel
} from '../models';

export interface ReportingService {
  generateValidationReport(result: ValidationResult): Promise<ValidationReport>;
  generateComplianceReport(result: ValidationResult): Promise<ComplianceReport>;
  generateBatchAnalytics(batchResult: BatchValidationResult): Promise<BatchAnalytics>;
  generateTrendAnalysis(historicalResults: BatchValidationResult[]): Promise<TrendAnalysis>;
  calculateComplianceScore(result: ValidationResult): number;
  categorizeValidationIssues(errors: ValidationError[], warnings: ValidationWarning[]): CategoryCompliance[];
}

export interface BatchAnalytics {
  /** Overall batch statistics */
  overallStats: BatchStatistics;
  /** Error distribution analysis */
  errorDistribution: ErrorDistribution;
  /** Compliance trends within the batch */
  complianceTrends: ComplianceTrends;
  /** Field-level analytics */
  fieldAnalytics: FieldAnalytics[];
  /** Performance metrics */
  performanceMetrics: PerformanceMetrics;
  /** Recommendations based on batch analysis */
  recommendations: AnalyticsRecommendation[];
  /** Timestamp of analysis */
  timestamp: Date;
}

export interface TrendAnalysis {
  /** Trend over time periods */
  timePeriods: TimePeriodAnalysis[];
  /** Overall trend direction */
  trendDirection: 'improving' | 'declining' | 'stable';
  /** Key insights from trend analysis */
  insights: TrendInsight[];
  /** Projected future performance */
  projections: PerformanceProjection[];
  /** Timestamp of analysis */
  timestamp: Date;
}

export interface BatchStatistics {
  totalRequests: number;
  validRequests: number;
  invalidRequests: number;
  warningRequests: number;
  averageComplianceScore: number;
  medianComplianceScore: number;
  complianceDistribution: ComplianceDistribution;
  processingTime: ProcessingTimeStats;
}

export interface ErrorDistribution {
  byCategory: CategoryDistribution[];
  bySeverity: SeverityDistribution[];
  byField: FieldDistribution[];
  mostCommonErrors: ErrorFrequency[];
  errorCorrelations: ErrorCorrelation[];
}

export interface ComplianceTrends {
  overallTrend: number; // Percentage change
  categoryTrends: CategoryTrend[];
  improvementAreas: string[];
  regressionAreas: string[];
}

export interface FieldAnalytics {
  fieldPath: string;
  validationRate: number; // Percentage of requests where field was valid
  errorRate: number;
  warningRate: number;
  commonIssues: string[];
  recommendations: string[];
}

export interface PerformanceMetrics {
  averageValidationTime: number;
  medianValidationTime: number;
  throughput: number; // Requests per second
  resourceUtilization: ResourceUtilization;
}

export interface AnalyticsRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'compliance' | 'performance' | 'quality';
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface TimePeriodAnalysis {
  period: string;
  startDate: Date;
  endDate: Date;
  totalRequests: number;
  averageComplianceScore: number;
  topErrors: ErrorFrequency[];
  improvements: string[];
  regressions: string[];
}

export interface TrendInsight {
  type: 'improvement' | 'regression' | 'pattern' | 'anomaly';
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  confidence: number; // 0-100
}

export interface PerformanceProjection {
  timeframe: '1week' | '1month' | '3months';
  projectedComplianceScore: number;
  confidence: number;
  assumptions: string[];
}

export interface ComplianceDistribution {
  compliant: number;
  partial: number;
  nonCompliant: number;
}

export interface ProcessingTimeStats {
  average: number;
  median: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface SeverityDistribution {
  severity: 'error' | 'warning' | 'info';
  count: number;
  percentage: number;
}

export interface FieldDistribution {
  fieldPath: string;
  errorCount: number;
  warningCount: number;
  affectedRequests: number;
  percentage: number;
}

export interface ErrorCorrelation {
  error1: string;
  error2: string;
  correlationStrength: number; // 0-1
  coOccurrenceRate: number; // Percentage
}

export interface CategoryTrend {
  category: string;
  trend: number; // Percentage change
  direction: 'improving' | 'declining' | 'stable';
}

export interface ResourceUtilization {
  cpuUsage: number;
  memoryUsage: number;
  networkUsage: number;
}

/**
 * Main reporting service implementation
 */
export class ORTBReportingService implements ReportingService {
  private readonly toolVersion = '1.0.0';
  private readonly reportVersion = '1.0';

  /**
   * Generate comprehensive validation report for a single result
   */
  async generateValidationReport(result: ValidationResult): Promise<ValidationReport> {
    const summary = this.generateValidationSummary(result);
    const fieldResults = this.generateFieldValidationResults(result);
    const recommendations = this.generateRecommendations(result);
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
  async generateComplianceReport(result: ValidationResult): Promise<ComplianceReport> {
    const categoryCompliance = this.categorizeValidationIssues(result.errors, result.warnings);
    const criticalIssues = this.identifyCriticalIssues(result.errors);
    const recommendations = this.generateComplianceRecommendations(result, categoryCompliance);

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
   * Generate comprehensive batch analytics
   */
  async generateBatchAnalytics(batchResult: BatchValidationResult): Promise<BatchAnalytics> {
    const overallStats = this.calculateBatchStatistics(batchResult);
    const errorDistribution = this.analyzeErrorDistribution(batchResult);
    const complianceTrends = this.analyzeComplianceTrends(batchResult);
    const fieldAnalytics = this.analyzeFieldPerformance(batchResult);
    const performanceMetrics = this.calculatePerformanceMetrics(batchResult);
    const recommendations = this.generateAnalyticsRecommendations(batchResult, overallStats, errorDistribution);

    return {
      overallStats,
      errorDistribution,
      complianceTrends,
      fieldAnalytics,
      performanceMetrics,
      recommendations,
      timestamp: new Date()
    };
  }

  /**
   * Generate trend analysis from historical batch results
   */
  async generateTrendAnalysis(historicalResults: BatchValidationResult[]): Promise<TrendAnalysis> {
    if (historicalResults.length < 2) {
      return {
        timePeriods: [],
        trendDirection: 'stable',
        insights: [{
          type: 'pattern',
          description: 'Insufficient historical data for trend analysis',
          impact: 'low',
          recommendation: 'Collect more validation data over time to enable trend analysis',
          confidence: 100
        }],
        projections: [],
        timestamp: new Date()
      };
    }

    const timePeriods = this.analyzeTimePeriods(historicalResults);
    const trendDirection = this.calculateOverallTrend(historicalResults);
    const insights = this.generateTrendInsights(historicalResults, timePeriods);
    const projections = this.generatePerformanceProjections(historicalResults);

    return {
      timePeriods,
      trendDirection,
      insights,
      projections,
      timestamp: new Date()
    };
  }

  /**
   * Calculate compliance score with detailed breakdown
   */
  calculateComplianceScore(result: ValidationResult): number {
    let score = 100;

    // Deduct points for errors (more severe penalty)
    const errorPenalty = result.errors.length * 20;
    
    // Deduct points for warnings (lighter penalty)
    const warningPenalty = result.warnings.length * 5;

    // Apply category-specific penalties
    const criticalErrors = result.errors.filter(e => e.code.includes('REQUIRED')).length;
    const criticalPenalty = criticalErrors * 10; // Additional penalty for critical errors

    score -= (errorPenalty + warningPenalty + criticalPenalty);

    // Bonus for having validated fields
    const validationBonus = Math.min(result.validatedFields.length * 2, 20);
    score += validationBonus;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Categorize validation issues by type and severity
   */
  categorizeValidationIssues(errors: ValidationError[], warnings: ValidationWarning[]): CategoryCompliance[] {
    const categories = new Map<string, { errors: ValidationError[], warnings: ValidationWarning[] }>();

    // Categorize errors
    errors.forEach(error => {
      const category = this.getCategoryFromErrorType(error.type);
      if (!categories.has(category)) {
        categories.set(category, { errors: [], warnings: [] });
      }
      categories.get(category)!.errors.push(error);
    });

    // Categorize warnings
    warnings.forEach(warning => {
      const category = this.getCategoryFromWarningCode(warning.code);
      if (!categories.has(category)) {
        categories.set(category, { errors: [], warnings: [] });
      }
      categories.get(category)!.warnings.push(warning);
    });

    // Convert to CategoryCompliance format
    return Array.from(categories.entries()).map(([category, issues]) => {
      const totalIssues = issues.errors.length + issues.warnings.length;
      const errorCount = issues.errors.length;
      
      let compliance: ComplianceLevel;
      let score: number;

      if (errorCount === 0) {
        compliance = issues.warnings.length === 0 ? 'compliant' : 'partial';
        score = issues.warnings.length === 0 ? 100 : 80;
      } else {
        compliance = 'non-compliant';
        score = Math.max(0, 50 - (errorCount * 10));
      }

      return {
        category,
        compliance,
        score,
        issueCount: totalIssues,
        issues: issues.errors
      };
    });
  }

  /**
   * Generate validation summary from result
   */
  private generateValidationSummary(result: ValidationResult): ValidationSummary {
    const totalFields = result.validatedFields.length;
    const errorFields = new Set(result.errors.map(e => e.field)).size;
    const warningFields = new Set(result.warnings.map(w => w.field)).size;
    const validFields = totalFields - errorFields;
    const missingRequiredFields = result.errors.filter(e => e.type === 'required-field').length;

    let status: 'passed' | 'failed' | 'warning';
    if (result.errors.length === 0) {
      status = result.warnings.length === 0 ? 'passed' : 'warning';
    } else {
      status = 'failed';
    }

    return {
      totalFields,
      validFields,
      errorFields,
      warningFields,
      missingRequiredFields,
      status
    };
  }

  /**
   * Generate field-level validation results
   */
  private generateFieldValidationResults(result: ValidationResult): FieldValidationResult[] {
    const fieldResults = new Map<string, FieldValidationResult>();

    // Initialize with validated fields
    result.validatedFields.forEach(fieldPath => {
      fieldResults.set(fieldPath, {
        fieldPath,
        isValid: true,
        errors: [],
        warnings: [],
        isRequired: false, // Will be determined from errors
        isPresent: true
      });
    });

    // Add errors
    result.errors.forEach(error => {
      const existing = fieldResults.get(error.field) || {
        fieldPath: error.field,
        isValid: false,
        errors: [],
        warnings: [],
        isRequired: error.type === 'required-field',
        isPresent: error.type !== 'required-field'
      };
      
      existing.errors.push(error);
      existing.isValid = false;
      if (error.type === 'required-field') {
        existing.isRequired = true;
        existing.isPresent = false;
      }
      
      fieldResults.set(error.field, existing);
    });

    // Add warnings
    result.warnings.forEach(warning => {
      const existing = fieldResults.get(warning.field) || {
        fieldPath: warning.field,
        isValid: true,
        errors: [],
        warnings: [],
        isRequired: false,
        isPresent: true
      };
      
      existing.warnings.push(warning);
      fieldResults.set(warning.field, existing);
    });

    return Array.from(fieldResults.values());
  }

  /**
   * Generate recommendations based on validation result
   */
  private generateRecommendations(result: ValidationResult): string[] {
    const recommendations: string[] = [];

    if (result.errors.length > 0) {
      recommendations.push('Address all validation errors to achieve compliance');
      
      const requiredFieldErrors = result.errors.filter(e => e.type === 'required-field');
      if (requiredFieldErrors.length > 0) {
        recommendations.push(`Add ${requiredFieldErrors.length} missing required field(s)`);
      }

      const schemaErrors = result.errors.filter(e => e.type === 'schema');
      if (schemaErrors.length > 0) {
        recommendations.push('Fix data type and format issues');
      }
    }

    if (result.warnings.length > 0) {
      recommendations.push('Consider addressing warnings to improve request quality');
    }

    if (result.complianceScore < 80) {
      recommendations.push('Focus on critical compliance issues first');
    }

    return recommendations;
  }

  /**
   * Generate report metadata
   */
  private generateReportMetadata(): ReportMetadata {
    return {
      generatedAt: new Date(),
      toolVersion: this.toolVersion,
      specVersion: '2.6',
      reportVersion: this.reportVersion
    };
  }

  /**
   * Identify critical issues that must be addressed
   */
  private identifyCriticalIssues(errors: ValidationError[]): ValidationError[] {
    return errors.filter(error => 
      error.severity === 'error' && 
      error.type === 'required-field'
    );
  }

  /**
   * Generate compliance-specific recommendations
   */
  private generateComplianceRecommendations(
    _result: ValidationResult, 
    categoryCompliance: CategoryCompliance[]
  ): ComplianceRecommendation[] {
    const recommendations: ComplianceRecommendation[] = [];

    // High priority recommendations for non-compliant categories
    categoryCompliance
      .filter(cat => cat.compliance === 'non-compliant')
      .forEach(category => {
        recommendations.push({
          priority: 'high',
          title: `Fix ${category.category} Issues`,
          description: `Address ${category.issueCount} issues in ${category.category} to improve compliance`,
          affectedFields: category.issues.map(e => e.field),
          impactScore: Math.min(category.issueCount * 10, 50)
        });
      });

    // Medium priority for partial compliance
    categoryCompliance
      .filter(cat => cat.compliance === 'partial')
      .forEach(category => {
        recommendations.push({
          priority: 'medium',
          title: `Improve ${category.category} Compliance`,
          description: `Address warnings in ${category.category} for full compliance`,
          affectedFields: [],
          impactScore: Math.min(category.issueCount * 5, 25)
        });
      });

    return recommendations.sort((a, b) => b.impactScore - a.impactScore);
  }

  /**
   * Calculate comprehensive batch statistics
   */
  private calculateBatchStatistics(batchResult: BatchValidationResult): BatchStatistics {
    const scores = batchResult.results.map(r => r.complianceScore);
    const sortedScores = [...scores].sort((a, b) => a - b);
    
    const complianceDistribution: ComplianceDistribution = {
      compliant: batchResult.results.filter(r => r.complianceLevel === 'compliant').length,
      partial: batchResult.results.filter(r => r.complianceLevel === 'partial').length,
      nonCompliant: batchResult.results.filter(r => r.complianceLevel === 'non-compliant').length
    };

    // Calculate processing time stats if available
    const processingTimes = batchResult.results
      .map(r => (r as any).processingTime)
      .filter(t => typeof t === 'number');
    
    const sortedProcessingTimes = [...processingTimes].sort((a, b) => a - b);
    const processingTime: ProcessingTimeStats = {
      average: processingTimes.length > 0 ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0,
      median: processingTimes.length > 0 ? (sortedProcessingTimes[Math.floor(processingTimes.length / 2)] || 0) : 0,
      p95: processingTimes.length > 0 ? (sortedProcessingTimes[Math.floor(processingTimes.length * 0.95)] || 0) : 0,
      p99: processingTimes.length > 0 ? (sortedProcessingTimes[Math.floor(processingTimes.length * 0.99)] || 0) : 0,
      min: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
      max: processingTimes.length > 0 ? Math.max(...processingTimes) : 0
    };

    return {
      totalRequests: batchResult.summary.totalRequests,
      validRequests: batchResult.summary.validRequests,
      invalidRequests: batchResult.summary.invalidRequests,
      warningRequests: batchResult.summary.warningRequests,
      averageComplianceScore: batchResult.summary.averageComplianceScore,
      medianComplianceScore: sortedScores[Math.floor(sortedScores.length / 2)] || 0,
      complianceDistribution,
      processingTime
    };
  }

  /**
   * Analyze error distribution patterns
   */
  private analyzeErrorDistribution(batchResult: BatchValidationResult): ErrorDistribution {
    const allErrors = batchResult.results.flatMap(r => r.errors);
    
    // Group by category
    const categoryMap = new Map<string, number>();
    allErrors.forEach(error => {
      const category = this.getCategoryFromErrorType(error.type);
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const byCategory: CategoryDistribution[] = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / allErrors.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Group by severity
    const severityMap = new Map<string, number>();
    allErrors.forEach(error => {
      severityMap.set(error.severity, (severityMap.get(error.severity) || 0) + 1);
    });

    const bySeverity: SeverityDistribution[] = Array.from(severityMap.entries())
      .map(([severity, count]) => ({
        severity: severity as 'error' | 'warning' | 'info',
        count,
        percentage: Math.round((count / allErrors.length) * 100)
      }));

    // Group by field
    const fieldMap = new Map<string, { errors: number, warnings: number, requests: Set<string> }>();
    batchResult.results.forEach((result, index) => {
      result.errors.forEach(error => {
        if (!fieldMap.has(error.field)) {
          fieldMap.set(error.field, { errors: 0, warnings: 0, requests: new Set() });
        }
        const fieldData = fieldMap.get(error.field)!;
        fieldData.errors++;
        fieldData.requests.add(index.toString());
      });

      result.warnings.forEach(warning => {
        if (!fieldMap.has(warning.field)) {
          fieldMap.set(warning.field, { errors: 0, warnings: 0, requests: new Set() });
        }
        const fieldData = fieldMap.get(warning.field)!;
        fieldData.warnings++;
        fieldData.requests.add(index.toString());
      });
    });

    const byField: FieldDistribution[] = Array.from(fieldMap.entries())
      .map(([fieldPath, data]) => ({
        fieldPath,
        errorCount: data.errors,
        warningCount: data.warnings,
        affectedRequests: data.requests.size,
        percentage: Math.round((data.requests.size / batchResult.results.length) * 100)
      }))
      .sort((a, b) => b.affectedRequests - a.affectedRequests);

    return {
      byCategory,
      bySeverity,
      byField,
      mostCommonErrors: batchResult.summary.commonErrors,
      errorCorrelations: [] // Could be implemented for advanced analytics
    };
  }

  /**
   * Analyze compliance trends within batch
   */
  private analyzeComplianceTrends(batchResult: BatchValidationResult): ComplianceTrends {
    // For a single batch, we can't show trends over time, but we can show patterns
    const categoryCompliance = this.categorizeValidationIssues(
      batchResult.results.flatMap(r => r.errors),
      batchResult.results.flatMap(r => r.warnings)
    );

    const categoryTrends: CategoryTrend[] = categoryCompliance.map(cat => ({
      category: cat.category,
      trend: 0, // No historical data for single batch
      direction: 'stable' as const
    }));

    return {
      overallTrend: 0,
      categoryTrends,
      improvementAreas: categoryCompliance
        .filter(cat => cat.compliance === 'compliant')
        .map(cat => cat.category),
      regressionAreas: categoryCompliance
        .filter(cat => cat.compliance === 'non-compliant')
        .map(cat => cat.category)
    };
  }

  /**
   * Analyze field-level performance across batch
   */
  private analyzeFieldPerformance(batchResult: BatchValidationResult): FieldAnalytics[] {
    const fieldMap = new Map<string, { 
      total: number, 
      valid: number, 
      errors: string[], 
      warnings: string[] 
    }>();

    batchResult.results.forEach(result => {
      // Count validated fields as valid
      result.validatedFields.forEach(field => {
        if (!fieldMap.has(field)) {
          fieldMap.set(field, { total: 0, valid: 0, errors: [], warnings: [] });
        }
        const fieldData = fieldMap.get(field)!;
        fieldData.total++;
        fieldData.valid++;
      });

      // Count error fields
      result.errors.forEach(error => {
        if (!fieldMap.has(error.field)) {
          fieldMap.set(error.field, { total: 0, valid: 0, errors: [], warnings: [] });
        }
        const fieldData = fieldMap.get(error.field)!;
        fieldData.total++;
        if (!fieldData.errors.includes(error.message)) {
          fieldData.errors.push(error.message);
        }
      });

      // Count warning fields
      result.warnings.forEach(warning => {
        if (!fieldMap.has(warning.field)) {
          fieldMap.set(warning.field, { total: 0, valid: 0, errors: [], warnings: [] });
        }
        const fieldData = fieldMap.get(warning.field)!;
        if (!fieldData.warnings.includes(warning.message)) {
          fieldData.warnings.push(warning.message);
        }
      });
    });

    return Array.from(fieldMap.entries()).map(([fieldPath, data]) => ({
      fieldPath,
      validationRate: data.total > 0 ? Math.round((data.valid / data.total) * 100) : 0,
      errorRate: data.total > 0 ? Math.round(((data.total - data.valid) / data.total) * 100) : 0,
      warningRate: data.total > 0 ? Math.round((data.warnings.length / data.total) * 100) : 0,
      commonIssues: [...data.errors, ...data.warnings].slice(0, 3),
      recommendations: this.generateFieldRecommendations(fieldPath, data)
    }));
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(batchResult: BatchValidationResult): PerformanceMetrics {
    const processingStats = (batchResult as any).processingStats;
    
    return {
      averageValidationTime: processingStats?.averageProcessingTime || 0,
      medianValidationTime: processingStats?.averageProcessingTime || 0, // Simplified
      throughput: processingStats?.totalProcessingTime > 0 
        ? Math.round((batchResult.results.length / processingStats.totalProcessingTime) * 1000)
        : 0,
      resourceUtilization: {
        cpuUsage: 0, // Would need system monitoring
        memoryUsage: 0,
        networkUsage: 0
      }
    };
  }

  /**
   * Generate analytics-based recommendations
   */
  private generateAnalyticsRecommendations(
    _batchResult: BatchValidationResult,
    stats: BatchStatistics,
    _errorDistribution: ErrorDistribution
  ): AnalyticsRecommendation[] {
    const recommendations: AnalyticsRecommendation[] = [];

    // Compliance recommendations
    if (stats.averageComplianceScore < 70) {
      recommendations.push({
        priority: 'critical',
        category: 'compliance',
        title: 'Critical Compliance Issues Detected',
        description: `Average compliance score is ${stats.averageComplianceScore}%, indicating systemic issues`,
        impact: 'High impact on request acceptance rates',
        actionItems: [
          'Review and fix most common errors',
          'Implement validation checks in request generation',
          'Establish compliance monitoring'
        ],
        estimatedEffort: 'high'
      });
    }

    // Performance recommendations
    if (stats.processingTime.average > 1000) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        title: 'Validation Performance Optimization Needed',
        description: `Average validation time is ${stats.processingTime.average}ms`,
        impact: 'Affects system throughput and user experience',
        actionItems: [
          'Optimize validation rules',
          'Implement caching for schema validation',
          'Consider batch processing optimizations'
        ],
        estimatedEffort: 'medium'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Helper methods
   */
  private getCategoryFromErrorType(type: string): string {
    switch (type) {
      case 'required-field': return 'Required Fields';
      case 'schema': return 'Schema Validation';
      case 'format': return 'Format Validation';
      case 'value': return 'Value Validation';
      case 'logical': return 'Business Logic';
      default: return 'Other';
    }
  }

  private getCategoryFromWarningCode(code: string): string {
    if (code.includes('RECOMMENDED')) return 'Recommended Fields';
    if (code.includes('FORMAT')) return 'Format Validation';
    if (code.includes('VALUE')) return 'Value Validation';
    return 'Other';
  }

  private generateFieldRecommendations(fieldPath: string, data: any): string[] {
    const recommendations: string[] = [];
    
    if (data.errors.length > 0) {
      recommendations.push(`Fix validation errors for ${fieldPath}`);
    }
    
    if (data.warnings.length > 0) {
      recommendations.push(`Address warnings to improve ${fieldPath} quality`);
    }
    
    if (data.valid / data.total < 0.8) {
      recommendations.push(`Improve ${fieldPath} validation rate (currently ${Math.round((data.valid / data.total) * 100)}%)`);
    }
    
    return recommendations;
  }

  private analyzeTimePeriods(historicalResults: BatchValidationResult[]): TimePeriodAnalysis[] {
    return historicalResults.map((result, index) => ({
      period: `Period ${index + 1}`,
      startDate: result.timestamp,
      endDate: result.timestamp,
      totalRequests: result.summary.totalRequests,
      averageComplianceScore: result.summary.averageComplianceScore,
      topErrors: result.summary.commonErrors.slice(0, 3),
      improvements: [] as any[],
      regressions: [] as any[]
    }));
  }

  private calculateOverallTrend(historicalResults: BatchValidationResult[]): 'improving' | 'declining' | 'stable' {
    if (historicalResults.length < 2) return 'stable';
    
    const first = historicalResults[0]?.summary?.averageComplianceScore || 0;
    const last = historicalResults[historicalResults.length - 1]?.summary?.averageComplianceScore || 0;
    const change = last - first;
    
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  private generateTrendInsights(
    historicalResults: BatchValidationResult[], 
    _timePeriods: TimePeriodAnalysis[]
  ): TrendInsight[] {
    const insights: TrendInsight[] = [];
    
    if (historicalResults.length >= 2) {
      const trend = this.calculateOverallTrend(historicalResults);
      insights.push({
        type: trend === 'improving' ? 'improvement' : trend === 'declining' ? 'regression' : 'pattern',
        description: `Overall compliance trend is ${trend}`,
        impact: trend === 'declining' ? 'high' : 'medium',
        recommendation: trend === 'declining' 
          ? 'Focus on addressing recurring validation issues'
          : 'Continue current validation practices',
        confidence: 80
      });
    }
    
    return insights;
  }

  private generatePerformanceProjections(historicalResults: BatchValidationResult[]): PerformanceProjection[] {
    const avgScore = historicalResults.reduce((sum, r) => sum + r.summary.averageComplianceScore, 0) / historicalResults.length;
    
    return [
      {
        timeframe: '1week',
        projectedComplianceScore: Math.round(avgScore),
        confidence: 70,
        assumptions: ['Current validation patterns continue', 'No major system changes']
      },
      {
        timeframe: '1month',
        projectedComplianceScore: Math.round(avgScore * 1.05), // Slight improvement assumed
        confidence: 60,
        assumptions: ['Gradual improvement through learning', 'Stable request patterns']
      },
      {
        timeframe: '3months',
        projectedComplianceScore: Math.round(Math.min(avgScore * 1.15, 100)),
        confidence: 40,
        assumptions: ['Systematic improvements implemented', 'Team learning curve']
      }
    ];
  }
}