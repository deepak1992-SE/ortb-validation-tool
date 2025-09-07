/**
 * Sample Template Manager
 * Manages predefined templates for common ORTB scenarios with caching
 */

import { SampleTemplate, SampleConfig, AdType } from '../models/sample';
import { ORTBRequest } from '../models/ortb';
import { TemplateCache } from './cache-service';

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SampleTemplateManager {
  private templates: Map<string, SampleTemplate> = new Map();
  private generatedRequestCache: TemplateCache = new TemplateCache();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): SampleTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): SampleTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by request type
   */
  getTemplatesByType(requestType: AdType): SampleTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.requestType === requestType);
  }

  /**
   * Get templates by tag
   */
  getTemplatesByTag(tag: string): SampleTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.tags.includes(tag));
  }

  /**
   * Add a custom template
   */
  addTemplate(template: SampleTemplate): void {
    const validation = this.validateTemplate(template);
    if (!validation.isValid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }
    
    this.templates.set(template.id, {
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Update an existing template
   */
  updateTemplate(id: string, updates: Partial<SampleTemplate>): void {
    const existing = this.templates.get(id);
    if (!existing) {
      throw new Error(`Template not found: ${id}`);
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Preserve original ID
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date()
    };

    const validation = this.validateTemplate(updated);
    if (!validation.isValid) {
      throw new Error(`Invalid template update: ${validation.errors.join(', ')}`);
    }

    this.templates.set(id, updated);
  }

  /**
   * Remove a template
   */
  removeTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * Create a sample configuration from a template
   */
  createConfigFromTemplate(templateId: string, overrides?: Partial<SampleConfig>): SampleConfig {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const config: SampleConfig = {
      ...template.config,
      ...overrides
    };

    return config;
  }

  /**
   * Generate a sample request from a template with caching
   */
  generateRequestFromTemplate(templateId: string, customFields?: Record<string, any>): ORTBRequest {
    // Generate cache key
    const cacheKey = this.generateCacheKey(templateId, customFields);
    
    // Check cache first
    const cachedRequest = this.generatedRequestCache.get(cacheKey);
    if (cachedRequest) {
      return JSON.parse(JSON.stringify(cachedRequest)); // Deep clone to prevent mutations
    }

    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Start with the template's base request
    let request: ORTBRequest = JSON.parse(JSON.stringify(template.template));

    // Apply custom field overrides if provided
    if (customFields) {
      this.applyCustomFields(request, customFields);
    }

    // Ensure required fields are present
    this.ensureRequiredFields(request, template);

    // Cache the generated request
    this.generatedRequestCache.set(cacheKey, request);

    return request;
  }

  /**
   * Validate a template
   */
  validateTemplate(template: SampleTemplate): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!template.id) {
      errors.push('Template ID is required');
    }

    if (!template.name) {
      errors.push('Template name is required');
    }

    if (!template.requestType) {
      errors.push('Request type is required');
    }

    if (!['display', 'video', 'native', 'audio'].includes(template.requestType)) {
      errors.push('Request type must be one of: display, video, native, audio');
    }

    if (!template.template) {
      errors.push('Template request structure is required');
    }

    // Validate template structure
    if (template.template) {
      const structureValidation = this.validateTemplateStructure(template.template, template.requestType);
      errors.push(...structureValidation.errors);
      warnings.push(...structureValidation.warnings);
    }

    // Validate required fields list
    if (template.requiredFields && template.requiredFields.length > 0) {
      const missingRequired = this.findMissingRequiredFields(template.template, template.requiredFields);
      if (missingRequired.length > 0) {
        warnings.push(`Template missing some required fields: ${missingRequired.join(', ')}`);
      }
    }

    // Validate version format
    if (template.version && !/^\d+\.\d+(\.\d+)?$/.test(template.version)) {
      warnings.push('Version should follow semantic versioning format (e.g., 1.0.0)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Clone a template with a new ID
   */
  cloneTemplate(sourceId: string, newId: string, newName?: string): SampleTemplate {
    const source = this.templates.get(sourceId);
    if (!source) {
      throw new Error(`Source template not found: ${sourceId}`);
    }

    if (this.templates.has(newId)) {
      throw new Error(`Template with ID '${newId}' already exists`);
    }

    const cloned: SampleTemplate = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      name: newName || `${source.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(newId, cloned);
    return cloned;
  }

  /**
   * Export templates to JSON
   */
  exportTemplates(templateIds?: string[]): string {
    const templatesToExport = templateIds 
      ? templateIds.map(id => this.templates.get(id)).filter(Boolean) as SampleTemplate[]
      : Array.from(this.templates.values());

    return JSON.stringify(templatesToExport, null, 2);
  }

  /**
   * Import templates from JSON
   */
  importTemplates(jsonData: string, overwriteExisting = false): { imported: number; skipped: number; errors: string[] } {
    let templates: SampleTemplate[];
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    try {
      templates = JSON.parse(jsonData);
    } catch (error) {
      throw new Error(`Invalid JSON data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!Array.isArray(templates)) {
      throw new Error('JSON data must contain an array of templates');
    }

    for (const template of templates) {
      try {
        if (this.templates.has(template.id) && !overwriteExisting) {
          skipped++;
          continue;
        }

        this.addTemplate(template);
        imported++;
      } catch (error) {
        errors.push(`Failed to import template '${template.id}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.generatedRequestCache.getStats();
  }

  /**
   * Clear generated request cache
   */
  clearCache(): void {
    this.generatedRequestCache.clear();
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache(): number {
    return this.generatedRequestCache.cleanup();
  }

  private initializeDefaultTemplates(): void {
    // Basic Display Banner Template
    this.templates.set('basic-display-banner', {
      id: 'basic-display-banner',
      name: 'Basic Display Banner',
      description: 'Standard 300x250 display banner ad template',
      requestType: 'display',
      config: {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'standard'
      },
      template: {
        id: 'template-request-001',
        imp: [{
          id: '1',
          banner: {
            w: 300,
            h: 250,
            pos: 1,
            mimes: ['image/jpeg', 'image/png', 'image/gif'],
            format: [
              { w: 300, h: 250 }
            ]
          },
          bidfloor: 0.5,
          bidfloorcur: 'USD'
        }],
        at: 1,
        tmax: 100,
        cur: ['USD']
      },
      requiredFields: ['id', 'imp', 'at'],
      optionalFields: ['tmax', 'cur', 'site', 'device', 'user'],
      tags: ['display', 'banner', 'standard', '300x250'],
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Leaderboard Banner Template
    this.templates.set('leaderboard-banner', {
      id: 'leaderboard-banner',
      name: 'Leaderboard Banner',
      description: '728x90 leaderboard banner ad template',
      requestType: 'display',
      config: {
        requestType: 'display',
        includeOptionalFields: true,
        complexity: 'standard'
      },
      template: {
        id: 'template-request-002',
        imp: [{
          id: '1',
          banner: {
            w: 728,
            h: 90,
            pos: 1,
            mimes: ['image/jpeg', 'image/png', 'image/gif'],
            format: [
              { w: 728, h: 90 }
            ]
          },
          bidfloor: 1.0,
          bidfloorcur: 'USD'
        }],
        at: 1,
        tmax: 100,
        cur: ['USD']
      },
      requiredFields: ['id', 'imp', 'at'],
      optionalFields: ['tmax', 'cur', 'site', 'device', 'user'],
      tags: ['display', 'banner', 'leaderboard', '728x90'],
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Video Pre-roll Template
    this.templates.set('video-preroll', {
      id: 'video-preroll',
      name: 'Video Pre-roll',
      description: 'Standard video pre-roll ad template',
      requestType: 'video',
      config: {
        requestType: 'video',
        includeOptionalFields: true,
        complexity: 'comprehensive'
      },
      template: {
        id: 'template-request-003',
        imp: [{
          id: '1',
          video: {
            mimes: ['video/mp4', 'video/webm'],
            minduration: 15,
            maxduration: 30,
            protocols: [2, 3, 5, 6],
            w: 640,
            h: 480,
            startdelay: 0,
            placement: 1,
            linearity: 1,
            skip: 1,
            skipmin: 5,
            skipafter: 5
          },
          bidfloor: 2.0,
          bidfloorcur: 'USD'
        }],
        at: 1,
        tmax: 100,
        cur: ['USD']
      },
      requiredFields: ['id', 'imp', 'at'],
      optionalFields: ['tmax', 'cur', 'site', 'app', 'device', 'user'],
      tags: ['video', 'preroll', 'skippable'],
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Native Feed Template
    this.templates.set('native-feed', {
      id: 'native-feed',
      name: 'Native Feed Ad',
      description: 'Native ad template for social media feeds',
      requestType: 'native',
      config: {
        requestType: 'native',
        includeOptionalFields: true,
        complexity: 'comprehensive'
      },
      template: {
        id: 'template-request-004',
        imp: [{
          id: '1',
          native: {
            request: JSON.stringify({
              ver: '1.2',
              layout: 1,
              assets: [
                {
                  id: 1,
                  required: 1,
                  title: { len: 90 }
                },
                {
                  id: 2,
                  required: 1,
                  img: { type: 3, w: 300, h: 250 }
                },
                {
                  id: 3,
                  required: 0,
                  data: { type: 2, len: 140 }
                }
              ]
            }),
            ver: '1.2',
            api: [3, 5]
          },
          bidfloor: 1.5,
          bidfloorcur: 'USD'
        }],
        at: 1,
        tmax: 100,
        cur: ['USD']
      },
      requiredFields: ['id', 'imp', 'at'],
      optionalFields: ['tmax', 'cur', 'site', 'app', 'device', 'user'],
      tags: ['native', 'feed', 'social'],
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Audio Podcast Template
    this.templates.set('audio-podcast', {
      id: 'audio-podcast',
      name: 'Audio Podcast Ad',
      description: 'Audio ad template for podcast insertion',
      requestType: 'audio',
      config: {
        requestType: 'audio',
        includeOptionalFields: true,
        complexity: 'standard'
      },
      template: {
        id: 'template-request-005',
        imp: [{
          id: '1',
          audio: {
            mimes: ['audio/mp3', 'audio/aac'],
            minduration: 15,
            maxduration: 30,
            protocols: [2, 3, 5, 6],
            startdelay: 0,
            feed: 1,
            stitched: 1
          },
          bidfloor: 1.0,
          bidfloorcur: 'USD'
        }],
        at: 1,
        tmax: 100,
        cur: ['USD']
      },
      requiredFields: ['id', 'imp', 'at'],
      optionalFields: ['tmax', 'cur', 'site', 'app', 'device', 'user'],
      tags: ['audio', 'podcast', 'streaming'],
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  private validateTemplateStructure(template: Partial<ORTBRequest>, requestType: AdType): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check basic ORTB structure
    if (!template.id) {
      errors.push('Template must have an ID');
    }

    if (!template.imp || !Array.isArray(template.imp) || template.imp.length === 0) {
      errors.push('Template must have at least one impression');
    }

    if (template.at === undefined) {
      errors.push('Template must specify auction type (at)');
    }

    // Check impression structure based on request type
    if (template.imp && template.imp.length > 0) {
      template.imp.forEach((imp, index) => {
        if (!imp.id) {
          errors.push(`Impression ${index} must have an ID`);
        }

        // Check for appropriate ad format based on request type
        switch (requestType) {
          case 'display':
            if (!imp.banner) {
              errors.push(`Display impression ${index} must have banner object`);
            }
            break;
          case 'video':
            if (!imp.video) {
              errors.push(`Video impression ${index} must have video object`);
            }
            break;
          case 'audio':
            if (!imp.audio) {
              errors.push(`Audio impression ${index} must have audio object`);
            }
            break;
          case 'native':
            if (!imp.native) {
              errors.push(`Native impression ${index} must have native object`);
            }
            break;
        }

        // Check for bid floor
        if (imp.bidfloor === undefined) {
          warnings.push(`Impression ${index} should have a bid floor`);
        }
      });
    }

    return { errors, warnings };
  }

  private findMissingRequiredFields(template: Partial<ORTBRequest>, requiredFields: string[]): string[] {
    const missing: string[] = [];

    for (const field of requiredFields) {
      if (!this.hasNestedField(template, field)) {
        missing.push(field);
      }
    }

    return missing;
  }

  private hasNestedField(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return false;
      }

      if (/^\d+$/.test(key)) {
        const index = parseInt(key);
        if (!Array.isArray(current) || current.length <= index) {
          return false;
        }
        current = current[index];
      } else {
        if (!(key in current)) {
          return false;
        }
        current = current[key];
      }
    }

    return current !== undefined;
  }

  private ensureRequiredFields(request: ORTBRequest, _template: SampleTemplate): void {
    // Ensure basic required fields
    if (!request.id) {
      request.id = `req-${Date.now()}`;
    }

    if (!request.imp || request.imp.length === 0) {
      throw new Error('Request must have at least one impression');
    }

    if (request.at === undefined) {
      request.at = 1; // Default to first price auction
    }

    // Ensure impression IDs
    request.imp.forEach((imp, index) => {
      if (!imp.id) {
        imp.id = `imp-${index + 1}`;
      }
    });
  }

  private applyCustomFields(request: ORTBRequest, customFields: Record<string, any>): void {
    for (const [fieldPath, value] of Object.entries(customFields)) {
      this.setNestedValue(request, fieldPath, value);
    }
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      
      if (/^\d+$/.test(key)) {
        const index = parseInt(key);
        if (!Array.isArray(current)) {
          return;
        }
        if (!current[index]) {
          current[index] = {};
        }
        current = current[index];
      } else {
        if (!current[key]) {
          const nextKey = keys[i + 1];
          if (nextKey && /^\d+$/.test(nextKey)) {
            current[key] = [];
          } else {
            current[key] = {};
          }
        }
        current = current[key];
      }
    }

    const finalKey = keys[keys.length - 1];
    
    if (/^\d+$/.test(finalKey)) {
      const index = parseInt(finalKey);
      if (Array.isArray(current)) {
        current[index] = value;
      }
    } else {
      current[finalKey] = value;
    }
  }

  /**
   * Generate cache key for template generation
   */
  private generateCacheKey(templateId: string, customFields?: Record<string, any>): string {
    const customFieldsStr = customFields ? JSON.stringify(customFields, Object.keys(customFields).sort()) : '';
    let hash = 0;
    const str = `${templateId}:${customFieldsStr}`;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `template:${templateId}:${Math.abs(hash).toString(36)}`;
  }
}