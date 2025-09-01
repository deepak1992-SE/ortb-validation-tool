/**
 * Schema Manager Tests
 * Tests for schema loading, caching, and validation functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SchemaManager } from '../schema-manager';
import { FieldDefinition } from '../../models';

describe('SchemaManager', () => {
  let schemaManager: SchemaManager;

  beforeEach(() => {
    schemaManager = new SchemaManager();
    schemaManager.clearCache();
  });

  describe('Schema Loading', () => {
    it('should load OpenRTB 2.6 schema successfully', async () => {
      const schema = await schemaManager.loadSchema('2.6');

      expect(schema).toBeDefined();
      expect(schema.version).toBe('2.6');
      expect(schema.schema).toBeDefined();
      expect(schema.fieldDefinitions).toBeInstanceOf(Map);
      expect(schema.metadata).toBeDefined();
      expect(schema.metadata.loadedAt).toBeInstanceOf(Date);
      expect(schema.metadata.source).toBe('embedded-ortb-2.6');
    });

    it('should throw error for unsupported schema version', async () => {
      await expect(schemaManager.loadSchema('1.0')).rejects.toThrow(
        'Unsupported OpenRTB version: 1.0'
      );
    });

    it('should include required fields in schema', async () => {
      const schema = await schemaManager.loadSchema('2.6');

      expect(schema.schema.required).toContain('id');
      expect(schema.schema.required).toContain('imp');
      expect(schema.schema.properties.id).toBeDefined();
      expect(schema.schema.properties.imp).toBeDefined();
    });

    it('should include impression properties in schema', async () => {
      const schema = await schemaManager.loadSchema('2.6');

      const impProperties = schema.schema.properties.imp.items.properties;
      expect(impProperties.id).toBeDefined();
      expect(impProperties.banner).toBeDefined();
      expect(impProperties.video).toBeDefined();
      expect(impProperties.bidfloor).toBeDefined();
    });
  });

  describe('Schema Caching', () => {
    it('should cache loaded schemas', async () => {
      const schema1 = await schemaManager.loadSchema('2.6');
      const schema2 = await schemaManager.loadSchema('2.6');

      // Should return the same cached instance
      expect(schema1).toBe(schema2);
      expect(schema1.metadata.loadedAt).toBe(schema2.metadata.loadedAt);
    });

    it('should track cache statistics', async () => {
      const initialStats = schemaManager.getCacheStats();
      expect(initialStats.schemaCount).toBe(0);

      await schemaManager.loadSchema('2.6');

      const afterLoadStats = schemaManager.getCacheStats();
      expect(afterLoadStats.schemaCount).toBe(1);
      expect(afterLoadStats.fieldDefinitionCount).toBeGreaterThan(0);
    });

    it('should clear cache when requested', async () => {
      await schemaManager.loadSchema('2.6');
      
      const beforeClear = schemaManager.getCacheStats();
      expect(beforeClear.schemaCount).toBe(1);

      schemaManager.clearCache();

      const afterClear = schemaManager.getCacheStats();
      expect(afterClear.schemaCount).toBe(0);
      expect(afterClear.fieldDefinitionCount).toBe(0);
    });

    it('should reload schema after cache clear', async () => {
      const schema1 = await schemaManager.loadSchema('2.6');
      schemaManager.clearCache();
      const schema2 = await schemaManager.loadSchema('2.6');

      // Should be different instances after cache clear
      expect(schema1).not.toBe(schema2);
      expect(schema1.metadata.loadedAt).not.toBe(schema2.metadata.loadedAt);
    });
  });

  describe('Field Definitions', () => {
    it('should extract field definitions from schema', async () => {
      await schemaManager.loadSchema('2.6');
      
      const idField = schemaManager.getFieldDefinitions('id', '2.6');
      expect(idField).toBeDefined();
      expect(idField?.name).toBe('id');
      expect(idField?.path).toBe('id');
      expect(idField?.type).toBe('string');
      expect(idField?.required).toBe(true);
      expect(idField?.requirementLevel).toBe('required');
      expect(idField?.description).toContain('Unique ID');
    });

    it('should extract nested field definitions', async () => {
      await schemaManager.loadSchema('2.6');
      
      const bannerWidth = schemaManager.getFieldDefinitions('imp[].banner.w', '2.6');
      expect(bannerWidth).toBeDefined();
      expect(bannerWidth?.name).toBe('w');
      expect(bannerWidth?.path).toBe('imp[].banner.w');
      expect(bannerWidth?.type).toBe('integer');
      expect(bannerWidth?.minimum).toBe(1);
      expect(bannerWidth?.parentPath).toBe('imp[].banner');
    });

    it('should handle different path formats', async () => {
      await schemaManager.loadSchema('2.6');
      
      // Test different path formats for the same field
      const field1 = schemaManager.getFieldDefinitions('imp[].banner.w', '2.6');
      const field2 = schemaManager.getFieldDefinitions('imp.0.banner.w', '2.6');
      const field3 = schemaManager.getFieldDefinitions('imp.banner.w', '2.6');
      
      expect(field1).toBeDefined();
      expect(field2).toBeDefined();
      expect(field3).toBeDefined();
      
      // Should all refer to the same field definition
      expect(field1?.name).toBe('w');
      expect(field2?.name).toBe('w');
      expect(field3?.name).toBe('w');
    });

    it('should return undefined for non-existent fields', async () => {
      await schemaManager.loadSchema('2.6');
      
      const nonExistentField = schemaManager.getFieldDefinitions('nonexistent.field', '2.6');
      expect(nonExistentField).toBeUndefined();
    });

    it('should return all field definitions', async () => {
      await schemaManager.loadSchema('2.6');
      
      const allFields = schemaManager.getAllFieldDefinitions('2.6');
      expect(allFields).toBeInstanceOf(Map);
      expect(allFields?.size).toBeGreaterThan(0);
      expect(allFields?.has('id')).toBe(true);
      expect(allFields?.has('imp')).toBe(true);
    });

    it('should include enhanced field metadata in definitions', async () => {
      await schemaManager.loadSchema('2.6');
      
      const bidfloorField = schemaManager.getFieldDefinitions('imp[].bidfloor', '2.6');
      expect(bidfloorField).toBeDefined();
      expect(bidfloorField?.type).toBe('number');
      expect(bidfloorField?.minimum).toBe(0);
      expect(bidfloorField?.description).toContain('Minimum bid');
      expect(bidfloorField?.requirementLevel).toBe('recommended');
      expect(bidfloorField?.documentation).toBeDefined();
      expect(bidfloorField?.examples).toBeDefined();
      expect(bidfloorField?.examples?.length).toBeGreaterThan(0);
    });

    it('should provide field examples with descriptions', async () => {
      await schemaManager.loadSchema('2.6');
      
      const idField = schemaManager.getFieldDefinitions('id', '2.6');
      expect(idField?.examples).toBeDefined();
      expect(idField?.examples?.length).toBeGreaterThan(0);
      expect(idField?.examples?.[0]).toHaveProperty('value');
      expect(idField?.examples?.[0]).toHaveProperty('description');
      expect(idField?.examples?.[0]).toHaveProperty('recommended');
    });

    it('should include field documentation', async () => {
      await schemaManager.loadSchema('2.6');
      
      const idField = schemaManager.getFieldDefinitions('id', '2.6');
      expect(idField?.documentation).toBeDefined();
      expect(idField?.documentation?.longDescription).toBeDefined();
      expect(idField?.documentation?.usageNotes).toBeDefined();
      expect(idField?.documentation?.commonErrors).toBeDefined();
    });

    it('should categorize fields by requirement level', async () => {
      await schemaManager.loadSchema('2.6');
      
      const requiredFields = schemaManager.getFieldDefinitionsByRequirement('required', '2.6');
      const optionalFields = schemaManager.getFieldDefinitionsByRequirement('optional', '2.6');
      const recommendedFields = schemaManager.getFieldDefinitionsByRequirement('recommended', '2.6');
      
      expect(requiredFields.length).toBeGreaterThan(0);
      expect(optionalFields.length).toBeGreaterThan(0);
      expect(recommendedFields.length).toBeGreaterThan(0);
      
      // Check that 'id' is required
      expect(requiredFields.some(f => f.name === 'id')).toBe(true);
      
      // Check that 'bidfloor' is recommended
      expect(recommendedFields.some(f => f.name === 'bidfloor')).toBe(true);
    });

    it('should support pattern-based field search', async () => {
      await schemaManager.loadSchema('2.6');
      
      const bannerFields = schemaManager.getFieldDefinitionsByPattern('banner', '2.6');
      expect(bannerFields.length).toBeGreaterThan(0);
      expect(bannerFields.some(f => f.path.includes('banner'))).toBe(true);
      
      const widthFields = schemaManager.getFieldDefinitionsByPattern('^.*\\.w$', '2.6');
      expect(widthFields.length).toBeGreaterThan(0);
      expect(widthFields.every(f => f.name === 'w')).toBe(true);
    });

    it('should retrieve child field definitions', async () => {
      await schemaManager.loadSchema('2.6');
      
      const bannerChildren = schemaManager.getChildFieldDefinitions('imp[].banner', '2.6');
      expect(bannerChildren.length).toBeGreaterThan(0);
      expect(bannerChildren.some(f => f.name === 'w')).toBe(true);
      expect(bannerChildren.some(f => f.name === 'h')).toBe(true);
      
      // All children should have the correct parent path
      bannerChildren.forEach(child => {
        expect(child.parentPath).toBe('imp[].banner');
      });
    });

    it('should handle array notation correctly', async () => {
      await schemaManager.loadSchema('2.6');
      
      // Test that array fields are properly handled
      const impField = schemaManager.getFieldDefinitions('imp', '2.6');
      expect(impField).toBeDefined();
      expect(impField?.type).toBe('array');
      
      const impIdField = schemaManager.getFieldDefinitions('imp[].id', '2.6');
      expect(impIdField).toBeDefined();
      expect(impIdField?.name).toBe('id');
      expect(impIdField?.parentPath).toBe('imp[]');
    });

    it('should provide spec section references', async () => {
      await schemaManager.loadSchema('2.6');
      
      const idField = schemaManager.getFieldDefinitions('id', '2.6');
      expect(idField?.documentation?.specSection).toBeDefined();
      expect(idField?.documentation?.specSection).toContain('3.2');
      
      const bannerField = schemaManager.getFieldDefinitions('imp[].banner', '2.6');
      expect(bannerField?.documentation?.specSection).toBeDefined();
    });

    it('should provide usage context', async () => {
      await schemaManager.loadSchema('2.6');
      
      const bannerField = schemaManager.getFieldDefinitions('imp[].banner.w', '2.6');
      expect(bannerField?.documentation?.usageContext).toBe('Display advertising');
      
      const videoField = schemaManager.getFieldDefinitions('imp[].video.mimes', '2.6');
      expect(videoField?.documentation?.usageContext).toBe('Video advertising');
      
      const siteField = schemaManager.getFieldDefinitions('site.domain', '2.6');
      expect(siteField?.documentation?.usageContext).toBe('Website advertising');
    });

    it('should handle field relationships', async () => {
      await schemaManager.loadSchema('2.6');
      
      const widthField = schemaManager.getFieldDefinitions('imp[].banner.w', '2.6');
      expect(widthField?.documentation?.relatedFields).toBeDefined();
      expect(widthField?.documentation?.relatedFields).toContain('h');
      
      const siteField = schemaManager.getFieldDefinitions('site', '2.6');
      expect(siteField?.documentation?.relatedFields).toContain('app');
    });
  });

  describe('Schema Validation', () => {
    let schema: any;

    beforeEach(async () => {
      schema = await schemaManager.loadSchema('2.6');
    });

    it('should validate valid ORTB request', () => {
      const validRequest = {
        id: 'test-request-123',
        imp: [
          {
            id: 'imp-1',
            banner: {
              w: 300,
              h: 250
            }
          }
        ],
        site: {
          id: 'site-123',
          domain: 'example.com'
        }
      };

      const result = schemaManager.validateAgainstSchema(validRequest, schema);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedPaths).toContain('id');
      expect(result.validatedPaths).toContain('imp');
    });

    it('should detect missing required fields', () => {
      const invalidRequest = {
        // Missing required 'id' field
        imp: [
          {
            id: 'imp-1'
          }
        ]
      };

      const result = schemaManager.validateAgainstSchema(invalidRequest, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].path).toBe('id');
      expect(result.errors[0].rule).toBe('required-field');
    });

    it('should detect empty impressions array', () => {
      const invalidRequest = {
        id: 'test-request-123',
        imp: [] // Empty impressions array
      };

      const result = schemaManager.validateAgainstSchema(invalidRequest, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path === 'imp')).toBe(true);
      expect(result.errors.some(e => e.rule === 'ortb-required-impressions')).toBe(true);
    });

    it('should detect missing impression IDs', () => {
      const invalidRequest = {
        id: 'test-request-123',
        imp: [
          {
            // Missing required impression ID
            banner: { w: 300, h: 250 }
          }
        ]
      };

      const result = schemaManager.validateAgainstSchema(invalidRequest, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path === 'imp.0.id')).toBe(true);
      expect(result.errors.some(e => e.rule === 'ortb-required-impression-id')).toBe(true);
    });

    it('should detect site/app exclusivity violation', () => {
      const invalidRequest = {
        id: 'test-request-123',
        imp: [{ id: 'imp-1' }],
        site: { id: 'site-123' },
        app: { id: 'app-123' } // Both site and app present
      };

      const result = schemaManager.validateAgainstSchema(invalidRequest, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path === 'site/app')).toBe(true);
      expect(result.errors.some(e => e.rule === 'ortb-site-app-exclusivity')).toBe(true);
    });

    it('should handle validation errors gracefully', () => {
      const invalidRequest = null;

      const result = schemaManager.validateAgainstSchema(invalidRequest, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].path).toBe('root');
      expect(result.errors[0].rule).toBe('type-validation');
    });

    it('should validate type correctness', () => {
      const invalidRequest = {
        id: 123, // Should be string
        imp: [{ id: 'imp-1' }]
      };

      const result = schemaManager.validateAgainstSchema(invalidRequest, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.rule === 'ortb-required-id')).toBe(true);
    });

    it('should return unique validated paths', () => {
      const validRequest = {
        id: 'test-request-123',
        imp: [
          { id: 'imp-1' },
          { id: 'imp-2' }
        ]
      };

      const result = schemaManager.validateAgainstSchema(validRequest, schema);
      
      // Should not have duplicate paths
      const uniquePaths = [...new Set(result.validatedPaths)];
      expect(result.validatedPaths).toHaveLength(uniquePaths.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle schema loading errors', async () => {
      // Mock a schema loading failure
      const originalMethod = SchemaManager.prototype['loadSchemaData'];
      SchemaManager.prototype['loadSchemaData'] = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(schemaManager.loadSchema('2.6')).rejects.toThrow(
        'Failed to load OpenRTB 2.6 schema: Network error'
      );

      // Restore original method
      SchemaManager.prototype['loadSchemaData'] = originalMethod;
    });

    it('should handle validation errors gracefully', async () => {
      const schema = await schemaManager.loadSchema('2.6');
      
      // Test with circular reference that might cause JSON.stringify to fail
      const circularRequest: any = { id: 'test' };
      circularRequest.self = circularRequest;

      const result = schemaManager.validateAgainstSchema(circularRequest, schema);
      
      // Should not throw, but return validation result with errors
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
    });
  });
});