import { describe, it, expect } from 'vitest';
import {
  transformToCanonical,
  transformGeminiResponse,
  transformPerplexityResponse,
  transformLocalResponse,
  GeminiResponseInput,
  PerplexityResponseInput,
  LocalResponseInput,
} from '../responseTransform';
import type { DetectedIntent } from '../../types/intents';

// Mock intent
const mockIntent: DetectedIntent = {
  category: 'portfolio_overview',
  subIntent: 'overall_summary',
  confidence: 0.9,
  responseType: 'widget',
  artifactType: 'portfolio_dashboard',
  extractedEntities: {},
  requiresHandoff: false,
  requiresResearch: false,
  requiresDiscovery: false,
};

describe('responseTransform', () => {
  describe('transformToCanonical', () => {
    it('routes to correct transformer based on provider', () => {
      const geminiResponse: GeminiResponseInput = {
        content: 'Gemini content',
        acknowledgement: 'From Gemini',
      };
      const perplexityResponse: PerplexityResponseInput = {
        content: 'Perplexity content',
      };
      const localResponse: LocalResponseInput = {
        content: 'Local content',
      };

      const geminiResult = transformToCanonical(geminiResponse, mockIntent, 'gemini');
      expect(geminiResult.provider).toBe('gemini');

      const perplexityResult = transformToCanonical(perplexityResponse, mockIntent, 'perplexity');
      expect(perplexityResult.provider).toBe('perplexity');

      const localResult = transformToCanonical(localResponse, mockIntent, 'local');
      expect(localResult.provider).toBe('local');
    });
  });

  describe('transformGeminiResponse', () => {
    it('transforms basic response', () => {
      const response: GeminiResponseInput = {
        id: 'test-123',
        content: 'Here is your portfolio overview.',
        acknowledgement: 'Analyzing your portfolio.',
      };

      const result = transformGeminiResponse(response, mockIntent);

      expect(result.id).toBe('test-123');
      expect(result.narrative).toBe('Here is your portfolio overview.');
      expect(result.acknowledgement).toBe('Analyzing your portfolio.');
      expect(result.provider).toBe('gemini');
    });

    it('generates id if missing', () => {
      const response: GeminiResponseInput = {
        content: 'Content',
      };

      const result = transformGeminiResponse(response, mockIntent);
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^resp-/);
    });

    it('generates acknowledgement from intent if missing', () => {
      const response: GeminiResponseInput = {
        content: 'Content',
      };

      const result = transformGeminiResponse(response, mockIntent);
      expect(result.acknowledgement).toBe("Here's your portfolio overview.");
    });

    it('transforms widget', () => {
      const response: GeminiResponseInput = {
        content: 'Content',
        widget: {
          type: 'risk_distribution',
          title: 'Risk Overview',
          data: { test: true },
        },
      };

      const result = transformGeminiResponse(response, mockIntent);
      expect(result.widget).toBeDefined();
      expect(result.widget?.type).toBe('risk_distribution');
      expect(result.widget?.title).toBe('Risk Overview');
    });

    it('ignores widget with type "none"', () => {
      const response: GeminiResponseInput = {
        content: 'Content',
        widget: {
          type: 'none',
          data: {},
        },
      };

      const result = transformGeminiResponse(response, mockIntent);
      expect(result.widget).toBeUndefined();
    });

    it('transforms insight', () => {
      const response: GeminiResponseInput = {
        content: 'Content',
        insight: {
          headline: 'Key Insight',
          summary: 'This is the summary.',
          sentiment: 'positive',
          type: 'opportunity',
          factors: [
            { title: 'Factor 1', detail: 'Detail 1', impact: 'positive' },
          ],
        },
      };

      const result = transformGeminiResponse(response, mockIntent);
      expect(result.insight).toBeDefined();
      expect(result.insight?.headline).toBe('Key Insight');
      expect(result.insight?.summary).toBe('This is the summary.');
      expect(result.insight?.factors).toHaveLength(1);
    });

    it('transforms suggestions', () => {
      const response: GeminiResponseInput = {
        content: 'Content',
        suggestions: [
          { id: '1', text: 'Question 1', icon: 'chart' },
          { id: '2', text: 'Question 2', icon: 'search' },
        ],
      };

      const result = transformGeminiResponse(response, mockIntent);
      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions?.[0].text).toBe('Question 1');
    });

    it('generates default suggestions if missing', () => {
      const response: GeminiResponseInput = {
        content: 'Content',
      };

      const result = transformGeminiResponse(response, mockIntent);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
    });

    it('transforms sources in ResponseSources format', () => {
      const response: GeminiResponseInput = {
        content: 'Content',
        sources: {
          web: [
            { name: 'Source 1', url: 'https://example.com', domain: 'example.com' },
          ],
          internal: [
            { name: 'Database', type: 'beroe' },
          ],
          totalWebCount: 1,
          totalInternalCount: 1,
        },
      };

      const result = transformGeminiResponse(response, mockIntent);
      expect(result.sources?.web).toHaveLength(1);
      expect(result.sources?.internal).toHaveLength(1);
    });

    it('includes intent in result', () => {
      const response: GeminiResponseInput = {
        content: 'Content',
      };

      const result = transformGeminiResponse(response, mockIntent);
      expect(result.intent).toBeDefined();
      expect(result.intent?.category).toBe('portfolio_overview');
    });
  });

  describe('transformPerplexityResponse', () => {
    it('transforms basic response', () => {
      const response: PerplexityResponseInput = {
        content: 'This is a detailed analysis. Here are the key findings about the market.',
      };

      const result = transformPerplexityResponse(response, mockIntent);

      expect(result.id).toBeDefined();
      expect(result.narrative).toBe(response.content);
      expect(result.provider).toBe('perplexity');
    });

    it('extracts acknowledgement from first sentence', () => {
      const response: PerplexityResponseInput = {
        content: 'This is the summary. More details follow in the next paragraph.',
      };

      const result = transformPerplexityResponse(response, mockIntent);
      expect(result.acknowledgement).toBe('This is the summary.');
    });

    it('truncates long acknowledgements', () => {
      const response: PerplexityResponseInput = {
        content: 'This is a very long first sentence that goes on and on and exceeds the maximum length allowed for acknowledgements in the system.',
      };

      const result = transformPerplexityResponse(response, mockIntent);
      expect(result.acknowledgement.length).toBeLessThanOrEqual(60);
      expect(result.acknowledgement).toMatch(/\.\.\.$/);
    });

    it('extracts headline from heading', () => {
      const response: PerplexityResponseInput = {
        content: '## Key Finding\n\nContent here describing the finding.',
      };

      const result = transformPerplexityResponse(response, mockIntent);
      expect(result.headline).toBe('Key Finding');
    });

    it('extracts headline from bold text', () => {
      const response: PerplexityResponseInput = {
        content: '**Important Discovery**: The market is showing signs of recovery.',
      };

      const result = transformPerplexityResponse(response, mockIntent);
      expect(result.headline).toBe('Important Discovery');
    });

    it('extracts bullets from list items', () => {
      const response: PerplexityResponseInput = {
        content: 'Overview.\n\n- Point 1\n- Point 2\n- Point 3',
      };

      const result = transformPerplexityResponse(response, mockIntent);
      expect(result.bullets).toEqual(['Point 1', 'Point 2', 'Point 3']);
    });

    it('limits bullets to 5', () => {
      const response: PerplexityResponseInput = {
        content: '- Item 1\n- Item 2\n- Item 3\n- Item 4\n- Item 5\n- Item 6\n- Item 7',
      };

      const result = transformPerplexityResponse(response, mockIntent);
      expect(result.bullets?.length).toBeLessThanOrEqual(5);
    });

    it('transforms citations to sources', () => {
      const response: PerplexityResponseInput = {
        content: 'Content with citations.',
        citations: [
          { url: 'https://reuters.com/article', title: 'Reuters Article' },
          { url: 'https://bloomberg.com/news', title: 'Bloomberg News' },
        ],
      };

      const result = transformPerplexityResponse(response, mockIntent);
      expect(result.sources?.web).toHaveLength(2);
      expect(result.sources?.web[0].title).toBe('Reuters Article');
      expect(result.sources?.web[0].url).toBe('https://reuters.com/article');
    });

    it('generates default suggestions', () => {
      const response: PerplexityResponseInput = {
        content: 'Content',
      };

      const result = transformPerplexityResponse(response, mockIntent);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
    });
  });

  describe('transformLocalResponse', () => {
    it('transforms basic response', () => {
      const response: LocalResponseInput = {
        content: 'Local response content',
      };

      const result = transformLocalResponse(response, mockIntent);

      expect(result.id).toBeDefined();
      expect(result.narrative).toBe('Local response content');
      expect(result.provider).toBe('local');
    });

    it('generates acknowledgement from intent', () => {
      const response: LocalResponseInput = {
        content: 'Content',
      };

      const result = transformLocalResponse(response, mockIntent);
      expect(result.acknowledgement).toBe("Here's your portfolio overview.");
    });

    it('generates suggestions from intent', () => {
      const response: LocalResponseInput = {
        content: 'Content',
      };

      const result = transformLocalResponse(response, mockIntent);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
    });

    it('includes intent', () => {
      const response: LocalResponseInput = {
        content: 'Content',
      };

      const result = transformLocalResponse(response, mockIntent);
      expect(result.intent).toBe(mockIntent);
    });
  });

  describe('edge cases', () => {
    it('handles empty content', () => {
      const response: GeminiResponseInput = {
        content: '',
      };

      const result = transformGeminiResponse(response, mockIntent);
      expect(result.narrative).toBe('');
    });

    it('handles missing fields gracefully', () => {
      const response = {} as GeminiResponseInput;
      const result = transformGeminiResponse(response, mockIntent);

      expect(result.id).toBeDefined();
      expect(result.acknowledgement).toBeDefined();
      // When content is missing, narrative is empty string (not undefined)
      expect(result.narrative).toBe('');
      expect(result.suggestions).toBeDefined();
    });

    it('handles malformed citations', () => {
      const response: PerplexityResponseInput = {
        content: 'Content',
        citations: [
          { url: 'invalid-url', title: 'Title' },
        ],
      };

      const result = transformPerplexityResponse(response, mockIntent);
      // Should not throw
      expect(result.sources?.web[0].url).toBe('invalid-url');
    });
  });
});
