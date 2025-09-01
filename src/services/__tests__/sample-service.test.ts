/**
 * Unit tests for Sample Service
 * Tests sample generation service functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultSampleService } from '../sample-service';
import { SampleConfig } from '../../models/sample';

describe('DefaultSampleService', () => {
  let service: DefaultSampleService;

  beforeEach(() => {
    service = new DefaultSampleService();
  });

  describe('generateSample', () => {
    it('should generate minimal display ad sample', async () => {
      const config: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: false,
        complexity: 'minimal'
      };

      const result = await service.generateSample(config);

      expect(result.request).toBeDefined();
      expect(result.request.id).toBeDefined();
      expect(result.request.imp).toHaveLength(1);
      expect(result.request.imp[0].banner).toBeDefined();
      expect(result.request.at).toBe(1);
      expect(result.config).toEqual(config);
      expect(result.metadata).toBeDefined();
    });

    it('should generate video ad sample', async () => {
      const config: SampleConfig = {
        requestType: 'video',
        includeOptionalFields: false,
        complexity: 'minimal'
      };

      const result = await service.generateSample(config);

      expect(result.request.imp[0].video).toBeDefined();
      expect(result.request.imp[0].video?.mimes).toContain('video/mp4');
      expect(result.request.imp[0].video?.minduration).toBe(15);
      expect(result.request.imp[0].video?.maxduration).toBe(30);
    });

    it('should generate audio ad sample', async () => {
      const config: SampleConfig = {
        requestType: 'audio',
        includeOptionalFields: false,
        complexity: 'minimal'
      };

      const result = await service.generateSample(config);

      expect(result.request.imp[0].audio).toBeDefined();
      expect(result.request.imp[0].audio?.mimes).toContain('audio/mp3');
    });

    it('should generate native ad sample', async () => {
      const config: SampleConfig = {
        requestType: 'native',
        includeOptionalFields: false,
        complexity: 'minimal'
      };

      const result = await service.generateSample(config);

      expect(result.request.imp[0].native).toBeDefined();
      expect(result.request.imp[0].native?.request).toBeDefined();
      
      const nativeRequest = JSON.parse(result.request.imp[0].native!.request);
      expect(nativeRequest.assets).toHaveLength(2);
    });

    it('should include optional fields when requested', async () => {
      const config: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'standard'
      };

      const result = await service.generateSample(config);

      expect(result.request.tmax).toBeDefined();
      expect(result.request.cur).toContain('USD');
      expect(result.request.imp[0].tagid).toBeDefined();
      expect(result.request.imp[0].secure).toBe(1);
    });

    it('should include comprehensive fields for comprehensive complexity', async () => {
      const config: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'comprehensive'
      };

      const result = await service.generateSample(config);

      expect(result.request.bcat).toBeDefined();
      expect(result.request.badv).toBeDefined();
      expect(result.request.wlang).toBeDefined();
      expect(result.request.imp[0].banner?.format).toBeDefined();
    });
  });

  describe('generateBatch', () => {
    it('should generate multiple samples', async () => {
      const batchConfig = {
        count: 3,
        baseConfig: {
          requestType: 'display' as const,
          includeOptionalFields: false,
          complexity: 'minimal' as const
        },
        varyConfigurations: false
      };

      const result = await service.generateBatch(batchConfig);

      expect(result.samples).toHaveLength(3);
      expect(result.summary.totalRequested).toBe(3);
      expect(result.summary.successfullyGenerated).toBe(3);
      expect(result.summary.failedGeneration).toBe(0);
      expect(result.metadata.batchId).toBeDefined();
    });

    it('should vary request types when configured', async () => {
      const batchConfig = {
        count: 4,
        baseConfig: {
          requestType: 'display' as const,
          includeOptionalFields: false,
          complexity: 'minimal' as const
        },
        varyConfigurations: true,
        variations: {
          varyRequestTypes: true
        }
      };

      const result = await service.generateBatch(batchConfig);

      expect(result.samples).toHaveLength(4);
      
      // Should have different request types
      const requestTypes = result.samples.map(s => s.config.requestType);
      const uniqueTypes = new Set(requestTypes);
      expect(uniqueTypes.size).toBeGreaterThan(1);
    });

    it('should calculate correct distribution statistics', async () => {
      const batchConfig = {
        count: 4,
        baseConfig: {
          requestType: 'display' as const,
          includeOptionalFields: false,
          complexity: 'minimal' as const
        },
        varyConfigurations: true,
        variations: {
          varyRequestTypes: true
        }
      };

      const result = await service.generateBatch(batchConfig);

      expect(result.summary.requestTypeDistribution).toBeDefined();
      
      // Sum of distribution should equal total samples
      const totalInDistribution = Object.values(result.summary.requestTypeDistribution)
        .reduce((sum, count) => sum + count, 0);
      expect(totalInDistribution).toBe(result.samples.length);
    });
  });

  describe('Custom Field Support', () => {
    it('should apply custom field overrides', async () => {
      const config: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: false,
        complexity: 'minimal',
        customFields: {
          'imp.0.bidfloor': 2.5,
          'tmax': 200,
          'cur.0': 'EUR'
        }
      };

      const result = await service.generateSample(config);

      expect(result.request.imp[0].bidfloor).toBe(2.5);
      expect(result.request.tmax).toBe(200);
      expect(result.request.cur?.[0]).toBe('EUR');
    });

    it('should handle nested custom fields', async () => {
      const config: SampleConfig = {
        requestType: 'video',
        includeOptionalFields: true,
        complexity: 'standard',
        customFields: {
          'imp.0.video.minduration': 10,
          'imp.0.video.maxduration': 60,
          'device.w': 1280,
          'device.h': 720
        }
      };

      const result = await service.generateSample(config);

      expect(result.request.imp[0].video?.minduration).toBe(10);
      expect(result.request.imp[0].video?.maxduration).toBe(60);
      expect(result.request.device?.w).toBe(1280);
      expect(result.request.device?.h).toBe(720);
    });
  });

  describe('Scenario-based Generation', () => {
    it('should generate from predefined scenario', async () => {
      const result = await service.generateFromScenario('basic-display');

      expect(result.request.imp[0].banner).toBeDefined();
      expect(result.config.requestType).toBe('display');
      expect(result.config.complexity).toBe('minimal');
    });

    it('should generate from video scenario', async () => {
      const result = await service.generateFromScenario('video-preroll');

      expect(result.request.imp[0].video).toBeDefined();
      expect(result.config.requestType).toBe('video');
      expect(result.request.imp[0].video?.startdelay).toBe(0);
    });

    it('should throw error for non-existent scenario', async () => {
      await expect(service.generateFromScenario('non-existent')).rejects.toThrow('Scenario not found: non-existent');
    });
  });

  describe('Preset-based Generation', () => {
    it('should generate from preset without variation', async () => {
      const result = await service.generateFromPreset('testing');

      expect(result.config.testMode).toBe(true);
      expect(result.config.includeOptionalFields).toBe(true);
      expect(result.config.complexity).toBe('standard');
    });

    it('should generate from preset with variation', async () => {
      const result = await service.generateFromPreset('testing', 'minimal');

      expect(result.config.complexity).toBe('minimal');
      expect(result.config.includeOptionalFields).toBe(false);
    });
  });

  describe('A/B Testing Support', () => {
    it('should generate A/B test samples', async () => {
      const baseConfig: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: false,
        complexity: 'minimal'
      };

      const testVariations = {
        'imp.0.bidfloor': [0.5, 1.0],
        'imp.0.banner.w': [300, 728]
      };

      const samples = await service.generateABTestSamples(baseConfig, testVariations);

      expect(samples).toHaveLength(4); // 2 * 2 combinations
      
      // Check that all combinations are present
      const bidfloors = samples.map(s => s.request.imp[0].bidfloor);
      const widths = samples.map(s => s.request.imp[0].banner?.w);
      
      expect(new Set(bidfloors)).toEqual(new Set([0.5, 1.0]));
      expect(new Set(widths)).toEqual(new Set([300, 728]));
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const config: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'standard'
      };

      const result = service.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid configuration', () => {
      const config = {
        requestType: 'invalid',
        includeOptionalFields: true,
        complexity: 'standard'
      } as any;

      const result = service.validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Template-based Generation', () => {
    it('should generate from template', async () => {
      const result = await service.generateFromTemplate('basic-display-banner');

      expect(result.request.imp[0].banner).toBeDefined();
      expect(result.request.imp[0].banner?.w).toBe(300);
      expect(result.request.imp[0].banner?.h).toBe(250);
      expect(result.template).toBeDefined();
      expect(result.template?.id).toBe('basic-display-banner');
    });

    it('should generate from template with custom fields', async () => {
      const customFields = {
        'imp.0.bidfloor': 3.0,
        'tmax': 150
      };

      const result = await service.generateFromTemplate('basic-display-banner', customFields);

      expect(result.request.imp[0].bidfloor).toBe(3.0);
      expect(result.request.tmax).toBe(150);
    });

    it('should generate video from template', async () => {
      const result = await service.generateFromTemplate('video-preroll');

      expect(result.request.imp[0].video).toBeDefined();
      expect(result.request.imp[0].video?.startdelay).toBe(0);
      expect(result.request.imp[0].video?.skip).toBe(1);
    });

    it('should throw error for non-existent template', async () => {
      await expect(service.generateFromTemplate('non-existent')).rejects.toThrow('Template not found: non-existent');
    });

    it('should get available templates', () => {
      const templates = service.getAvailableTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.id === 'basic-display-banner')).toBe(true);
    });

    it('should get templates by type', () => {
      const displayTemplates = service.getTemplatesByType('display');
      const videoTemplates = service.getTemplatesByType('video');
      
      expect(displayTemplates.length).toBeGreaterThan(0);
      expect(videoTemplates.length).toBeGreaterThan(0);
      expect(displayTemplates.every(t => t.requestType === 'display')).toBe(true);
      expect(videoTemplates.every(t => t.requestType === 'video')).toBe(true);
    });

    it('should validate templates', () => {
      const templates = service.getAvailableTemplates();
      const template = templates[0];
      
      const result = service.validateTemplate(template);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Metadata Generation', () => {
    it('should generate complete metadata for samples', async () => {
      const config: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'standard'
      };

      const result = await service.generateSample(config);

      expect(result.metadata.sampleId).toBeDefined();
      expect(result.metadata.generatedAt).toBeInstanceOf(Date);
      expect(result.metadata.generatorVersion).toBe('1.0.0');
      expect(result.metadata.specVersion).toBe('2.6');
      expect(result.metadata.stats.generationTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.stats.fieldsGenerated).toBeGreaterThan(0);
      expect(result.metadata.stats.jsonSize).toBeGreaterThan(0);
    });
  });
});