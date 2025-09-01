/**
 * Best Practices System Tests
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { BestPracticesSystem, BestPractice, BestPracticeCategory } from '../best-practices';

describe('BestPracticesSystem', () => {
  let practicesSystem: BestPracticesSystem;

  beforeEach(() => {
    practicesSystem = new BestPracticesSystem();
  });

  describe('getBestPractice', () => {
    test('should return best practice by ID', () => {
      const practice = practicesSystem.getBestPractice('unique-request-ids');
      
      expect(practice).toBeDefined();
      expect(practice?.id).toBe('unique-request-ids');
      expect(practice?.title).toBe('Use Unique Request IDs');
      expect(practice?.category).toBe('request-structure');
      expect(practice?.priority).toBe('critical');
    });

    test('should return null for non-existent practice', () => {
      const practice = practicesSystem.getBestPractice('nonexistent-practice');
      expect(practice).toBeNull();
    });

    test('should have complete practice data', () => {
      const practice = practicesSystem.getBestPractice('unique-request-ids');
      
      expect(practice?.description).toBeTruthy();
      expect(practice?.explanation).toBeTruthy();
      expect(practice?.rationale).toBeTruthy();
      expect(practice?.examples.length).toBeGreaterThan(0);
      expect(practice?.commonMistakes.length).toBeGreaterThan(0);
      expect(practice?.tags).toBeDefined();
      expect(practice?.relatedFields.length).toBeGreaterThan(0);
      expect(practice?.performanceImpact).toBeDefined();
      expect(practice?.difficulty).toBeDefined();
      expect(practice?.tags.length).toBeGreaterThan(0);
    });
  });

  describe('getBestPracticesByCategory', () => {
    test('should return practices for request-structure category', () => {
      const practices = practicesSystem.getBestPracticesByCategory('request-structure');
      
      expect(practices.length).toBeGreaterThan(0);
      expect(practices.every(p => p.category === 'request-structure')).toBe(true);
      expect(practices.some(p => p.id === 'unique-request-ids')).toBe(true);
    });

    test('should return practices for field-optimization category', () => {
      const practices = practicesSystem.getBestPracticesByCategory('field-optimization');
      
      expect(practices.length).toBeGreaterThan(0);
      expect(practices.every(p => p.category === 'field-optimization')).toBe(true);
      expect(practices.some(p => p.id === 'standard-banner-sizes')).toBe(true);
    });

    test('should return practices for compliance category', () => {
      const practices = practicesSystem.getBestPracticesByCategory('compliance');
      
      expect(practices.length).toBeGreaterThan(0);
      expect(practices.every(p => p.category === 'compliance')).toBe(true);
      expect(practices.some(p => p.id === 'site-app-exclusivity')).toBe(true);
    });

    test('should sort practices by priority', () => {
      const practices = practicesSystem.getBestPracticesByCategory('request-structure');
      
      if (practices.length > 1) {
        const priorityWeights = { critical: 1, high: 2, medium: 3, low: 4 };
        for (let i = 1; i < practices.length; i++) {
          const currentWeight = priorityWeights[practices[i].priority];
          const previousWeight = priorityWeights[practices[i - 1].priority];
          expect(currentWeight).toBeGreaterThanOrEqual(previousWeight);
        }
      }
    });

    test('should return empty array for non-existent category', () => {
      const practices = practicesSystem.getBestPracticesByCategory('non-existent' as BestPracticeCategory);
      expect(practices).toHaveLength(0);
    });
  });

  describe('getBestPracticesByTag', () => {
    test('should return practices by tag', () => {
      const practices = practicesSystem.getBestPracticesByTag('request-id');
      
      expect(practices.length).toBeGreaterThan(0);
      expect(practices.every(p => p.tags.includes('request-id'))).toBe(true);
    });

    test('should return practices for banner tag', () => {
      const practices = practicesSystem.getBestPracticesByTag('banner');
      
      expect(practices.length).toBeGreaterThan(0);
      expect(practices.every(p => p.tags.includes('banner'))).toBe(true);
    });

    test('should return practices for compliance tag', () => {
      const practices = practicesSystem.getBestPracticesByTag('compliance');
      
      expect(practices.length).toBeGreaterThan(0);
      expect(practices.every(p => p.tags.includes('compliance'))).toBe(true);
    });

    test('should return empty array for non-existent tag', () => {
      const practices = practicesSystem.getBestPracticesByTag('nonexistent-tag');
      expect(practices).toHaveLength(0);
    });

    test('should sort practices by priority', () => {
      const practices = practicesSystem.getBestPracticesByTag('compliance');
      
      if (practices.length > 1) {
        const priorityWeights = { critical: 1, high: 2, medium: 3, low: 4 };
        for (let i = 1; i < practices.length; i++) {
          const currentWeight = priorityWeights[practices[i].priority];
          const previousWeight = priorityWeights[practices[i - 1].priority];
          expect(currentWeight).toBeGreaterThanOrEqual(previousWeight);
        }
      }
    });
  });

  describe('searchBestPractices', () => {
    test('should find practices by title', () => {
      const results = practicesSystem.searchBestPractices('unique request ids');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('unique-request-ids');
    });

    test('should find practices by description', () => {
      const results = practicesSystem.searchBestPractices('banner sizes');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(p => p.id === 'standard-banner-sizes')).toBe(true);
    });

    test('should find practices by tags', () => {
      const results = practicesSystem.searchBestPractices('compliance');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(p => p.tags.includes('compliance'))).toBe(true);
    });

    test('should find practices by related fields', () => {
      const results = practicesSystem.searchBestPractices('imp.banner.w');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(p => p.relatedFields.includes('imp.banner.w'))).toBe(true);
    });

    test('should return empty array for no matches', () => {
      const results = practicesSystem.searchBestPractices('xyz123nonexistent');
      expect(results).toHaveLength(0);
    });

    test('should limit results to 10', () => {
      const results = practicesSystem.searchBestPractices('the');
      expect(results.length).toBeLessThanOrEqual(10);
    });

    test('should rank results by relevance', () => {
      const results = practicesSystem.searchBestPractices('request id');
      
      if (results.length > 1) {
        // Results should be sorted by relevance (score)
        // We can't easily test the exact scoring, but we can verify ordering
        expect(results[0].title.toLowerCase()).toContain('request');
      }
    });
  });

  describe('getBestPracticesForField', () => {
    test('should return practices for specific field', () => {
      const practices = practicesSystem.getBestPracticesForField('id');
      
      expect(practices.length).toBeGreaterThan(0);
      expect(practices.every(p => p.relatedFields.includes('id'))).toBe(true);
      expect(practices.some(p => p.id === 'unique-request-ids')).toBe(true);
    });

    test('should return practices for banner width field', () => {
      const practices = practicesSystem.getBestPracticesForField('imp.banner.w');
      
      expect(practices.length).toBeGreaterThan(0);
      expect(practices.every(p => p.relatedFields.includes('imp.banner.w'))).toBe(true);
    });

    test('should return empty array for field with no practices', () => {
      const practices = practicesSystem.getBestPracticesForField('nonexistent.field');
      expect(practices).toHaveLength(0);
    });

    test('should sort practices by priority', () => {
      const practices = practicesSystem.getBestPracticesForField('id');
      
      if (practices.length > 1) {
        const priorityWeights = { critical: 1, high: 2, medium: 3, low: 4 };
        for (let i = 1; i < practices.length; i++) {
          const currentWeight = priorityWeights[practices[i].priority];
          const previousWeight = priorityWeights[practices[i - 1].priority];
          expect(currentWeight).toBeGreaterThanOrEqual(previousWeight);
        }
      }
    });
  });

  describe('getGuide', () => {
    test('should return guide by ID', () => {
      const guide = practicesSystem.getGuide('beginner-guide');
      
      expect(guide).toBeDefined();
      expect(guide?.id).toBe('beginner-guide');
      expect(guide?.title).toBe('Getting Started with OpenRTB');
      expect(guide?.audience).toBe('beginner');
      expect(guide?.practices.length).toBeGreaterThan(0);
    });

    test('should return null for non-existent guide', () => {
      const guide = practicesSystem.getGuide('nonexistent-guide');
      expect(guide).toBeNull();
    });

    test('should have complete guide data', () => {
      const guide = practicesSystem.getGuide('beginner-guide');
      
      expect(guide?.description).toBeTruthy();
      expect(guide?.readingTime).toBeGreaterThan(0);
      expect(guide?.prerequisites.length).toBeGreaterThan(0);
      expect(guide?.objectives.length).toBeGreaterThan(0);
      expect(guide?.practices.length).toBeGreaterThan(0);
    });
  });

  describe('getAllGuides', () => {
    test('should return all guides', () => {
      const guides = practicesSystem.getAllGuides();
      
      expect(guides.length).toBeGreaterThan(0);
      expect(guides.some(g => g.id === 'beginner-guide')).toBe(true);
      expect(guides.some(g => g.id === 'performance-optimization')).toBe(true);
    });

    test('should sort guides alphabetically by title', () => {
      const guides = practicesSystem.getAllGuides();
      
      if (guides.length > 1) {
        for (let i = 1; i < guides.length; i++) {
          expect(guides[i].title.localeCompare(guides[i - 1].title))
            .toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('getGuidesByAudience', () => {
    test('should return guides for beginner audience', () => {
      const guides = practicesSystem.getGuidesByAudience('beginner');
      
      expect(guides.length).toBeGreaterThan(0);
      expect(guides.every(g => g.audience === 'beginner' || g.audience === 'all')).toBe(true);
      expect(guides.some(g => g.id === 'beginner-guide')).toBe(true);
    });

    test('should return guides for intermediate audience', () => {
      const guides = practicesSystem.getGuidesByAudience('intermediate');
      
      expect(guides.length).toBeGreaterThan(0);
      expect(guides.every(g => g.audience === 'intermediate' || g.audience === 'all')).toBe(true);
    });

    test('should return guides for advanced audience', () => {
      const guides = practicesSystem.getGuidesByAudience('advanced');
      
      expect(Array.isArray(guides)).toBe(true);
      expect(guides.every(g => g.audience === 'advanced' || g.audience === 'all')).toBe(true);
    });

    test('should sort guides alphabetically', () => {
      const guides = practicesSystem.getGuidesByAudience('beginner');
      
      if (guides.length > 1) {
        for (let i = 1; i < guides.length; i++) {
          expect(guides[i].title.localeCompare(guides[i - 1].title))
            .toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('getQuickTips', () => {
    test('should return tips for first-request scenario', () => {
      const tips = practicesSystem.getQuickTips('first-request');
      
      expect(tips.length).toBeGreaterThan(0);
      expect(tips.some(tip => tip.includes('required fields'))).toBe(true);
      expect(tips.some(tip => tip.includes('id'))).toBe(true);
    });

    test('should return tips for debugging scenario', () => {
      const tips = practicesSystem.getQuickTips('debugging');
      
      expect(tips.length).toBeGreaterThan(0);
      expect(tips.some(tip => tip.includes('impression IDs'))).toBe(true);
      expect(tips.some(tip => tip.includes('JSON'))).toBe(true);
    });

    test('should return tips for optimization scenario', () => {
      const tips = practicesSystem.getQuickTips('optimization');
      
      expect(tips.length).toBeGreaterThan(0);
      expect(tips.some(tip => tip.includes('device'))).toBe(true);
      expect(tips.some(tip => tip.includes('targeting'))).toBe(true);
    });

    test('should return tips for mobile scenario', () => {
      const tips = practicesSystem.getQuickTips('mobile');
      
      expect(tips.length).toBeGreaterThan(0);
      expect(tips.some(tip => tip.includes('mobile'))).toBe(true);
      expect(tips.some(tip => tip.includes('320x50') || tip.includes('300x250'))).toBe(true);
    });

    test('should return tips for video scenario', () => {
      const tips = practicesSystem.getQuickTips('video');
      
      expect(tips.length).toBeGreaterThan(0);
      expect(tips.some(tip => tip.includes('video'))).toBe(true);
      expect(tips.some(tip => tip.includes('duration'))).toBe(true);
    });

    test('should return empty array for unknown scenario', () => {
      const tips = practicesSystem.getQuickTips('unknown-scenario' as any);
      expect(tips).toHaveLength(0);
    });
  });

  describe('practice content validation', () => {
    test('should have valid examples with required properties', () => {
      const practice = practicesSystem.getBestPractice('unique-request-ids');
      
      expect(practice?.examples).toBeDefined();
      practice?.examples.forEach(example => {
        expect(example.title).toBeTruthy();
        expect(example.description).toBeTruthy();
        expect(example.goodExample).toBeDefined();
        expect(example.explanation).toBeTruthy();
        expect(example.context).toBeTruthy();
      });
    });

    test('should have valid common mistakes with solutions', () => {
      const practice = practicesSystem.getBestPractice('unique-request-ids');
      
      expect(practice?.commonMistakes).toBeDefined();
      practice?.commonMistakes.forEach(mistake => {
        expect(mistake.mistake).toBeTruthy();
        expect(mistake.problem).toBeTruthy();
        expect(mistake.solution).toBeTruthy();
      });
    });

    test('should have valid performance impact data', () => {
      const practice = practicesSystem.getBestPractice('standard-banner-sizes');
      
      expect(practice?.performanceImpact).toBeDefined();
      expect(['positive', 'negative', 'neutral']).toContain(practice?.performanceImpact.fillRate);
      expect(['positive', 'negative', 'neutral']).toContain(practice?.performanceImpact.bidPrices);
      expect(['positive', 'negative', 'neutral']).toContain(practice?.performanceImpact.latency);
      expect(practice?.performanceImpact.description).toBeTruthy();
    });

    test('should have valid difficulty levels', () => {
      const practices = [
        practicesSystem.getBestPractice('unique-request-ids'),
        practicesSystem.getBestPractice('standard-banner-sizes'),
        practicesSystem.getBestPractice('site-app-exclusivity')
      ];
      
      practices.forEach(practice => {
        expect(['easy', 'medium', 'hard']).toContain(practice?.difficulty);
      });
    });

    test('should have valid priority levels', () => {
      const practices = [
        practicesSystem.getBestPractice('unique-request-ids'),
        practicesSystem.getBestPractice('standard-banner-sizes'),
        practicesSystem.getBestPractice('site-app-exclusivity')
      ];
      
      practices.forEach(practice => {
        expect(['critical', 'high', 'medium', 'low']).toContain(practice?.priority);
      });
    });

    test('should have non-empty tags and related fields', () => {
      const practice = practicesSystem.getBestPractice('unique-request-ids');
      
      expect(practice?.tags.length).toBeGreaterThan(0);
      expect(practice?.relatedFields.length).toBeGreaterThan(0);
      expect(practice?.tags.every(tag => typeof tag === 'string' && tag.length > 0)).toBe(true);
      expect(practice?.relatedFields.every(field => typeof field === 'string' && field.length > 0)).toBe(true);
    });
  });
});