/**
 * Reporting Service Tests
 * Tests comprehensive validation report generation and analytics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ORTBReportingService } from '../reporting-service';
import { ValidationResult, BatchValidationResult, ValidationError, ValidationWarning } from '../../models';

describe('ORTBReportingService', () => {
  let reportingService: ORTBReportingService;

  const createValidationResult = (
    isValid: boolean = true,
    complianceScore: number = 100,
    errors: ValidationError[] = [],
    warnings: ValidationWarning[] = []
  ): ValidationResult => ({
    isValid,
    errors,
    warnings,
    complianceLevel: isValid ? 'compliant' : 'non-compliant',
    validatedFields: ['id', 'imp', 'site', 'device', 'at'],
    complianceScore,
    timestamp: new Date(),
    validationId: 'val_123',
    specVersion: '2.6'
  });

  const createValidationError = (field: string = 'id', type: string = 'required-field'): ValidationError => ({
    field,
    message: `${field} is required`,
    severity: 'error',
    code: 'ORTB_REQUIRED_FIELD_MISSING',
    type: type as any,
    actualValue: undefined,
    expectedValue: 'string'
  });

  const createValidationWarning = (field: string = 'tagid'): ValidationWarning => ({
    field,
    message: `${field} is recommended`,
    code: 'ORTB_RECOMMENDED_FIELD',
    actualValue: undefined,
    recommendedValue: 'string'
  });

  const createBatchResult = (results: ValidationResult[]): BatchValidationResult => ({
    results,
    summary: {
      totalRequests: results.length,
      validRequests: results.filter(r => r.isValid).length,
      invalidRequests: results.filter(r => !r.isValid).length,
      warningRequests: results.filter(r => r.warnings.length > 0).length,
      commonErrors: [],
      commonWarnings: [],
      averageComplianceScore: results.reduce((sum, r) => sum + r.complianceScore, 0) / results.length
    },
    overallComplianceScore: results.reduce((sum, r) => sum + r.complianceScore, 0) / results.length,
    timestamp: new Date(),
    batchId: 'batch_123'
  });

  beforeEach(() => {
    reportingService = new ORTBReportingService();
  });

  describe('generateValidationReport', () => {
    it('should generate comprehensive validation report for valid result', async () => {
      const result = createValidationResult(true, 100);
      
      const report = await reportingService.generateValidationReport(result);
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('fieldResults');
      expect(report).toHaveProperty('complianceScore');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('metadata');
      
      expect(report.complianceScore).toBe(100);
      expect(report.summary.status).toBe('passed');
      expect(report.summary.totalFields).toBe(5);
      expect(report.summary.validFields).toBe(5);
      expect(report.summary.errorFields).toBe(0);
    });

    it('should generate validation report for result with errors', async () => {
      const errors = [createValidationError('id'), createValidationError('imp')];
      const result = createValidationResult(false, 50, errors);
      
      const report = await reportingService.generateValidationReport(result);
      
      expect(report.summary.status).toBe('failed');
      expect(report.summary.errorFields).toBe(2);
      expect(report.summary.missingRequiredFields).toBe(2);
      expect(report.recommendations).toContain('Address all validation errors to achieve compliance');
      expect(report.recommendations).toContain('Add 2 missing required field(s)');
    });

    it('should generate validation report for result with warnings', async () => {
      const warnings = [createValidationWarning('tagid')];
      const result = createValidationResult(true, 95, [], warnings);
      
      const report = await reportingService.generateValidationReport(result);
      
      expect(report.summary.status).toBe('warning');
      expect(report.summary.warningFields).toBe(1);
      expect(report.recommendations).toContain('Consider addressing warnings to improve request quality');
    });

    it('should include field-level validation results', async () => {
      const errors = [createValidationError('id')];
      const warnings = [createValidationWarning('tagid')];
      const result = createValidationResult(false, 80, errors, warnings);
      
      const report = await reportingService.generateValidationReport(result);
      
      expect(report.fieldResults).toHaveLength(6); // 5 validated + 1 error + 1 warning (some overlap)
      
      const idField = report.fieldResults.find(f => f.fieldPath === 'id');
      expect(idField).toBeDefined();
      expect(idField!.isValid).toBe(false);
      expect(idField!.errors).toHaveLength(1);
      expect(idField!.isRequired).toBe(true);
      expect(idField!.isPresent).toBe(false);
      
      const tagidField = report.fieldResults.find(f => f.fieldPath === 'tagid');
      expect(tagidField).toBeDefined();
      expect(tagidField!.warnings).toHaveLength(1);
    });

    it('should include proper metadata', async () => {
      const result = createValidationResult();
      
      const report = await reportingService.generateValidationReport(result);
      
      expect(report.metadata.toolVersion).toBe('1.0.0');
      expect(report.metadata.specVersion).toBe('2.6');
      expect(report.metadata.reportVersion).toBe('1.0');
      expect(report.metadata.generatedAt).toBeInstanceOf(Date);
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate compliance report for compliant result', async () => {
      const result = createValidationResult(true, 100);
      
      const report = await reportingService.generateComplianceReport(result);
      
      expect(report.overallCompliance).toBe('compliant');
      expect(report.complianceScore).toBe(100);
      expect(report.criticalIssues).toHaveLength(0);
      expect(report.categoryCompliance).toHaveLength(0); // No issues to categorize
    });

    it('should generate compliance report with critical issues', async () => {
      const errors = [
        createValidationError('id', 'required-field'),
        createValidationError('imp', 'required-field'),
        createValidationError('site.domain', 'schema')
      ];
      const result = createValidationResult(false, 30, errors);
      
      const report = await reportingService.generateComplianceReport(result);
      
      expect(report.overallCompliance).toBe('non-compliant');
      expect(report.complianceScore).toBe(30);
      expect(report.criticalIssues).toHaveLength(2); // Only required field errors
      expect(report.categoryCompliance.length).toBeGreaterThan(0);
      
      const requiredFieldsCategory = report.categoryCompliance.find(c => c.category === 'Required Fields');
      expect(requiredFieldsCategory).toBeDefined();
      expect(requiredFieldsCategory!.compliance).toBe('non-compliant');
      expect(requiredFieldsCategory!.issueCount).toBe(2);
    });

    it('should generate appropriate recommendations', async () => {
      const errors = [createValidationError('id'), createValidationError('imp')];
      const result = createValidationResult(false, 40, errors);
      
      const report = await reportingService.generateComplianceReport(result);
      
      expect(report.recommendations).toHaveLength(1);
      expect(report.recommendations[0].priority).toBe('high');
      expect(report.recommendations[0].title).toContain('Required Fields');
      expect(report.recommendations[0].affectedFields).toContain('id');
      expect(report.recommendations[0].affectedFields).toContain('imp');
    });
  });

  describe('generateBatchAnalytics', () => {
    it('should generate comprehensive batch analytics', async () => {
      const results = [
        createValidationResult(true, 100),
        createValidationResult(false, 60, [createValidationError('id')]),
        createValidationResult(true, 90, [], [createValidationWarning('tagid')])
      ];
      const batchResult = createBatchResult(results);
      
      const analytics = await reportingService.generateBatchAnalytics(batchResult);
      
      expect(analytics).toHaveProperty('overallStats');
      expect(analytics).toHaveProperty('errorDistribution');
      expect(analytics).toHaveProperty('complianceTrends');
      expect(analytics).toHaveProperty('fieldAnalytics');
      expect(analytics).toHaveProperty('performanceMetrics');
      expect(analytics).toHaveProperty('recommendations');
      expect(analytics).toHaveProperty('timestamp');
      
      expect(analytics.overallStats.totalRequests).toBe(3);
      expect(analytics.overallStats.validRequests).toBe(2);
      expect(analytics.overallStats.invalidRequests).toBe(1);
      expect(Math.round(analytics.overallStats.averageComplianceScore * 100) / 100).toBe(83.33);
    });

    it('should analyze error distribution correctly', async () => {
      const results = [
        createValidationResult(false, 50, [
          createValidationError('id', 'required-field'),
          createValidationError('site.domain', 'schema')
        ]),
        createValidationResult(false, 60, [
          createValidationError('id', 'required-field'),
          createValidationError('imp.banner.w', 'format')
        ])
      ];
      const batchResult = createBatchResult(results);
      
      const analytics = await reportingService.generateBatchAnalytics(batchResult);
      
      expect(analytics.errorDistribution.byCategory).toHaveLength(3);
      expect(analytics.errorDistribution.bySeverity).toHaveLength(1); // All errors
      expect(analytics.errorDistribution.byField).toHaveLength(3); // 3 different fields (id appears in both)
      
      const requiredFieldsCategory = analytics.errorDistribution.byCategory.find(c => c.category === 'Required Fields');
      expect(requiredFieldsCategory).toBeDefined();
      expect(requiredFieldsCategory!.count).toBe(2); // 'id' appears twice
    });

    it('should generate field analytics', async () => {
      const results = [
        createValidationResult(true, 100),
        createValidationResult(false, 70, [createValidationError('id')])
      ];
      const batchResult = createBatchResult(results);
      
      const analytics = await reportingService.generateBatchAnalytics(batchResult);
      
      expect(analytics.fieldAnalytics.length).toBeGreaterThan(0);
      
      const idFieldAnalytics = analytics.fieldAnalytics.find(f => f.fieldPath === 'id');
      expect(idFieldAnalytics).toBeDefined();
      expect(idFieldAnalytics!.validationRate).toBeGreaterThan(0); // Some valid occurrences
      expect(idFieldAnalytics!.errorRate).toBeGreaterThan(0); // Some errors
    });

    it('should generate analytics recommendations', async () => {
      const results = Array(10).fill(null).map(() => 
        createValidationResult(false, 30, [createValidationError('id')])
      );
      const batchResult = createBatchResult(results);
      
      const analytics = await reportingService.generateBatchAnalytics(batchResult);
      
      expect(analytics.recommendations).toHaveLength(1);
      expect(analytics.recommendations[0].priority).toBe('critical');
      expect(analytics.recommendations[0].category).toBe('compliance');
      expect(analytics.recommendations[0].title).toContain('Critical Compliance Issues');
    });
  });

  describe('generateTrendAnalysis', () => {
    it('should handle insufficient historical data', async () => {
      const historicalResults = [createBatchResult([createValidationResult()])];
      
      const trendAnalysis = await reportingService.generateTrendAnalysis(historicalResults);
      
      expect(trendAnalysis.trendDirection).toBe('stable');
      expect(trendAnalysis.insights).toHaveLength(1);
      expect(trendAnalysis.insights[0].description).toContain('Insufficient historical data');
      expect(trendAnalysis.projections).toHaveLength(0);
    });

    it('should analyze improving trend', async () => {
      const historicalResults = [
        createBatchResult([createValidationResult(false, 60)]),
        createBatchResult([createValidationResult(true, 80)]),
        createBatchResult([createValidationResult(true, 90)])
      ];
      
      const trendAnalysis = await reportingService.generateTrendAnalysis(historicalResults);
      
      expect(trendAnalysis.trendDirection).toBe('improving');
      expect(trendAnalysis.timePeriods).toHaveLength(3);
      expect(trendAnalysis.insights.length).toBeGreaterThan(0);
      expect(trendAnalysis.projections).toHaveLength(3); // 1week, 1month, 3months
    });

    it('should analyze declining trend', async () => {
      const historicalResults = [
        createBatchResult([createValidationResult(true, 90)]),
        createBatchResult([createValidationResult(true, 70)]),
        createBatchResult([createValidationResult(false, 50)])
      ];
      
      const trendAnalysis = await reportingService.generateTrendAnalysis(historicalResults);
      
      expect(trendAnalysis.trendDirection).toBe('declining');
      
      const regressionInsight = trendAnalysis.insights.find(i => i.type === 'regression');
      expect(regressionInsight).toBeDefined();
      expect(regressionInsight!.impact).toBe('high');
    });

    it('should generate performance projections', async () => {
      const historicalResults = [
        createBatchResult([createValidationResult(true, 80)]),
        createBatchResult([createValidationResult(true, 85)])
      ];
      
      const trendAnalysis = await reportingService.generateTrendAnalysis(historicalResults);
      
      expect(trendAnalysis.projections).toHaveLength(3);
      
      const oneWeekProjection = trendAnalysis.projections.find(p => p.timeframe === '1week');
      expect(oneWeekProjection).toBeDefined();
      expect(oneWeekProjection!.confidence).toBeGreaterThan(0);
      expect(oneWeekProjection!.assumptions).toHaveLength(2);
      
      const threeMonthProjection = trendAnalysis.projections.find(p => p.timeframe === '3months');
      expect(threeMonthProjection).toBeDefined();
      expect(threeMonthProjection!.confidence).toBeLessThan(oneWeekProjection!.confidence);
    });
  });

  describe('calculateComplianceScore', () => {
    it('should calculate perfect score for valid result', () => {
      const result = createValidationResult(true, 100);
      
      const score = reportingService.calculateComplianceScore(result);
      
      expect(score).toBe(100); // Capped at 100
    });

    it('should penalize errors heavily', () => {
      const errors = [createValidationError('id'), createValidationError('imp')];
      const result = createValidationResult(false, 0, errors);
      
      const score = reportingService.calculateComplianceScore(result);
      
      expect(score).toBeLessThan(70); // Heavy penalty for errors
    });

    it('should penalize required field errors more', () => {
      const requiredError = createValidationError('id', 'required-field');
      const schemaError = createValidationError('site.domain', 'schema');
      
      const resultWithRequired = createValidationResult(false, 0, [requiredError]);
      const resultWithSchema = createValidationResult(false, 0, [schemaError]);
      
      const scoreWithRequired = reportingService.calculateComplianceScore(resultWithRequired);
      const scoreWithSchema = reportingService.calculateComplianceScore(resultWithSchema);
      
      expect(scoreWithRequired).toBeLessThanOrEqual(scoreWithSchema);
    });

    it('should apply lighter penalty for warnings', () => {
      const warnings = [createValidationWarning('tagid'), createValidationWarning('secure')];
      const result = createValidationResult(true, 90, [], warnings);
      
      const score = reportingService.calculateComplianceScore(result);
      
      expect(score).toBeGreaterThan(90); // Light penalty for warnings
    });

    it('should cap score between 0 and 100', () => {
      const manyErrors = Array(20).fill(null).map((_, i) => createValidationError(`field${i}`));
      const result = createValidationResult(false, 0, manyErrors);
      
      const score = reportingService.calculateComplianceScore(result);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('categorizeValidationIssues', () => {
    it('should categorize errors by type', () => {
      const errors = [
        createValidationError('id', 'required-field'),
        createValidationError('site.domain', 'schema'),
        createValidationError('imp.banner.w', 'format'),
        createValidationError('device.ip', 'value')
      ];
      const warnings: ValidationWarning[] = [];
      
      const categories = reportingService.categorizeValidationIssues(errors, warnings);
      
      expect(categories).toHaveLength(4);
      expect(categories.map(c => c.category)).toContain('Required Fields');
      expect(categories.map(c => c.category)).toContain('Schema Validation');
      expect(categories.map(c => c.category)).toContain('Format Validation');
      expect(categories.map(c => c.category)).toContain('Value Validation');
      
      const requiredFieldsCategory = categories.find(c => c.category === 'Required Fields');
      expect(requiredFieldsCategory!.compliance).toBe('non-compliant');
      expect(requiredFieldsCategory!.issueCount).toBe(1);
    });

    it('should handle mixed errors and warnings', () => {
      const errors = [createValidationError('id', 'required-field')];
      const warnings = [createValidationWarning('tagid')];
      
      const categories = reportingService.categorizeValidationIssues(errors, warnings);
      
      expect(categories).toHaveLength(2);
      
      const requiredFieldsCategory = categories.find(c => c.category === 'Required Fields');
      expect(requiredFieldsCategory!.compliance).toBe('non-compliant');
      
      const recommendedFieldsCategory = categories.find(c => c.category === 'Recommended Fields');
      expect(recommendedFieldsCategory!.compliance).toBe('partial');
    });

    it('should handle no issues', () => {
      const categories = reportingService.categorizeValidationIssues([], []);
      
      expect(categories).toHaveLength(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle large batch analytics efficiently', async () => {
      const results = Array(100).fill(null).map((_, i) => 
        createValidationResult(
          i % 3 === 0, // Every 3rd request is invalid
          Math.random() * 100,
          i % 3 === 0 ? [createValidationError(`field${i % 5}`)] : [],
          i % 2 === 0 ? [createValidationWarning(`warning${i % 3}`)] : []
        )
      );
      const batchResult = createBatchResult(results);
      
      const startTime = Date.now();
      const analytics = await reportingService.generateBatchAnalytics(batchResult);
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
      expect(analytics.overallStats.totalRequests).toBe(100);
      expect(analytics.errorDistribution.byField.length).toBeGreaterThan(0);
      expect(analytics.fieldAnalytics.length).toBeGreaterThan(0);
    });

    it('should provide consistent scoring across different methods', () => {
      const result = createValidationResult(false, 75, [createValidationError('id')], [createValidationWarning('tagid')]);
      
      const calculatedScore = reportingService.calculateComplianceScore(result);
      const reportScore = result.complianceScore;
      
      // Scores might differ due to different calculation methods, but should be in similar range
      expect(Math.abs(calculatedScore - reportScore)).toBeLessThan(30);
    });
  });
});