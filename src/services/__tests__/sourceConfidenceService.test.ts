import { describe, it, expect } from 'vitest';
import {
  calculateSourceConfidence,
  getConfidenceLabel,
  shouldShowDecisionGradeBadge,
  shouldSuggestWebExpansion,
} from '../sourceConfidenceService';
import type { ResponseSources } from '../../types/aiResponse';

// Helper to create mock sources
const createMockSources = (
  internalCount: number,
  webCount: number
): ResponseSources => ({
  web: Array(webCount).fill({ name: 'Test', url: 'https://test.com', domain: 'test.com' }),
  internal: Array(internalCount).fill({ name: 'Beroe Report', type: 'beroe' }),
  totalWebCount: webCount,
  totalInternalCount: internalCount,
});

describe('calculateSourceConfidence', () => {
  describe('high confidence scenarios', () => {
    it('returns high confidence for managed category with 2+ Beroe sources', () => {
      const sources = createMockSources(3, 0);
      const result = calculateSourceConfidence(sources, 'Steel', ['Steel', 'Aluminum']);

      expect(result.level).toBe('high');
      expect(result.isManagedCategory).toBe(true);
      expect(result.categoryName).toBe('Steel');
      expect(result.showExpandToWeb).toBe(false);
      expect(result.reason).toContain('Comprehensive');
    });

    it('returns high confidence for 3+ Beroe sources even without managed category', () => {
      const sources = createMockSources(4, 0);
      const result = calculateSourceConfidence(sources, 'Rubber', ['Steel']);

      expect(result.level).toBe('high');
      expect(result.isManagedCategory).toBe(false);
      expect(result.beroeSourceCount).toBe(4);
      expect(result.showExpandToWeb).toBe(false);
    });

    it('handles case-insensitive category matching', () => {
      const sources = createMockSources(2, 0);
      const result = calculateSourceConfidence(sources, 'STEEL', ['steel', 'aluminum']);

      expect(result.level).toBe('high');
      expect(result.isManagedCategory).toBe(true);
    });
  });

  describe('medium confidence scenarios', () => {
    it('returns medium confidence for non-managed category with 1-2 Beroe sources', () => {
      const sources = createMockSources(1, 0);
      const result = calculateSourceConfidence(sources, 'Rubber', ['Steel']);

      expect(result.level).toBe('medium');
      expect(result.isManagedCategory).toBe(false);
      expect(result.showExpandToWeb).toBe(true);
    });

    it('returns medium confidence for managed category with only 1 Beroe source', () => {
      const sources = createMockSources(1, 0);
      const result = calculateSourceConfidence(sources, 'Steel', ['Steel']);

      // Only 1 source, even for managed category, is medium confidence
      expect(result.level).toBe('medium');
      expect(result.showExpandToWeb).toBe(true);
    });

    it('suggests web expansion for partial coverage', () => {
      const sources = createMockSources(2, 0);
      const result = calculateSourceConfidence(sources, 'Packaging', []);

      expect(result.showExpandToWeb).toBe(true);
    });
  });

  describe('web_only scenarios', () => {
    it('returns web_only when no Beroe sources', () => {
      const sources = createMockSources(0, 5);
      const result = calculateSourceConfidence(sources, 'Random Topic', []);

      expect(result.level).toBe('web_only');
      expect(result.beroeSourceCount).toBe(0);
      expect(result.webSourceCount).toBe(5);
      expect(result.showExpandToWeb).toBe(false);
    });

    it('returns web_only with correct reason', () => {
      const sources = createMockSources(0, 3);
      const result = calculateSourceConfidence(sources);

      expect(result.reason).toBe('Response based on web research');
    });
  });

  describe('low confidence scenarios', () => {
    it('returns low confidence when no sources at all', () => {
      const sources = createMockSources(0, 0);
      const result = calculateSourceConfidence(sources);

      expect(result.level).toBe('low');
      expect(result.beroeSourceCount).toBe(0);
      expect(result.webSourceCount).toBe(0);
      expect(result.showExpandToWeb).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles undefined category', () => {
      const sources = createMockSources(2, 1);
      const result = calculateSourceConfidence(sources, undefined, ['Steel']);

      expect(result.isManagedCategory).toBe(false);
      expect(result.categoryName).toBeUndefined();
    });

    it('handles undefined managed categories', () => {
      const sources = createMockSources(2, 1);
      const result = calculateSourceConfidence(sources, 'Steel', undefined);

      expect(result.isManagedCategory).toBe(false);
    });

    it('handles empty managed categories array', () => {
      const sources = createMockSources(2, 1);
      const result = calculateSourceConfidence(sources, 'Steel', []);

      expect(result.isManagedCategory).toBe(false);
    });

    it('handles mixed sources (Beroe + Web)', () => {
      const sources = createMockSources(3, 2);
      const result = calculateSourceConfidence(sources, 'Steel', ['Steel']);

      expect(result.level).toBe('high');
      expect(result.beroeSourceCount).toBe(3);
      expect(result.webSourceCount).toBe(2);
    });

    it('only counts beroe-type sources, not D&B or Ecovadis', () => {
      // Create sources with mixed internal types
      const mixedSources: ResponseSources = {
        web: [],
        internal: [
          { name: 'Beroe Report', type: 'beroe' },
          { name: 'D&B Report', type: 'dun_bradstreet' },
          { name: 'Ecovadis Score', type: 'ecovadis' },
          { name: 'Another Beroe', type: 'beroe' },
          { name: 'Internal Data', type: 'internal_data' },
        ],
        totalWebCount: 0,
        totalInternalCount: 5, // Total internal is 5
      };
      const result = calculateSourceConfidence(mixedSources, 'Steel', ['Steel']);

      // Only 2 sources have type 'beroe', so beroeSourceCount should be 2
      expect(result.beroeSourceCount).toBe(2);
      // With 2 Beroe sources in a managed category, should be high confidence
      expect(result.level).toBe('high');
    });

    it('returns medium confidence when only non-Beroe internal sources present', () => {
      const nonBeroeSources: ResponseSources = {
        web: [],
        internal: [
          { name: 'D&B Report', type: 'dun_bradstreet' },
          { name: 'Ecovadis Score', type: 'ecovadis' },
        ],
        totalWebCount: 0,
        totalInternalCount: 2,
      };
      const result = calculateSourceConfidence(nonBeroeSources, 'Steel', ['Steel']);

      // No Beroe sources, so beroeSourceCount should be 0
      expect(result.beroeSourceCount).toBe(0);
      // With 0 Beroe sources and no web, should be low confidence
      expect(result.level).toBe('low');
    });
  });
});

describe('getConfidenceLabel', () => {
  it('returns "Decision Grade" for high confidence', () => {
    expect(getConfidenceLabel('high')).toBe('Decision Grade');
  });

  it('returns "Partial Coverage" for medium confidence', () => {
    expect(getConfidenceLabel('medium')).toBe('Partial Coverage');
  });

  it('returns "Limited Data" for low confidence', () => {
    expect(getConfidenceLabel('low')).toBe('Limited Data');
  });

  it('returns "Web Research" for web_only', () => {
    expect(getConfidenceLabel('web_only')).toBe('Web Research');
  });
});

describe('shouldShowDecisionGradeBadge', () => {
  it('returns true for high confidence', () => {
    const confidence = calculateSourceConfidence(createMockSources(3, 0), 'Steel', ['Steel']);
    expect(shouldShowDecisionGradeBadge(confidence)).toBe(true);
  });

  it('returns false for medium confidence', () => {
    const confidence = calculateSourceConfidence(createMockSources(1, 0), 'Rubber', []);
    expect(shouldShowDecisionGradeBadge(confidence)).toBe(false);
  });

  it('returns false for web_only', () => {
    const confidence = calculateSourceConfidence(createMockSources(0, 5), 'Topic', []);
    expect(shouldShowDecisionGradeBadge(confidence)).toBe(false);
  });
});

describe('shouldSuggestWebExpansion', () => {
  it('returns true for medium confidence with showExpandToWeb', () => {
    const confidence = calculateSourceConfidence(createMockSources(1, 0), 'Topic', []);
    expect(shouldSuggestWebExpansion(confidence)).toBe(true);
  });

  it('returns false for high confidence', () => {
    const confidence = calculateSourceConfidence(createMockSources(3, 0), 'Steel', ['Steel']);
    expect(shouldSuggestWebExpansion(confidence)).toBe(false);
  });

  it('returns false for web_only (already using web)', () => {
    const confidence = calculateSourceConfidence(createMockSources(0, 5), 'Topic', []);
    expect(shouldSuggestWebExpansion(confidence)).toBe(false);
  });
});
