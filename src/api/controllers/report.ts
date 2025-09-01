/**
 * Report API Controller
 * Handles report generation-related API endpoints
 */

import { Response } from 'express';
import { 
  AuthenticatedRequest, 
  APIResponse, 
  ReportRequest, 
  ReportResponse,
  APIController 
} from '../types';
import { ORTBValidationService, ValidationService } from '../../services/validation-service';
import { ORTBReportingService, ReportingService } from '../../services/reporting-service';

export class ReportController implements APIController {
  private validationService: ValidationService;
  private reportingService: ReportingService;

  constructor() {
    this.validationService = new ORTBValidationService();
    this.reportingService = new ORTBReportingService();
  }

  /**
   * POST /api/reports/validation
   * Generate validation report from validation result
   */
  generateValidationReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { validationResult }: ReportRequest = req.body;

      // Validate input
      if (!validationResult) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_VALIDATION_RESULT',
            message: 'Validation result is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Generate validation report
      const report = await this.validationService.generateReport(validationResult);

      // Prepare response
      const response: ReportResponse = {
        success: true,
        data: report,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Validation report generation error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown report generation error',
          timestamp: new Date()
        },
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      } as APIResponse);
    }
  };

  /**
   * POST /api/reports/compliance
   * Generate compliance report from validation result
   */
  generateComplianceReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { validationResult }: ReportRequest = req.body;

      // Validate input
      if (!validationResult) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_VALIDATION_RESULT',
            message: 'Validation result is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Generate compliance report
      const report = await this.validationService.generateComplianceReport(validationResult);

      // Prepare response
      const response: ReportResponse = {
        success: true,
        data: report,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Compliance report generation error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown report generation error',
          timestamp: new Date()
        },
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      } as APIResponse);
    }
  };

  /**
   * POST /api/reports/batch
   * Generate batch report from batch validation result
   */
  generateBatchReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { batchResult } = req.body;

      // Validate input
      if (!batchResult) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_BATCH_RESULT',
            message: 'Batch validation result is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Generate batch report
      const report = await this.validationService.generateBatchReport(batchResult);

      // Prepare response
      const response: ReportResponse = {
        success: true,
        data: report as any,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Batch report generation error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown report generation error',
          timestamp: new Date()
        },
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      } as APIResponse);
    }
  };

  /**
   * POST /api/reports/custom
   * Generate custom report with specific configuration
   */
  generateCustomReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { validationResult, config } = req.body;

      // Validate input
      if (!validationResult) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_VALIDATION_RESULT',
            message: 'Validation result is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Generate custom report using reporting service
      const report = await this.reportingService.generateValidationReport(validationResult);

      // Prepare response
      const response: ReportResponse = {
        success: true,
        data: report,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Custom report generation error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown report generation error',
          timestamp: new Date()
        },
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      } as APIResponse);
    }
  };

  /**
   * GET /api/reports/templates
   * Get available report templates
   */
  getReportTemplates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const templates = [
        {
          id: 'validation-summary',
          name: 'Validation Summary',
          description: 'Basic validation results with error summary',
          type: 'validation'
        },
        {
          id: 'compliance-detailed',
          name: 'Detailed Compliance Report',
          description: 'Comprehensive compliance analysis with recommendations',
          type: 'compliance'
        },
        {
          id: 'batch-analysis',
          name: 'Batch Analysis Report',
          description: 'Statistical analysis of batch validation results',
          type: 'batch'
        },
        {
          id: 'field-analysis',
          name: 'Field-Level Analysis',
          description: 'Detailed field-by-field validation analysis',
          type: 'validation'
        },
        {
          id: 'trend-analysis',
          name: 'Trend Analysis Report',
          description: 'Historical validation trends and patterns',
          type: 'analytics'
        }
      ];

      res.status(200).json({
        success: true,
        data: templates,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      } as APIResponse);
    } catch (error) {
      console.error('Get report templates error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'TEMPLATES_ERROR',
          message: 'Failed to retrieve report templates',
          timestamp: new Date()
        },
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      } as APIResponse);
    }
  };

  /**
   * GET /api/reports/health
   * Health check for reporting service
   */
  healthCheck = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      // Test report generation with minimal data
      const testResult = {
        isValid: true,
        errors: [] as any[],
        warnings: [] as any[],
        complianceLevel: 'compliant' as const,
        validatedFields: ['id', 'imp'],
        complianceScore: 100,
        timestamp: new Date(),
        validationId: 'health-check',
        specVersion: '2.6'
      };

      const report = await this.reportingService.generateValidationReport(testResult);
      
      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          reportGeneration: report ? 'operational' : 'degraded',
          timestamp: new Date()
        },
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      } as APIResponse);
    } catch (error) {
      console.error('Health check error:', error);
      
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Reporting service is not healthy',
          timestamp: new Date()
        },
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      } as APIResponse);
    }
  };
}