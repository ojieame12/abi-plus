import { describe, it, expect } from 'vitest';
import { matchCategory } from '../categoryMatcher';
import { MOCK_MANAGED_CATEGORIES, MOCK_ACTIVATED_CATEGORIES } from '../mockCategories';

const activatedIds = new Set(MOCK_ACTIVATED_CATEGORIES.map(ac => ac.categoryId));

describe('categoryMatcher', () => {
  describe('matchCategory', () => {
    it('"Steel" matches steel_hrc (activated) with score > 0.4', () => {
      const result = matchCategory('Steel', MOCK_MANAGED_CATEGORIES, activatedIds);
      expect(result).not.toBeNull();
      expect(result!.score).toBeGreaterThanOrEqual(0.4);
      expect(result!.isActivated).toBe(true);
      // Should match a steel category
      expect(result!.category.name.toLowerCase()).toContain('steel');
    });

    it('"Steel Hot Rolled" matches steel_hrc specifically', () => {
      const result = matchCategory('Steel Hot Rolled', MOCK_MANAGED_CATEGORIES, activatedIds);
      expect(result).not.toBeNull();
      expect(result!.category.id).toBe('steel_hrc');
    });

    it('"Steel Cold Rolled" matches steel_crc specifically', () => {
      const result = matchCategory('Steel Cold Rolled', MOCK_MANAGED_CATEGORIES, activatedIds);
      expect(result).not.toBeNull();
      expect(result!.category.id).toBe('steel_crc');
    });

    it('"Aluminum" matches aluminum_primary (activated)', () => {
      const result = matchCategory('Aluminum', MOCK_MANAGED_CATEGORIES, activatedIds);
      expect(result).not.toBeNull();
      expect(result!.isActivated).toBe(true);
      expect(result!.category.name.toLowerCase()).toContain('aluminum');
    });

    it('"Rare Earth" matches rare_earths (not activated)', () => {
      const result = matchCategory('Rare Earth', MOCK_MANAGED_CATEGORIES, activatedIds);
      expect(result).not.toBeNull();
      expect(result!.category.id).toBe('rare_earths');
      expect(result!.isActivated).toBe(false);
    });

    it('"Unicorn" returns null (no match)', () => {
      const result = matchCategory('Unicorn', MOCK_MANAGED_CATEGORIES, activatedIds);
      expect(result).toBeNull();
    });

    it('"Unicorn Farming" returns null (no match)', () => {
      const result = matchCategory('Unicorn Farming', MOCK_MANAGED_CATEGORIES, activatedIds);
      expect(result).toBeNull();
    });

    it('"Copper" matches copper_cathodes (activated, more popular)', () => {
      const result = matchCategory('Copper', MOCK_MANAGED_CATEGORIES, activatedIds);
      expect(result).not.toBeNull();
      expect(result!.isActivated).toBe(true);
      expect(result!.category.name.toLowerCase()).toContain('copper');
    });

    it('grade tokens boost specificity toward matching category', () => {
      // "Steel" alone could match any steel category;
      // Adding grade "Cold Rolled" gives steel_crc a boost since "cold" and "rolled" appear in its name
      const withGrade = matchCategory('Steel', MOCK_MANAGED_CATEGORIES, activatedIds, { grade: 'Cold Rolled' });
      expect(withGrade).not.toBeNull();
      // The boosted category should contain the grade-related tokens
      expect(withGrade!.category.name.toLowerCase()).toContain('cold rolled');
    });

    it('non-matching grade tokens do not penalize the base score', () => {
      // "Steel" alone matches; grade "HRC" doesn't appear in any category name
      // but should NOT prevent a match
      const result = matchCategory('Steel', MOCK_MANAGED_CATEGORIES, activatedIds, { grade: 'HRC' });
      expect(result).not.toBeNull();
      expect(result!.category.name.toLowerCase()).toContain('steel');
    });

    it('returns null for empty text', () => {
      const result = matchCategory('', MOCK_MANAGED_CATEGORIES, activatedIds);
      expect(result).toBeNull();
    });

    it('returns null when no categories provided', () => {
      const result = matchCategory('Steel', [], activatedIds);
      expect(result).toBeNull();
    });

    it('prefers activated categories when scores are close', () => {
      // Lithium is activated, but rare_earths is not. Both are specialty metals.
      const result = matchCategory('Lithium', MOCK_MANAGED_CATEGORIES, activatedIds);
      expect(result).not.toBeNull();
      expect(result!.isActivated).toBe(true);
      expect(result!.category.id).toBe('lithium');
    });

    it('"Corrugated" matches corrugated (activated)', () => {
      const result = matchCategory('Corrugated', MOCK_MANAGED_CATEGORIES, activatedIds);
      expect(result).not.toBeNull();
      expect(result!.category.id).toBe('corrugated');
      expect(result!.isActivated).toBe(true);
    });

    it('"Ocean Freight" matches ocean_freight', () => {
      const result = matchCategory('Ocean Freight', MOCK_MANAGED_CATEGORIES, activatedIds);
      expect(result).not.toBeNull();
      expect(result!.category.id).toBe('ocean_freight');
      expect(result!.isActivated).toBe(true);
    });

    it('"Landscaping" matches landscaping (not activated)', () => {
      const result = matchCategory('Landscaping', MOCK_MANAGED_CATEGORIES, activatedIds);
      expect(result).not.toBeNull();
      expect(result!.category.id).toBe('landscaping');
      expect(result!.isActivated).toBe(false);
    });
  });
});
