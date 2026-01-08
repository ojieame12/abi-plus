// Thread Similarity Service Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findSimilarThreads,
  hasSimilarThreads,
  getThreadById,
} from '../threadSimilarity';
import * as api from '../api';

// Mock the API module
vi.mock('../api');

const mockQuestions = [
  {
    id: 'q1',
    title: 'Aluminum pricing volatility in APAC region',
    body: 'Looking for insights on aluminum price trends in the Asia-Pacific market...',
    answerCount: 12,
    score: 15,
    tags: [{ id: 't1', name: 'Raw Materials', slug: 'raw-materials', questionCount: 10 }],
    author: { displayName: 'Sarah Chen', avatarUrl: undefined },
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 'q2',
    title: 'Supplier risk assessment best practices',
    body: 'What frameworks do you use for evaluating supplier risk?',
    answerCount: 8,
    score: 10,
    tags: [{ id: 't2', name: 'Risk Management', slug: 'risk-management', questionCount: 5 }],
    author: { displayName: 'John Doe' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
  },
];

describe('Thread Similarity Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(api.apiFetch).mockResolvedValue({
      questions: mockQuestions,
      totalCount: 2,
    });
  });

  // ════════════════════════════════════════════════════════════════
  // findSimilarThreads
  // ════════════════════════════════════════════════════════════════

  describe('findSimilarThreads', () => {
    it('returns empty array for short queries', async () => {
      const result = await findSimilarThreads('hi');
      expect(result).toEqual([]);
      expect(api.apiFetch).not.toHaveBeenCalled();
    });

    it('returns empty array for empty query', async () => {
      const result = await findSimilarThreads('');
      expect(result).toEqual([]);
      expect(api.apiFetch).not.toHaveBeenCalled();
    });

    it('calls API with search parameter', async () => {
      await findSimilarThreads('aluminum pricing');
      expect(api.apiFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/community/questions?')
      );
      expect(api.apiFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=aluminum+pricing')
      );
    });

    it('returns threads matching the query', async () => {
      const result = await findSimilarThreads('aluminum pricing');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toContain('Aluminum');
    });

    it('converts Question to SimilarThread format', async () => {
      const result = await findSimilarThreads('aluminum pricing');
      const thread = result[0];

      expect(thread).toHaveProperty('id');
      expect(thread).toHaveProperty('title');
      expect(thread).toHaveProperty('replyCount');
      expect(thread).toHaveProperty('lastActivity');
      expect(thread).toHaveProperty('relevanceScore');
      expect(thread).toHaveProperty('category');
      expect(thread).toHaveProperty('author');
      expect(thread).toHaveProperty('snippet');
    });

    it('respects limit option', async () => {
      // Mock more questions
      vi.mocked(api.apiFetch).mockResolvedValueOnce({
        questions: [...mockQuestions, ...mockQuestions.map(q => ({ ...q, id: q.id + '-2' }))],
        totalCount: 4,
      });

      const result = await findSimilarThreads('supplier risk assessment', { limit: 2 });
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('excludes specified thread IDs', async () => {
      const result = await findSimilarThreads('aluminum pricing', {
        excludeIds: ['q1'],
      });
      expect(result.every(t => t.id !== 'q1')).toBe(true);
    });

    it('returns threads sorted by relevance score', async () => {
      const result = await findSimilarThreads('aluminum pricing');
      if (result.length >= 2) {
        const scores = result.map(t => t.relevanceScore);
        const sortedScores = [...scores].sort((a, b) => b - a);
        expect(scores).toEqual(sortedScores);
      }
    });

    it('handles API errors gracefully', async () => {
      vi.mocked(api.apiFetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await findSimilarThreads('aluminum pricing');
      expect(result).toEqual([]);
    });

    it('formats lastActivity as relative time', async () => {
      const result = await findSimilarThreads('aluminum pricing');
      expect(result[0].lastActivity).toMatch(/ago|today/);
    });

    it('extracts category from first tag', async () => {
      const result = await findSimilarThreads('aluminum pricing');
      expect(result[0].category).toBe('Raw Materials');
    });

    it('extracts author name from displayName', async () => {
      const result = await findSimilarThreads('aluminum pricing');
      expect(result[0].author?.name).toBe('Sarah Chen');
    });
  });

  // ════════════════════════════════════════════════════════════════
  // hasSimilarThreads
  // ════════════════════════════════════════════════════════════════

  describe('hasSimilarThreads', () => {
    it('returns true when similar threads exist', async () => {
      const result = await hasSimilarThreads('aluminum pricing', 0.3);
      expect(result).toBe(true);
    });

    it('returns false when no threads match threshold', async () => {
      // Return questions that won't match the query well
      vi.mocked(api.apiFetch).mockResolvedValueOnce({
        questions: [{
          ...mockQuestions[0],
          title: 'Completely unrelated topic',
          body: 'Nothing about the search term',
        }],
        totalCount: 1,
      });

      const result = await hasSimilarThreads('xyz unique query', 0.9);
      expect(result).toBe(false);
    });

    it('returns false for empty results', async () => {
      vi.mocked(api.apiFetch).mockResolvedValueOnce({
        questions: [],
        totalCount: 0,
      });

      const result = await hasSimilarThreads('unique query xyz');
      expect(result).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // getThreadById
  // ════════════════════════════════════════════════════════════════

  describe('getThreadById', () => {
    it('returns thread for valid ID', async () => {
      vi.mocked(api.apiFetch).mockResolvedValueOnce(mockQuestions[0]);

      const thread = await getThreadById('q1');
      expect(thread).not.toBeNull();
      expect(thread?.id).toBe('q1');
    });

    it('returns null on API error', async () => {
      vi.mocked(api.apiFetch).mockRejectedValueOnce(new Error('Not found'));

      const thread = await getThreadById('non-existent-id');
      expect(thread).toBeNull();
    });

    it('calls correct API endpoint', async () => {
      vi.mocked(api.apiFetch).mockResolvedValueOnce(mockQuestions[0]);

      await getThreadById('q1');
      expect(api.apiFetch).toHaveBeenCalledWith('/api/community/questions/q1');
    });
  });
});
