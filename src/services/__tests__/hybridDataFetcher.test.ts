import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildEvidencePool } from '../hybridDataFetcher';
import type { BeroeDataResult, WebDataResult } from '../../types/hybridResponse';

// Note: Full fetchHybridData tests would require mocking the API calls
// These unit tests focus on the pure functions

describe('buildEvidencePool', () => {
  it('assigns B1, B2 to Beroe sources and W1, W2 to web sources', () => {
    const beroe: BeroeDataResult = {
      content: 'Beroe analysis content',
      sources: [
        { name: 'Beroe Steel Report', type: 'beroe' },
        { name: 'Beroe Aluminum Report', type: 'beroe' },
      ],
    };

    const web: WebDataResult = {
      content: 'Web research content',
      sources: [
        { name: 'Reuters', url: 'https://reuters.com/article', domain: 'reuters.com' },
        { name: 'Bloomberg', url: 'https://bloomberg.com/news', domain: 'bloomberg.com' },
      ],
    };

    const pool = buildEvidencePool(beroe, web);

    expect(pool).toHaveLength(4);
    expect(pool[0].id).toBe('B1');
    expect(pool[0].type).toBe('beroe');
    expect(pool[0].name).toBe('Beroe Steel Report');
    expect(pool[1].id).toBe('B2');
    expect(pool[1].type).toBe('beroe');
    expect(pool[2].id).toBe('W1');
    expect(pool[2].type).toBe('web');
    expect(pool[2].url).toBe('https://reuters.com/article');
    expect(pool[3].id).toBe('W2');
    expect(pool[3].type).toBe('web');
  });

  it('handles null web data (Beroe only)', () => {
    const beroe: BeroeDataResult = {
      content: 'Beroe only content',
      sources: [
        { name: 'Market Report', type: 'beroe' },
      ],
    };

    const pool = buildEvidencePool(beroe, null);

    expect(pool).toHaveLength(1);
    expect(pool[0].id).toBe('B1');
    expect(pool[0].type).toBe('beroe');
  });

  it('handles empty sources gracefully', () => {
    const beroe: BeroeDataResult = {
      content: 'No sources available',
      sources: [],
    };

    const web: WebDataResult = {
      content: 'No web sources',
      sources: [],
    };

    const pool = buildEvidencePool(beroe, web);

    expect(pool).toHaveLength(0);
  });

  it('assigns citationId back to sources for later lookup', () => {
    const beroe: BeroeDataResult = {
      content: 'test',
      sources: [
        { name: 'Report 1', type: 'beroe' },
        { name: 'Report 2', type: 'beroe' },
      ],
    };

    const web: WebDataResult = {
      content: 'test',
      sources: [
        { name: 'Article', url: 'https://example.com', domain: 'example.com' },
      ],
    };

    buildEvidencePool(beroe, web);

    // Check that citationIds were assigned to the original sources
    expect(beroe.sources[0].citationId).toBe('B1');
    expect(beroe.sources[1].citationId).toBe('B2');
    expect(web.sources[0].citationId).toBe('W1');
  });

  it('preserves source metadata in citations', () => {
    const beroe: BeroeDataResult = {
      content: 'test',
      sources: [
        {
          name: 'Beroe Intelligence Report',
          type: 'beroe',
          reportId: 'report-123',
          category: 'Metals',
          summary: 'Comprehensive steel analysis',
        },
      ],
    };

    const web: WebDataResult = {
      content: 'test',
      sources: [
        {
          name: 'Market Watch',
          url: 'https://marketwatch.com/steel',
          domain: 'marketwatch.com',
          snippet: 'Steel prices surge amid...',
        },
      ],
    };

    const pool = buildEvidencePool(beroe, web);

    // Check Beroe citation has report metadata
    expect(pool[0].reportId).toBe('report-123');
    expect(pool[0].category).toBe('Metals');
    expect(pool[0].snippet).toBe('Comprehensive steel analysis');

    // Check Web citation has URL and snippet
    expect(pool[1].url).toBe('https://marketwatch.com/steel');
    expect(pool[1].snippet).toBe('Steel prices surge amid...');
  });

  it('handles mixed Beroe source types (only beroe type gets B prefix)', () => {
    const beroe: BeroeDataResult = {
      content: 'test',
      sources: [
        { name: 'Beroe Report', type: 'beroe' },
        { name: 'D&B Report', type: 'dun_bradstreet' },
        { name: 'Ecovadis Score', type: 'ecovadis' },
      ],
    };

    const pool = buildEvidencePool(beroe, null);

    // All internal sources get B prefix regardless of specific type
    // The "beroe" vs "dun_bradstreet" distinction is in the type field
    expect(pool).toHaveLength(3);
    expect(pool[0].id).toBe('B1');
    expect(pool[0].type).toBe('beroe');
    expect(pool[1].id).toBe('B2');
    expect(pool[1].type).toBe('beroe'); // buildEvidencePool uses 'beroe' as generic internal type
    expect(pool[2].id).toBe('B3');
  });
});

describe('Citation ID format', () => {
  it('uses B prefix for Beroe/internal sources', () => {
    const beroe: BeroeDataResult = {
      content: 'test',
      sources: [{ name: 'Report', type: 'beroe' }],
    };

    const pool = buildEvidencePool(beroe, null);

    expect(pool[0].id).toMatch(/^B\d+$/);
  });

  it('uses W prefix for web sources', () => {
    const beroe: BeroeDataResult = {
      content: 'test',
      sources: [],
    };

    const web: WebDataResult = {
      content: 'test',
      sources: [{ name: 'Article', url: 'https://test.com', domain: 'test.com' }],
    };

    const pool = buildEvidencePool(beroe, web);

    expect(pool[0].id).toMatch(/^W\d+$/);
  });

  it('numbers citations sequentially starting from 1', () => {
    const beroe: BeroeDataResult = {
      content: 'test',
      sources: [
        { name: 'Report 1', type: 'beroe' },
        { name: 'Report 2', type: 'beroe' },
        { name: 'Report 3', type: 'beroe' },
      ],
    };

    const web: WebDataResult = {
      content: 'test',
      sources: [
        { name: 'Article 1', url: 'https://1.com', domain: '1.com' },
        { name: 'Article 2', url: 'https://2.com', domain: '2.com' },
      ],
    };

    const pool = buildEvidencePool(beroe, web);

    expect(pool.map(c => c.id)).toEqual(['B1', 'B2', 'B3', 'W1', 'W2']);
  });
});
