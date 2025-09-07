/**
 * Sample Configuration Manager
 * Manages sample generation configurations and scenarios
 */

import { SampleConfig } from '../models/sample';

export interface SampleScenario {
  id: string;
  name: string;
  description: string;
  config: SampleConfig;
  tags: string[];
}

export interface ConfigurationPreset {
  id: string;
  name: string;
  description: string;
  baseConfig: Partial<SampleConfig>;
  variations: ConfigurationVariation[];
}

export interface ConfigurationVariation {
  name: string;
  description: string;
  fieldOverrides: Record<string, any>;
}

export class SampleConfigManager {
  private scenarios: Map<string, SampleScenario> = new Map();
  private presets: Map<string, ConfigurationPreset> = new Map();

  constructor() {
    this.initializeDefaultScenarios();
    this.initializeDefaultPresets();
  }

  /**
   * Get a predefined scenario by ID
   */
  getScenario(id: string): SampleScenario | undefined {
    return this.scenarios.get(id);
  }

  /**
   * Get all available scenarios
   */
  getAllScenarios(): SampleScenario[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * Get scenarios by tag
   */
  getScenariosByTag(tag: string): SampleScenario[] {
    return Array.from(this.scenarios.values())
      .filter(scenario => scenario.tags.includes(tag));
  }

  /**
   * Add a custom scenario
   */
  addScenario(scenario: SampleScenario): void {
    this.scenarios.set(scenario.id, scenario);
  }

  /**
   * Get a configuration preset by ID
   */
  getPreset(id: string): ConfigurationPreset | undefined {
    return this.presets.get(id);
  }

  /**
   * Get all available presets
   */
  getAllPresets(): ConfigurationPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Create a configuration from a preset with optional variation
   */
  createConfigFromPreset(presetId: string, variationName?: string): SampleConfig {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    let config: SampleConfig = {
      requestType: 'display',
      includeOptionalFields: false,
      complexity: 'minimal',
      ...preset.baseConfig
    };

    if (variationName) {
      const variation = preset.variations.find(v => v.name === variationName);
      if (variation) {
        config = this.applyVariation(config, variation);
      }
    }

    return config;
  }

  /**
   * Create a customized configuration with field overrides
   */
  createCustomConfig(baseConfig: SampleConfig, overrides: Record<string, any>): SampleConfig {
    const config = { ...baseConfig };
    
    // Apply direct config overrides
    for (const [key, value] of Object.entries(overrides)) {
      if (key in config) {
        (config as any)[key] = value;
      } else {
        // Add to custom fields for nested overrides
        if (!config.customFields) {
          config.customFields = {};
        }
        config.customFields[key] = value;
      }
    }

    return config;
  }

  /**
   * Generate configuration for A/B testing scenarios
   */
  generateABTestConfigs(baseConfig: SampleConfig, testVariations: Record<string, any[]>): SampleConfig[] {
    const configs: SampleConfig[] = [];
    
    // Generate all combinations of test variations
    const variationKeys = Object.keys(testVariations);
    const combinations = this.generateCombinations(testVariations);

    combinations.forEach((combination) => {
      const config = { ...baseConfig };
      const customFields = { ...config.customFields };

      variationKeys.forEach((key, keyIndex) => {
        customFields[key] = combination[keyIndex];
      });

      config.customFields = customFields;
      configs.push(config);
    });

    return configs;
  }

  /**
   * Validate a sample configuration
   */
  validateConfig(config: SampleConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!config.requestType) {
      errors.push('requestType is required');
    }

    if (!['display', 'video', 'native', 'audio'].includes(config.requestType)) {
      errors.push('requestType must be one of: display, video, native, audio');
    }

    if (!['minimal', 'standard', 'comprehensive'].includes(config.complexity)) {
      errors.push('complexity must be one of: minimal, standard, comprehensive');
    }

    // Validate impression count
    if (config.impressionCount !== undefined && config.impressionCount < 1) {
      errors.push('impressionCount must be at least 1');
    }

    // Validate publisher info for mobile apps
    if (config.publisherInfo?.isMobileApp && !config.publisherInfo.bundleId) {
      errors.push('bundleId is required for mobile app publishers');
    }

    // Validate device screen size
    if (config.deviceInfo?.screenSize) {
      const { width, height } = config.deviceInfo.screenSize;
      if (width <= 0 || height <= 0) {
        errors.push('screen dimensions must be positive numbers');
      }
    }

    // Validate geo coordinates
    if (config.geoInfo?.coordinates) {
      const { lat, lon } = config.geoInfo.coordinates;
      if (lat < -90 || lat > 90) {
        errors.push('latitude must be between -90 and 90');
      }
      if (lon < -180 || lon > 180) {
        errors.push('longitude must be between -180 and 180');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private initializeDefaultScenarios(): void {
    // Basic display ad scenario
    this.scenarios.set('basic-display', {
      id: 'basic-display',
      name: 'Basic Display Ad',
      description: 'Simple banner ad request with minimal fields',
      config: {
        requestType: 'display',
        includeOptionalFields: false,
        complexity: 'minimal'
      },
      tags: ['display', 'basic', 'banner']
    });

    // Video ad scenario
    this.scenarios.set('video-preroll', {
      id: 'video-preroll',
      name: 'Video Pre-roll Ad',
      description: 'Video ad request for pre-roll placement',
      config: {
        requestType: 'video',
        includeOptionalFields: true,
        complexity: 'standard',
        customFields: {
          'imp.0.video.startdelay': 0,
          'imp.0.video.placement': 1
        }
      },
      tags: ['video', 'preroll', 'standard']
    });

    // Mobile app scenario
    this.scenarios.set('mobile-app', {
      id: 'mobile-app',
      name: 'Mobile App Ad',
      description: 'Ad request from mobile application',
      config: {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'standard',
        publisherInfo: {
          name: 'Mobile Game Studio',
          domain: 'mobilegames.com',
          siteName: 'Puzzle Adventure',
          categories: ['IAB9'],
          isMobileApp: true,
          bundleId: 'com.mobilegames.puzzle',
          storeUrl: 'https://play.google.com/store/apps/details?id=com.mobilegames.puzzle'
        },
        deviceInfo: {
          deviceType: 'mobile',
          os: 'Android',
          browser: 'Chrome',
          screenSize: { width: 375, height: 812 },
          supportsJavaScript: true
        }
      },
      tags: ['mobile', 'app', 'display']
    });

    // Native ad scenario
    this.scenarios.set('native-feed', {
      id: 'native-feed',
      name: 'Native Feed Ad',
      description: 'Native ad for social media feed placement',
      config: {
        requestType: 'native',
        includeOptionalFields: true,
        complexity: 'comprehensive'
      },
      tags: ['native', 'feed', 'social']
    });

    // Audio ad scenario
    this.scenarios.set('podcast-audio', {
      id: 'podcast-audio',
      name: 'Podcast Audio Ad',
      description: 'Audio ad for podcast insertion',
      config: {
        requestType: 'audio',
        includeOptionalFields: true,
        complexity: 'standard',
        customFields: {
          'imp.0.audio.minduration': 15,
          'imp.0.audio.maxduration': 30,
          'imp.0.audio.feed': 1
        }
      },
      tags: ['audio', 'podcast', 'streaming']
    });
  }

  private initializeDefaultPresets(): void {
    // Testing preset
    this.presets.set('testing', {
      id: 'testing',
      name: 'Testing Configuration',
      description: 'Configuration optimized for testing and validation',
      baseConfig: {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'standard',
        testMode: true
      },
      variations: [
        {
          name: 'minimal',
          description: 'Minimal fields for basic testing',
          fieldOverrides: {
            complexity: 'minimal',
            includeOptionalFields: false
          }
        },
        {
          name: 'comprehensive',
          description: 'All fields for comprehensive testing',
          fieldOverrides: {
            complexity: 'comprehensive',
            includeOptionalFields: true
          }
        }
      ]
    });

    // Performance preset
    this.presets.set('performance', {
      id: 'performance',
      name: 'Performance Optimized',
      description: 'Configuration optimized for performance testing',
      baseConfig: {
        requestType: 'display',
        includeOptionalFields: false,
        complexity: 'minimal',
        impressionCount: 1
      },
      variations: [
        {
          name: 'single',
          description: 'Single impression',
          fieldOverrides: {
            impressionCount: 1
          }
        },
        {
          name: 'multiple',
          description: 'Multiple impressions',
          fieldOverrides: {
            impressionCount: 5
          }
        }
      ]
    });

    // Demo preset
    this.presets.set('demo', {
      id: 'demo',
      name: 'Demo Configuration',
      description: 'Configuration for demonstrations and examples',
      baseConfig: {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'standard',
        publisherInfo: {
          name: 'Demo Publisher',
          domain: 'demo.example.com',
          siteName: 'Demo Site',
          categories: ['IAB1'],
          isMobileApp: false
        }
      },
      variations: [
        {
          name: 'desktop',
          description: 'Desktop demo',
          fieldOverrides: {
            deviceInfo: {
              deviceType: 'desktop',
              os: 'Windows',
              browser: 'Chrome',
              screenSize: { width: 1920, height: 1080 }
            }
          }
        },
        {
          name: 'mobile',
          description: 'Mobile demo',
          fieldOverrides: {
            deviceInfo: {
              deviceType: 'mobile',
              os: 'iOS',
              browser: 'Safari',
              screenSize: { width: 375, height: 812 }
            }
          }
        }
      ]
    });
  }

  private applyVariation(config: SampleConfig, variation: ConfigurationVariation): SampleConfig {
    const result = { ...config };
    
    for (const [key, value] of Object.entries(variation.fieldOverrides)) {
      if (key in result) {
        (result as any)[key] = value;
      } else {
        if (!result.customFields) {
          result.customFields = {};
        }
        result.customFields[key] = value;
      }
    }

    return result;
  }

  private generateCombinations(variations: Record<string, any[]>): any[][] {
    const keys = Object.keys(variations);
    const values = keys.map(key => variations[key]);
    
    const combinations: any[][] = [];
    
    const generate = (current: any[], index: number) => {
      if (index === keys.length) {
        combinations.push([...current]);
        return;
      }
      
      for (const value of values[index] || []) {
        current[index] = value;
        generate(current, index + 1);
      }
    };
    
    generate(new Array(keys.length), 0);
    return combinations;
  }
}