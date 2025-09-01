/**
 * Export API Controller
 * Handles export-related API endpoints
 */

import { Response } from 'express';
import { 
  AuthenticatedRequest, 
  APIResponse, 
  ExportRequest, 
  ExportResponse,
  APIController 
} from '../types';
import { ORTBExportService, ExportService, ExportOptions } from '../../services/export-service';

export class ExportController implements APIController {
  private exportService: ExportService;

  constructor() {
    this.exportService = new ORTBExportService();
  }

  /**
   * POST /api/export/validation-result
   * Export validation result in specified format
   */
  exportValidationResult = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { data, options }: ExportRequest = req.body;

      // Validate input
      if (!data) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DATA',
            message: 'Validation result data is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      if (!options || !options.format) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FORMAT',
            message: 'Export format is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Validate format
      const validFormats = ['json', 'csv', 'pdf', 'txt', 'html'];
      if (!validFormats.includes(options.format)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FORMAT',
            message: `Invalid format. Supported formats: ${validFormats.join(', ')}`,
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Export validation result
      const result = await this.exportService.exportValidationResult(data, options);

      // Prepare response
      const response: ExportResponse = {
        success: result.success,
        data: result,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      if (!result.success) {
        res.status(500).json(response);
        return;
      }

      res.status(200).json(response);
    } catch (error) {
      console.error('Export validation result error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown export error',
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
   * POST /api/export/validation-report
   * Export validation report in specified format
   */
  exportValidationReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { data, options }: ExportRequest = req.body;

      // Validate input
      if (!data) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DATA',
            message: 'Validation report data is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      if (!options || !options.format) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FORMAT',
            message: 'Export format is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Export validation report
      const result = await this.exportService.exportValidationReport(data, options);

      // Prepare response
      const response: ExportResponse = {
        success: result.success,
        data: result,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      if (!result.success) {
        res.status(500).json(response);
        return;
      }

      res.status(200).json(response);
    } catch (error) {
      console.error('Export validation report error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown export error',
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
   * POST /api/export/batch-results
   * Export batch validation results in specified format
   */
  exportBatchResults = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { data, options }: ExportRequest = req.body;

      // Validate input
      if (!data) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DATA',
            message: 'Batch results data is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      if (!options || !options.format) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FORMAT',
            message: 'Export format is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Export batch results
      const result = await this.exportService.exportBatchResults(data, options);

      // Prepare response
      const response: ExportResponse = {
        success: result.success,
        data: result,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      if (!result.success) {
        res.status(500).json(response);
        return;
      }

      res.status(200).json(response);
    } catch (error) {
      console.error('Export batch results error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown export error',
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
   * POST /api/export/sample-request
   * Export sample ORTB request in specified format
   */
  exportSampleRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { data, options }: ExportRequest = req.body;

      // Validate input
      if (!data) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DATA',
            message: 'Sample request data is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      if (!options || !options.format) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FORMAT',
            message: 'Export format is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Export sample request
      const result = await this.exportService.exportSampleRequest(data, options);

      // Prepare response
      const response: ExportResponse = {
        success: result.success,
        data: result,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      if (!result.success) {
        res.status(500).json(response);
        return;
      }

      res.status(200).json(response);
    } catch (error) {
      console.error('Export sample request error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown export error',
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
   * POST /api/export/multiple-samples
   * Export multiple sample requests in specified format
   */
  exportMultipleSamples = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { data, options }: ExportRequest = req.body;

      // Validate input
      if (!data || !Array.isArray(data)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DATA',
            message: 'Sample requests array is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      if (!options || !options.format) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FORMAT',
            message: 'Export format is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      if (data.length > 100) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_SAMPLES',
            message: 'Maximum 100 samples allowed for export',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Export multiple samples
      const result = await this.exportService.exportMultipleSamples(data, options);

      // Prepare response
      const response: ExportResponse = {
        success: result.success,
        data: result,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      if (!result.success) {
        res.status(500).json(response);
        return;
      }

      res.status(200).json(response);
    } catch (error) {
      console.error('Export multiple samples error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown export error',
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
   * GET /api/export/formats
   * Get supported export formats
   */
  getSupportedFormats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const formats = [
        {
          format: 'json',
          description: 'JavaScript Object Notation',
          mimeType: 'application/json',
          extension: 'json'
        },
        {
          format: 'csv',
          description: 'Comma Separated Values',
          mimeType: 'text/csv',
          extension: 'csv'
        },
        {
          format: 'txt',
          description: 'Plain Text',
          mimeType: 'text/plain',
          extension: 'txt'
        },
        {
          format: 'html',
          description: 'HyperText Markup Language',
          mimeType: 'text/html',
          extension: 'html'
        },
        {
          format: 'pdf',
          description: 'Portable Document Format (HTML-based)',
          mimeType: 'text/html',
          extension: 'html'
        }
      ];

      res.status(200).json({
        success: true,
        data: formats,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      } as APIResponse);
    } catch (error) {
      console.error('Get formats error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'FORMATS_ERROR',
          message: 'Failed to retrieve supported formats',
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