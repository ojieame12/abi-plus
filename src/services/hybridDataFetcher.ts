// Hybrid Data Fetcher
// Fetches data from both Gemini (Beroe) and Perplexity (Web) in parallel
// and builds a unified evidence pool with citation IDs

import { callGeminiV2 } from './gemini';
import { callPerplexity, isPerplexityConfigured } from './perplexity';
import type {
  HybridDataResult,
  BeroeDataResult,
  WebDataResult,
  Citation,
  FetchHybridDataOptions,
} from '../types/hybridResponse';
import type { InternalSource, WebSource, ResponseSources } from '../types/aiResponse';
import type { DetectedIntent } from '../types/intents';
import type { ChatMessage } from '../types/chat';
import { buildResponseSources } from '../utils/sources';

/**
 * Fetch data from both Gemini (Beroe) and Perplexity (Web) in parallel
 */
export async function fetchHybridData(
  query: string,
  options: FetchHybridDataOptions
): Promise<HybridDataResult> {
  const { webEnabled, intent, conversationHistory } = options;

  console.log('[HybridFetcher] Starting parallel fetch...', { webEnabled });

  // Always fetch Beroe data from Gemini
  const beroePromise = fetchBeroeData(query, intent as DetectedIntent, conversationHistory);

  // Conditionally fetch web data from Perplexity
  const webPromise = webEnabled && isPerplexityConfigured()
    ? fetchWebData(query, conversationHistory)
    : Promise.resolve(null);

  // Execute in parallel
  const [beroe, web] = await Promise.all([beroePromise, webPromise]);

  console.log('[HybridFetcher] Fetch complete:', {
    beroeSourceCount: beroe.sources.length,
    webSourceCount: web?.sources.length || 0,
  });

  // Build unified evidence pool with citation IDs
  const evidencePool = buildEvidencePool(beroe, web);

  return { beroe, web, evidencePool };
}

/**
 * Fetch Beroe/internal data from Gemini
 */
async function fetchBeroeData(
  query: string,
  intent: DetectedIntent,
  history: ChatMessage[]
): Promise<BeroeDataResult> {
  try {
    const response = await callGeminiV2(query, history, intent);

    // Extract internal sources from response
    const sources = extractInternalSources(response.sources);

    return {
      content: response.content,
      sources,
      structuredData: response.widget as BeroeDataResult['structuredData'],
      insight: response.insight,
    };
  } catch (error) {
    console.error('[HybridFetcher] Gemini fetch error:', error);
    return {
      content: 'Unable to retrieve Beroe intelligence data.',
      sources: [],
    };
  }
}

/**
 * Fetch web data from Perplexity
 */
async function fetchWebData(
  query: string,
  history: ChatMessage[]
): Promise<WebDataResult> {
  try {
    const response = await callPerplexity(query, history);

    // Convert Perplexity sources to WebSource format
    const sources = extractWebSources(response.sources);

    return {
      content: response.content,
      sources,
      rawCitations: response.citations,
    };
  } catch (error) {
    console.error('[HybridFetcher] Perplexity fetch error:', error);
    return {
      content: 'Unable to retrieve web research data.',
      sources: [],
    };
  }
}

/**
 * Extract internal sources from Gemini response
 */
function extractInternalSources(
  sources: ResponseSources | Array<{ type: string; name?: string; url?: string }> | undefined
): InternalSource[] {
  if (!sources) return [];

  // If already ResponseSources format
  if ('internal' in sources && Array.isArray(sources.internal)) {
    return sources.internal;
  }

  // Legacy array format - filter for internal types
  if (Array.isArray(sources)) {
    return sources
      .filter(s => ['beroe', 'dnd', 'ecovadis', 'internal_data', 'supplier_data'].includes(s.type))
      .map(s => ({
        name: s.name || 'Beroe Report',
        type: mapSourceType(s.type),
      }));
  }

  return [];
}

/**
 * Map legacy source types to InternalSource types
 */
function mapSourceType(type: string): InternalSource['type'] {
  switch (type) {
    case 'beroe': return 'beroe';
    case 'dnd': return 'dun_bradstreet';
    case 'ecovadis': return 'ecovadis';
    case 'internal_data': return 'internal_data';
    case 'supplier_data': return 'supplier_data';
    default: return 'internal_data';
  }
}

/**
 * Extract web sources from Perplexity response
 */
function extractWebSources(
  sources: Array<{ type?: string; name?: string; url?: string; snippet?: string }> | undefined
): WebSource[] {
  if (!sources || !Array.isArray(sources)) return [];

  return sources
    .filter(s => s.url) // Only sources with URLs
    .map(s => ({
      name: s.name || extractDomainName(s.url || ''),
      url: s.url || '',
      domain: extractDomain(s.url || ''),
      snippet: s.snippet, // Preserve snippet for citations
    }));
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'source';
  }
}

/**
 * Extract readable domain name from URL
 */
function extractDomainName(url: string): string {
  const domain = extractDomain(url);
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

/**
 * Build unified evidence pool with citation IDs [B1], [W1], etc.
 * Assigns citationId to each source for later lookup
 */
export function buildEvidencePool(
  beroe: BeroeDataResult,
  web: WebDataResult | null
): Citation[] {
  const pool: Citation[] = [];
  let beroeIndex = 1;
  let webIndex = 1;

  // Add Beroe sources as [B1], [B2], etc.
  for (const source of beroe.sources) {
    const citationId = `B${beroeIndex++}`;

    // Assign citationId to source for later lookup
    source.citationId = citationId;

    pool.push({
      id: citationId,
      type: 'beroe',
      name: source.name,
      snippet: source.summary,
      reportId: source.reportId,
      category: source.category,
    });
  }

  // Add Web sources as [W1], [W2], etc.
  if (web) {
    for (const source of web.sources) {
      const citationId = `W${webIndex++}`;

      // Assign citationId to source for later lookup
      source.citationId = citationId;

      pool.push({
        id: citationId,
        type: 'web',
        name: source.name,
        snippet: source.snippet,
        url: source.url,
      });
    }
  }

  return pool;
}

/**
 * Build ResponseSources with citations map for the hybrid response
 */
export function buildHybridSources(
  beroe: BeroeDataResult,
  web: WebDataResult | null,
  evidencePool: Citation[],
  detectedCategory?: string,
  managedCategories?: string[]
): ResponseSources {
  const webSources = web?.sources || [];
  const internalSources = beroe.sources;

  // Build citation map for quick lookup
  // Support BOTH [B1]/[W1] format AND numeric [1]/[2] format
  const citations: Record<string, WebSource | InternalSource> = {};

  // Add with B/W prefix keys (e.g., "B1", "W1")
  for (const source of internalSources) {
    if (source.citationId) {
      citations[source.citationId] = source;
    }
  }

  for (const source of webSources) {
    if (source.citationId) {
      citations[source.citationId] = source;
    }
  }

  // ALSO add with numeric-only keys for AI-generated content that uses [1], [2], etc.
  // This handles cases where the AI outputs numeric citations instead of B/W format
  // Map numeric index to web sources (most common case from Perplexity)
  let numericIndex = 1;
  for (const source of webSources) {
    citations[String(numericIndex++)] = source;
  }
  // Continue numbering with internal sources
  for (const source of internalSources) {
    citations[String(numericIndex++)] = source;
  }

  // Use buildResponseSources to get confidence calculation
  const baseSources = buildResponseSources(
    [...internalSources, ...webSources] as Array<{ name: string; type?: string; url?: string }>,
    { detectedCategory, managedCategories }
  );

  return {
    ...baseSources,
    citations,
  };
}
