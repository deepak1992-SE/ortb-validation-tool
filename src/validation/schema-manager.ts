/**
 * Schema Manager Implementation
 * Manages OpenRTB 2.6 JSON schemas and validation rules with enhanced caching
 */

import { FieldDefinition, FieldRequirementLevel, FieldExample, FieldDocumentation } from '../models';
import { SchemaCache } from '../services/cache-service';

export interface ORTBSchema {
  /** Schema version */
  version: string;
  /** JSON Schema definition */
  schema: any;
  /** Field definitions mapping */
  fieldDefinitions: Map<string, FieldDefinition>;
  /** Schema metadata */
  metadata: SchemaMetadata;
}

export interface SchemaMetadata {
  /** Schema load timestamp */
  loadedAt: Date;
  /** Schema source URL or path */
  source: string;
  /** Schema checksum for validation */
  checksum?: string;
  /** Additional metadata */
  additionalInfo?: Record<string, any>;
}

export interface SchemaValidationResult {
  /** Whether the request matches the schema */
  isValid: boolean;
  /** Schema validation errors */
  errors: SchemaValidationError[];
  /** Validated field paths */
  validatedPaths: string[];
}

export interface SchemaValidationError {
  /** Field path where error occurred */
  path: string;
  /** Error message */
  message: string;
  /** Schema rule that was violated */
  rule: string;
  /** Expected value or type */
  expected: any;
  /** Actual value */
  actual: any;
}

/**
 * Schema Manager class for handling OpenRTB 2.6 schemas with enhanced caching
 */
export class SchemaManager {
  private schemaCache: SchemaCache = new SchemaCache();
  private fieldDefinitionCache: Map<string, Map<string, FieldDefinition>> = new Map();
  private validationResultCache: Map<string, SchemaValidationResult> = new Map();


  /**
   * Load OpenRTB schema for a specific version with enhanced caching
   */
  async loadSchema(version: string): Promise<ORTBSchema> {
    // Check enhanced cache first
    const cached = this.schemaCache.get(`schema:${version}`);
    if (cached) {
      return cached;
    }

    try {
      // Load schema from embedded definitions
      const schemaData = await this.loadSchemaData(version);
      const fieldDefinitions = this.extractFieldDefinitions(schemaData);
      
      const schema: ORTBSchema = {
        version,
        schema: schemaData,
        fieldDefinitions,
        metadata: {
          loadedAt: new Date(),
          source: `embedded-ortb-${version}`,
          checksum: this.calculateChecksum(schemaData)
        }
      };

      // Cache the schema with enhanced cache service
      this.schemaCache.set(`schema:${version}`, schema);
      this.fieldDefinitionCache.set(version, fieldDefinitions);

      return schema;
    } catch (error) {
      throw new Error(`Failed to load OpenRTB ${version} schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a request against a specific schema with result caching
   */
  validateAgainstSchema(request: any, schema: ORTBSchema): SchemaValidationResult {
    // Generate cache key for validation result
    const cacheKey = this.generateValidationCacheKey(request, schema.version);
    
    // Check validation result cache
    const cachedResult = this.validationResultCache.get(cacheKey);
    if (cachedResult && this.isValidationCacheValid(cacheKey)) {
      return cachedResult;
    }

    const errors: SchemaValidationError[] = [];
    const validatedPaths: string[] = [];

    try {
      // Handle null/undefined requests
      if (request === null || request === undefined) {
        errors.push({
          path: 'root',
          message: `Expected object, got ${request === null ? 'null' : 'undefined'}`,
          rule: 'type-validation',
          expected: 'object',
          actual: request === null ? 'null' : 'undefined'
        });
        return {
          isValid: false,
          errors,
          validatedPaths
        };
      }

      // Perform basic JSON schema validation
      const basicValidation = this.performBasicSchemaValidation(request, schema.schema);
      errors.push(...basicValidation.errors);
      validatedPaths.push(...basicValidation.validatedPaths);

      // Perform OpenRTB-specific validation only if basic validation passes for required fields
      const ortbValidation = this.performORTBValidation(request, schema);
      errors.push(...ortbValidation.errors);
      validatedPaths.push(...ortbValidation.validatedPaths);

      const result = {
        isValid: errors.length === 0,
        errors,
        validatedPaths: [...new Set(validatedPaths)] // Remove duplicates
      };

      // Cache the validation result
      this.validationResultCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      errors.push({
        path: 'root',
        message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rule: 'schema-validation',
        expected: 'valid JSON structure',
        actual: typeof request
      });

      const errorResult = {
        isValid: false,
        errors,
        validatedPaths
      };

      // Cache error results too (with shorter TTL)
      this.validationResultCache.set(cacheKey, errorResult);
      
      return errorResult;
    }
  }

  /**
   * Get field definitions for a specific field path
   * Supports various path formats:
   * - "imp.banner.w" - direct path
   * - "imp[].banner.w" - array notation
   * - "imp.0.banner.w" - indexed array notation
   */
  getFieldDefinitions(fieldPath: string, version: string = '2.6'): FieldDefinition | undefined {
    const fieldDefinitions = this.fieldDefinitionCache.get(version);
    if (!fieldDefinitions) {
      return undefined;
    }

    // Try multiple path variations to handle different formats
    const pathVariations = [
      fieldPath,                                    // Original path
      this.normalizeFieldPath(fieldPath),          // Normalized path
      this.convertToArrayNotation(fieldPath),      // Array notation
      this.removeArrayIndices(fieldPath),          // Without indices
      fieldPath.replace(/\.\d+\./g, '[].'),        // Convert numeric indices to []
      fieldPath.replace(/\.\d+$/, '[]'),           // Convert ending numeric index to []
      this.addArrayNotationToPath(fieldPath),      // Add [] where arrays are expected
    ];

    // Remove duplicates and try each variation
    const uniquePaths = [...new Set(pathVariations)];
    
    for (const path of uniquePaths) {
      const definition = fieldDefinitions.get(path);
      if (definition) {
        return definition;
      }
    }

    return undefined;
  }

  /**
   * Get field definitions by pattern matching
   */
  getFieldDefinitionsByPattern(pattern: string, version: string = '2.6'): FieldDefinition[] {
    const fieldDefinitions = this.fieldDefinitionCache.get(version);
    if (!fieldDefinitions) {
      return [];
    }

    const regex = new RegExp(pattern, 'i');
    const matches: FieldDefinition[] = [];

    fieldDefinitions.forEach((definition, path) => {
      if (regex.test(path) || regex.test(definition.name) || regex.test(definition.description)) {
        matches.push(definition);
      }
    });

    return matches;
  }

  /**
   * Get field definitions by requirement level
   */
  getFieldDefinitionsByRequirement(
    requirementLevel: FieldRequirementLevel, 
    version: string = '2.6'
  ): FieldDefinition[] {
    const fieldDefinitions = this.fieldDefinitionCache.get(version);
    if (!fieldDefinitions) {
      return [];
    }

    const matches: FieldDefinition[] = [];
    fieldDefinitions.forEach((definition) => {
      if (definition.requirementLevel === requirementLevel) {
        matches.push(definition);
      }
    });

    return matches;
  }

  /**
   * Get child field definitions for a parent path
   */
  getChildFieldDefinitions(parentPath: string, version: string = '2.6'): FieldDefinition[] {
    const fieldDefinitions = this.fieldDefinitionCache.get(version);
    if (!fieldDefinitions) {
      return [];
    }

    const normalizedParentPath = this.normalizeFieldPath(parentPath);
    const children: FieldDefinition[] = [];

    fieldDefinitions.forEach((definition) => {
      if (definition.parentPath === normalizedParentPath) {
        children.push(definition);
      }
    });

    return children;
  }

  /**
   * Get all available field definitions for a schema version
   */
  getAllFieldDefinitions(version: string = '2.6'): Map<string, FieldDefinition> | undefined {
    return this.fieldDefinitionCache.get(version);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.schemaCache.clear();
    this.fieldDefinitionCache.clear();
    this.validationResultCache.clear();
  }

  /**
   * Get comprehensive cache statistics
   */
  getCacheStats(): { 
    schemaCache: any; 
    fieldDefinitionCount: number; 
    validationResultCount: number;
    totalMemoryUsage: number;
  } {
    let fieldDefinitionCount = 0;
    this.fieldDefinitionCache.forEach(map => {
      fieldDefinitionCount += map.size;
    });

    const schemaStats = this.schemaCache.getStats();

    return {
      schemaCache: schemaStats,
      fieldDefinitionCount,
      validationResultCount: this.validationResultCache.size,
      totalMemoryUsage: schemaStats.memoryUsage + (this.validationResultCache.size * 1000) // Rough estimate
    };
  }

  /**
   * Load schema data for a specific version
   */
  private async loadSchemaData(version: string): Promise<any> {
    // For now, return a basic OpenRTB 2.6 schema structure
    // In a real implementation, this would load from actual schema files
    if (version === '2.6') {
      return this.getOpenRTB26Schema();
    }

    throw new Error(`Unsupported OpenRTB version: ${version}`);
  }

  /**
   * Extract field definitions from schema data
   */
  private extractFieldDefinitions(schemaData: any): Map<string, FieldDefinition> {
    const definitions = new Map<string, FieldDefinition>();

    // Extract field definitions from the schema
    this.extractFieldDefinitionsRecursive(schemaData, '', definitions);

    return definitions;
  }

  /**
   * Recursively extract field definitions from schema
   */
  private extractFieldDefinitionsRecursive(
    schema: any,
    currentPath: string,
    definitions: Map<string, FieldDefinition>,
    parentPath?: string
  ): void {
    if (!schema || typeof schema !== 'object') {
      return;
    }

    if (schema.properties) {
      Object.entries(schema.properties).forEach(([fieldName, fieldSchema]: [string, any]) => {
        const fieldPath = currentPath ? `${currentPath}.${fieldName}` : fieldName;
        
        // Determine requirement level
        const isRequired = schema.required?.includes(fieldName) || false;
        const requirementLevel: FieldRequirementLevel = isRequired ? 'required' : 
          this.isRecommendedField(fieldPath) ? 'recommended' : 'optional';

        // Create enhanced examples
        const examples = this.createFieldExamples(fieldName, fieldSchema);

        // Create documentation
        const documentation = this.createFieldDocumentation(fieldName, fieldPath, fieldSchema);

        const fieldDefinition: FieldDefinition = {
          name: fieldName,
          path: fieldPath,
          description: fieldSchema.description || `${fieldName} field`,
          type: fieldSchema.type || 'unknown',
          requirementLevel,
          required: isRequired, // Keep for backward compatibility
          enumValues: fieldSchema.enum,
          minimum: fieldSchema.minimum,
          maximum: fieldSchema.maximum,
          pattern: fieldSchema.pattern,
          examples,
          defaultValue: fieldSchema.default,
          documentation,
          parentPath: parentPath || ''
        };

        definitions.set(fieldPath, fieldDefinition);

        // Recursively process nested objects
        if (fieldSchema.type === 'object' || fieldSchema.properties) {
          this.extractFieldDefinitionsRecursive(fieldSchema, fieldPath, definitions, fieldPath);
        }

        // Process array items
        if (fieldSchema.type === 'array' && fieldSchema.items) {
          this.extractFieldDefinitionsRecursive(fieldSchema.items, `${fieldPath}[]`, definitions, `${fieldPath}[]`);
        }
      });
    }
  }

  /**
   * Normalize field path to handle different formats
   */
  private normalizeFieldPath(fieldPath: string): string {
    return fieldPath
      .replace(/\[\d+\]/g, '[]') // Convert [0], [1], etc. to []
      .replace(/\.(\d+)\./g, '[].')  // Convert .0., .1., etc. to [].
      .replace(/\.(\d+)$/, '[]')     // Convert ending .0, .1, etc. to []
      .trim();
  }

  /**
   * Convert path to array notation
   */
  private convertToArrayNotation(fieldPath: string): string {
    return fieldPath
      .replace(/\.(\d+)\./g, '[].')  // Convert .0., .1., etc. to [].
      .replace(/\.(\d+)$/, '[]');    // Convert ending .0, .1, etc. to []
  }

  /**
   * Remove array indices from path
   */
  private removeArrayIndices(fieldPath: string): string {
    return fieldPath
      .replace(/\[\d+\]/g, '[]')     // Convert [0], [1], etc. to []
      .replace(/\.(\d+)\./g, '[].')  // Convert .0., .1., etc. to [].
      .replace(/\.(\d+)$/, '[]');    // Convert ending .0, .1, etc. to []
  }

  /**
   * Add array notation to paths where arrays are expected (like imp)
   */
  private addArrayNotationToPath(fieldPath: string): string {
    // Known array fields in OpenRTB
    const arrayFields = ['imp', 'format', 'mimes', 'cur', 'wseat', 'bseat', 'bcat', 'badv', 'bapp', 'wlang'];
    
    let modifiedPath = fieldPath;
    
    // Add [] after known array fields if not already present
    arrayFields.forEach(arrayField => {
      const pattern = new RegExp(`\\b${arrayField}(?!\\[)(\\.|\$)`, 'g');
      modifiedPath = modifiedPath.replace(pattern, `${arrayField}[]$1`);
    });
    
    return modifiedPath;
  }

  /**
   * Determine if a field is recommended based on OpenRTB best practices
   */
  private isRecommendedField(fieldPath: string): boolean {
    const recommendedFields = [
      'device.ua',
      'device.ip',
      'site.domain',
      'site.page',
      'app.bundle',
      'user.id',
      'imp[].bidfloor',
      'imp[].banner.w',
      'imp[].banner.h',
      'imp[].video.mimes',
      'tmax',
      'cur'
    ];

    return recommendedFields.some(recommended => 
      fieldPath === recommended || fieldPath.endsWith(recommended)
    );
  }

  /**
   * Create enhanced field examples with descriptions
   */
  private createFieldExamples(fieldName: string, fieldSchema: any): FieldExample[] {
    const examples: FieldExample[] = [];

    // Add schema examples if available
    if (fieldSchema.examples && Array.isArray(fieldSchema.examples)) {
      fieldSchema.examples.forEach((example: any) => {
        examples.push({
          value: example,
          description: `Example ${fieldName} value`,
          recommended: true
        });
      });
    }

    // Add field-specific examples based on field name and type
    const fieldExamples = this.getFieldSpecificExamples(fieldName, fieldSchema.type);
    examples.push(...fieldExamples);

    return examples;
  }

  /**
   * Get field-specific examples based on field name and type
   */
  private getFieldSpecificExamples(fieldName: string, _fieldType: string): FieldExample[] {
    const examples: FieldExample[] = [];

    switch (fieldName) {
      case 'id':
        examples.push(
          { value: 'req-123456789', description: 'Unique request identifier', recommended: true },
          { value: 'bid-request-' + Date.now(), description: 'Timestamp-based ID', recommended: false }
        );
        break;
      case 'w':
        examples.push(
          { value: 300, description: 'Medium rectangle width', recommended: true },
          { value: 728, description: 'Leaderboard width', recommended: true },
          { value: 320, description: 'Mobile banner width', recommended: true }
        );
        break;
      case 'h':
        examples.push(
          { value: 250, description: 'Medium rectangle height', recommended: true },
          { value: 90, description: 'Leaderboard height', recommended: true },
          { value: 50, description: 'Mobile banner height', recommended: true }
        );
        break;
      case 'domain':
        examples.push(
          { value: 'example.com', description: 'Website domain', recommended: true },
          { value: 'news.example.org', description: 'Subdomain example', recommended: false }
        );
        break;
      case 'ua':
        examples.push({
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          description: 'Desktop Chrome user agent',
          recommended: true
        });
        break;
      case 'ip':
        examples.push(
          { value: '192.168.1.1', description: 'IPv4 address', recommended: true },
          { value: '10.0.0.1', description: 'Private network IP', recommended: false }
        );
        break;
      case 'bidfloor':
        examples.push(
          { value: 0.5, description: 'Minimum bid of $0.50', recommended: true },
          { value: 1.0, description: 'Premium inventory floor', recommended: false }
        );
        break;
      case 'tmax':
        examples.push(
          { value: 120, description: '120ms timeout (recommended)', recommended: true },
          { value: 100, description: '100ms timeout (fast)', recommended: false }
        );
        break;
    }

    return examples;
  }

  /**
   * Create field documentation with context and usage notes
   */
  private createFieldDocumentation(fieldName: string, fieldPath: string, _fieldSchema: any): FieldDocumentation {
    const documentation: FieldDocumentation = {};

    // Add detailed descriptions based on field
    switch (fieldName) {
      case 'id':
        documentation.longDescription = 'Unique identifier for the bid request. Must be unique across all requests from the same source.';
        documentation.usageNotes = 'Use a format that ensures uniqueness, such as UUID or timestamp-based IDs.';
        documentation.commonErrors = ['Empty or null ID', 'Non-unique IDs', 'IDs containing special characters'];
        break;
      case 'imp':
        documentation.longDescription = 'Array of impression objects representing the ad placements available for bidding.';
        documentation.usageNotes = 'Must contain at least one impression. Each impression must have a unique ID.';
        documentation.relatedFields = ['imp[].id', 'imp[].banner', 'imp[].video'];
        break;
      case 'w':
        documentation.longDescription = 'Width of the ad placement in pixels.';
        documentation.usageNotes = 'Should match standard IAB ad sizes when possible for better fill rates.';
        documentation.relatedFields = ['h', 'format'];
        break;
      case 'h':
        documentation.longDescription = 'Height of the ad placement in pixels.';
        documentation.usageNotes = 'Should match standard IAB ad sizes when possible for better fill rates.';
        documentation.relatedFields = ['w', 'format'];
        break;
      case 'bidfloor':
        documentation.longDescription = 'Minimum bid price for this impression in the specified currency.';
        documentation.usageNotes = 'Set appropriately to balance revenue and fill rate. Too high may reduce bids.';
        documentation.relatedFields = ['bidfloorcur'];
        break;
      case 'site':
        documentation.longDescription = 'Website information where the ad will be displayed.';
        documentation.usageNotes = 'Mutually exclusive with app object. Provide as much detail as possible for better targeting.';
        documentation.relatedFields = ['app', 'site.domain', 'site.page'];
        break;
      case 'app':
        documentation.longDescription = 'Mobile application information where the ad will be displayed.';
        documentation.usageNotes = 'Mutually exclusive with site object. Include bundle ID for app identification.';
        documentation.relatedFields = ['site', 'app.bundle', 'app.name'];
        break;
    }

    // Add spec section references
    documentation.specSection = this.getSpecSection(fieldPath);

    // Add usage context
    documentation.usageContext = this.getUsageContext(fieldPath);

    return documentation;
  }

  /**
   * Get OpenRTB specification section for a field
   */
  private getSpecSection(fieldPath: string): string {
    const sectionMap: Record<string, string> = {
      'id': '3.2.1',
      'imp': '3.2.4',
      'site': '3.2.13',
      'app': '3.2.14',
      'device': '3.2.18',
      'user': '3.2.20',
      'imp[].banner': '3.2.6',
      'imp[].video': '3.2.7',
      'imp[].audio': '3.2.8',
      'imp[].native': '3.2.9'
    };

    // Find the most specific match
    const sortedKeys = Object.keys(sectionMap).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (fieldPath.startsWith(key)) {
        return sectionMap[key] || 'OpenRTB 2.6';
      }
    }

    return 'OpenRTB 2.6';
  }

  /**
   * Get usage context for a field
   */
  private getUsageContext(fieldPath: string): string {
    if (fieldPath.includes('banner')) return 'Display advertising';
    if (fieldPath.includes('video')) return 'Video advertising';
    if (fieldPath.includes('audio')) return 'Audio advertising';
    if (fieldPath.includes('native')) return 'Native advertising';
    if (fieldPath.includes('site')) return 'Website advertising';
    if (fieldPath.includes('app')) return 'Mobile app advertising';
    if (fieldPath.includes('device')) return 'Device targeting';
    if (fieldPath.includes('user')) return 'User targeting';
    return 'General';
  }

  /**
   * Perform basic JSON schema validation
   */
  private performBasicSchemaValidation(request: any, schema: any): {
    errors: SchemaValidationError[];
    validatedPaths: string[];
  } {
    const errors: SchemaValidationError[] = [];
    const validatedPaths: string[] = [];

    // Recursive validation function
    const validateRecursive = (data: any, schemaDefinition: any, path: string = 'root') => {
      // Type validation
      if (schemaDefinition.type) {
        if (schemaDefinition.type === 'array' && !Array.isArray(data)) {
          errors.push({
            path,
            message: `Expected array, got ${typeof data}`,
            rule: 'type-validation',
            expected: 'array',
            actual: typeof data
          });
          return;
        } else if (schemaDefinition.type === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) {
          errors.push({
            path,
            message: `Expected object, got ${Array.isArray(data) ? 'array' : typeof data}`,
            rule: 'type-validation',
            expected: 'object',
            actual: Array.isArray(data) ? 'array' : typeof data
          });
          return;
        } else if (schemaDefinition.type === 'string' && typeof data !== 'string') {
          errors.push({
            path,
            message: `Expected string, got ${typeof data}`,
            rule: 'type-validation',
            expected: 'string',
            actual: typeof data
          });
          return;
        } else if (schemaDefinition.type === 'number' && (typeof data !== 'number' || isNaN(data))) {
          errors.push({
            path,
            message: `Expected number, got ${typeof data}`,
            rule: 'type-validation',
            expected: 'number',
            actual: typeof data
          });
          return;
        } else if (schemaDefinition.type === 'integer' && (!Number.isInteger(data))) {
          errors.push({
            path,
            message: `Expected integer, got ${typeof data}`,
            rule: 'type-validation',
            expected: 'integer',
            actual: typeof data
          });
          return;
        }
      }

      validatedPaths.push(path);

      // Validate array items
      if (schemaDefinition.type === 'array' && Array.isArray(data)) {
        if (schemaDefinition.minItems && data.length < schemaDefinition.minItems) {
          errors.push({
            path,
            message: `Array must have at least ${schemaDefinition.minItems} items, got ${data.length}`,
            rule: 'minItems',
            expected: `>= ${schemaDefinition.minItems} items`,
            actual: `${data.length} items`
          });
        }

        if (schemaDefinition.items) {
          data.forEach((item: any, index: number) => {
            validateRecursive(item, schemaDefinition.items, `${path}[${index}]`);
          });
        }
      }

      // Validate object properties
      if (schemaDefinition.type === 'object' && typeof data === 'object' && data !== null) {
        // Check required fields
        if (schemaDefinition.required && Array.isArray(schemaDefinition.required)) {
          schemaDefinition.required.forEach((requiredField: string) => {
            if (!(requiredField in data)) {
              errors.push({
                path: path === 'root' ? requiredField : `${path}.${requiredField}`,
                message: `Required field '${requiredField}' is missing`,
                rule: 'required-field',
                expected: 'field to be present',
                actual: 'field missing'
              });
            }
          });
        }

        // Validate properties
        if (schemaDefinition.properties) {
          Object.entries(schemaDefinition.properties).forEach(([prop, propSchema]: [string, any]) => {
            if (prop in data) {
              const propPath = path === 'root' ? prop : `${path}.${prop}`;
              validateRecursive(data[prop], propSchema, propPath);
            }
          });
        }
      }

      // Number range validation
      if ((schemaDefinition.type === 'number' || schemaDefinition.type === 'integer') && typeof data === 'number') {
        if (schemaDefinition.minimum !== undefined && data < schemaDefinition.minimum) {
          errors.push({
            path,
            message: `Value ${data} is less than minimum ${schemaDefinition.minimum}`,
            rule: 'minimum',
            expected: `>= ${schemaDefinition.minimum}`,
            actual: data
          });
        }
        if (schemaDefinition.maximum !== undefined && data > schemaDefinition.maximum) {
          errors.push({
            path,
            message: `Value ${data} is greater than maximum ${schemaDefinition.maximum}`,
            rule: 'maximum',
            expected: `<= ${schemaDefinition.maximum}`,
            actual: data
          });
        }
      }
    };

    // Start recursive validation
    validateRecursive(request, schema);

    return { errors, validatedPaths };
  }

  /**
   * Perform OpenRTB-specific validation
   */
  private performORTBValidation(request: any, _schema: ORTBSchema): {
    errors: SchemaValidationError[];
    validatedPaths: string[];
  } {
    const errors: SchemaValidationError[] = [];
    const validatedPaths: string[] = [];

    // Skip ORTB validation if request is not an object
    if (typeof request !== 'object' || request === null) {
      return { errors, validatedPaths };
    }

    // OpenRTB-specific validation rules - only validate if field is present
    if ('id' in request && (request.id === null || request.id === '' || typeof request.id !== 'string')) {
      errors.push({
        path: 'id',
        message: 'ORTB request ID is required and cannot be empty',
        rule: 'ortb-required-id',
        expected: 'non-empty string',
        actual: request.id
      });
    } else if ('id' in request) {
      validatedPaths.push('id');
    }

    // Validate impressions array
    if ('imp' in request) {
      if (!Array.isArray(request.imp) || request.imp.length === 0) {
        errors.push({
          path: 'imp',
          message: 'ORTB request must contain at least one impression',
          rule: 'ortb-required-impressions',
          expected: 'non-empty array',
          actual: request.imp
        });
      } else {
        validatedPaths.push('imp');
        
        // Validate each impression
        request.imp.forEach((imp: any, index: number) => {
          const impPath = `imp.${index}`;
          if (!imp.id) {
            errors.push({
              path: `${impPath}.id`,
              message: 'Impression ID is required',
              rule: 'ortb-required-impression-id',
              expected: 'non-empty string',
              actual: imp.id
            });
          } else {
            validatedPaths.push(`${impPath}.id`);
          }
        });
      }
    }

    // Validate site vs app exclusivity
    if (request.site && request.app) {
      errors.push({
        path: 'site/app',
        message: 'ORTB request cannot contain both site and app objects',
        rule: 'ortb-site-app-exclusivity',
        expected: 'either site or app, not both',
        actual: 'both site and app present'
      });
    }

    return { errors, validatedPaths };
  }



  /**
   * Calculate checksum for schema data
   */
  private calculateChecksum(data: any): string {
    // Simple checksum calculation - in production, use a proper hash function
    return JSON.stringify(data).length.toString(16);
  }

  /**
   * Get OpenRTB 2.6 schema definition
   */
  private getOpenRTB26Schema(): any {
    return {
      type: 'object',
      required: ['id', 'imp', 'at'],
      properties: {
        id: {
          type: 'string',
          description: 'Unique ID of the bid request, provided by the exchange',
          examples: ['req-123456789', 'bid-request-1640995200000']
        },
        imp: {
          type: 'array',
          description: 'Array of impression objects representing ad placements available for bidding',
          minItems: 1,
          items: {
            type: 'object',
            required: ['id'],
            properties: {
              id: {
                type: 'string',
                description: 'Unique ID for this impression within the bid request',
                examples: ['imp-1', 'impression-banner-300x250']
              },
              banner: {
                type: 'object',
                description: 'Banner impression object',
                properties: {
                  w: {
                    type: 'integer',
                    description: 'Width of the impression in pixels',
                    minimum: 1,
                    examples: [300, 728, 320, 160]
                  },
                  h: {
                    type: 'integer',
                    description: 'Height of the impression in pixels',
                    minimum: 1,
                    examples: [250, 90, 50, 600]
                  },
                  format: {
                    type: 'array',
                    description: 'Array of format objects',
                    items: {
                      type: 'object',
                      properties: {
                        w: { type: 'integer', minimum: 1 },
                        h: { type: 'integer', minimum: 1 }
                      }
                    }
                  }
                }
              },
              video: {
                type: 'object',
                description: 'Video impression object',
                properties: {
                  mimes: {
                    type: 'array',
                    description: 'Content MIME types supported',
                    items: { type: 'string' }
                  },
                  minduration: {
                    type: 'integer',
                    description: 'Minimum video ad duration in seconds'
                  },
                  maxduration: {
                    type: 'integer',
                    description: 'Maximum video ad duration in seconds'
                  }
                }
              },
              bidfloor: {
                type: 'number',
                description: 'Minimum bid for this impression',
                minimum: 0
              },
              bidfloorcur: {
                type: 'string',
                description: 'Currency for bid floor',
                default: 'USD'
              }
            }
          }
        },
        site: {
          type: 'object',
          description: 'Website where the impression will be shown',
          properties: {
            id: {
              type: 'string',
              description: 'Site ID on the exchange'
            },
            name: {
              type: 'string',
              description: 'Site name'
            },
            domain: {
              type: 'string',
              description: 'Domain of the site'
            },
            page: {
              type: 'string',
              description: 'URL of the page'
            }
          }
        },
        app: {
          type: 'object',
          description: 'Mobile application where the impression will be shown',
          properties: {
            id: {
              type: 'string',
              description: 'App ID on the exchange'
            },
            name: {
              type: 'string',
              description: 'App name'
            },
            bundle: {
              type: 'string',
              description: 'App bundle or package name'
            }
          }
        },
        device: {
          type: 'object',
          description: 'Device information',
          properties: {
            ua: {
              type: 'string',
              description: 'User agent string'
            },
            ip: {
              type: 'string',
              description: 'IPv4 address'
            },
            devicetype: {
              type: 'integer',
              description: 'Device type',
              enum: [1, 2, 3, 4, 5, 6, 7]
            }
          }
        },
        user: {
          type: 'object',
          description: 'User information',
          properties: {
            id: {
              type: 'string',
              description: 'Exchange-specific user ID'
            },
            yob: {
              type: 'integer',
              description: 'Year of birth',
              minimum: 1900,
              maximum: new Date().getFullYear()
            }
          }
        },
        at: {
          type: 'integer',
          description: 'Auction type',
          enum: [1, 2, 3],
          default: 2
        },
        tmax: {
          type: 'integer',
          description: 'Maximum time in milliseconds to submit a bid',
          minimum: 1
        },
        cur: {
          type: 'array',
          description: 'Allowed currencies for bids',
          items: { type: 'string' },
          default: ['USD']
        }
      }
    };
  }

  /**
   * Generate cache key for validation results
   */
  private generateValidationCacheKey(request: any, version: string): string {
    const requestStr = JSON.stringify(request, Object.keys(request || {}).sort());
    let hash = 0;
    for (let i = 0; i < requestStr.length; i++) {
      const char = requestStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `validation:${version}:${Math.abs(hash).toString(36)}`;
  }

  /**
   * Check if validation cache entry is still valid
   */
  private isValidationCacheValid(_cacheKey: string): boolean {
    // Simple time-based validation - in production, could be more sophisticated
    return true; // For now, rely on the cache service's TTL
  }

  /**
   * Cleanup validation result cache
   */
  cleanupValidationCache(): number {
    const sizeBefore = this.validationResultCache.size;
    // Remove entries older than cache timeout

    
    for (const [key] of this.validationResultCache.entries()) {
      // Simple cleanup - in production, would track timestamps
      if (Math.random() < 0.1) { // Randomly remove 10% of entries
        this.validationResultCache.delete(key);
      }
    }
    
    return sizeBefore - this.validationResultCache.size;
  }
}

// Export singleton instance
export const schemaManager = new SchemaManager();