/**
 * Unit tests for Sample Template Manager
 * Tests template management and validation functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SampleTemplateManager } from '../sample-template-manager';
import { SampleTemplate } from '../../models/sample';

describe('SampleTemplateManager', () => {
  let manager: SampleTemplateManager;

  beforeEach(() => {
    manager = new SampleTemplateManager();
  });

  describe('Template Retrieval', () => {
    it('should provide default templates', () => {
      const templates = manager.getAllTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.id === 'basic-display-banner')).toBe(true);
      expect(templates.some(t => t.id === 'leaderboard-banner')).toBe(true);
      expect(templates.some(t => t.id === 'video-preroll')).toBe(true);
      expect(templates.some(t => t.id === 'native-feed')).toBe(true);
      expect(templates.some(t => t.id === 'audio-podcast')).toBe(true);
    });

    it('should get template by ID', () => {
      const template = manager.getTemplate('basic-display-banner');
      
      expect(template).toBeDefined();
      expect(template?.id).toBe('basic-display-banner');
      expect(template?.name).toBe('Basic Display Banner');
      expect(template?.requestType).toBe('display');
    });

    it('should return undefined for non-existent template', () => {
      const template = manager.getTemplate('non-existent');
      expect(template).toBeUndefined();
    });

    it('should get templates by type', () => {
      const displayTemplates = manager.getTemplatesByType('display');
      const videoTemplates = manager.getTemplatesByType('video');
      
      expect(displayTemplates.length).toBeGreaterThan(0);
      expect(videoTemplates.length).toBeGreaterThan(0);
      expect(displayTemplates.every(t => t.requestType === 'display')).toBe(true);
      expect(videoTemplates.every(t => t.requestType === 'video')).toBe(true);
    });

    it('should get templates by tag', () => {
      const bannerTemplates = manager.getTemplatesByTag('banner');
      const podcastTemplates = manager.getTemplatesByTag('podcast');
      
      expect(bannerTemplates.length).toBeGreaterThan(0);
      expect(podcastTemplates.length).toBeGreaterThan(0);
      expect(bannerTemplates.every(t => t.tags.includes('banner'))).toBe(true);
      expect(podcastTemplates.every(t => t.tags.includes('podcast'))).toBe(true);
    });
  });

  describe('Template Management', () => {
    it('should add a valid custom template', () => {
      const customTemplate: SampleTemplate = {
        id: 'custom-test',
        name: 'Custom Test Template',
        description: 'A custom test template',
        requestType: 'display',
        config: {
          requestType: 'display',
          includeOptionalFields: true,
          complexity: 'standard'
        },
        template: {
          id: 'custom-req-001',
          imp: [{
            id: '1',
            banner: {
              w: 320,
              h: 50,
              pos: 1,
              mimes: ['image/jpeg']
            },
            bidfloor: 0.25,
            bidfloorcur: 'USD'
          }],
          at: 1
        },
        requiredFields: ['id', 'imp', 'at'],
        optionalFields: ['tmax', 'cur'],
        tags: ['custom', 'mobile'],
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      manager.addTemplate(customTemplate);
      
      const retrieved = manager.getTemplate('custom-test');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Custom Test Template');
    });

    it('should reject invalid template', () => {
      const invalidTemplate = {
        id: 'invalid-test',
        name: 'Invalid Template',
        requestType: 'invalid-type',
        // Missing required fields
      } as any;

      expect(() => {
        manager.addTemplate(invalidTemplate);
      }).toThrow('Invalid template');
    });

    it('should update existing template', () => {
      const updates = {
        name: 'Updated Basic Banner',
        description: 'Updated description'
      };

      manager.updateTemplate('basic-display-banner', updates);
      
      const updated = manager.getTemplate('basic-display-banner');
      expect(updated?.name).toBe('Updated Basic Banner');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when updating non-existent template', () => {
      expect(() => {
        manager.updateTemplate('non-existent', { name: 'New Name' });
      }).toThrow('Template not found: non-existent');
    });

    it('should remove template', () => {
      const removed = manager.removeTemplate('basic-display-banner');
      expect(removed).toBe(true);
      
      const retrieved = manager.getTemplate('basic-display-banner');
      expect(retrieved).toBeUndefined();
    });

    it('should return false when removing non-existent template', () => {
      const removed = manager.removeTemplate('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('Configuration Generation', () => {
    it('should create config from template', () => {
      const config = manager.createConfigFromTemplate('basic-display-banner');
      
      expect(config.requestType).toBe('display');
      expect(config.includeOptionalFields).toBe(true);
      expect(config.complexity).toBe('standard');
    });

    it('should create config with overrides', () => {
      const config = manager.createConfigFromTemplate('basic-display-banner', {
        complexity: 'comprehensive',
        testMode: true
      });
      
      expect(config.complexity).toBe('comprehensive');
      expect(config.testMode).toBe(true);
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        manager.createConfigFromTemplate('non-existent');
      }).toThrow('Template not found: non-existent');
    });
  });

  describe('Request Generation', () => {
    it('should generate request from template', () => {
      const request = manager.generateRequestFromTemplate('basic-display-banner');
      
      expect(request.id).toBeDefined();
      expect(request.imp).toHaveLength(1);
      expect(request.imp[0].banner).toBeDefined();
      expect(request.imp[0].banner?.w).toBe(300);
      expect(request.imp[0].banner?.h).toBe(250);
      expect(request.at).toBe(1);
    });

    it('should generate request with custom fields', () => {
      const customFields = {
        'imp.0.bidfloor': 2.0,
        'tmax': 200
      };

      const request = manager.generateRequestFromTemplate('basic-display-banner', customFields);
      
      expect(request.imp[0].bidfloor).toBe(2.0);
      expect(request.tmax).toBe(200);
    });

    it('should generate video request from template', () => {
      const request = manager.generateRequestFromTemplate('video-preroll');
      
      expect(request.imp[0].video).toBeDefined();
      expect(request.imp[0].video?.mimes).toContain('video/mp4');
      expect(request.imp[0].video?.startdelay).toBe(0);
    });

    it('should generate native request from template', () => {
      const request = manager.generateRequestFromTemplate('native-feed');
      
      expect(request.imp[0].native).toBeDefined();
      expect(request.imp[0].native?.request).toBeDefined();
      
      const nativeRequest = JSON.parse(request.imp[0].native!.request);
      expect(nativeRequest.assets).toHaveLength(3);
    });

    it('should generate audio request from template', () => {
      const request = manager.generateRequestFromTemplate('audio-podcast');
      
      expect(request.imp[0].audio).toBeDefined();
      expect(request.imp[0].audio?.mimes).toContain('audio/mp3');
      expect(request.imp[0].audio?.feed).toBe(1);
    });
  });

  describe('Template Validation', () => {
    it('should validate valid template', () => {
      const template = manager.getTemplate('basic-display-banner')!;
      const result = manager.validateTemplate(template);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidTemplate = {
        // Missing id, name, requestType
        description: 'Invalid template',
        config: {},
        template: {},
        requiredFields: [],
        optionalFields: [],
        tags: [],
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;

      const result = manager.validateTemplate(invalidTemplate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template ID is required');
      expect(result.errors).toContain('Template name is required');
      expect(result.errors).toContain('Request type is required');
    });

    it('should detect invalid request type', () => {
      const invalidTemplate = {
        id: 'test',
        name: 'Test',
        requestType: 'invalid',
        description: 'Test template',
        config: {},
        template: {},
        requiredFields: [],
        optionalFields: [],
        tags: [],
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;

      const result = manager.validateTemplate(invalidTemplate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Request type must be one of: display, video, native, audio');
    });

    it('should detect invalid template structure', () => {
      const invalidTemplate: SampleTemplate = {
        id: 'test',
        name: 'Test',
        requestType: 'display',
        description: 'Test template',
        config: {
          requestType: 'display',
          includeOptionalFields: false,
          complexity: 'minimal'
        },
        template: {
          // Missing required fields
        },
        requiredFields: [],
        optionalFields: [],
        tags: [],
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = manager.validateTemplate(invalidTemplate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('must have an ID'))).toBe(true);
      expect(result.errors.some(e => e.includes('must have at least one impression'))).toBe(true);
    });

    it('should warn about version format', () => {
      const template: SampleTemplate = {
        id: 'test',
        name: 'Test',
        requestType: 'display',
        description: 'Test template',
        config: {
          requestType: 'display',
          includeOptionalFields: false,
          complexity: 'minimal'
        },
        template: {
          id: 'test-req',
          imp: [{
            id: '1',
            banner: { w: 300, h: 250, pos: 1, mimes: ['image/jpeg'] },
            bidfloor: 0.5,
            bidfloorcur: 'USD'
          }],
          at: 1
        },
        requiredFields: [],
        optionalFields: [],
        tags: [],
        version: 'invalid-version',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = manager.validateTemplate(template);
      
      expect(result.warnings.some(w => w.includes('semantic versioning'))).toBe(true);
    });
  });

  describe('Template Cloning', () => {
    it('should clone template successfully', () => {
      const cloned = manager.cloneTemplate('basic-display-banner', 'cloned-banner', 'Cloned Banner');
      
      expect(cloned.id).toBe('cloned-banner');
      expect(cloned.name).toBe('Cloned Banner');
      expect(cloned.requestType).toBe('display');
      expect(cloned.createdAt).toBeInstanceOf(Date);
      
      // Verify it was added to the manager
      const retrieved = manager.getTemplate('cloned-banner');
      expect(retrieved).toBeDefined();
    });

    it('should throw error when cloning non-existent template', () => {
      expect(() => {
        manager.cloneTemplate('non-existent', 'new-id');
      }).toThrow('Source template not found: non-existent');
    });

    it('should throw error when target ID already exists', () => {
      expect(() => {
        manager.cloneTemplate('basic-display-banner', 'basic-display-banner');
      }).toThrow("Template with ID 'basic-display-banner' already exists");
    });
  });

  describe('Import/Export', () => {
    it('should export templates to JSON', () => {
      const json = manager.exportTemplates(['basic-display-banner']);
      const parsed = JSON.parse(json);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('basic-display-banner');
    });

    it('should export all templates when no IDs specified', () => {
      const json = manager.exportTemplates();
      const parsed = JSON.parse(json);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(1);
    });

    it('should import templates from JSON', () => {
      const templateData = [{
        id: 'imported-test',
        name: 'Imported Test Template',
        description: 'An imported test template',
        requestType: 'display',
        config: {
          requestType: 'display',
          includeOptionalFields: true,
          complexity: 'standard'
        },
        template: {
          id: 'imported-req-001',
          imp: [{
            id: '1',
            banner: {
              w: 300,
              h: 250,
              pos: 1,
              mimes: ['image/jpeg']
            },
            bidfloor: 0.5,
            bidfloorcur: 'USD'
          }],
          at: 1
        },
        requiredFields: ['id', 'imp', 'at'],
        optionalFields: ['tmax', 'cur'],
        tags: ['imported', 'test'],
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];

      const result = manager.importTemplates(JSON.stringify(templateData));
      
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      
      const imported = manager.getTemplate('imported-test');
      expect(imported).toBeDefined();
      expect(imported?.name).toBe('Imported Test Template');
    });

    it('should skip existing templates when not overwriting', () => {
      const existingTemplate = manager.getTemplate('basic-display-banner')!;
      const templateData = [existingTemplate];

      const result = manager.importTemplates(JSON.stringify(templateData), false);
      
      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid JSON during import', () => {
      expect(() => {
        manager.importTemplates('invalid json');
      }).toThrow('Invalid JSON data');
    });

    it('should handle non-array JSON during import', () => {
      expect(() => {
        manager.importTemplates('{"not": "array"}');
      }).toThrow('JSON data must contain an array of templates');
    });
  });
});