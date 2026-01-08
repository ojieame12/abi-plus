import { describe, it, expect } from 'vitest';
import { getContextualMockThreads } from '../CommunityEmbedArtifact';

describe('CommunityEmbedArtifact', () => {
  describe('getContextualMockThreads', () => {
    it('returns default threads when no category provided', () => {
      const threads = getContextualMockThreads();
      expect(threads.length).toBeGreaterThan(0);
      // Default threads should have generic categories
      expect(threads[0].id).toMatch(/^thread_/);
    });

    it('returns default threads when category is undefined', () => {
      const threads = getContextualMockThreads(undefined);
      expect(threads[0].id).toMatch(/^thread_/);
    });

    it('returns IT Software threads for "it-software" category', () => {
      const threads = getContextualMockThreads('it-software');
      expect(threads.length).toBe(3);
      expect(threads[0].id).toBe('it_001');
      expect(threads[0].category).toBe('IT Software');
      expect(threads[0].title).toContain('SaaS');
    });

    it('returns IT Software threads for "IT Software" (with spaces)', () => {
      const threads = getContextualMockThreads('IT Software');
      expect(threads[0].id).toBe('it_001');
      expect(threads[0].category).toBe('IT Software');
    });

    it('returns Marketing threads for "marketing" category', () => {
      const threads = getContextualMockThreads('marketing');
      expect(threads.length).toBe(3);
      expect(threads[0].id).toBe('mkt_001');
      expect(threads[0].category).toBe('Marketing');
      expect(threads[0].title).toContain('Agency');
    });

    it('returns Marketing threads for "Marketing" (case insensitive)', () => {
      const threads = getContextualMockThreads('Marketing');
      expect(threads[0].id).toBe('mkt_001');
    });

    it('returns Logistics threads for "logistics" category', () => {
      const threads = getContextualMockThreads('logistics');
      expect(threads.length).toBe(3);
      expect(threads[0].id).toBe('log_001');
      expect(threads[0].category).toBe('Logistics');
      expect(threads[0].title).toContain('Freight');
    });

    it('returns Logistics threads for "Logistics" (case insensitive)', () => {
      const threads = getContextualMockThreads('Logistics');
      expect(threads[0].id).toBe('log_001');
    });

    it('falls back to default for unknown category', () => {
      const threads = getContextualMockThreads('unknown-category');
      expect(threads[0].id).toMatch(/^thread_/);
    });

    it('handles partial match for category containing keyword', () => {
      // "it-software-procurement" should match "it-software"
      const threads = getContextualMockThreads('it-software-procurement');
      expect(threads[0].id).toBe('it_001');
    });

    it('handles partial match for keyword containing category', () => {
      // "it" is contained in "it-software"
      const threads = getContextualMockThreads('it');
      expect(threads[0].id).toBe('it_001');
    });

    it('normalizes category with multiple spaces', () => {
      const threads = getContextualMockThreads('IT   Software');
      expect(threads[0].id).toBe('it_001');
    });

    it('returns threads with expected structure', () => {
      const threads = getContextualMockThreads('marketing');
      const thread = threads[0];

      // Verify thread has all required fields
      expect(thread).toHaveProperty('id');
      expect(thread).toHaveProperty('title');
      expect(thread).toHaveProperty('excerpt');
      expect(thread).toHaveProperty('replyCount');
      expect(thread).toHaveProperty('upvotes');
      expect(thread).toHaveProperty('category');
      expect(thread).toHaveProperty('author');
      expect(thread).toHaveProperty('timeAgo');
      expect(thread).toHaveProperty('isHot');

      // Verify author structure
      expect(thread.author).toHaveProperty('name');
      expect(thread.author).toHaveProperty('company');
      expect(thread.author).toHaveProperty('badge');
    });

    it('returns threads with valid badge values', () => {
      const threads = getContextualMockThreads('it-software');
      const badges = threads.map(t => t.author.badge);

      // Each badge should be null, 'expert', or 'top_contributor'
      badges.forEach(badge => {
        expect([null, 'expert', 'top_contributor']).toContain(badge);
      });
    });

    it('returns at least one hot thread per category', () => {
      const categories = ['it-software', 'marketing', 'logistics'];

      categories.forEach(category => {
        const threads = getContextualMockThreads(category);
        const hotThreads = threads.filter(t => t.isHot);
        expect(hotThreads.length).toBeGreaterThan(0);
      });
    });
  });
});
