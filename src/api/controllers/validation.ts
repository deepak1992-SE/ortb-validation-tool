/**
 * Validation API Controller
 * Handles validation-related API endpoints
 */

import { Response } from 'express';
import { 
  AuthenticatedRequest, 
  APIResponse, 
  ValidateRequest, 
  ValidateResponse,
  ValidateBatchRequest,
  ValidateBatchResponse,
  APIController 
} from '../types';
import { ORTBValidationService, ValidationService } from '../../services/validation-service';
import { ORTBRequest } from '../../models/ortb';

export class ValidationController implements APIController {
  private validationService: ValidationService;

  constructor() {
    this.validationService = new ORTBValidationService();
  }

  /**
   * POST /api/validate
   * Validate a single ORTB request
   */
  validateSingle = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { request: ortbRequest, options = {} }: ValidateRequest = req.body;

      // Validate input
      if (!ortbRequest) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUEST',
            message: 'ORTB request is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Perform validation
      const result = await this.validationService.validateSingle(ortbRequest, options);

      // Prepare response
      const response: ValidateResponse = {
        success: true,
        data: result,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Validation error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_SERVICE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown validation error',
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
   * POST /api/validate-batch
   * Validate multiple ORTB requests
   */
  validateBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { requests, options = {} }: ValidateBatchRequest = req.body;

      // Validate input
      if (!requests || !Array.isArray(requests)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUESTS',
            message: 'Requests array is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      if (requests.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'EMPTY_REQUESTS',
            message: 'Requests array cannot be empty',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      if (requests.length > 100) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Maximum 100 requests allowed per batch',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Add progress callback for large batches
      const batchOptions: any = { ...options };
      if (requests.length > 10) {
        batchOptions.onProgress = (processed: number, total: number) => {
          console.log(`Batch validation progress: ${processed}/${total} (${Math.round((processed/total)*100)}%)`);
        };
      }

      // Perform batch validation
      const result = await this.validationService.validateBatch(requests, batchOptions);

      // Prepare response
      const response: ValidateBatchResponse = {
        success: true,
        data: result,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Batch validation error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'BATCH_VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown batch validation error',
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
   * GET /api/validate/health
   * Health check for validation service
   */
  healthCheck = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      // Perform a simple validation test
      const testRequest: ORTBRequest = {
        id: 'health-check',
        imp: [{
          id: '1',
          banner: {
            w: 300,
            h: 250,
            mimes: ['image/jpeg']
          }
        }],
        at: 1
      };

      const result = await this.validationService.validateSingle(testRequest);
      
      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          validationEngine: result.isValid ? 'operational' : 'degraded',
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
          message: 'Validation service is not healthy',
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
   * GET /api/validate/stats
   * Get validation service statistics
   */
  getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      // Get API stats if available
      const apiStats = (req as any).getStats ? (req as any).getStats() : null;
      
      res.status(200).json({
        success: true,
        data: {
          service: 'validation',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          apiStats,
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
      console.error('Stats error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to retrieve statistics',
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