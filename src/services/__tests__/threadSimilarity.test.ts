// Thread Similarity Service Tests
import { describe, it, expect } from 'vitest';
import {
  findSimilarThreads,
  hasSimilarThreads,
  getThreadById,
} from '../threadSimilarity';

describe('Thread Similarity Service', () => {
  // ════════════════════════════════════════════════════════════════
  // findSimilarThreads
  // ════════════════════════════════════════════════════════════════

  describe('findSimilarThreads', () => {
    it('returns empty array for short queries', async () => {
      const result = await findSimilarThreads('hi');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty query', async () => {
      const result = await findSimilarThreads('');
      expect(result).toEqual([]);
    });

    it('finds threads matching aluminum keyword', async () => {
      const result = await findSimilarThreads('aluminum pricing trends');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(t => t.title.toLowerCase().includes('aluminum'))).toBe(true);
    });

    it('finds threads matching supplier risk', async () => {
      const result = await findSimilarThreads('supplier risk assessment');
      expect(result.length).toBeGreaterThan(0);
    });

    it('respects limit option', async () => {
      const result = await findSimilarThreads('supplier risk assessment', {
        limit: 2,
      });
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('respects minScore option', async () => {
      const lowScoreResult = await findSimilarThreads('aluminum prices', {
        minScore: 0.1,
      });
      const highScoreResult = await findSimilarThreads('aluminum prices', {
        minScore: 0.9,
      });
      expect(lowScoreResult.length).toBeGreaterThanOrEqual(highScoreResult.length);
    });

    it('filters by categories when provided', async () => {
      const result = await findSimilarThreads('aluminum pricing', {
        categories: ['Raw Materials'],
      });
      expect(result.every(t => t.category === 'Raw Materials')).toBe(true);
    });

    it('excludes specified thread IDs', async () => {
      const allResults = await findSimilarThreads('aluminum pricing');
      const firstId = allResults[0]?.id;

      if (firstId) {
        const filteredResults = await findSimilarThreads('aluminum pricing', {
          excludeIds: [firstId],
        });
        expect(filteredResults.every(t => t.id !== firstId)).toBe(true);
      }
    });

    it('returns threads sorted by relevance score', async () => {
      const result = await findSimilarThreads('aluminum pricing');
      if (result.length >= 2) {
        const scores = result.map(t => t.relevanceScore);
        const sortedScores = [...scores].sort((a, b) => b - a);
        expect(scores).toEqual(sortedScores);
      }
    });

    it('includes required thread properties', async () => {
      const result = await findSimilarThreads('supplier risk');
      if (result.length > 0) {
        const thread = result[0];
        expect(thread).toHaveProperty('id');
        expect(thread).toHaveProperty('title');
        expect(thread).toHaveProperty('replyCount');
        expect(thread).toHaveProperty('lastActivity');
        expect(thread).toHaveProperty('relevanceScore');
      }
    });

    it('matches synonym terms (aluminium vs aluminum)', async () => {
      const result1 = await findSimilarThreads('aluminum pricing');
      const result2 = await findSimilarThreads('aluminium pricing');
      // Both should find similar threads due to synonym mapping
      expect(result1.length).toBeGreaterThan(0);
      expect(result2.length).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // hasSimilarThreads
  // ════════════════════════════════════════════════════════════════

  describe('hasSimilarThreads', () => {
    it('returns true for queries with similar threads', async () => {
      const result = await hasSimilarThreads('aluminum pricing trends', 0.3);
      expect(result).toBe(true);
    });

    it('returns false for very specific unique queries', async () => {
      const result = await hasSimilarThreads('xyz123abc unique query', 0.9);
      expect(result).toBe(false);
    });

    it('respects custom threshold', async () => {
      // With low threshold, should find similar threads
      const lowThreshold = await hasSimilarThreads('supplier risk', 0.1);
      expect(lowThreshold).toBe(true);

      // With impossibly high threshold, should not find any
      // Note: Use a query that doesn't exactly match mock thread titles
      const highThreshold = await hasSimilarThreads('random unrelated query xyz', 0.99);
      expect(highThreshold).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // getThreadById
  // ════════════════════════════════════════════════════════════════

  describe('getThreadById', () => {
    it('returns thread for valid ID', async () => {
      const thread = await getThreadById('thread-1');
      expect(thread).not.toBeNull();
      expect(thread?.id).toBe('thread-1');
    });

    it('returns null for invalid ID', async () => {
      const thread = await getThreadById('non-existent-id');
      expect(thread).toBeNull();
    });

    it('returns thread with all properties', async () => {
      const thread = await getThreadById('thread-1');
      if (thread) {
        expect(thread).toHaveProperty('id');
        expect(thread).toHaveProperty('title');
        expect(thread).toHaveProperty('replyCount');
        expect(thread).toHaveProperty('lastActivity');
        expect(thread).toHaveProperty('relevanceScore');
      }
    });
  });
});
