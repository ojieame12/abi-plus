// Content Moderation Service Tests
import { describe, it, expect } from 'vitest';
import {
  checkProfanity,
  checkQuestionContent,
  sanitizeText,
} from '../contentModeration';

describe('Content Moderation Service', () => {
  // ════════════════════════════════════════════════════════════════
  // checkProfanity
  // ════════════════════════════════════════════════════════════════

  describe('checkProfanity', () => {
    it('returns not flagged for clean text', () => {
      const result = checkProfanity('This is a clean question about procurement');
      expect(result.flagged).toBe(false);
      expect(result.severity).toBe('none');
      expect(result.flaggedTerms).toHaveLength(0);
    });

    it('detects profanity and returns medium severity', () => {
      const result = checkProfanity('What the hell is going on with damn prices?');
      expect(result.flagged).toBe(true);
      expect(result.severity).toBe('medium');
      expect(result.flaggedTerms.length).toBeGreaterThan(0);
    });

    it('detects hate speech and returns high severity', () => {
      const result = checkProfanity('This supplier is a complete retard');
      expect(result.flagged).toBe(true);
      expect(result.severity).toBe('high');
    });

    it('detects personal attacks and returns low severity', () => {
      const result = checkProfanity('The sales rep is an idiot');
      expect(result.flagged).toBe(true);
      expect(result.severity).toBe('low');
      expect(result.reason).toContain('respectful');
    });

    it('detects threats and returns high severity', () => {
      const result = checkProfanity('I want to kill you');
      expect(result.flagged).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.reason).toContain('threatening');
    });

    it('detects spam patterns', () => {
      const result = checkProfanity('This is greattttttt');
      expect(result.flagged).toBe(true);
      expect(result.severity).toBe('low');
    });

    // Business term allowlist tests
    it('allows business terms that might trigger false positives', () => {
      const businessPhrases = [
        'risk assessment methodology',
        'supply chain classification',
        'mass production capabilities',
        'asset management strategies',
        'assuming normal operations',
        'pass-through pricing',
      ];

      businessPhrases.forEach((phrase) => {
        const result = checkProfanity(phrase);
        expect(result.flagged).toBe(false);
      });
    });

    it('returns empty result for null/undefined input', () => {
      expect(checkProfanity('')).toEqual({
        flagged: false,
        reason: null,
        severity: 'none',
        flaggedTerms: [],
      });
    });

    it('deduplicates flagged terms', () => {
      const result = checkProfanity('damn damn damn prices');
      expect(result.flaggedTerms.filter(t => t === 'damn').length).toBeLessThanOrEqual(1);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // checkQuestionContent
  // ════════════════════════════════════════════════════════════════

  describe('checkQuestionContent', () => {
    it('checks both title and body', () => {
      const result = checkQuestionContent(
        'Clean title here',
        'Clean body content'
      );
      expect(result.flagged).toBe(false);
    });

    it('flags if only title has issues', () => {
      const result = checkQuestionContent(
        'What the damn?',
        'Clean body content here'
      );
      expect(result.flagged).toBe(true);
    });

    it('flags if only body has issues', () => {
      const result = checkQuestionContent(
        'Clean title here',
        'This is such crap'
      );
      expect(result.flagged).toBe(true);
    });

    it('returns highest severity from both fields', () => {
      const result = checkQuestionContent(
        'You idiot', // low severity
        'This is such damn crap' // medium severity
      );
      expect(result.severity).toBe('medium');
    });

    it('combines flagged terms from both fields', () => {
      const result = checkQuestionContent(
        'This is crap',
        'And also damn annoying'
      );
      expect(result.flaggedTerms.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ════════════════════════════════════════════════════════════════
  // sanitizeText
  // ════════════════════════════════════════════════════════════════

  describe('sanitizeText', () => {
    it('masks profanity with asterisks', () => {
      const result = sanitizeText('What the damn!');
      expect(result).toContain('*');
      expect(result).not.toContain('damn');
    });

    it('keeps first and last character for longer words', () => {
      const result = sanitizeText('This is stupid');
      expect(result).toMatch(/s\*+d/);
    });

    it('returns original text if no profanity', () => {
      const clean = 'This is a clean sentence';
      expect(sanitizeText(clean)).toBe(clean);
    });

    it('handles multiple profanity instances', () => {
      const result = sanitizeText('damn crap damn');
      expect(result.match(/\*/g)?.length).toBeGreaterThan(4);
    });
  });
});
