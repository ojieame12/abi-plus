// Perplexity API Service for deep research queries
import { PERPLEXITY_SYSTEM_PROMPT } from '../prompts/system';
import type { ChatMessage, Suggestion, Source } from '../types/chat';
import type { DetectedIntent } from '../types/intents';
import { classifyIntent } from '../types/intents';
import { getPortfolioSummary, MOCK_SUPPLIERS } from './mockData';
import type { Supplier } from '../types/supplier';

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
const parsePerplexityResponse = (text: string, citations?: string[]): Partial<PerplexityResponse> => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Add citations as sources if not already present
      if (citations && citations.length > 0 && (!parsed.sources || parsed.sources.length === 0)) {
        parsed.sources = citations.map((url, i) => ({
          name: extractDomainFromUrl(url),
          url,
          type: 'research',
        }));
      }
      return parsed;
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
    sources: citations?.map((url, i) => ({
      name: extractDomainFromUrl(url),
      url,
      type: 'research' as const,
    })) || [],
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

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online', // Online model for real-time search
        messages,
        temperature: 0.2,
        max_tokens: 1500,
        return_citations: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    const parsed = parsePerplexityResponse(textContent, citations);
    const thinkingSteps = generateThinkingSteps(userMessage, intent);

    return {
      content: parsed.content || '',
      responseType: parsed.responseType || 'summary',
      suggestions: parsed.suggestions || generateDefaultSuggestions(intent),
      sources: parsed.sources || [],
      artifact: parsed.artifact,
      insight: parsed.insight,
      intent,
      citations,
      thinkingSteps,
    };
  } catch (error) {
    console.error('Perplexity API call failed:', error);
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
