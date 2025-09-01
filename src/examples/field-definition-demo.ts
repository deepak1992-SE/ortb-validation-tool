/**
 * Field Definition System Demo
 * Demonstrates the enhanced field definition and documentation system
 */

import { schemaManager } from '../validation/schema-manager';
import { FieldRequirementLevel } from '../models/validation';

async function demonstrateFieldDefinitionSystem() {
  console.log('🔍 Field Definition System Demo\n');

  // Load the schema
  await schemaManager.loadSchema('2.6');

  // 1. Basic field definition retrieval
  console.log('1. Basic Field Definition Retrieval:');
  const idField = schemaManager.getFieldDefinitions('id', '2.6');
  console.log(`Field: ${idField?.name}`);
  console.log(`Path: ${idField?.path}`);
  console.log(`Type: ${idField?.type}`);
  console.log(`Requirement Level: ${idField?.requirementLevel}`);
  console.log(`Description: ${idField?.description}`);
  console.log();

  // 2. Different path format handling
  console.log('2. Different Path Format Handling:');
  const pathFormats = [
    'imp[].banner.w',
    'imp.0.banner.w', 
    'imp.banner.w'
  ];
  
  pathFormats.forEach(path => {
    const field = schemaManager.getFieldDefinitions(path, '2.6');
    console.log(`Path "${path}" -> Found: ${field ? 'Yes' : 'No'} (${field?.path})`);
  });
  console.log();

  // 3. Field examples and documentation
  console.log('3. Field Examples and Documentation:');
  const bannerWidth = schemaManager.getFieldDefinitions('imp[].banner.w', '2.6');
  console.log(`Field: ${bannerWidth?.name}`);
  console.log('Examples:');
  bannerWidth?.examples?.forEach((example, index) => {
    console.log(`  ${index + 1}. ${example.value} - ${example.description} ${example.recommended ? '(Recommended)' : ''}`);
  });
  console.log(`Documentation: ${bannerWidth?.documentation?.longDescription}`);
  console.log(`Usage Notes: ${bannerWidth?.documentation?.usageNotes}`);
  console.log(`Usage Context: ${bannerWidth?.documentation?.usageContext}`);
  console.log();

  // 4. Fields by requirement level
  console.log('4. Fields by Requirement Level:');
  const requirementLevels: FieldRequirementLevel[] = ['required', 'recommended', 'optional'];
  
  requirementLevels.forEach(level => {
    const fields = schemaManager.getFieldDefinitionsByRequirement(level, '2.6');
    console.log(`${level.toUpperCase()} fields (${fields.length}):`);
    fields.slice(0, 5).forEach(field => {
      console.log(`  - ${field.path}: ${field.description}`);
    });
    if (fields.length > 5) {
      console.log(`  ... and ${fields.length - 5} more`);
    }
    console.log();
  });

  // 5. Pattern-based search
  console.log('5. Pattern-based Field Search:');
  const bannerFields = schemaManager.getFieldDefinitionsByPattern('banner', '2.6');
  console.log(`Banner-related fields (${bannerFields.length}):`);
  bannerFields.forEach(field => {
    console.log(`  - ${field.path}: ${field.description}`);
  });
  console.log();

  // 6. Child field definitions
  console.log('6. Child Field Definitions:');
  const bannerChildren = schemaManager.getChildFieldDefinitions('imp[].banner', '2.6');
  console.log(`Children of imp[].banner (${bannerChildren.length}):`);
  bannerChildren.forEach(child => {
    console.log(`  - ${child.name} (${child.type}): ${child.description}`);
  });
  console.log();

  // 7. Field relationships and common errors
  console.log('7. Field Relationships and Common Errors:');
  const siteField = schemaManager.getFieldDefinitions('site', '2.6');
  console.log(`Field: ${siteField?.name}`);
  console.log(`Related Fields: ${siteField?.documentation?.relatedFields?.join(', ')}`);
  console.log(`Common Errors: ${siteField?.documentation?.commonErrors?.join(', ')}`);
  console.log(`Spec Section: ${siteField?.documentation?.specSection}`);
  console.log();

  // 8. Cache statistics
  console.log('8. Cache Statistics:');
  const stats = schemaManager.getCacheStats();
  console.log(`Cached Schemas: ${stats.schemaCount}`);
  console.log(`Field Definitions: ${stats.fieldDefinitionCount}`);
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateFieldDefinitionSystem().catch(console.error);
}

export { demonstrateFieldDefinitionSystem };