/**
 * Schema Service Implementation
 * Provides high-level schema operations using the SchemaManager
 */

import { FieldDefinition } from '../models';
import { schemaManager, ORTBSchema, SchemaValidationResult } from '../validation/schema-manager';

export interface SchemaService {
  loadSchema(version: string): Promise<ORTBSchema>;
  getFieldDefinition(fieldPath: string, version?: string): Promise<FieldDefinition | undefined>;
  validateAgainstSchema(request: any, version?: string): Promise<SchemaValidationResult>;
  getAllFieldDefinitions(version?: string): Promise<Map<string, FieldDefinition> | undefined>;
  clearCache(): void;
  getCacheStats(): { schemaCount: number; fieldDefinitionCount: number };
}

/**
 * Schema Service implementation
 */
export class SchemaServiceImpl implements SchemaService {
  /**
   * Load OpenRTB schema for a specific version
   */
  async loadSchema(version: string): Promise<ORTBSchema> {
    return await schemaManager.loadSchema(version);
  }

  /**
   * Get field definition for a specific field path
   */
  async getFieldDefinition(fieldPath: string, version: string = '2.6'): Promise<FieldDefinition | undefined> {
    // Ensure schema is loaded first
    await this.loadSchema(version);
    return schemaManager.getFieldDefinitions(fieldPath, version);
  }

  /**
   * Validate a request against the schema
   */
  async validateAgainstSchema(request: any, version: string = '2.6'): Promise<SchemaValidationResult> {
    const schema = await this.loadSchema(version);
    return schemaManager.validateAgainstSchema(request, schema);
  }

  /**
   * Get all field definitions for a schema version
   */
  async getAllFieldDefinitions(version: string = '2.6'): Promise<Map<string, FieldDefinition> | undefined> {
    // Ensure schema is loaded first
    await this.loadSchema(version);
    return schemaManager.getAllFieldDefinitions(version);
  }

  /**
   * Clear schema cache
   */
  clearCache(): void {
    schemaManager.clearCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { schemaCount: number; fieldDefinitionCount: number } {
    return schemaManager.getCacheStats();
  }
}

// Export singleton instance
export const schemaService = new SchemaServiceImpl();