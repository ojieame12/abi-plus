// Response Transform - Convert provider responses to canonical format
// Normalizes Gemini, Perplexity, and local responses to a single schema

import type {
  CanonicalResponse,
  ResponseSources,
  CanonicalSuggestion,
  CanonicalInsight,
  CanonicalWidget,
  CanonicalArtifact,
} from '../types/responseSchema';
import type { DetectedIntent } from '../types/intents';
import type { ResponseInsight, ResponseSources as LegacySources } from '../types/aiResponse';
import { extractFirstSentence } from './markdownRenderer';
import {
  generateDefaultAcknowledgement,
  generateDefaultSuggestions,
  normalizeSources,
} from './responseValidator';

// ============================================
// TYPES
// ============================================

// Gemini response shape (from gemini.ts)
export interface GeminiResponseInput {
  id?: string;
  content: string;
  acknowledgement?: string;
  responseType?: string;
  insight?: ResponseInsight;
  widget?: {
    type: string;
    title?: string;
    data?: Record<string, unknown>;
  };
  artifact?: {
    type: string;
    title?: string;
    data?: Record<string, unknown>;
  };
  sources?: LegacySources | Array<{ name: string; url?: string; type?: string }>;
  suggestions?: Array<{ id: string; text: string; icon?: string }>;
  thinkingSteps?: Array<{ title: string; content: string }>;
  thinkingDuration?: string;
}

// Perplexity response shape (from perplexity.ts)
export interface PerplexityResponseInput {
  content: string;
  citations?: Array<{ url: string; title: string; snippet?: string }>;
  sources?: Array<{ name?: string; title?: string; url?: string; domain?: string }>;
  model?: string;
}

// Local/mock response shape
export interface LocalResponseInput {
  content: string;
  type?: string;
  data?: Record<string, unknown>;
}

type ProviderResponse = GeminiResponseInput | PerplexityResponseInput | LocalResponseInput;
type Provider = 'gemini' | 'perplexity' | 'local';

// ============================================
// MAIN TRANSFORM FUNCTION
// ============================================

/**
 * Transform any provider response to canonical schema
 */
export function transformToCanonical(
  response: ProviderResponse,
  intent: DetectedIntent,
  provider: Provider
): CanonicalResponse {
  switch (provider) {
    case 'gemini':
      return transformGeminiResponse(response as GeminiResponseInput, intent);
    case 'perplexity':
      return transformPerplexityResponse(response as PerplexityResponseInput, intent);
    case 'local':
    default:
      return transformLocalResponse(response as LocalResponseInput, intent);
  }
}

// ============================================
// PROVIDER-SPECIFIC TRANSFORMS
// ============================================

/**
 * Transform Gemini response to canonical
 */
function transformGeminiResponse(
  response: GeminiResponseInput,
  intent: DetectedIntent
): CanonicalResponse {
  const id = response.id || generateId();

  // Use existing acknowledgement or generate from intent
  const acknowledgement = response.acknowledgement || generateDefaultAcknowledgement(intent);

  // Use content as narrative
  const narrative = response.content || '';

  // Transform widget if present
  let widget: CanonicalWidget | undefined;
  if (response.widget && response.widget.type && response.widget.type !== 'none') {
    widget = {
      type: response.widget.type as CanonicalWidget['type'],
      title: response.widget.title,
      data: response.widget.data || {},
    };
  }

  // Transform insight if present
  let insight: CanonicalInsight | undefined;
  if (response.insight) {
    insight = transformInsight(response.insight);
  }

  // Transform artifact to artifactContent if present
  let artifactContent: CanonicalArtifact | undefined;
  if (response.artifact && response.artifact.title) {
    artifactContent = {
      title: response.artifact.title,
      overview: '', // Would need to be populated from artifact data
      keyPoints: [],
      recommendations: [],
    };
  }

  // Transform sources
  const sources = transformSources(response.sources);

  // Transform suggestions
  const suggestions = transformSuggestions(response.suggestions, intent);

  return {
    id,
    acknowledgement,
    narrative,
    widget,
    insight,
    artifactContent,
    sources,
    suggestions,
    intent,
    provider: 'gemini',
  };
}

/**
 * Transform Perplexity response to canonical
 * Perplexity returns prose - we need to extract structure
 */
function transformPerplexityResponse(
  response: PerplexityResponseInput,
  intent: DetectedIntent
): CanonicalResponse {
  const id = generateId();
  const content = response.content || '';

  // Extract acknowledgement from first sentence
  const firstSentence = extractFirstSentence(content);
  const acknowledgement = firstSentence.length > 60
    ? firstSentence.slice(0, 57) + '...'
    : firstSentence || generateDefaultAcknowledgement(intent);

  // Use full content as narrative
  const narrative = content;

  // Extract headline from first heading or bold text
  const headline = extractHeadline(content);

  // Extract bullets from list items
  const bullets = extractBullets(content);

  // Transform citations to sources
  const sources = transformPerplexitySources(response.citations, response.sources);

  // Generate suggestions based on intent
  const suggestions = generateDefaultSuggestions(intent);

  return {
    id,
    acknowledgement,
    narrative,
    headline,
    bullets: bullets.length > 0 ? bullets : undefined,
    sources,
    suggestions,
    intent,
    provider: 'perplexity',
  };
}

/**
 * Transform local/mock response to canonical
 */
function transformLocalResponse(
  response: LocalResponseInput,
  intent: DetectedIntent
): CanonicalResponse {
  const id = generateId();
  const content = response.content || '';

  const acknowledgement = generateDefaultAcknowledgement(intent);
  const suggestions = generateDefaultSuggestions(intent);

  return {
    id,
    acknowledgement,
    narrative: content,
    suggestions,
    intent,
    provider: 'local',
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateId(): string {
  return `resp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Transform ResponseInsight to CanonicalInsight
 */
function transformInsight(insight: ResponseInsight): CanonicalInsight {
  return {
    headline: insight.headline,
    summary: insight.summary || insight.explanation || '',
    type: insight.type || 'info',
    sentiment: insight.sentiment,
    factors: insight.factors?.map(f => ({
      title: f.title,
      detail: f.detail,
      impact: f.impact,
    })),
  };
}

/**
 * Transform various source formats to ResponseSources
 */
function transformSources(
  sources: LegacySources | Array<{ name?: string; url?: string; type?: string }> | undefined
): ResponseSources | undefined {
  if (!sources) return undefined;

  // Already in ResponseSources format
  if ('web' in sources && 'internal' in sources) {
    return {
      web: (sources.web || []).map(s => ({
        title: s.name || 'Source',
        url: s.url,
        favicon: s.domain ? `https://www.google.com/s2/favicons?domain=${s.domain}` : undefined,
      })),
      internal: (sources.internal || []).map(s => ({
        title: s.name,
        type: mapInternalSourceType(s.type),
      })),
      totalWebCount: sources.totalWebCount || sources.web?.length || 0,
      totalInternalCount: sources.totalInternalCount || sources.internal?.length || 0,
    };
  }

  // Array format
  if (Array.isArray(sources)) {
    return normalizeSources(sources.map(s => ({
      title: s.name || 'Source',
      url: s.url,
      type: s.type as 'database' | 'report' | 'analysis' | undefined,
    })));
  }

  return undefined;
}

/**
 * Transform Perplexity citations to ResponseSources
 */
function transformPerplexitySources(
  citations?: Array<{ url: string; title: string; snippet?: string }>,
  sources?: Array<{ name?: string; title?: string; url?: string; domain?: string }>
): ResponseSources | undefined {
  const webSources: ResponseSources['web'] = [];

  // Add citations
  if (citations) {
    for (const c of citations) {
      const domain = extractDomain(c.url);
      webSources.push({
        title: c.title || domain,
        url: c.url,
        favicon: domain ? `https://www.google.com/s2/favicons?domain=${domain}` : undefined,
      });
    }
  }

  // Add sources if not already in citations
  if (sources) {
    for (const s of sources) {
      if (s.url && !webSources.some(w => w.url === s.url)) {
        const domain = s.domain || extractDomain(s.url);
        webSources.push({
          title: s.title || s.name || domain || 'Source',
          url: s.url,
          favicon: domain ? `https://www.google.com/s2/favicons?domain=${domain}` : undefined,
        });
      }
    }
  }

  if (webSources.length === 0) return undefined;

  return {
    web: webSources,
    internal: [],
    totalWebCount: webSources.length,
    totalInternalCount: 0,
  };
}

/**
 * Transform suggestions to CanonicalSuggestion[]
 */
function transformSuggestions(
  suggestions: Array<{ id: string; text: string; icon?: string }> | undefined,
  intent: DetectedIntent
): CanonicalSuggestion[] {
  if (suggestions && suggestions.length > 0) {
    return suggestions.map((s, i) => ({
      id: s.id || `sug-${i}`,
      text: s.text,
      icon: s.icon,
    }));
  }

  return generateDefaultSuggestions(intent);
}

/**
 * Extract headline from markdown content
 * Looks for first heading or bold text
 */
function extractHeadline(content: string): string | undefined {
  // Try heading first
  const headingMatch = content.match(/^#+\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].slice(0, 60);
  }

  // Try first bold text
  const boldMatch = content.match(/\*\*([^*]+)\*\*/);
  if (boldMatch) {
    return boldMatch[1].slice(0, 60);
  }

  return undefined;
}

/**
 * Extract bullet points from markdown content
 */
function extractBullets(content: string): string[] {
  const bulletMatches = content.match(/^[-*•]\s+.+$/gm);
  if (!bulletMatches) return [];

  return bulletMatches
    .slice(0, 5)
    .map(b => b.replace(/^[-*•]\s+/, '').trim());
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Map internal source type to canonical type
 */
function mapInternalSourceType(
  type: string
): 'database' | 'report' | 'analysis' {
  const typeMap: Record<string, 'database' | 'report' | 'analysis'> = {
    beroe: 'database',
    dun_bradstreet: 'database',
    ecovadis: 'database',
    internal_data: 'database',
    supplier_data: 'database',
    report: 'report',
    analysis: 'analysis',
  };
  return typeMap[type] || 'database';
}

// ============================================
// EXPORTS
// ============================================

export {
  transformGeminiResponse,
  transformPerplexityResponse,
  transformLocalResponse,
};
