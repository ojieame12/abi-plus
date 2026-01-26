// Perplexity API Service for deep research queries
import { PERPLEXITY_SYSTEM_PROMPT } from '../prompts/system';
import type { ChatMessage, Suggestion, Source } from '../types/chat';
import type { DetectedIntent } from '../types/intents';
import { classifyIntent } from '../types/intents';
import { getPortfolioSummary, MOCK_SUPPLIERS } from './mockData';
import { extractJSONFromResponse } from './prompts';
import { normalizeUrl } from '../utils/sources';

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export interface PerplexityResponse {
  content: string;
  responseType: 'widget' | 'table' | 'summary' | 'alert' | 'handoff';
  suggestions: Suggestion[];
  sources: Source[];
  artifact?: {
    type: string;
    title?: string;
    filters?: Record<string, unknown>;
  };
  insight?: string;
  intent?: DetectedIntent;
  citations?: string[];
  thinkingSteps?: ThinkingStep[];
}

export interface ThinkingStep {
  title: string;
  content: string;
  status: 'complete' | 'in_progress';
}

// Build context for Perplexity
const buildResearchContext = (): string => {
  const portfolio = getPortfolioSummary();

  return `
USER'S SUPPLIER PORTFOLIO CONTEXT:
- Monitoring ${portfolio.totalSuppliers} suppliers
- Total spend: ${portfolio.totalSpendFormatted}
- Key categories: ${[...new Set(MOCK_SUPPLIERS.map(s => s.category))].join(', ')}
- Regions: ${[...new Set(MOCK_SUPPLIERS.map(s => s.location.region))].join(', ')}

Remember: You cannot reveal specific partner-sourced scores (Financial, Cybersecurity, etc.) even when researching.
Focus on publicly available market intelligence and industry analysis.
`;
};

// Parse Perplexity response
const parsePerplexityResponse = (text: string): Partial<PerplexityResponse> => {
  try {
    const jsonText = extractJSONFromResponse(text);
    if (jsonText) {
      return JSON.parse(jsonText);
    }
  } catch (e) {
    console.warn('Failed to parse Perplexity response as JSON:', e);
  }

  // Fallback: use text as content
  return {
    content: text,
    responseType: 'summary',
    suggestions: [
      { id: '1', text: 'Analyze further', icon: 'lightbulb' },
      { id: '2', text: 'Compare suppliers', icon: 'compare' },
      { id: '3', text: 'View risk portfolio', icon: 'chart' },
    ],
  };
};

// Extract domain name from URL for display
const extractDomainFromUrl = (url: string): string => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Source';
  }
};

const dedupeCitations = (citations: string[]): string[] => {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const citation of citations) {
    const trimmed = citation?.trim();
    if (!trimmed) continue;
    const key = normalizeUrl(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(trimmed);
  }

  return deduped;
};

interface CitationWithSnippet {
  url: string;
  text?: string;
  snippet?: string;
  title?: string;
}

const buildCitationSources = (
  citations: string[],
  searchResults?: CitationWithSnippet[]
): Source[] => {
  const sources: Source[] = [];
  const snippetMap = new Map<string, string>();

  // Build snippet map from search results if available
  if (searchResults && Array.isArray(searchResults)) {
    for (const result of searchResults) {
      if (result.url) {
        const key = normalizeUrl(result.url);
        const snippet = result.text || result.snippet || '';
        if (snippet) {
          snippetMap.set(key, snippet.slice(0, 200));
        }
      }
    }
  }

  for (const url of dedupeCitations(citations)) {
    const key = normalizeUrl(url);
    sources.push({
      name: extractDomainFromUrl(url),
      url,
      type: 'web',
      snippet: snippetMap.get(key),
    });
  }

  return sources;
};

const mergeSources = (primary: Source[] = [], secondary: Source[] = []): Source[] => {
  const merged: Source[] = [];
  const seen = new Set<string>();

  const addSource = (source: Source) => {
    const key = source.url ? normalizeUrl(source.url) : source.name?.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(source);
  };

  primary.forEach(addSource);
  secondary.forEach(addSource);

  return merged;
};

// Generate thinking steps for the UI
const generateThinkingSteps = (query: string, intent: DetectedIntent): ThinkingStep[] => {
  const steps: ThinkingStep[] = [
    {
      title: 'Query Analysis',
      content: `Analyzing request: "${query.slice(0, 50)}${query.length > 50 ? '...' : ''}"`,
      status: 'complete',
    },
    {
      title: 'Research Strategy',
      content: `Searching market intelligence sources for ${intent.extractedEntities.category || 'relevant'} data`,
      status: 'complete',
    },
    {
      title: 'Information Synthesis',
      content: 'Compiling findings from multiple authoritative sources',
      status: 'complete',
    },
  ];

  return steps;
};

// Main function to call Perplexity API
export const callPerplexity = async (
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<PerplexityResponse> => {
  const intent = classifyIntent(userMessage);
  const researchContext = buildResearchContext();

  // Build messages array for Perplexity
  const messages = [
    {
      role: 'system',
      content: `${PERPLEXITY_SYSTEM_PROMPT}\n\n${researchContext}`,
    },
    ...conversationHistory.slice(-4).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
    {
      role: 'user',
      content: userMessage,
    },
  ];

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for research

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro', // Latest 2025 Perplexity model with enhanced reasoning
        messages,
        temperature: 0.2,
        max_tokens: 2000,
        return_citations: true,
        search_recency_filter: 'month', // Focus on recent information
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content || '';
    const rawCitations = [
      ...(data.citations || []),
      ...(data.choices?.[0]?.message?.citations || []),
    ];
    const citations = dedupeCitations(rawCitations);

    // Extract search results with snippets (if available)
    const searchResults = data.search_results || data.choices?.[0]?.search_results || [];

    const parsed = parsePerplexityResponse(textContent);
    const citationSources = buildCitationSources(citations, searchResults);
    const sources = mergeSources(parsed.sources || [], citationSources);
    const thinkingSteps = generateThinkingSteps(userMessage, intent);

    return {
      content: parsed.content || '',
      responseType: parsed.responseType || 'summary',
      suggestions: parsed.suggestions || generateDefaultSuggestions(intent),
      sources,
      artifact: parsed.artifact,
      insight: parsed.insight,
      intent,
      citations,
      thinkingSteps,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Perplexity] API call timed out after 30 seconds');
    } else {
      console.error('[Perplexity] API call failed:', error);
    }
    return generateFallbackResearchResponse(intent, userMessage);
  }
};

// Generate default suggestions based on intent
const generateDefaultSuggestions = (intent: DetectedIntent): Suggestion[] => {
  switch (intent.category) {
    case 'portfolio_overview':
      return [
        { id: '1', text: 'Deep dive on high-risk suppliers', icon: 'search' },
        { id: '2', text: 'Industry trends affecting my portfolio', icon: 'chart' },
        { id: '3', text: 'Risk mitigation strategies', icon: 'lightbulb' },
      ];
    case 'supplier_deep_dive':
      return [
        { id: '1', text: 'Research this company further', icon: 'search' },
        { id: '2', text: 'Find alternative suppliers', icon: 'search' },
        { id: '3', text: 'Industry benchmark comparison', icon: 'compare' },
      ];
    default:
      return [
        { id: '1', text: 'Show my risk portfolio', icon: 'chart' },
        { id: '2', text: 'Research market trends', icon: 'lightbulb' },
        { id: '3', text: 'Find suppliers', icon: 'search' },
      ];
  }
};

// Fallback response when API fails
const generateFallbackResearchResponse = (
  intent: DetectedIntent,
  query: string
): PerplexityResponse => {
  const portfolio = getPortfolioSummary();

  return {
    content: `I'm researching this for you. Based on your portfolio of ${portfolio.totalSuppliers} suppliers across ${[...new Set(MOCK_SUPPLIERS.map(s => s.location.region))].length} regions, here's what I can share:\n\nMarket conditions are dynamic, and supplier risk profiles can change based on various economic factors. I recommend regularly monitoring your high-risk suppliers and exploring alternatives where appropriate.\n\nWould you like me to focus on any specific aspect of your supplier risk landscape?`,
    responseType: 'summary',
    suggestions: [
      { id: '1', text: 'Show high-risk suppliers', icon: 'search' },
      { id: '2', text: 'Industry trends', icon: 'chart' },
      { id: '3', text: 'Risk mitigation tips', icon: 'lightbulb' },
    ],
    sources: [
      { name: 'Beroe Market Intelligence', type: 'report' },
      { name: 'Industry Analysis', type: 'analysis' },
    ],
    intent,
    thinkingSteps: generateThinkingSteps(query, intent),
  };
};

// Utility to check if API key is configured
export const isPerplexityConfigured = (): boolean => {
  return Boolean(PERPLEXITY_API_KEY);
};

// Research specific topics with Perplexity
export const researchTopic = async (
  topic: string,
  context?: string
): Promise<PerplexityResponse> => {
  const enhancedQuery = context
    ? `${topic}\n\nContext: ${context}`
    : topic;

  return callPerplexity(enhancedQuery, []);
};
