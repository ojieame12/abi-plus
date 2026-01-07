import { describe, it, expect } from 'vitest';
import {
  validateResponse,
  repairResponse,
  generateDefaultAcknowledgement,
  generateDefaultSuggestions,
  normalizeSources,
  validateAndRepair,
} from '../responseValidator';
import type { DetectedIntent } from '../../types/intents';

// Mock intent for testing
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

describe('responseValidator', () => {
  describe('validateResponse', () => {
    it('passes valid response', () => {
      const response = {
        id: '1',
        acknowledgement: 'Here is your data.',
        narrative: 'Some content about your portfolio.',
        provider: 'gemini',
      };
      const result = validateResponse(response);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails for non-object response', () => {
      expect(validateResponse(null).valid).toBe(false);
      expect(validateResponse('string').valid).toBe(false);
      expect(validateResponse(123).valid).toBe(false);
    });

    it('fails missing id', () => {
      const response = {
        acknowledgement: 'Hi',
        narrative: 'Content',
        provider: 'gemini',
      };
      const result = validateResponse(response);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('missing id');
    });

    it('fails missing acknowledgement', () => {
      const response = {
        id: '1',
        narrative: 'Content',
        provider: 'gemini',
      };
      const result = validateResponse(response);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('missing acknowledgement');
    });

    it('fails missing narrative', () => {
      const response = {
        id: '1',
        acknowledgement: 'Hi',
        provider: 'gemini',
      };
      const result = validateResponse(response);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('missing narrative');
    });

    it('fails invalid provider', () => {
      const response = {
        id: '1',
        acknowledgement: 'Hi',
        narrative: 'Content',
        provider: 'invalid_provider',
      };
      const result = validateResponse(response);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invalid provider');
    });

    it('fails invalid widget', () => {
      const response = {
        id: '1',
        acknowledgement: 'Hi',
        narrative: 'Content',
        provider: 'gemini',
        widget: 'not an object',
      };
      const result = validateResponse(response);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invalid widget');
    });

    it('fails widget without type', () => {
      const response = {
        id: '1',
        acknowledgement: 'Hi',
        narrative: 'Content',
        provider: 'gemini',
        widget: { data: {} },
      };
      const result = validateResponse(response);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('widget missing type');
    });

    it('fails invalid suggestions', () => {
      const response = {
        id: '1',
        acknowledgement: 'Hi',
        narrative: 'Content',
        provider: 'gemini',
        suggestions: 'not an array',
      };
      const result = validateResponse(response);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('suggestions must be an array');
    });

    it('validates valid widget', () => {
      const response = {
        id: '1',
        acknowledgement: 'Hi',
        narrative: 'Content',
        provider: 'gemini',
        widget: { type: 'risk_distribution', data: {} },
      };
      const result = validateResponse(response);
      expect(result.valid).toBe(true);
    });

    it('stores original in result', () => {
      const response = { invalid: 'data' };
      const result = validateResponse(response);
      expect(result.original).toBe(response);
    });
  });

  describe('generateDefaultAcknowledgement', () => {
    it('returns generic acknowledgement without intent', () => {
      expect(generateDefaultAcknowledgement()).toBe("Here's what I found.");
      expect(generateDefaultAcknowledgement(undefined)).toBe("Here's what I found.");
    });

    it('returns intent-specific acknowledgement', () => {
      expect(generateDefaultAcknowledgement(mockIntent)).toBe("Here's your portfolio overview.");
    });

    it('returns supplier acknowledgement for supplier_deep_dive', () => {
      const intent = { ...mockIntent, category: 'supplier_deep_dive' as const };
      expect(generateDefaultAcknowledgement(intent)).toBe("Here's the supplier profile.");
    });

    it('returns market acknowledgement for market_context', () => {
      const intent = { ...mockIntent, category: 'market_context' as const };
      expect(generateDefaultAcknowledgement(intent)).toBe("Here's the market context.");
    });
  });

  describe('generateDefaultSuggestions', () => {
    it('returns generic suggestions without intent', () => {
      const suggestions = generateDefaultSuggestions();
      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].text).toBe('Tell me more');
    });

    it('returns intent-specific suggestions for portfolio_overview', () => {
      const suggestions = generateDefaultSuggestions(mockIntent);
      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].text).toBe('Show high-risk suppliers');
    });

    it('returns intent-specific suggestions for supplier_deep_dive', () => {
      const intent = { ...mockIntent, category: 'supplier_deep_dive' as const };
      const suggestions = generateDefaultSuggestions(intent);
      expect(suggestions.some(s => s.text.includes('risk level'))).toBe(true);
    });

    it('all suggestions have id, text, and icon', () => {
      const suggestions = generateDefaultSuggestions(mockIntent);
      suggestions.forEach(s => {
        expect(s.id).toBeDefined();
        expect(s.text).toBeDefined();
        expect(s.icon).toBeDefined();
      });
    });
  });

  describe('normalizeSources', () => {
    it('returns undefined for null/undefined', () => {
      expect(normalizeSources(null)).toBeUndefined();
      expect(normalizeSources(undefined)).toBeUndefined();
    });

    it('returns undefined for empty array', () => {
      expect(normalizeSources([])).toBeUndefined();
    });

    it('passes through already normalized sources', () => {
      const sources = {
        web: [{ title: 'Source', url: 'https://example.com' }],
        internal: [{ title: 'DB', type: 'database' as const }],
        totalWebCount: 1,
        totalInternalCount: 1,
      };
      const result = normalizeSources(sources);
      expect(result?.web).toHaveLength(1);
      expect(result?.internal).toHaveLength(1);
    });

    it('normalizes array format to ResponseSources', () => {
      const sources = [
        { title: 'Web Source', url: 'https://example.com', favicon: 'icon.png' },
        { title: 'Database', type: 'database' as const },
      ];
      const result = normalizeSources(sources);
      expect(result?.web).toHaveLength(1);
      expect(result?.internal).toHaveLength(1);
      expect(result?.totalWebCount).toBe(1);
      expect(result?.totalInternalCount).toBe(1);
    });

    it('handles web-only sources', () => {
      const sources = [
        { title: 'Source 1', url: 'https://a.com' },
        { title: 'Source 2', url: 'https://b.com' },
      ];
      const result = normalizeSources(sources);
      expect(result?.web).toHaveLength(2);
      expect(result?.internal).toHaveLength(0);
    });
  });

  describe('repairResponse', () => {
    it('generates id if missing', () => {
      const response = { narrative: 'Content' };
      const repaired = repairResponse(response);
      expect(repaired.id).toBeDefined();
      expect(repaired.id).toMatch(/^resp-/);
    });

    it('preserves existing id', () => {
      const response = { id: 'my-id', narrative: 'Content' };
      const repaired = repairResponse(response);
      expect(repaired.id).toBe('my-id');
    });

    it('adds default acknowledgement', () => {
      const response = { narrative: 'Content' };
      const repaired = repairResponse(response);
      expect(repaired.acknowledgement).toBeTruthy();
    });

    it('adds intent-specific acknowledgement', () => {
      const response = { narrative: 'Content' };
      const repaired = repairResponse(response, mockIntent);
      expect(repaired.acknowledgement).toBe("Here's your portfolio overview.");
    });

    it('uses content as narrative fallback', () => {
      const response = { content: 'This is the content' };
      const repaired = repairResponse(response);
      expect(repaired.narrative).toBe('This is the content');
    });

    it('generates follow-ups if missing', () => {
      const response = { acknowledgement: 'Hi', narrative: 'Content' };
      const repaired = repairResponse(response);
      expect(repaired.suggestions).toBeDefined();
      expect(repaired.suggestions?.length).toBeGreaterThan(0);
    });

    it('preserves existing suggestions', () => {
      const response = {
        narrative: 'Content',
        suggestions: [{ id: '1', text: 'Custom suggestion' }],
      };
      const repaired = repairResponse(response);
      expect(repaired.suggestions?.[0].text).toBe('Custom suggestion');
    });

    it('sets provider to local by default', () => {
      const response = { narrative: 'Content' };
      const repaired = repairResponse(response);
      expect(repaired.provider).toBe('local');
    });

    it('preserves valid provider', () => {
      const response = { narrative: 'Content', provider: 'perplexity' };
      const repaired = repairResponse(response);
      expect(repaired.provider).toBe('perplexity');
    });

    it('preserves valid widget', () => {
      const response = {
        narrative: 'Content',
        widget: { type: 'risk_distribution', data: { test: true } },
      };
      const repaired = repairResponse(response);
      expect(repaired.widget?.type).toBe('risk_distribution');
    });

    it('normalizes sources', () => {
      const response = {
        narrative: 'Content',
        sources: [{ title: 'Source', url: 'https://example.com' }],
      };
      const repaired = repairResponse(response);
      expect(repaired.sources?.web).toHaveLength(1);
    });

    it('copies intent if provided', () => {
      const response = { narrative: 'Content' };
      const repaired = repairResponse(response, mockIntent);
      expect(repaired.intent?.category).toBe('portfolio_overview');
    });
  });

  describe('validateAndRepair', () => {
    it('returns original if valid', () => {
      const response = {
        id: '1',
        acknowledgement: 'Hi',
        narrative: 'Content',
        provider: 'gemini' as const,
      };
      const { response: result, validation } = validateAndRepair(response);
      expect(validation.valid).toBe(true);
      expect(validation.repaired).toBe(false);
      expect(result).toBe(response);
    });

    it('returns repaired if invalid', () => {
      const response = { narrative: 'Content' };
      const { response: result, validation } = validateAndRepair(response);
      expect(validation.valid).toBe(false);
      expect(validation.repaired).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.acknowledgement).toBeDefined();
    });

    it('uses intent for repair', () => {
      const response = { narrative: 'Content' };
      const { response: result } = validateAndRepair(response, mockIntent);
      expect(result.acknowledgement).toBe("Here's your portfolio overview.");
    });
  });
});
