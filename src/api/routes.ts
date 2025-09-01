/**
 * API Routes Configuration
 * Defines all API endpoints and their handlers
 */

import { Router } from 'express';
import { 
  ValidationController, 
  SampleController, 
  ExportController, 
  ReportController 
} from './controllers';
import { validateRequestBody } from './middleware';

export function createRoutes(): Router {
  const router = Router();

  // Initialize controllers
  const validationController = new ValidationController();
  const sampleController = new SampleController();
  const exportController = new ExportController();
  const reportController = new ReportController();

  // Validation endpoints
  router.post('/validate', 
    validateRequestBody(['request']),
    validationController.validateSingle
  );

  router.post('/validate-batch', 
    validateRequestBody(['requests']),
    validationController.validateBatch
  );

  router.get('/validate/health', validationController.healthCheck);
  router.get('/validate/stats', validationController.getStats);

  // Sample generation endpoints
  router.post('/generate', 
    validateRequestBody(['config']),
    sampleController.generateSingle
  );

  router.post('/generate-batch', 
    validateRequestBody(['config']),
    sampleController.generateBatch
  );

  router.post('/generate/from-template', 
    validateRequestBody(['templateId']),
    sampleController.generateFromTemplate
  );

  router.post('/generate/from-scenario', 
    validateRequestBody(['scenarioId']),
    sampleController.generateFromScenario
  );

  router.get('/templates', sampleController.getTemplates);
  router.get('/generate/health', sampleController.healthCheck);

  // Export endpoints
  router.post('/export/validation-result', 
    validateRequestBody(['data', 'options']),
    exportController.exportValidationResult
  );

  router.post('/export/validation-report', 
    validateRequestBody(['data', 'options']),
    exportController.exportValidationReport
  );

  router.post('/export/batch-results', 
    validateRequestBody(['data', 'options']),
    exportController.exportBatchResults
  );

  router.post('/export/sample-request', 
    validateRequestBody(['data', 'options']),
    exportController.exportSampleRequest
  );

  router.post('/export/multiple-samples', 
    validateRequestBody(['data', 'options']),
    exportController.exportMultipleSamples
  );

  router.get('/export/formats', exportController.getSupportedFormats);

  // Report endpoints
  router.post('/reports/validation', 
    validateRequestBody(['validationResult']),
    reportController.generateValidationReport
  );

  router.post('/reports/compliance', 
    validateRequestBody(['validationResult']),
    reportController.generateComplianceReport
  );

  router.post('/reports/batch', 
    validateRequestBody(['batchResult']),
    reportController.generateBatchReport
  );

  router.post('/reports/custom', 
    validateRequestBody(['validationResult']),
    reportController.generateCustomReport
  );

  router.get('/reports/templates', reportController.getReportTemplates);
  router.get('/reports/health', reportController.healthCheck);

  // Analytics endpoints
  router.get('/analytics/usage', (req, res) => {
    try {
      const { apiAnalytics } = require('./analytics');
      const metrics = apiAnalytics.exportMetrics();
      
      res.json({
        success: true,
        data: metrics,
        metadata: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date(),
          processingTime: 0,
          version: '1.0.0'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to retrieve analytics data',
          timestamp: new Date()
        }
      });
    }
  });

  router.get('/analytics/security', (req, res) => {
    try {
      const { apiAnalytics } = require('./analytics');
      const securityMetrics = apiAnalytics.getSecurityMetrics();
      
      res.json({
        success: true,
        data: securityMetrics,
        metadata: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date(),
          processingTime: 0,
          version: '1.0.0'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SECURITY_METRICS_ERROR',
          message: 'Failed to retrieve security metrics',
          timestamp: new Date()
        }
      });
    }
  });

  // API info endpoint
  router.get('/info', (req, res) => {
    res.json({
      success: true,
      data: {
        name: 'ORTB Validation Tool API',
        version: '1.0.0',
        description: 'REST API for OpenRTB 2.6 validation and sample generation',
        endpoints: {
          validation: [
            'POST /api/validate',
            'POST /api/validate-batch',
            'GET /api/validate/health',
            'GET /api/validate/stats'
          ],
          generation: [
            'POST /api/generate',
            'POST /api/generate-batch',
            'POST /api/generate/from-template',
            'POST /api/generate/from-scenario',
            'GET /api/templates',
            'GET /api/generate/health'
          ],
          export: [
            'POST /api/export/validation-result',
            'POST /api/export/validation-report',
            'POST /api/export/batch-results',
            'POST /api/export/sample-request',
            'POST /api/export/multiple-samples',
            'GET /api/export/formats'
          ],
          reports: [
            'POST /api/reports/validation',
            'POST /api/reports/compliance',
            'POST /api/reports/batch',
            'POST /api/reports/custom',
            'GET /api/reports/templates',
            'GET /api/reports/health'
          ],
          analytics: [
            'GET /api/analytics/usage',
            'GET /api/analytics/security'
          ]
        },
        documentation: 'https://github.com/your-org/ortb-validation-tool/blob/main/API.md'
      },
      metadata: {
        requestId: req.headers['x-request-id'],
        timestamp: new Date(),
        processingTime: 0,
        version: '1.0.0'
      }
    });
  });

  // Health check endpoint for the entire API
  router.get('/health', async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Check all services
      const healthChecks = await Promise.allSettled([
        validationController.healthCheck(req as any, { 
          status: () => ({ json: () => {} }), 
          json: () => {} 
        } as any),
        sampleController.healthCheck(req as any, { 
          status: () => ({ json: () => {} }), 
          json: () => {} 
        } as any),
        reportController.healthCheck(req as any, { 
          status: () => ({ json: () => {} }), 
          json: () => {} 
        } as any)
      ]);

      const allHealthy = healthChecks.every(check => check.status === 'fulfilled');

      res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        data: {
          status: allHealthy ? 'healthy' : 'degraded',
          services: {
            validation: healthChecks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
            generation: healthChecks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
            reporting: healthChecks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy'
          },
          uptime: process.uptime(),
          timestamp: new Date()
        },
        metadata: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: 'Failed to perform health check',
          timestamp: new Date()
        },
        metadata: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        }
      });
    }
  });

  return router;
}