import { describe, it, expect } from 'vitest';
import { buildResponseSources } from '../sources';
import type { Source } from '../../types/chat';

describe('buildResponseSources', () => {
  describe('web/news source handling', () => {
    it('keeps web sources with URLs as web sources (not internal)', () => {
      const sources: Source[] = [
        { name: 'Reuters Article', url: 'https://reuters.com/article', type: 'news' },
        { name: 'Web Research', url: 'https://example.com/research', type: 'web' },
      ];

      const result = buildResponseSources(sources);

      // Should be in web array, not internal
      expect(result.web).toHaveLength(2);
      expect(result.internal).toHaveLength(0);
      expect(result.web[0].name).toBe('Reuters Article');
      expect(result.web[1].name).toBe('Web Research');
    });

    it('drops news/web sources without URLs (does not misclassify as internal)', () => {
      const sources: Source[] = [
        { name: 'News Item Without URL', type: 'news' },
        { name: 'Web Source Without URL', type: 'web' },
      ];

      const result = buildResponseSources(sources);

      // Should not appear in either array
      expect(result.web).toHaveLength(0);
      expect(result.internal).toHaveLength(0);
      expect(result.totalWebCount).toBe(0);
      expect(result.totalInternalCount).toBe(0);
    });

    it('processes mixed sources correctly - URL sources to web, internal types to internal', () => {
      const sources: Source[] = [
        { name: 'Beroe Report', type: 'beroe' },
        { name: 'D&B Data', type: 'dun_bradstreet' },
        { name: 'News with URL', url: 'https://news.com/article', type: 'news' },
        { name: 'News without URL', type: 'news' },
      ];

      const result = buildResponseSources(sources);

      // Internal sources
      expect(result.internal).toHaveLength(2);
      expect(result.internal.map(s => s.name)).toContain('Beroe Report');
      expect(result.internal.map(s => s.name)).toContain('D&B Data');

      // Web sources (only the one with URL)
      expect(result.web).toHaveLength(1);
      expect(result.web[0].name).toBe('News with URL');

      // News without URL should be dropped entirely
      const allNames = [...result.web.map(s => s.name), ...result.internal.map(s => s.name)];
      expect(allNames).not.toContain('News without URL');
    });
  });

  describe('provider type mapping', () => {
    it('maps Beroe sources to type beroe (counts toward Decision Grade)', () => {
      const sources: Source[] = [
        { name: 'Beroe Risk Intelligence', type: 'beroe' },
      ];

      const result = buildResponseSources(sources);

      expect(result.internal).toHaveLength(1);
      expect(result.internal[0].type).toBe('beroe');
    });

    it('maps D&B/Moodys to type dun_bradstreet (does not count toward Decision Grade)', () => {
      const sources: Source[] = [
        { name: 'D&B Financial Data', type: 'dun_bradstreet' },
        { name: 'D&B via dnd alias', type: 'dnd' },
      ];

      const result = buildResponseSources(sources);

      expect(result.internal).toHaveLength(2);
      expect(result.internal.every(s => s.type === 'dun_bradstreet')).toBe(true);
    });

    it('maps EcoVadis to type ecovadis', () => {
      const sources: Source[] = [
        { name: 'EcoVadis Score', type: 'ecovadis' },
      ];

      const result = buildResponseSources(sources);

      expect(result.internal).toHaveLength(1);
      expect(result.internal[0].type).toBe('ecovadis');
    });

    it('maps report/analysis/data types to internal_data', () => {
      const sources: Source[] = [
        { name: 'Internal Report', type: 'report' },
        { name: 'Analysis', type: 'analysis' },
        { name: 'Data Source', type: 'data' },
      ];

      const result = buildResponseSources(sources);

      expect(result.internal).toHaveLength(3);
      expect(result.internal.every(s => s.type === 'internal_data')).toBe(true);
    });

    it('drops unknown provider types instead of misclassifying as internal_data', () => {
      const sources: Source[] = [
        { name: 'Unknown Provider', type: 'bloomberg_news' as Source['type'] },
        { name: 'Another Unknown', type: 'random_type' as Source['type'] },
        { name: 'Known Beroe', type: 'beroe' },
      ];

      const result = buildResponseSources(sources);

      // Only the known Beroe source should be in internal
      expect(result.internal).toHaveLength(1);
      expect(result.internal[0].name).toBe('Known Beroe');

      // Unknown types should be dropped entirely (not web, not internal)
      expect(result.web).toHaveLength(0);
    });

    it('undefined type is dropped (not misclassified)', () => {
      const sources: Source[] = [
        { name: 'No Type Source' }, // type is undefined
      ];

      const result = buildResponseSources(sources);

      expect(result.internal).toHaveLength(0);
      expect(result.web).toHaveLength(0);
    });
  });

  describe('deduplication', () => {
    it('deduplicates web sources by normalized URL', () => {
      const sources: Source[] = [
        { name: 'Article 1', url: 'https://example.com/article/' },
        { name: 'Article 2', url: 'https://example.com/article' }, // Same without trailing slash
      ];

      const result = buildResponseSources(sources);

      expect(result.web).toHaveLength(1);
    });

    it('deduplicates internal sources by type:name key', () => {
      const sources: Source[] = [
        { name: 'Beroe Report', type: 'beroe' },
        { name: 'Beroe Report', type: 'beroe' }, // Duplicate
        { name: 'Beroe Report', type: 'dun_bradstreet' }, // Same name, different type - not a dupe
      ];

      const result = buildResponseSources(sources);

      expect(result.internal).toHaveLength(2);
    });
  });

  describe('provider metadata preservation', () => {
    it('preserves provider metadata from enriched sources', () => {
      // When sources come from buildResponseSources with enriched data
      // the provider metadata should be preserved
      const sources: Source[] = [
        { name: 'Beroe Risk Intelligence', type: 'beroe' },
      ];

      const result = buildResponseSources(sources);

      // The source should have provider metadata from the registry
      expect(result.internal).toHaveLength(1);
      const source = result.internal[0];
      expect(source.providerId).toBeDefined();
      expect(source.providerShortName).toBeDefined();
      expect(source.reliabilityTier).toBeDefined();
    });
  });

  describe('confidence calculation', () => {
    it('calculates confidence when enabled (default)', () => {
      const sources: Source[] = [
        { name: 'Beroe Report 1', type: 'beroe' },
        { name: 'Beroe Report 2', type: 'beroe' },
      ];

      const result = buildResponseSources(sources, {
        detectedCategory: 'Steel',
        managedCategories: ['Steel'],
      });

      expect(result.confidence).toBeDefined();
      expect(result.confidence?.level).toBe('high'); // 2 Beroe sources in managed category
      expect(result.confidence?.isManagedCategory).toBe(true);
    });

    it('skips confidence calculation when disabled', () => {
      const sources: Source[] = [
        { name: 'Beroe Report', type: 'beroe' },
      ];

      const result = buildResponseSources(sources, {
        calculateConfidenceFlag: false,
      });

      expect(result.confidence).toBeUndefined();
    });

    it('preserves citations when sources are already ResponseSources', () => {
      const sourcesWithCitations = {
        web: [],
        internal: [
          { name: 'Market Intelligence Reports', type: 'beroe' as const },
        ],
        totalWebCount: 0,
        totalInternalCount: 1,
        citations: {
          'B1': { id: 'B1', name: 'Market Intelligence Reports', type: 'beroe' },
        },
      };

      const result = buildResponseSources(sourcesWithCitations);

      // Should preserve citations
      expect((result as typeof sourcesWithCitations).citations).toBeDefined();
      expect(Object.keys((result as typeof sourcesWithCitations).citations)).toHaveLength(1);
      expect((result as typeof sourcesWithCitations).citations['B1']).toEqual({
        id: 'B1',
        name: 'Market Intelligence Reports',
        type: 'beroe',
      });
    });
  });
});
