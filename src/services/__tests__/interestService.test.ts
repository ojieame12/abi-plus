import { describe, it, expect } from 'vitest';
import {
  getInterests,
  addInterest,
  removeInterest,
  updateInterest,
  isDuplicate,
  extractTopicFromResponse,
  extractInterestContext,
  normalizeLegacyInterests,
  computeCoverage,
} from '../interestService';
import type { Interest } from '../../types/interests';
import { MAX_INTERESTS, canonicalKey, cleanTopicText } from '../../types/interests';

describe('interestService', () => {
  // ============================================
  // CANONICAL KEY
  // ============================================
  describe('canonicalKey', () => {
    it('normalizes to sorted lowercase tokens', () => {
      expect(canonicalKey('Steel - HRC - Europe')).toBe('europe|hrc|steel');
    });

    it('handles reordered input identically', () => {
      expect(canonicalKey('Europe Steel HRC')).toBe('europe|hrc|steel');
      expect(canonicalKey('HRC Steel Europe')).toBe('europe|hrc|steel');
    });

    it('strips punctuation', () => {
      expect(canonicalKey('Steel, EU')).toBe('eu|steel');
      expect(canonicalKey('Steel (Europe)')).toBe('europe|steel');
      expect(canonicalKey('Steel/HRC/Europe')).toBe('europe|hrc|steel');
    });

    it('merges region/grade opts into key', () => {
      expect(canonicalKey('Steel', { region: 'Europe', grade: 'HRC' })).toBe('europe|hrc|steel');
    });

    it('deduplicates tokens', () => {
      expect(canonicalKey('Steel Steel', { region: 'Steel' })).toBe('steel');
    });

    it('handles empty input', () => {
      expect(canonicalKey('')).toBe('');
    });
  });

  // ============================================
  // CLEAN TOPIC TEXT
  // ============================================
  describe('cleanTopicText', () => {
    it('strips region from text', () => {
      expect(cleanTopicText('Steel - Europe', 'Europe')).toBe('Steel');
    });

    it('strips grade from text', () => {
      expect(cleanTopicText('Steel - HRC', undefined, 'HRC')).toBe('Steel');
    });

    it('strips both region and grade', () => {
      expect(cleanTopicText('Steel - HRC - Europe', 'Europe', 'HRC')).toBe('Steel');
    });

    it('preserves text when no region/grade', () => {
      expect(cleanTopicText('Steel Pricing Volatility')).toBe('Steel Pricing Volatility');
    });

    it('returns original if cleaning would empty the string', () => {
      expect(cleanTopicText('Europe HRC', 'Europe', 'HRC')).toBe('Europe HRC');
    });
  });

  // ============================================
  // CRUD
  // ============================================
  describe('CRUD operations', () => {
    it('getInterests returns an array', async () => {
      const interests = await getInterests();
      expect(Array.isArray(interests)).toBe(true);
    });

    it('getInterests includes seed data with canonical keys', async () => {
      const interests = await getInterests();
      expect(interests.length).toBeGreaterThan(0);
      const steel = interests.find(i => i.text === 'Steel');
      expect(steel).toBeDefined();
      expect(steel!.canonicalKey).toBe('europe|hrc|steel');
      expect(steel!.coverage).toBeDefined();
      expect(steel!.coverage!.level).toBe('decision_grade');
    });

    it('addInterest returns interest with canonical key and coverage', async () => {
      const result = await addInterest({
        text: 'Copper - Asia Pacific',
        source: 'manual',
        region: 'Asia Pacific',
      });

      expect(result.id).toBeDefined();
      expect(result.canonicalKey).toBeDefined();
      expect(result.canonicalKey).toContain('copper');
      expect(result.coverage).toBeDefined();
      expect(result.savedAt).toBeDefined();

      // Cleanup
      await removeInterest(result.id);
    });

    it('addInterest resolves text/field conflict', async () => {
      const result = await addInterest({
        text: 'Nickel - Asia',
        source: 'manual',
        region: 'Asia',
      });

      // Text should have "Asia" stripped since it's in the region field
      expect(result.text).toBe('Nickel');
      expect(result.region).toBe('Asia');

      await removeInterest(result.id);
    });

    it('removeInterest removes by id', async () => {
      const added = await addInterest({
        text: 'Temp Interest for Removal',
        source: 'manual',
      });

      await removeInterest(added.id);
      const interests = await getInterests();
      expect(interests.find(i => i.id === added.id)).toBeUndefined();
    });

    it('updateInterest merges partial updates', async () => {
      const added = await addInterest({
        text: 'Update Test Interest',
        source: 'manual',
      });

      const updated = await updateInterest(added.id, {
        region: 'Europe',
        grade: 'HRC',
      });

      expect(updated.text).toBe('Update Test Interest');
      expect(updated.region).toBe('Europe');
      expect(updated.grade).toBe('HRC');

      // Cleanup
      await removeInterest(added.id);
    });
  });

  // ============================================
  // DEDUP (FUZZY)
  // ============================================
  describe('isDuplicate', () => {
    const existing: Interest[] = [
      {
        id: '1',
        text: 'Steel',
        canonicalKey: 'europe|hrc|steel',
        source: 'manual',
        region: 'Europe',
        grade: 'HRC',
        savedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        text: 'Aluminum Pricing',
        canonicalKey: 'aluminum|pricing',
        source: 'chat_inferred',
        savedAt: '2025-01-02T00:00:00.000Z',
      },
    ];

    it('matches exact canonical key', () => {
      expect(isDuplicate(existing, 'Steel - HRC - Europe')).toBe(true);
    });

    it('matches reordered text (EU Steel vs Steel EU)', () => {
      expect(isDuplicate(existing, 'Europe Steel HRC')).toBe(true);
    });

    it('matches with different punctuation', () => {
      expect(isDuplicate(existing, 'Steel, HRC, Europe')).toBe(true);
      expect(isDuplicate(existing, 'Steel/HRC/Europe')).toBe(true);
    });

    it('matches when region/grade passed as opts', () => {
      expect(isDuplicate(existing, 'Steel', { region: 'Europe', grade: 'HRC' })).toBe(true);
    });

    it('matches via token overlap (>= 80%)', () => {
      // "aluminum pricing trends" has 3 tokens, shares 2 with "aluminum|pricing" (2/2 of smaller = 100%) — match
      expect(isDuplicate(existing, 'Aluminum Pricing Trends')).toBe(true);
    });

    it('single-token subset matches existing multi-token interest', () => {
      // "aluminum" (1 token) vs "aluminum|pricing" (2 tokens): smaller set = {aluminum}, 1/1 = 100%
      // This IS a match because the single token is fully contained
      expect(isDuplicate(existing, 'Aluminum')).toBe(true);
    });

    it('does not match when overlap is below 80%', () => {
      // "aluminum copper zinc" shares 1/3 with "aluminum|pricing": smaller is {aluminum,pricing} (2 tokens)
      // shared=1, overlap=1/2=50% — NOT a match
      expect(isDuplicate(existing, 'Aluminum Copper Zinc')).toBe(false);
    });

    it('returns false for clearly different interests', () => {
      expect(isDuplicate(existing, 'Copper - Americas')).toBe(false);
    });

    it('returns false for empty existing array', () => {
      expect(isDuplicate([], 'Steel')).toBe(false);
    });

    it('handles interests without canonical key (backward compat)', () => {
      const legacy: Interest[] = [
        {
          id: '99',
          text: 'Steel HRC Europe',
          canonicalKey: '', // empty key
          source: 'manual',
          savedAt: '2025-01-01T00:00:00.000Z',
        },
      ];
      // Should compute key on the fly and still match
      expect(isDuplicate(legacy, 'Europe Steel HRC')).toBe(true);
    });
  });

  // ============================================
  // COVERAGE (category-matched)
  // ============================================
  describe('computeCoverage', () => {
    it('returns decision_grade when grade is provided but does not penalize base score', () => {
      // With text-only scoring, "Steel" has high recall against steel categories.
      // Region/grade tokens are boost-only, so non-matching grade doesn't cause partial.
      const result = computeCoverage('Steel', 'Europe', 'HRC');
      expect(result.matchedCategory).toBeDefined();
      expect(result.level).toBe('decision_grade');
    });

    it('grade tokens that match category name boost the correct result', () => {
      // "Steel" text + grade "Hot Rolled" → boost pushes steel_hrc above stainless_steel
      const result = computeCoverage('Steel', undefined, 'Hot Rolled');
      expect(result.level).toBe('decision_grade');
      expect(result.matchedCategory).toBeDefined();
      expect(result.matchedCategory!.categoryName.toLowerCase()).toContain('hot rolled');
    });

    it('returns decision_grade for activated categories with matching descriptors', () => {
      // Use tokens that actually appear in category names
      const result = computeCoverage('Steel Hot Rolled Coil');
      expect(result.level).toBe('decision_grade');
      expect(result.matchedCategory).toBeDefined();
      expect(result.matchedCategory!.categoryId).toBe('steel_hrc');
    });

    it('returns decision_grade for activated categories without qualifiers', () => {
      const result = computeCoverage('Copper');
      expect(result.level).toBe('decision_grade');
      expect(result.matchedCategory).toBeDefined();
    });

    it('returns decision_grade for activated specialty metals', () => {
      const result = computeCoverage('Lithium');
      expect(result.level).toBe('decision_grade');
      expect(result.matchedCategory).toBeDefined();
      expect(result.matchedCategory!.isActivated).toBe(true);
    });

    it('returns web_only for unknown commodities', () => {
      const result = computeCoverage('Unicorn Dust');
      expect(result.level).toBe('web_only');
      expect(result.gapReason).toContain('No Beroe coverage');
      expect(result.matchedCategory).toBeUndefined();
    });

    it('returns available for non-activated catalog categories', () => {
      const result = computeCoverage('Rare Earth');
      expect(result.level).toBe('available');
      expect(result.matchedCategory).toBeDefined();
      expect(result.matchedCategory!.isActivated).toBe(false);
      expect(result.gapReason).toContain('available in the Beroe catalog');
    });
  });

  // ============================================
  // TOPIC EXTRACTION
  // ============================================
  describe('extractTopicFromResponse', () => {
    it('extracts commodity names from AI responses', () => {
      const response = 'Steel prices have been volatile in the European market, with HRC prices rising 8% in Q1...'.padEnd(150, '.');
      const result = extractTopicFromResponse(response, 'What is the steel price trend in Europe?');
      expect(result).toContain('Steel');
      expect(result).toContain('Europe');
    });

    it('extracts commodity with grade context', () => {
      const response = 'Hot-rolled coil (HRC) prices in Europe have seen significant movement...'.padEnd(150, '.');
      const result = extractTopicFromResponse(response, 'Show me HRC steel pricing in Europe');
      expect(result).toContain('Steel');
      expect(result).toContain('HRC');
    });

    it('returns null for greetings', () => {
      expect(extractTopicFromResponse('Hello! How can I help you today?', 'Hi there')).toBeNull();
    });

    it('returns null for general responses', () => {
      expect(extractTopicFromResponse("Sure, I'd be happy to help with that.", 'Can you help?')).toBeNull();
    });

    it('handles empty content', () => {
      expect(extractTopicFromResponse('', '')).toBeNull();
      expect(extractTopicFromResponse('', 'test')).toBeNull();
      expect(extractTopicFromResponse('test', '')).toBeNull();
    });

    it('returns null for short non-commodity responses', () => {
      const response = 'I can help you with that.';
      expect(extractTopicFromResponse(response, 'How are you?')).toBeNull();
    });

    it('extracts packaging topics', () => {
      const response = 'Corrugated box prices in North America have been trending upward due to pulp cost increases...'.padEnd(150, '.');
      const result = extractTopicFromResponse(response, 'What about corrugated packaging in North America?');
      expect(result).toContain('Corrugated');
    });
  });

  // ============================================
  // STRUCTURED EXTRACTION
  // ============================================
  describe('extractInterestContext', () => {
    it('returns structured { text, region, grade }', () => {
      const response = 'Steel HRC prices in Europe have risen...'.padEnd(150, '.');
      const result = extractInterestContext(response, 'Show me HRC steel pricing in Europe');
      expect(result).not.toBeNull();
      expect(result!.text).toBe('Steel');
      expect(result!.region).toBe('Europe');
      expect(result!.grade).toBe('HRC');
    });

    it('returns text-only when no region/grade', () => {
      const response = 'Copper prices have been volatile...'.padEnd(150, '.');
      const result = extractInterestContext(response, 'What is happening with copper?');
      expect(result).not.toBeNull();
      expect(result!.text).toBe('Copper');
      expect(result!.region).toBeUndefined();
      expect(result!.grade).toBeUndefined();
    });

    it('returns null for greetings', () => {
      expect(extractInterestContext('Hello!', 'Hi there')).toBeNull();
    });

    it('returns null for empty inputs', () => {
      expect(extractInterestContext('', '')).toBeNull();
    });
  });

  // ============================================
  // LIMITS
  // ============================================
  describe('limits', () => {
    it('MAX_INTERESTS is 50', () => {
      expect(MAX_INTERESTS).toBe(50);
    });
  });

  // ============================================
  // BACKWARD COMPATIBILITY
  // ============================================
  describe('normalizeLegacyInterests', () => {
    it('handles legacy string[] and adds canonical key + coverage', () => {
      const legacy = ['risk', 'sourcing', 'logistics'];
      const normalized = normalizeLegacyInterests(legacy);

      expect(normalized).toHaveLength(3);
      expect(normalized[0].text).toBe('risk');
      expect(normalized[0].source).toBe('manual');
      expect(normalized[0].canonicalKey).toBe('risk');
      expect(normalized[0].coverage).toBeDefined();
      expect(normalized[0].coverage!.level).toBe('web_only');
    });

    it('passes through Interest[] objects and backfills canonical key', () => {
      const interests = [
        {
          id: 'test_1',
          text: 'Steel',
          // Missing canonicalKey — should be backfilled
          source: 'manual' as const,
          region: 'Europe',
          savedAt: '2025-01-01T00:00:00.000Z',
        },
      ];
      const normalized = normalizeLegacyInterests(interests);
      expect(normalized[0].id).toBe('test_1');
      expect(normalized[0].canonicalKey).toBe('europe|steel');
    });

    it('handles mixed array of strings and objects', () => {
      const mixed = [
        'risk',
        {
          id: 'test_1',
          text: 'Steel',
          canonicalKey: 'steel',
          source: 'manual',
          savedAt: '2025-01-01T00:00:00.000Z',
        },
      ];
      const normalized = normalizeLegacyInterests(mixed);
      expect(normalized).toHaveLength(2);
      expect(normalized[0].text).toBe('risk');
      expect(normalized[1].text).toBe('Steel');
    });

    it('handles null/undefined gracefully', () => {
      expect(normalizeLegacyInterests(null)).toEqual([]);
      expect(normalizeLegacyInterests(undefined)).toEqual([]);
    });

    it('handles empty array', () => {
      expect(normalizeLegacyInterests([])).toEqual([]);
    });
  });
});
