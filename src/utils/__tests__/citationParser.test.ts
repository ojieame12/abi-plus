import { describe, it, expect } from 'vitest';
import {
  parseContentWithCitations,
  extractCitationIds,
  extractCitationIdsByType,
  hasCitations,
  countTotalCitations,
  stripCitations,
  humanizeCitations,
  getCitationStats,
} from '../citationParser';

describe('parseContentWithCitations', () => {
  it('parses text with citations into segments', () => {
    const content = 'Steel prices up 3% [B1] due to demand [W1].';
    const citations = {
      B1: { id: 'B1', type: 'beroe', name: 'Report' },
      W1: { id: 'W1', type: 'web', name: 'Reuters' },
    };

    const segments = parseContentWithCitations(content, citations as any);

    expect(segments).toHaveLength(5);
    expect(segments[0]).toEqual({ type: 'text', content: 'Steel prices up 3% ' });
    expect(segments[1]).toEqual({ type: 'citation', content: 'B1', citationId: 'B1', sourceType: 'beroe' });
    expect(segments[2]).toEqual({ type: 'text', content: ' due to demand ' });
    expect(segments[3]).toEqual({ type: 'citation', content: 'W1', citationId: 'W1', sourceType: 'web' });
    expect(segments[4]).toEqual({ type: 'text', content: '.' });
  });

  it('handles multiple citations in sequence', () => {
    const content = 'Both sources agree [B1][W1] on this.';
    const citations = {
      B1: { id: 'B1', type: 'beroe', name: 'R1' },
      W1: { id: 'W1', type: 'web', name: 'R2' },
    };

    const segments = parseContentWithCitations(content, citations as any);

    expect(segments).toHaveLength(4);
    expect(segments[0]).toEqual({ type: 'text', content: 'Both sources agree ' });
    expect(segments[1].citationId).toBe('B1');
    expect(segments[2].citationId).toBe('W1');
    expect(segments[3]).toEqual({ type: 'text', content: ' on this.' });
  });

  it('handles content with no citations', () => {
    const content = 'Just plain text.';
    const segments = parseContentWithCitations(content, {});

    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ type: 'text', content: 'Just plain text.' });
  });

  it('treats unknown citations as text', () => {
    // [X1] doesn't match [BW]\d+ pattern, so it stays as plain text
    const content = 'Unknown [X1] citation.';
    const segments = parseContentWithCitations(content, {});

    // [X1] is not a valid citation pattern, so entire string is one text segment
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ type: 'text', content: 'Unknown [X1] citation.' });
  });

  it('treats unmapped B/W citations as text', () => {
    // [B99] matches the pattern but is not in the citations map
    const content = 'Unknown [B99] citation.';
    const segments = parseContentWithCitations(content, {});

    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ type: 'text', content: 'Unknown ' });
    expect(segments[1]).toEqual({ type: 'text', content: '[B99]' });
    expect(segments[2]).toEqual({ type: 'text', content: ' citation.' });
  });

  it('handles empty content', () => {
    const segments = parseContentWithCitations('', {});
    expect(segments).toHaveLength(0);
  });

  it('handles citation at start of content', () => {
    const content = '[B1] This starts with citation.';
    const citations = { B1: { type: 'beroe', name: 'Report' } };

    const segments = parseContentWithCitations(content, citations as any);

    expect(segments[0].type).toBe('citation');
    expect(segments[0].citationId).toBe('B1');
  });

  it('handles citation at end of content', () => {
    const content = 'This ends with citation [W1]';
    const citations = { W1: { type: 'web', name: 'Article', url: 'https://test.com', domain: 'test.com' } };

    const segments = parseContentWithCitations(content, citations as any);

    expect(segments[segments.length - 1].type).toBe('citation');
    expect(segments[segments.length - 1].citationId).toBe('W1');
  });

  it('assigns correct sourceType for Beroe citations', () => {
    const content = 'Data [B1] shows trends.';
    const citations = { B1: { type: 'beroe', name: 'Report' } };

    const segments = parseContentWithCitations(content, citations as any);
    const citationSegment = segments.find(s => s.type === 'citation');

    expect(citationSegment?.sourceType).toBe('beroe');
  });

  it('assigns correct sourceType for Web citations', () => {
    const content = 'News [W1] reports.';
    const citations = { W1: { url: 'https://test.com', domain: 'test.com', name: 'Article' } };

    const segments = parseContentWithCitations(content, citations as any);
    const citationSegment = segments.find(s => s.type === 'citation');

    expect(citationSegment?.sourceType).toBe('web');
  });
});

describe('extractCitationIds', () => {
  it('extracts all unique citation IDs', () => {
    const content = 'Prices [B1] and demand [W1][W2] with [B1] repeated.';
    const ids = extractCitationIds(content);

    expect(ids).toEqual(['B1', 'W1', 'W2']);
  });

  it('returns empty array for content without citations', () => {
    const ids = extractCitationIds('No citations here.');
    expect(ids).toEqual([]);
  });

  it('handles empty content', () => {
    const ids = extractCitationIds('');
    expect(ids).toEqual([]);
  });

  it('handles multi-digit citations', () => {
    const content = 'Sources [B10][W15][B2].';
    const ids = extractCitationIds(content);

    expect(ids).toContain('B10');
    expect(ids).toContain('W15');
    expect(ids).toContain('B2');
  });
});

describe('extractCitationIdsByType', () => {
  it('separates Beroe and Web citations', () => {
    const content = '[B1][W1][B2][W2][B3]';
    const result = extractCitationIdsByType(content);

    expect(result.beroe).toEqual(['B1', 'B2', 'B3']);
    expect(result.web).toEqual(['W1', 'W2']);
  });

  it('handles content with only Beroe citations', () => {
    const content = '[B1][B2]';
    const result = extractCitationIdsByType(content);

    expect(result.beroe).toEqual(['B1', 'B2']);
    expect(result.web).toEqual([]);
  });

  it('handles content with only Web citations', () => {
    const content = '[W1][W2]';
    const result = extractCitationIdsByType(content);

    expect(result.beroe).toEqual([]);
    expect(result.web).toEqual(['W1', 'W2']);
  });
});

describe('hasCitations', () => {
  it('returns true for content with citations', () => {
    expect(hasCitations('Text with [B1] citation.')).toBe(true);
    expect(hasCitations('Text with [W1] citation.')).toBe(true);
  });

  it('returns false for content without citations', () => {
    expect(hasCitations('Plain text.')).toBe(false);
    expect(hasCitations('[X1] invalid prefix')).toBe(false);
    expect(hasCitations('[B] no number')).toBe(false);
  });
});

describe('countTotalCitations', () => {
  it('counts unique citations', () => {
    expect(countTotalCitations('[B1][W1][B2]')).toBe(3);
    expect(countTotalCitations('[B1][B1][B1]')).toBe(1); // Unique only
    expect(countTotalCitations('No citations')).toBe(0);
  });
});

describe('stripCitations', () => {
  it('removes all citation markers', () => {
    const content = 'Prices up [B1] due to demand [W1].';
    expect(stripCitations(content)).toBe('Prices up  due to demand .');
  });

  it('handles content without citations', () => {
    const content = 'Plain text.';
    expect(stripCitations(content)).toBe('Plain text.');
  });
});

describe('humanizeCitations', () => {
  it('replaces citations with source names', () => {
    const content = 'Prices up [B1].';
    const citations = { B1: { name: 'Beroe Steel Report' } };

    expect(humanizeCitations(content, citations)).toBe('Prices up (Beroe Steel Report).');
  });

  it('keeps citation marker if name not available', () => {
    const content = 'Data [B1] shows.';
    const citations = { B1: {} }; // No name

    expect(humanizeCitations(content, citations)).toBe('Data [B1] shows.');
  });

  it('keeps citation marker if not in map', () => {
    const content = 'Unknown [B99].';
    const citations = { B1: { name: 'Report' } };

    expect(humanizeCitations(content, citations)).toBe('Unknown [B99].');
  });
});

describe('getCitationStats', () => {
  it('returns complete statistics', () => {
    const content = '[B1][W1][B2][W2][B1]'; // B1 repeated
    const stats = getCitationStats(content);

    expect(stats.total).toBe(4); // Unique count
    expect(stats.beroe).toBe(2);
    expect(stats.web).toBe(2);
    expect(stats.unique).toEqual(['B1', 'W1', 'B2', 'W2']);
  });

  it('handles empty content', () => {
    const stats = getCitationStats('');

    expect(stats.total).toBe(0);
    expect(stats.beroe).toBe(0);
    expect(stats.web).toBe(0);
    expect(stats.unique).toEqual([]);
  });
});
