/**
 * Schema Service Tests
 * Tests for the high-level schema service functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaServiceImpl } from '../schema-service';
import { FieldDefinition } from '../../models';

describe('SchemaService', () => {
  let schemaService: SchemaServiceImpl;

  beforeEach(() => {
    schemaService = new SchemaServiceImpl();
    schemaService.clearCache();
  });

  describe('Schema Loading', () => {
    it('should load schema through service', async () => {
      const schema = await schemaService.loadSchema('2.6');

      expect(schema).toBeDefined();
      expect(schema.version).toBe('2.6');
      expect(schema.schema).toBeDefined();
      expect(schema.fieldDefinitions).toBeInstanceOf(Map);
    });

    it('should handle schema loading errors', async () => {
      await expect(schemaService.loadSchema('invalid-version')).rejects.toThrow();
    });
  });

  describe('Field Definition Retrieval', () => {
    it('should get field definition by path', async () => {
      const fieldDef = await schemaService.getFieldDefinition('id');

      expect(fieldDef).toBeDefined();
      expect(fieldDef?.name).toBe('id');
      expect(fieldDef?.type).toBe('string');
      expect(fieldDef?.required).toBe(true);
    });

    it('should get field definition with specific version', async () => {
      const fieldDef = await schemaService.getFieldDefinition('id', '2.6');

      expect(fieldDef).toBeDefined();
      expect(fieldDef?.name).toBe('id');
    });

    it('should return undefined for non-existent field', async () => {
      const fieldDef = await schemaService.getFieldDefinition('nonexistent.field');

      expect(fieldDef).toBeUndefined();
    });

    it('should get nested field definitions', async () => {
      const fieldDef = await schemaService.getFieldDefinition('imp[].banner.w');

      expect(fieldDef).toBeDefined();
      expect(fieldDef?.name).toBe('w');
      expect(fieldDef?.type).toBe('integer');
    });
  });

  describe('All Field Definitions', () => {
    it('should get all field definitions', async () => {
      const allFields = await schemaService.getAllFieldDefinitions();

      expect(allFields).toBeInstanceOf(Map);
      expect(allFields?.size).toBeGreaterThan(0);
      expect(allFields?.has('id')).toBe(true);
      expect(allFields?.has('imp')).toBe(true);
    });

    it('should get all field definitions for specific version', async () => {
      const allFields = await schemaService.getAllFieldDefinitions('2.6');

      expect(allFields).toBeInstanceOf(Map);
      expect(allFields?.size).toBeGreaterThan(0);
    });
  });

  describe('Schema Validation', () => {
    it('should validate request against schema', async () => {
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
        ]
      };

      const result = await schemaService.validateAgainstSchema(validRequest);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate request against specific version', async () => {
      const validRequest = {
        id: 'test-request-123',
        imp: [{ id: 'imp-1' }]
      };

      const result = await schemaService.validateAgainstSchema(validRequest, '2.6');

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
    });

    it('should detect validation errors', async () => {
      const invalidRequest = {
        // Missing required 'id' field
        imp: [{ id: 'imp-1' }]
      };

      const result = await schemaService.validateAgainstSchema(invalidRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', async () => {
      const initialStats = schemaService.getCacheStats();
      expect(initialStats.schemaCount).toBe(0);

      await schemaService.loadSchema('2.6');

      const afterLoadStats = schemaService.getCacheStats();
      expect(afterLoadStats.schemaCount).toBe(1);
      expect(afterLoadStats.fieldDefinitionCount).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      await schemaService.loadSchema('2.6');
      
      const beforeClear = schemaService.getCacheStats();
      expect(beforeClear.schemaCount).toBe(1);

      schemaService.clearCache();

      const afterClear = schemaService.getCacheStats();
      expect(afterClear.schemaCount).toBe(0);
    });
  });

  describe('Integration', () => {
    it('should work with multiple concurrent requests', async () => {
      const promises = [
        schemaService.getFieldDefinition('id'),
        schemaService.getFieldDefinition('imp'),
        schemaService.getAllFieldDefinitions(),
        schemaService.loadSchema('2.6')
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toBeDefined(); // id field
      expect(results[1]).toBeDefined(); // imp field
      expect(results[2]).toBeInstanceOf(Map); // all fields
      expect(results[3]).toBeDefined(); // schema
    });

    it('should maintain consistency across operations', async () => {
      // Load schema and get field definition
      const schema = await schemaService.loadSchema('2.6');
      const fieldDef = await schemaService.getFieldDefinition('id');
      const allFields = await schemaService.getAllFieldDefinitions();

      // Verify consistency
      expect(schema.fieldDefinitions.get('id')).toEqual(fieldDef);
      expect(allFields?.get('id')).toEqual(fieldDef);
    });

    it('should handle field definition caching correctly', async () => {
      // First call should load schema
      const fieldDef1 = await schemaService.getFieldDefinition('id');
      
      // Second call should use cached schema
      const fieldDef2 = await schemaService.getFieldDefinition('id');

      expect(fieldDef1).toEqual(fieldDef2);
    });
  });

  describe('Field Definition Properties', () => {
    it('should include all required field properties', async () => {
      const fieldDef = await schemaService.getFieldDefinition('id');

      expect(fieldDef).toBeDefined();
      expect(fieldDef).toHaveProperty('name');
      expect(fieldDef).toHaveProperty('description');
      expect(fieldDef).toHaveProperty('type');
      expect(fieldDef).toHaveProperty('required');
    });

    it('should include optional field properties when available', async () => {
      const fieldDef = await schemaService.getFieldDefinition('imp[].bidfloor');

      expect(fieldDef).toBeDefined();
      expect(fieldDef?.minimum).toBeDefined();
      expect(fieldDef?.type).toBe('number');
    });

    it('should handle enumerated field values', async () => {
      const fieldDef = await schemaService.getFieldDefinition('at');

      expect(fieldDef).toBeDefined();
      expect(fieldDef?.enumValues).toBeDefined();
      expect(Array.isArray(fieldDef?.enumValues)).toBe(true);
    });

    it('should include field examples when available', async () => {
      // Test with a field that might have examples
      const fieldDef = await schemaService.getFieldDefinition('cur');

      expect(fieldDef).toBeDefined();
      // Examples might not be defined for all fields, so just check structure
      if (fieldDef?.examples) {
        expect(Array.isArray(fieldDef.examples)).toBe(true);
      }
    });
  });
});