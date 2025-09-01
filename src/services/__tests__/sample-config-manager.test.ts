/**
 * Unit tests for Sample Configuration Manager
 * Tests configuration management and scenario handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SampleConfigManager } from '../sample-config-manager';
import { SampleConfig } from '../../models/sample';

describe('SampleConfigManager', () => {
  let manager: SampleConfigManager;

  beforeEach(() => {
    manager = new SampleConfigManager();
  });

  describe('Scenario Management', () => {
    it('should provide default scenarios', () => {
      const scenarios = manager.getAllScenarios();
      
      expect(scenarios.length).toBeGreaterThan(0);
      expect(scenarios.some(s => s.id === 'basic-display')).toBe(true);
      expect(scenarios.some(s => s.id === 'video-preroll')).toBe(true);
      expect(scenarios.some(s => s.id === 'mobile-app')).toBe(true);
      expect(scenarios.some(s => s.id === 'native-feed')).toBe(true);
      expect(scenarios.some(s => s.id === 'podcast-audio')).toBe(true);
    });

    it('should get scenario by ID', () => {
      const scenario = manager.getScenario('basic-display');
      
      expect(scenario).toBeDefined();
      expect(scenario?.id).toBe('basic-display');
      expect(scenario?.name).toBe('Basic Display Ad');
      expect(scenario?.config.requestType).toBe('display');
      expect(scenario?.config.complexity).toBe('minimal');
    });

    it('should get scenarios by tag', () => {
      const displayScenarios = manager.getScenariosByTag('display');
      const videoScenarios = manager.getScenariosByTag('video');
      
      expect(displayScenarios.length).toBeGreaterThan(0);
      expect(videoScenarios.length).toBeGreaterThan(0);
      expect(displayScenarios.every(s => s.tags.includes('display'))).toBe(true);
      expect(videoScenarios.every(s => s.tags.includes('video'))).toBe(true);
    });

    it('should add custom scenarios', () => {
      const customScenario = {
        id: 'custom-test',
        name: 'Custom Test Scenario',
        description: 'A custom test scenario',
        config: {
          requestType: 'display' as const,
          includeOptionalFields: true,
          complexity: 'standard' as const
        },
        tags: ['custom', 'test']
      };

      manager.addScenario(customScenario);
      
      const retrieved = manager.getScenario('custom-test');
      expect(retrieved).toEqual(customScenario);
    });
  });

  describe('Preset Management', () => {
    it('should provide default presets', () => {
      const presets = manager.getAllPresets();
      
      expect(presets.length).toBeGreaterThan(0);
      expect(presets.some(p => p.id === 'testing')).toBe(true);
      expect(presets.some(p => p.id === 'performance')).toBe(true);
      expect(presets.some(p => p.id === 'demo')).toBe(true);
    });

    it('should get preset by ID', () => {
      const preset = manager.getPreset('testing');
      
      expect(preset).toBeDefined();
      expect(preset?.id).toBe('testing');
      expect(preset?.name).toBe('Testing Configuration');
      expect(preset?.baseConfig.testMode).toBe(true);
    });

    it('should create config from preset without variation', () => {
      const config = manager.createConfigFromPreset('testing');
      
      expect(config.requestType).toBe('display');
      expect(config.includeOptionalFields).toBe(true);
      expect(config.complexity).toBe('standard');
      expect(config.testMode).toBe(true);
    });

    it('should create config from preset with variation', () => {
      const config = manager.createConfigFromPreset('testing', 'minimal');
      
      expect(config.complexity).toBe('minimal');
      expect(config.includeOptionalFields).toBe(false);
    });

    it('should throw error for non-existent preset', () => {
      expect(() => {
        manager.createConfigFromPreset('non-existent');
      }).toThrow('Preset not found: non-existent');
    });
  });

  describe('Custom Configuration', () => {
    it('should create custom config with overrides', () => {
      const baseConfig: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: false,
        complexity: 'minimal'
      };

      const overrides = {
        includeOptionalFields: true,
        complexity: 'standard',
        'imp.0.bidfloor': 1.0
      };

      const config = manager.createCustomConfig(baseConfig, overrides);
      
      expect(config.includeOptionalFields).toBe(true);
      expect(config.complexity).toBe('standard');
      expect(config.customFields).toBeDefined();
      expect(config.customFields!['imp.0.bidfloor']).toBe(1.0);
    });

    it('should preserve existing custom fields', () => {
      const baseConfig: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: false,
        complexity: 'minimal',
        customFields: {
          'existing.field': 'value'
        }
      };

      const overrides = {
        'new.field': 'new-value'
      };

      const config = manager.createCustomConfig(baseConfig, overrides);
      
      expect(config.customFields!['existing.field']).toBe('value');
      expect(config.customFields!['new.field']).toBe('new-value');
    });
  });

  describe('A/B Testing Configuration', () => {
    it('should generate A/B test configurations', () => {
      const baseConfig: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: false,
        complexity: 'minimal'
      };

      const testVariations = {
        'imp.0.bidfloor': [0.5, 1.0, 1.5],
        'imp.0.banner.w': [300, 728]
      };

      const configs = manager.generateABTestConfigs(baseConfig, testVariations);
      
      expect(configs).toHaveLength(6); // 3 * 2 combinations
      
      // Check that all combinations are present
      const bidfloors = configs.map(c => c.customFields!['imp.0.bidfloor']);
      const widths = configs.map(c => c.customFields!['imp.0.banner.w']);
      
      expect(new Set(bidfloors)).toEqual(new Set([0.5, 1.0, 1.5]));
      expect(new Set(widths)).toEqual(new Set([300, 728]));
    });

    it('should handle single variation', () => {
      const baseConfig: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: false,
        complexity: 'minimal'
      };

      const testVariations = {
        'imp.0.bidfloor': [0.5, 1.0]
      };

      const configs = manager.generateABTestConfigs(baseConfig, testVariations);
      
      expect(configs).toHaveLength(2);
      expect(configs[0].customFields!['imp.0.bidfloor']).toBe(0.5);
      expect(configs[1].customFields!['imp.0.bidfloor']).toBe(1.0);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const config: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'standard'
      };

      const result = manager.validateConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing request type', () => {
      const config = {
        includeOptionalFields: true,
        complexity: 'standard'
      } as SampleConfig;

      const result = manager.validateConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('requestType is required');
    });

    it('should detect invalid request type', () => {
      const config: SampleConfig = {
        requestType: 'invalid' as any,
        includeOptionalFields: true,
        complexity: 'standard'
      };

      const result = manager.validateConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('requestType must be one of: display, video, native, audio');
    });

    it('should detect invalid complexity', () => {
      const config: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'invalid' as any
      };

      const result = manager.validateConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('complexity must be one of: minimal, standard, comprehensive');
    });

    it('should detect invalid impression count', () => {
      const config: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'standard',
        impressionCount: 0
      };

      const result = manager.validateConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('impressionCount must be at least 1');
    });

    it('should detect missing bundle ID for mobile apps', () => {
      const config: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'standard',
        publisherInfo: {
          name: 'Test Publisher',
          domain: 'test.com',
          siteName: 'Test App',
          categories: ['IAB1'],
          isMobileApp: true
          // Missing bundleId
        }
      };

      const result = manager.validateConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('bundleId is required for mobile app publishers');
    });

    it('should detect invalid screen dimensions', () => {
      const config: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'standard',
        deviceInfo: {
          deviceType: 'mobile',
          screenSize: { width: -100, height: 0 }
        }
      };

      const result = manager.validateConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('screen dimensions must be positive numbers');
    });

    it('should detect invalid geo coordinates', () => {
      const config: SampleConfig = {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'standard',
        geoInfo: {
          country: 'US',
          coordinates: { lat: 100, lon: -200 }
        }
      };

      const result = manager.validateConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('latitude must be between -90 and 90');
      expect(result.errors).toContain('longitude must be between -180 and 180');
    });
  });
});