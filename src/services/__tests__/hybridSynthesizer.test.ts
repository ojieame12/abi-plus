import { describe, it, expect, vi } from 'vitest';
import {
  countCitations,
  validateCitations,
  parseJsonResponse,
} from '../hybridSynthesizer';

describe('countCitations', () => {
  it('counts B-prefix citations', () => {
    const text = 'Steel prices rose 3% [B1] due to demand [B2] and supply constraints [B3].';
    expect(countCitations(text, 'B')).toBe(3);
  });

  it('counts W-prefix citations', () => {
    const text = 'Market analysts [W1] report strong demand [W2].';
    expect(countCitations(text, 'W')).toBe(2);
  });

  it('counts only specified prefix', () => {
    const text = 'Internal data [B1] aligns with market research [W1][W2].';
    expect(countCitations(text, 'B')).toBe(1);
    expect(countCitations(text, 'W')).toBe(2);
  });

  it('returns 0 for text without citations', () => {
    const text = 'No citations in this text.';
    expect(countCitations(text, 'B')).toBe(0);
    expect(countCitations(text, 'W')).toBe(0);
  });

  it('handles sequential citations', () => {
    const text = 'Both sources agree [B1][W1] on this point.';
    expect(countCitations(text, 'B')).toBe(1);
    expect(countCitations(text, 'W')).toBe(1);
  });

  it('handles multi-digit citation numbers', () => {
    const text = 'Many sources [B10][B11][W15] were consulted.';
    expect(countCitations(text, 'B')).toBe(2);
    expect(countCitations(text, 'W')).toBe(1);
  });
});

describe('validateCitations', () => {
  it('keeps valid citations', () => {
    const text = 'Prices up [B1] and demand strong [W1].';
    const valid = new Set(['B1', 'W1']);

    const result = validateCitations(text, valid);

    expect(result.text).toBe(text);
    expect(result.unknownCitations).toHaveLength(0);
  });

  it('removes unknown citations', () => {
    const text = 'Data shows [B1] and [B5] indicate trends.';
    const valid = new Set(['B1']); // B5 is not valid

    const result = validateCitations(text, valid);

    expect(result.text).toBe('Data shows [B1] and  indicate trends.');
    expect(result.unknownCitations).toEqual(['B5']);
  });

  it('tracks all unknown citations', () => {
    const text = 'Sources [X1][Y2][B99] not in pool.';
    const valid = new Set(['B1', 'W1']); // None of X1, Y2, B99 are valid

    const result = validateCitations(text, valid);

    // X1 and Y2 don't match [BW]\d+ pattern, only B99 is caught
    expect(result.unknownCitations).toEqual(['B99']);
  });

  it('handles mixed valid and invalid citations', () => {
    const text = 'Valid [B1] and invalid [B10][W5] plus valid [W1].';
    const valid = new Set(['B1', 'W1']);

    const result = validateCitations(text, valid);

    expect(result.text).toBe('Valid [B1] and invalid  plus valid [W1].');
    expect(result.unknownCitations).toContain('B10');
    expect(result.unknownCitations).toContain('W5');
  });

  it('handles text with no citations', () => {
    const text = 'No citations here.';
    const valid = new Set(['B1', 'W1']);

    const result = validateCitations(text, valid);

    expect(result.text).toBe(text);
    expect(result.unknownCitations).toHaveLength(0);
  });
});

describe('parseJsonResponse', () => {
  it('parses valid JSON response', () => {
    const response = `{
      "content": "Steel prices rose 3% [B1].",
      "agreementLevel": "high",
      "keyInsight": "Prices are up"
    }`;

    const result = parseJsonResponse(response);

    expect(result.content).toBe('Steel prices rose 3% [B1].');
    expect(result.agreementLevel).toBe('high');
    expect(result.keyInsight).toBe('Prices are up');
  });

  it('extracts JSON from mixed content', () => {
    const response = `Here is my analysis:

    {"content": "Analysis complete [B1].", "agreementLevel": "medium"}

    Let me know if you need more.`;

    const result = parseJsonResponse(response);

    expect(result.content).toBe('Analysis complete [B1].');
    expect(result.agreementLevel).toBe('medium');
  });

  it('falls back to raw text for invalid JSON', () => {
    const response = 'This is plain text without JSON.';

    const result = parseJsonResponse(response);

    expect(result.content).toBe(response);
    expect(result.agreementLevel).toBeUndefined();
  });

  it('falls back if JSON has no content field', () => {
    const response = '{"message": "Hello", "status": "ok"}';

    const result = parseJsonResponse(response);

    // Falls back because content is not a string
    expect(result.content).toBe(response);
  });

  it('handles malformed JSON gracefully', () => {
    const response = '{"content": "incomplete...';

    const result = parseJsonResponse(response);

    expect(result.content).toBe(response);
  });
});

describe('Citation format validation', () => {
  it('only matches B and W prefixes', () => {
    const text = '[A1] [B1] [C1] [W1] [X1]';

    // Only B and W should be counted
    expect(countCitations(text, 'B')).toBe(1);
    expect(countCitations(text, 'W')).toBe(1);
  });

  it('requires digit after prefix', () => {
    const text = '[B] [W] [B1] [W2]';

    expect(countCitations(text, 'B')).toBe(1);
    expect(countCitations(text, 'W')).toBe(1);
  });

  it('handles citations at different positions', () => {
    const text = '[B1] at start, middle [W1], and [B2] at end.';

    expect(countCitations(text, 'B')).toBe(2);
    expect(countCitations(text, 'W')).toBe(1);
  });
});
