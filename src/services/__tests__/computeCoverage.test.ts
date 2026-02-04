import { describe, it, expect } from 'vitest';
import { computeCoverage } from '../interestService';

describe('computeCoverage (category-matched)', () => {
  it('"Steel" → decision_grade with matchedCategory', () => {
    const result = computeCoverage('Steel');
    expect(result.level).toBe('decision_grade');
    expect(result.matchedCategory).toBeDefined();
    expect(result.matchedCategory!.categoryName.toLowerCase()).toContain('steel');
    expect(result.matchedCategory!.isActivated).toBe(true);
  });

  it('"Steel" + grade "HRC" → decision_grade (text-only scoring is high enough)', () => {
    // Base score from "Steel" alone matches activated steel category well.
    // Grade "HRC" is a boost-only input; not matching doesn't penalize.
    const result = computeCoverage('Steel', undefined, 'HRC');
    expect(result.level).toBe('decision_grade');
    expect(result.matchedCategory).toBeDefined();
    expect(result.matchedCategory!.isActivated).toBe(true);
  });

  it('"Steel" + grade "Hot Rolled" → decision_grade with boosted steel_hrc match', () => {
    // "Hot" and "Rolled" appear in "Steel (Hot Rolled Coil)" → boost raises score
    const result = computeCoverage('Steel', undefined, 'Hot Rolled');
    expect(result.level).toBe('decision_grade');
    expect(result.matchedCategory).toBeDefined();
    // Grade tokens boost steel_hrc above other steel categories
    expect(result.matchedCategory!.categoryName.toLowerCase()).toContain('hot rolled');
  });

  it('"Steel Hot Rolled" → decision_grade matching steel_hrc specifically', () => {
    const result = computeCoverage('Steel Hot Rolled');
    expect(result.level).toBe('decision_grade');
    expect(result.matchedCategory).toBeDefined();
    expect(result.matchedCategory!.categoryId).toBe('steel_hrc');
  });

  it('"Rare Earth" → available (in catalog, not activated)', () => {
    const result = computeCoverage('Rare Earth');
    expect(result.level).toBe('available');
    expect(result.matchedCategory).toBeDefined();
    expect(result.matchedCategory!.categoryName).toBe('Rare Earth Elements');
    expect(result.matchedCategory!.isActivated).toBe(false);
    expect(result.gapReason).toContain('available in the Beroe catalog');
  });

  it('"Unicorn Farming" → web_only with no matchedCategory', () => {
    const result = computeCoverage('Unicorn Farming');
    expect(result.level).toBe('web_only');
    expect(result.matchedCategory).toBeUndefined();
    expect(result.gapReason).toContain('No Beroe coverage');
  });

  it('matchedCategory.isActivated is true for activated categories', () => {
    const result = computeCoverage('Aluminum');
    expect(result.matchedCategory).toBeDefined();
    expect(result.matchedCategory!.isActivated).toBe(true);
  });

  it('matchedCategory contains real capabilities', () => {
    const result = computeCoverage('Steel');
    expect(result.matchedCategory).toBeDefined();
    const mc = result.matchedCategory!;
    expect(typeof mc.hasMarketReport).toBe('boolean');
    expect(typeof mc.hasPriceIndex).toBe('boolean');
    expect(typeof mc.hasSupplierData).toBe('boolean');
    expect(typeof mc.hasNewsAlerts).toBe('boolean');
    expect(typeof mc.hasCostModel).toBe('boolean');
    expect(mc.analystName).toBeTruthy();
    expect(['daily', 'weekly', 'bi-weekly', 'monthly']).toContain(mc.updateFrequency);
  });

  it('matchedCategory includes domain and subDomain', () => {
    const result = computeCoverage('Copper');
    expect(result.matchedCategory).toBeDefined();
    expect(result.matchedCategory!.domain).toBe('Metals');
    expect(result.matchedCategory!.subDomain).toBeDefined();
  });

  it('"Corrugated" → decision_grade with Packaging domain', () => {
    const result = computeCoverage('Corrugated');
    expect(result.level).toBe('decision_grade');
    expect(result.matchedCategory).toBeDefined();
    expect(result.matchedCategory!.domain).toBe('Packaging');
  });

  it('"Landscaping" → available (not activated)', () => {
    const result = computeCoverage('Landscaping');
    expect(result.level).toBe('available');
    expect(result.matchedCategory!.isActivated).toBe(false);
  });

  it('activated category with non-matching grade still returns decision_grade', () => {
    // With text-only base scoring, "Copper" alone has high recall.
    // Non-matching grade "Premium" doesn't penalize the score.
    const result = computeCoverage('Copper', undefined, 'Premium');
    expect(result.level).toBe('decision_grade');
    expect(result.matchedCategory).toBeDefined();
    expect(result.matchedCategory!.isActivated).toBe(true);
  });
});
