/**
 * Sample Generation API Controller
 * Handles sample generation-related API endpoints
 */

import { Response } from 'express';
import { 
  AuthenticatedRequest, 
  APIResponse, 
  GenerateRequest, 
  GenerateResponse,
  GenerateBatchRequest,
  GenerateBatchResponse,
  TemplatesResponse,
  APIController 
} from '../types';
import { DefaultSampleService, SampleService } from '../../services/sample-service';
import { SampleConfig } from '../../models/sample';

export class SampleController implements APIController {
  private sampleService: SampleService;

  constructor() {
    this.sampleService = new DefaultSampleService();
  }

  /**
   * POST /api/generate
   * Generate a single ORTB sample request
   */
  generateSingle = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { config }: GenerateRequest = req.body;

      // Validate input
      if (!config) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_CONFIG',
            message: 'Sample configuration is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Validate configuration
      const validation = this.sampleService.validateConfiguration(config);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CONFIG',
            message: 'Invalid sample configuration',
            details: validation.errors,
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Generate sample
      const result = await this.sampleService.generateSample(config);

      // Prepare response
      const response: GenerateResponse = {
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
      console.error('Sample generation error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown generation error',
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
   * POST /api/generate-batch
   * Generate multiple ORTB sample requests
   */
  generateBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { config }: GenerateBatchRequest = req.body;

      // Validate input
      if (!config) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_CONFIG',
            message: 'Batch configuration is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      if (!config.count || config.count <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COUNT',
            message: 'Count must be a positive number',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      if (config.count > 50) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_SAMPLES',
            message: 'Maximum 50 samples allowed per batch',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Validate base configuration
      const validation = this.sampleService.validateConfiguration(config.baseConfig);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_BASE_CONFIG',
            message: 'Invalid base sample configuration',
            details: validation.errors,
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Generate batch
      const result = await this.sampleService.generateBatch(config);

      // Prepare response
      const response: GenerateBatchResponse = {
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
      console.error('Batch generation error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'BATCH_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown batch generation error',
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
   * GET /api/templates
   * Get available sample templates
   */
  getTemplates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const requestType = req.query.type as string;
      
      let templates;
      if (requestType && ['display', 'video', 'native', 'audio'].includes(requestType)) {
        templates = this.sampleService.getTemplatesByType(requestType as any);
      } else {
        templates = this.sampleService.getAvailableTemplates();
      }

      // Prepare response
      const response: TemplatesResponse = {
        success: true,
        data: templates,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Templates error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'TEMPLATES_ERROR',
          message: 'Failed to retrieve templates',
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
   * POST /api/generate/from-template
   * Generate sample from a specific template
   */
  generateFromTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { templateId, customFields } = req.body;

      // Validate input
      if (!templateId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TEMPLATE_ID',
            message: 'Template ID is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Generate sample from template
      const result = await this.sampleService.generateFromTemplate(templateId, customFields);

      // Prepare response
      const response: GenerateResponse = {
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
      console.error('Template generation error:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: error.message,
            timestamp: new Date()
          },
          metadata: {
            requestId,
            timestamp: new Date(),
            processingTime: Date.now() - startTime,
            version: '1.0.0'
          }
        } as APIResponse);
        return;
      }
      
      res.status(500).json({
        success: false,
        error: {
          code: 'TEMPLATE_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown template generation error',
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
   * POST /api/generate/from-scenario
   * Generate sample from a predefined scenario
   */
  generateFromScenario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { scenarioId } = req.body;

      // Validate input
      if (!scenarioId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_SCENARIO_ID',
            message: 'Scenario ID is required',
            timestamp: new Date()
          }
        } as APIResponse);
        return;
      }

      // Generate sample from scenario
      const result = await this.sampleService.generateFromScenario(scenarioId);

      // Prepare response
      const response: GenerateResponse = {
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
      console.error('Scenario generation error:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SCENARIO_NOT_FOUND',
            message: error.message,
            timestamp: new Date()
          },
          metadata: {
            requestId,
            timestamp: new Date(),
            processingTime: Date.now() - startTime,
            version: '1.0.0'
          }
        } as APIResponse);
        return;
      }
      
      res.status(500).json({
        success: false,
        error: {
          code: 'SCENARIO_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown scenario generation error',
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
   * GET /api/generate/health
   * Health check for sample generation service
   */
  healthCheck = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    try {
      // Perform a simple generation test
      const testConfig: SampleConfig = {
        requestType: 'display',
        complexity: 'minimal',
        includeOptionalFields: false
      };

      const result = await this.sampleService.generateSample(testConfig);
      
      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          sampleGeneration: result ? 'operational' : 'degraded',
          templatesAvailable: this.sampleService.getAvailableTemplates().length,
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
          message: 'Sample generation service is not healthy',
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