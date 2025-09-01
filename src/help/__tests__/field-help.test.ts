/**
 * Field Help System Tests
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { FieldHelpSystem, FieldHelp } from '../field-help';

describe('FieldHelpSystem', () => {
  let helpSystem: FieldHelpSystem;

  beforeEach(() => {
    helpSystem = new FieldHelpSystem();
  });

  describe('getFieldHelp', () => {
    test('should return help for existing field', () => {
      const help = helpSystem.getFieldHelp('id');
      
      expect(help).toBeDefined();
      expect(help?.fieldPath).toBe('id');
      expect(help?.name).toBe('Request ID');
      expect(help?.requirementLevel).toBe('required');
      expect(help?.examples.length).toBeGreaterThan(0);
    });

    test('should return null for non-existent field', () => {
      const help = helpSystem.getFieldHelp('nonexistent.field');
      expect(help).toBeNull();
    });

    test('should return help for nested field', () => {
      const help = helpSystem.getFieldHelp('imp.id');
      
      expect(help).toBeDefined();
      expect(help?.fieldPath).toBe('imp.id');
      expect(help?.name).toBe('Impression ID');
      expect(help?.requirementLevel).toBe('required');
    });

    test('should return help for banner width field', () => {
      const help = helpSystem.getFieldHelp('imp.banner.w');
      
      expect(help).toBeDefined();
      expect(help?.fieldPath).toBe('imp.banner.w');
      expect(help?.name).toBe('Banner Width');
      expect(help?.type.type).toBe('integer');
      expect(help?.type.minimum).toBe(1);
    });
  });

  describe('searchFieldHelp', () => {
    test('should find fields by name', () => {
      const results = helpSystem.searchFieldHelp('request id');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].fieldHelp.fieldPath).toBe('id');
      expect(results[0].relevance).toBeGreaterThan(0);
      expect(results[0].matchingTerms).toContain('request');
    });

    test('should find fields by description', () => {
      const results = helpSystem.searchFieldHelp('banner width');
      
      expect(results.length).toBeGreaterThan(0);
      const bannerWidthResult = results.find(r => r.fieldHelp.fieldPath === 'imp.banner.w');
      expect(bannerWidthResult).toBeDefined();
    });

    test('should find fields by field path components', () => {
      const results = helpSystem.searchFieldHelp('imp');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.fieldHelp.fieldPath.includes('imp'))).toBe(true);
    });

    test('should return empty array for no matches', () => {
      const results = helpSystem.searchFieldHelp('xyz123nonexistent');
      expect(results).toHaveLength(0);
    });

    test('should rank results by relevance', () => {
      const results = helpSystem.searchFieldHelp('id');
      
      expect(results.length).toBeGreaterThan(1);
      // First result should have higher or equal relevance than second
      expect(results[0].relevance).toBeGreaterThanOrEqual(results[1].relevance);
    });
  });

  describe('getFieldsByCategory', () => {
    test('should return required fields', () => {
      const requiredFields = helpSystem.getFieldsByCategory('required');
      
      expect(requiredFields.length).toBeGreaterThan(0);
      expect(requiredFields.every(field => field.requirementLevel === 'required')).toBe(true);
      expect(requiredFields.some(field => field.fieldPath === 'id')).toBe(true);
      expect(requiredFields.some(field => field.fieldPath === 'imp')).toBe(true);
    });

    test('should return optional fields', () => {
      const optionalFields = helpSystem.getFieldsByCategory('optional');
      
      // Should return array (may be empty if no optional fields defined yet)
      expect(Array.isArray(optionalFields)).toBe(true);
      if (optionalFields.length > 0) {
        expect(optionalFields.every(field => field.requirementLevel === 'optional')).toBe(true);
      }
    });

    test('should return recommended fields', () => {
      const recommendedFields = helpSystem.getFieldsByCategory('recommended');
      
      expect(Array.isArray(recommendedFields)).toBe(true);
      if (recommendedFields.length > 0) {
        expect(recommendedFields.every(field => field.requirementLevel === 'recommended')).toBe(true);
      }
    });

    test('should sort fields alphabetically by path', () => {
      const requiredFields = helpSystem.getFieldsByCategory('required');
      
      if (requiredFields.length > 1) {
        for (let i = 1; i < requiredFields.length; i++) {
          expect(requiredFields[i].fieldPath.localeCompare(requiredFields[i - 1].fieldPath))
            .toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('getRelatedFields', () => {
    test('should return related fields for existing field', () => {
      const relatedFields = helpSystem.getRelatedFields('id');
      
      expect(Array.isArray(relatedFields)).toBe(true);
      // Should include imp.id as related field
      expect(relatedFields.some(field => field.fieldPath === 'imp.id')).toBe(true);
    });

    test('should return empty array for field with no related fields', () => {
      const relatedFields = helpSystem.getRelatedFields('nonexistent.field');
      expect(relatedFields).toHaveLength(0);
    });

    test('should return related fields for banner width', () => {
      const relatedFields = helpSystem.getRelatedFields('imp.banner.w');
      
      expect(Array.isArray(relatedFields)).toBe(true);
      // Should include banner height as related field
      expect(relatedFields.some(field => field.fieldPath === 'imp.banner.h')).toBe(true);
    });
  });

  describe('getHelpForValidationError', () => {
    test('should return help for specific field error', () => {
      const help = helpSystem.getHelpForValidationError('MISSING_REQUEST_ID', 'id');
      
      expect(help.length).toBeGreaterThan(0);
      expect(help[0].fieldPath).toBe('id');
    });

    test('should return help for error without specific field', () => {
      const help = helpSystem.getHelpForValidationError('MISSING_REQUEST_ID');
      
      expect(Array.isArray(help)).toBe(true);
      // Should find fields that commonly have this error
      expect(help.some(field => 
        field.commonErrors.some(error => error.code === 'MISSING_REQUEST_ID')
      )).toBe(true);
    });

    test('should return empty array for unknown error code', () => {
      const help = helpSystem.getHelpForValidationError('UNKNOWN_ERROR_CODE');
      expect(help).toHaveLength(0);
    });
  });

  describe('getValidationGuidance', () => {
    test('should return validation steps', () => {
      const steps = helpSystem.getValidationGuidance();
      
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].step).toBe(1);
      expect(steps[0].title).toBeDefined();
      expect(steps[0].description).toBeDefined();
      expect(steps[0].fields).toBeDefined();
      expect(steps[0].checkFunction).toBeDefined();
    });

    test('should have sequential step numbers', () => {
      const steps = helpSystem.getValidationGuidance();
      
      for (let i = 0; i < steps.length; i++) {
        expect(steps[i].step).toBe(i + 1);
      }
    });

    test('should include required fields step', () => {
      const steps = helpSystem.getValidationGuidance();
      
      const requiredFieldsStep = steps.find(step => 
        step.checkFunction === 'validateRequiredFields'
      );
      expect(requiredFieldsStep).toBeDefined();
      expect(requiredFieldsStep?.title).toContain('Required');
    });

    test('should include impression validation step', () => {
      const steps = helpSystem.getValidationGuidance();
      
      const impressionStep = steps.find(step => 
        step.checkFunction === 'validateImpressions'
      );
      expect(impressionStep).toBeDefined();
      expect(impressionStep?.title).toContain('Impression');
    });

    test('should include site/app validation step', () => {
      const steps = helpSystem.getValidationGuidance();
      
      const siteAppStep = steps.find(step => 
        step.checkFunction === 'validateSiteApp'
      );
      expect(siteAppStep).toBeDefined();
      expect(siteAppStep?.title).toContain('Site');
    });
  });

  describe('field help content validation', () => {
    test('should have complete field help for id field', () => {
      const help = helpSystem.getFieldHelp('id');
      
      expect(help).toBeDefined();
      expect(help?.fieldPath).toBe('id');
      expect(help?.name).toBeTruthy();
      expect(help?.description).toBeTruthy();
      expect(help?.longDescription).toBeTruthy();
      expect(help?.type).toBeDefined();
      expect(help?.requirementLevel).toBeDefined();
      expect(help?.examples.length).toBeGreaterThan(0);
      expect(help?.commonErrors.length).toBeGreaterThan(0);
      expect(help?.bestPractices.length).toBeGreaterThan(0);
      expect(help?.usageGuidance).toBeDefined();
      expect(help?.specReference).toBeDefined();
    });

    test('should have valid examples with required properties', () => {
      const help = helpSystem.getFieldHelp('id');
      
      expect(help?.examples).toBeDefined();
      help?.examples.forEach(example => {
        expect(example.value).toBeDefined();
        expect(example.description).toBeTruthy();
        expect(example.context).toBeTruthy();
        expect(typeof example.recommended).toBe('boolean');
      });
    });

    test('should have valid common errors with solutions', () => {
      const help = helpSystem.getFieldHelp('id');
      
      expect(help?.commonErrors).toBeDefined();
      help?.commonErrors.forEach(error => {
        expect(error.code).toBeTruthy();
        expect(error.description).toBeTruthy();
        expect(error.solution).toBeTruthy();
      });
    });

    test('should have valid related fields with relationships', () => {
      const help = helpSystem.getFieldHelp('id');
      
      expect(help?.relatedFields).toBeDefined();
      help?.relatedFields.forEach(related => {
        expect(related.fieldPath).toBeTruthy();
        expect(related.relationship).toBeTruthy();
        expect(related.description).toBeTruthy();
      });
    });

    test('should have valid usage guidance', () => {
      const help = helpSystem.getFieldHelp('id');
      
      expect(help?.usageGuidance).toBeDefined();
      expect(help?.usageGuidance.whenToUse).toBeDefined();
      expect(help?.usageGuidance.whenNotToUse).toBeDefined();
      expect(help?.usageGuidance.bidProcessingImpact).toBeTruthy();
    });

    test('should have valid spec reference', () => {
      const help = helpSystem.getFieldHelp('id');
      
      expect(help?.specReference).toBeDefined();
      expect(help?.specReference.version).toBeTruthy();
      expect(help?.specReference.section).toBeTruthy();
    });
  });
});