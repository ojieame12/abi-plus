import { describe, it, expect } from 'vitest';
import { buildInterestContext } from '../ai';

describe('buildInterestContext', () => {
  // ============================================
  // EMPTY
  // ============================================
  describe('Empty', () => {
    it('returns empty string for undefined interests', () => {
      expect(buildInterestContext(undefined)).toBe('');
    });

    it('returns empty string for empty array', () => {
      expect(buildInterestContext([])).toBe('');
    });
  });

  // ============================================
  // SINGLE
  // ============================================
  describe('Single', () => {
    it('formats single interest correctly', () => {
      const result = buildInterestContext(['Steel - HRC - Europe']);
      expect(result).toContain('USER INTERESTS');
      expect(result).toContain('- Steel - HRC - Europe');
      expect(result).toContain('Only reference these interests when directly relevant');
    });

    it('includes count header', () => {
      const result = buildInterestContext(['Steel']);
      expect(result).toContain('1 of 1');
    });
  });

  // ============================================
  // MULTIPLE
  // ============================================
  describe('Multiple', () => {
    it('formats as bullet list', () => {
      const result = buildInterestContext([
        'Steel - HRC - Europe',
        'Corrugated Packaging - North America',
        'Aluminum Pricing Volatility',
      ]);

      expect(result).toContain('USER INTERESTS');
      expect(result).toContain('- Steel - HRC - Europe');
      expect(result).toContain('- Corrugated Packaging - North America');
      expect(result).toContain('- Aluminum Pricing Volatility');
    });

    it('each interest is on its own line', () => {
      const result = buildInterestContext(['A', 'B', 'C']);
      const lines = result.split('\n').filter(l => l.startsWith('- '));
      expect(lines).toHaveLength(3);
    });
  });

  // ============================================
  // CAPPING
  // ============================================
  describe('Capping', () => {
    it('caps at 10 most recent interests', () => {
      const interests = Array.from({ length: 20 }, (_, i) => `Interest ${i + 1}`);
      const result = buildInterestContext(interests);

      // Should include the last 10 (most recent)
      expect(result).toContain('- Interest 11');
      expect(result).toContain('- Interest 20');
      // Should NOT include the first 10
      expect(result).not.toContain('- Interest 1\n');
      expect(result).not.toContain('- Interest 10\n');
    });

    it('shows count of total vs injected', () => {
      const interests = Array.from({ length: 25 }, (_, i) => `Interest ${i + 1}`);
      const result = buildInterestContext(interests);
      expect(result).toContain('10 of 25');
    });

    it('does not cap when under limit', () => {
      const interests = ['A', 'B', 'C'];
      const result = buildInterestContext(interests);
      expect(result).toContain('3 of 3');
      expect(result).toContain('- A');
      expect(result).toContain('- B');
      expect(result).toContain('- C');
    });
  });

  // ============================================
  // RELEVANCE INSTRUCTION
  // ============================================
  describe('Relevance instruction', () => {
    it('includes "do not force connections" instruction', () => {
      const result = buildInterestContext(['Steel']);
      expect(result).toContain('Do not force connections');
    });
  });
});
