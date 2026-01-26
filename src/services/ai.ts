// AI Orchestration Layer - Routes between Gemini and Perplexity
import type { GeminiResponse } from './gemini';
import { callGeminiV2, isGeminiConfigured } from './gemini';
import type { PerplexityResponse } from './perplexity';
import { callPerplexity, isPerplexityConfigured } from './perplexity';
import type { ChatMessage, Suggestion, Source } from '../types/chat';
import { generateId } from '../types/chat';
import type { DetectedIntent, IntentCategory } from '../types/intents';
import { classifyIntent } from '../types/intents';
import type { Supplier, RiskChange } from '../types/supplier';
import {
  getPortfolioSummary,
  filterSuppliers,
  MOCK_SUPPLIERS,
  MOCK_RISK_CHANGES,
  getInflationSummary,
  getCommodityDrivers,
  getCommodity,
  getSpendImpact,
  getJustificationData,
  getScenarioData,
  generateSpendExposureData,
  getCategoryBreakdown,
  getMarketEvents,
  generateValueLadder,
  generateSourceEnhancement,
  determineSourceMix,
} from './mockData';
import { formatSpend } from '../types/supplier';
import {
  transformSuppliersToTableData,
  transformRiskChangesToAlertData,
  transformSupplierToRiskCardData,
} from './widgetTransformers';
import { generateSuggestions, suggestionEngine } from './suggestionEngine';
import { getWidgetRouteFromRegistry } from './widgetRouter';
// Canonical response transform
import { transformToCanonical } from '../utils/responseTransform';
import { validateAndRepair } from '../utils/responseValidator';
import type { CanonicalResponse } from '../types/responseSchema';
import type { ResponseInsight, ResponseSources } from '../types/aiResponse';
// Hybrid response (Gemini + Perplexity combined)
import { fetchHybridData, buildHybridSources } from './hybridDataFetcher';
import { synthesizeHybridResponse } from './hybridSynthesizer';
import type { HybridResponse, CitationMap } from '../types/hybridResponse';

export type ThinkingMode = 'fast' | 'reasoning';

// ============================================
// REAL-TIME MILESTONES
// ============================================

export interface Milestone {
  id: string;
  event: 'intent_classified' | 'provider_selected' | 'data_retrieved' | 'sources_found' | 'widget_selected' | 'response_ready';
  label: string;
  value?: string | number;
  timestamp: number; // ms since start
}

export type MilestoneCallback = (milestone: Milestone) => void;

// AI-generated artifact content for expanded panel
export interface ArtifactContent {
  title: string;
  overview: string;
  keyPoints: string[];
  recommendations?: string[];
}

export interface AIResponse {
  id: string;
  content: string;
  responseType: 'widget' | 'table' | 'summary' | 'alert' | 'handoff';
  suggestions: Suggestion[];
  sources?: Source[];
  artifact?: {
    type: string;
    title?: string;
    filters?: Record<string, unknown>;
    supplierId?: string;
  };
  // AI-generated content for the artifact panel
  artifactContent?: ArtifactContent;
  insight?: string | { text?: string; headline?: string; summary?: string; detail?: string; trend?: string; sentiment?: string };
  handoff?: {
    required: boolean;
    reason: string;
    linkText: string;
    url?: string;
  };
  // Widget data from AI
  widget?: {
    type: string;
    title?: string;
    data?: unknown;
  };
  // Acknowledgement header
  acknowledgement?: string;
  // Data for UI rendering
  suppliers?: Supplier[];
  portfolio?: ReturnType<typeof getPortfolioSummary>;
  riskChanges?: RiskChange[]; // Risk changes for trend detection
  // Response escalation - determines inline vs artifact
  escalation: {
    showInline: boolean;      // Show widget/table in chat
    expandToArtifact: boolean; // Also open artifact panel
    resultCount: number;       // How many items in result
    threshold: number;         // Threshold that triggered escalation
  };
  // Metadata
  intent: DetectedIntent;
  provider: 'gemini' | 'perplexity' | 'local' | 'hybrid';
  thinkingDuration?: string;
  // Hybrid response citations for inline [B1][W1] badges
  citations?: CitationMap;
  thinkingSteps?: Array<{
    title: string;
    content: string;
    status: 'complete' | 'in_progress';
  }>;
  // Real milestones captured during processing
  milestones?: Milestone[];
  // Canonical response layer (added alongside existing fields for backward compatibility)
  canonical?: CanonicalResponse;
}

// Response escalation thresholds
const ESCALATION_THRESHOLDS = {
  INLINE_ONLY: 3,        // ≤3 items: show only in chat
  INLINE_WITH_ARTIFACT: 5, // 4-5 items: show in chat + offer artifact
  ARTIFACT_ONLY: 10,     // >5 items: summarize in chat + open artifact
};

// Determine response escalation based on result count
const determineEscalation = (
  resultCount: number,
  intentCategory: string
): AIResponse['escalation'] => {
  // Single supplier queries always stay inline
  if (intentCategory === 'supplier_deep_dive' && resultCount === 1) {
    return {
      showInline: true,
      expandToArtifact: true, // But also show detail in artifact
      resultCount,
      threshold: 1,
    };
  }

  // Portfolio overview always shows artifact
  if (intentCategory === 'portfolio_overview') {
    return {
      showInline: true,
      expandToArtifact: true,
      resultCount,
      threshold: 0,
    };
  }

  // For lists/tables, use thresholds
  if (resultCount <= ESCALATION_THRESHOLDS.INLINE_ONLY) {
    return {
      showInline: true,
      expandToArtifact: false,
      resultCount,
      threshold: ESCALATION_THRESHOLDS.INLINE_ONLY,
    };
  }

  if (resultCount <= ESCALATION_THRESHOLDS.INLINE_WITH_ARTIFACT) {
    return {
      showInline: true,
      expandToArtifact: true,
      resultCount,
      threshold: ESCALATION_THRESHOLDS.INLINE_WITH_ARTIFACT,
    };
  }

  // Many results - summarize inline, show full in artifact
  return {
    showInline: true,
    expandToArtifact: true,
    resultCount,
    threshold: ESCALATION_THRESHOLDS.ARTIFACT_ONLY,
  };
};

// Builder metadata for deterministic intent routing
export interface BuilderMeta {
  path: string;
  intent: string;
  subIntent: string;
  widgets: string[];
  requiresResearch?: boolean;
  promptTemplate?: string;  // Detailed prompt template from builder config
}

export interface SendMessageOptions {
  mode: ThinkingMode;
  webSearchEnabled: boolean;
  conversationHistory?: ChatMessage[];
  // Pre-classified intent from builder - bypasses regex classification
  builderMeta?: BuilderMeta;
  // Callback for real-time milestone updates
  onMilestone?: MilestoneCallback;
  // Hybrid mode: call both Gemini AND Perplexity, synthesize with inline citations
  hybridMode?: boolean;
  // User's managed categories for confidence calculation
  managedCategories?: string[];
}

// Note: simulateThinkingDuration and generateThinkingSteps removed - using real timing instead

// Main orchestration function
export const sendMessage = async (
  message: string,
  options: SendMessageOptions
): Promise<AIResponse> => {
  const { mode, webSearchEnabled, conversationHistory = [], builderMeta, onMilestone, hybridMode, managedCategories } = options;

  // Track milestones with real timestamps
  const startTime = Date.now();
  const milestones: Milestone[] = [];
  let milestoneCounter = 0; // Counter to ensure unique IDs

  const emitMilestone = (
    event: Milestone['event'],
    label: string,
    value?: string | number
  ) => {
    milestoneCounter++;
    const milestone: Milestone = {
      id: `${event}-${milestoneCounter}-${Date.now()}`,
      event,
      label,
      value,
      timestamp: Date.now() - startTime,
    };
    milestones.push(milestone);
    onMilestone?.(milestone);
  };

  // Use builder's deterministic intent if provided, otherwise classify from message
  let intent: DetectedIntent;

  if (builderMeta) {
    // Builder provided pre-classified intent - use it directly
    // Still run entity extraction to preserve supplier/commodity context
    const baseIntent = classifyIntent(message);
    console.log('[AI] Using builder metadata for intent:', builderMeta.intent, builderMeta.subIntent);
    intent = {
      category: builderMeta.intent as IntentCategory,
      subIntent: builderMeta.subIntent as DetectedIntent['subIntent'],
      confidence: 1.0, // Deterministic from builder
      responseType: 'widget',
      artifactType: 'none',
      // Preserve entity extraction from message even when intent is forced
      extractedEntities: baseIntent.extractedEntities,
      requiresHandoff: false,
      requiresResearch: builderMeta.requiresResearch || false,
      requiresDiscovery: false,
    };
    emitMilestone('intent_classified', `Intent: ${formatIntentName(intent.category)}`, intent.category);
  } else {
    // Classify intent from message text
    intent = classifyIntent(message);
    emitMilestone('intent_classified', `Intent: ${formatIntentName(intent.category)}`, intent.category);
  }

  // Check if this is a price/commodity query that should use Gemini instead of Perplexity
  // Even if builder says requiresResearch, price data queries should use our data + Gemini
  const PRICE_DATA_PATTERNS = [
    /price\s*(movement|impact|trend|change|forecast|outlook)/i,
    /(lithium|rare\s*earth|cobalt|nickel|battery|steel|aluminum|copper)\s*(price|cost|movement|impact)/i,
    /how\s*(does|do|will|would).*price.*impact/i,
    /analyze.*price.*movement/i,
    /commodity\s*(price|cost).*impact/i,
  ];
  const isPriceDataQuery = PRICE_DATA_PATTERNS.some(p => p.test(message));
  if (isPriceDataQuery && intent.requiresResearch) {
    console.log('[AI] Price data query detected - using Gemini instead of Perplexity');
    intent.requiresResearch = false;
  }

  // Determine which provider to use:
  // 1. User explicitly chose reasoning mode
  // 2. User enabled web search
  // 3. Intent automatically requires research (market context, news, benchmarks, etc.)
  const usePerplexity = mode === 'reasoning' || webSearchEnabled || intent.requiresResearch;
  // Note: effectiveMode removed as it was unused

  // Note: provider_selected milestone is emitted inside each branch to avoid duplicate keys

  try {
    // Transform functions return response without id/provider/thinkingDuration - those are added at the end
    let response: Omit<AIResponse, 'id' | 'provider' | 'thinkingDuration' | 'milestones' | 'canonical'>;
    let provider: AIResponse['provider'];

    console.log('[AI] Intent classified:', intent.category, '| SubIntent:', intent.subIntent);
    console.log('[AI] Mode:', mode, '| WebSearch:', webSearchEnabled);
    console.log('[AI] Auto-research triggered:', intent.requiresResearch);
    console.log('[AI] Hybrid mode:', hybridMode);
    console.log('[AI] Using provider:', hybridMode ? 'hybrid' : (usePerplexity ? 'perplexity' : 'gemini'));

    // HYBRID MODE: Call both Gemini (Beroe) and Perplexity (Web) in parallel
    // ONLY trigger when user EXPLICITLY requests web search (hybridMode or webSearchEnabled toggle)
    // Auto-research queries use Perplexity alone for faster response, not the full hybrid synthesis
    const shouldUseHybrid = hybridMode || webSearchEnabled;
    console.log('[AI] Should use hybrid:', shouldUseHybrid, '| Perplexity configured:', isPerplexityConfigured());

    // Warn if user enabled web search but Perplexity isn't configured
    if ((webSearchEnabled || hybridMode) && !isPerplexityConfigured()) {
      console.warn('[AI] Web search enabled but VITE_PERPLEXITY_API_KEY not configured - falling back to Gemini only');
    }

    if (shouldUseHybrid && isPerplexityConfigured() && isGeminiConfigured()) {
      console.log('[AI] Using HYBRID mode (Gemini + Perplexity)...');
      emitMilestone('provider_selected', 'Hybrid (Beroe + Web)', 'hybrid');

      // Fetch data from both providers in parallel
      const hybridData = await fetchHybridData(message, {
        webEnabled: true,
        intent,
        conversationHistory,
        managedCategories,
      });

      // Emit sources milestone
      const beroeCount = hybridData.beroe.sources.length;
      const webCount = hybridData.web?.sources.length || 0;
      if (beroeCount > 0 || webCount > 0) {
        emitMilestone('sources_found', `${beroeCount} Beroe + ${webCount} Web sources`, beroeCount + webCount);
      }

      // Synthesize into unified response with inline citations
      const hybridResponse = await synthesizeHybridResponse(
        hybridData,
        intent,
        { managedCategories }
      );

      // Transform hybrid response to AIResponse format
      response = transformHybridResponse(hybridResponse, intent);
      provider = 'hybrid' as AIResponse['provider'];
    } else if (usePerplexity && isPerplexityConfigured()) {
      console.log('[AI] Calling Perplexity for deep research...');
      emitMilestone('provider_selected', 'Perplexity (web research)', 'perplexity');
      const perplexityResponse = await callPerplexity(message, conversationHistory);
      response = transformPerplexityResponse(perplexityResponse, intent);
      provider = 'perplexity';

      // Emit sources milestone for research
      const sourceCount = perplexityResponse.sources?.length || 0;
      if (sourceCount > 0) {
        emitMilestone('sources_found', `Found ${sourceCount} sources`, sourceCount);
      }
    } else if (isGeminiConfigured()) {
      console.log('[AI] Calling GeminiV2...');
      emitMilestone('provider_selected', 'Gemini (Beroe data)', 'gemini');
      const geminiResponse = await callGeminiV2(
        message,
        conversationHistory,
        intent,
        builderMeta?.promptTemplate ? {
          promptTemplate: builderMeta.promptTemplate,
          routePath: builderMeta.path,
        } : undefined
      );
      response = transformGeminiResponse(geminiResponse, intent);
      provider = 'gemini';
    } else {
      console.log('[AI] Using local fallback');
      emitMilestone('provider_selected', 'Local data', 'local');
      response = generateLocalResponse(message, intent);
      provider = 'local';
    }

    // Emit data retrieved milestone
    const dataCount = response.suppliers?.length || response.portfolio?.totalSuppliers || 0;
    if (dataCount > 0) {
      const dataLabel = response.portfolio
        ? `${response.portfolio.totalSuppliers} suppliers, ${response.portfolio.totalSpendFormatted}`
        : `${dataCount} supplier${dataCount > 1 ? 's' : ''} found`;
      emitMilestone('data_retrieved', dataLabel, dataCount);
    }

    // Emit widget selection milestone
    if (response.widget?.type) {
      emitMilestone('widget_selected', `Widget: ${formatWidgetName(response.widget.type)}`, response.widget.type);
    }

    // Final milestone
    const totalTime = Date.now() - startTime;
    emitMilestone('response_ready', 'Response ready', totalTime);

    // Format actual duration
    const actualDuration = totalTime < 1000
      ? `${totalTime}ms`
      : `${(totalTime / 1000).toFixed(1)}s`;

    // Build canonical layer for unified rendering
    const canonical = buildCanonicalResponse(response, provider, intent);

    return {
      ...response,
      id: generateId(),
      provider,
      thinkingDuration: actualDuration, // Real duration!
      milestones,
      canonical, // Add canonical layer
    };
  } catch (error) {
    console.error('[AI] Orchestration error:', error);
    emitMilestone('response_ready', 'Fallback response', Date.now() - startTime);

    const localResponse = generateLocalResponse(message, intent);
    const canonical = buildCanonicalResponse(localResponse, 'local', intent);

    return {
      ...localResponse,
      id: generateId(),
      provider: 'local',
      thinkingDuration: `${Date.now() - startTime}ms`,
      milestones,
      canonical, // Add canonical layer
    };
  }
};

// Helper to format intent names for display
const formatIntentName = (intent: string): string => {
  const names: Record<string, string> = {
    portfolio_overview: 'Portfolio Overview',
    filtered_discovery: 'Supplier Search',
    supplier_deep_dive: 'Supplier Analysis',
    trend_detection: 'Risk Changes',
    comparison: 'Comparison',
    market_context: 'Market Intelligence',
    explanation_why: 'Explanation',
    action_trigger: 'Action Request',
    setup_config: 'Configuration',
    reporting_export: 'Export/Report',
    restricted_query: 'Restricted',
    general: 'General Query',
  };
  return names[intent] || intent;
};

// Helper to format widget names for display
const formatWidgetName = (widget: string): string => {
  const names: Record<string, string> = {
    risk_distribution: 'Risk Distribution',
    supplier_table: 'Supplier Table',
    supplier_risk_card: 'Supplier Card',
    alert_card: 'Alert Card',
    comparison_table: 'Comparison',
    trend_chart: 'Trend Chart',
    price_gauge: 'Price Gauge',
    events_feed: 'Events Feed',
    stat_card: 'Stats',
    info_card: 'Info Card',
  };
  return names[widget] || widget;
};

// Build canonical response from AIResponse
// This is added alongside existing fields for backward compatibility
const buildCanonicalResponse = (
  response: Omit<AIResponse, 'id' | 'provider' | 'thinkingDuration' | 'thinkingSteps' | 'canonical'>,
  provider: AIResponse['provider'],
  intent: DetectedIntent
): CanonicalResponse => {
  // Build input for transformer based on provider
  const transformInput = {
    id: generateId(),
    content: response.content,
    acknowledgement: response.acknowledgement,
    responseType: response.responseType,
    insight: typeof response.insight === 'string'
      ? { headline: response.insight, sentiment: 'neutral' as const }
      : response.insight as ResponseInsight | undefined,
    widget: response.widget,
    artifact: response.artifact,
    sources: response.sources,
    suggestions: response.suggestions?.map(s => ({
      id: s.id,
      text: s.text,
      icon: s.icon,
    })),
  };

  // Transform to canonical format
  const { response: canonical } = validateAndRepair(
    transformToCanonical(transformInput, intent, provider),
    intent
  );

  // Generate Value Ladder based on intent context
  // Use intent.category for complex intent detection (not subIntent)
  const valueLadderContext = {
    commodity: intent.extractedEntities?.commodity,
    supplier: intent.extractedEntities?.supplierName,
    category: intent.extractedEntities?.category,
    queryId: canonical.id,
  };
  const valueLadder = generateValueLadder(valueLadderContext, intent.category);

  // Determine source mix from response sources (pass full array for proper classification)
  const sourceMix = determineSourceMix(response.sources);

  // Generate source enhancement suggestions (use intent.category for complex intent detection)
  const sourceEnhancement = generateSourceEnhancement(sourceMix, intent.category);

  // Add value ladder and source enhancement to canonical response
  return {
    ...canonical,
    valueLadder,
    sourceEnhancement,
    sourceMix,
  };
};

// Transform Gemini response to unified format
const transformGeminiResponse = (
  response: GeminiResponse,
  intent: DetectedIntent
): Omit<AIResponse, 'id' | 'provider' | 'thinkingDuration' | 'thinkingSteps'> => {
  // Calculate result count for escalation
  const resultCount = response.suppliers?.length || (response.portfolio ? 1 : 0);

  return {
    content: response.content,
    responseType: response.responseType,
    suggestions: response.suggestions,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sources: response.sources as any,
    artifact: response.artifact,
    artifactContent: response.artifactContent, // AI-generated artifact content
    insight: response.insight,
    handoff: response.handoff,
    // Pass through widget data and acknowledgement from AI
    widget: response.widget,
    acknowledgement: response.acknowledgement,
    suppliers: response.suppliers,
    portfolio: response.portfolio,
    riskChanges: response.riskChanges, // Pass through risk changes for trend detection
    escalation: determineEscalation(resultCount, intent.category),
    intent: response.intent || intent,
  };
};

// Generate acknowledgement based on intent
const generateAcknowledgement = (intent: DetectedIntent): string => {
  const commodity = intent.extractedEntities?.commodity;
  const supplier = intent.extractedEntities?.supplierName;

  switch (intent.category) {
    case 'market_context':
      return commodity
        ? `Researching ${commodity} market trends.`
        : 'Analyzing market conditions.';
    case 'supplier_deep_dive':
      return supplier
        ? `Researching ${supplier}.`
        : 'Analyzing supplier data.';
    case 'inflation_summary':
    case 'inflation_drivers':
    case 'inflation_impact':
      return 'Analyzing inflation impacts.';
    case 'portfolio_overview':
      return 'Reviewing your portfolio.';
    default:
      return 'Here\'s what I found.';
  }
};

// Clean up markdown formatting from Perplexity/Gemini content
const cleanMarkdownContent = (content: string): string => {
  let cleaned = content;

  // CRITICAL: Strip JSON code fences that shouldn't be in content
  // This catches cases where LLM wrapped response in markdown code block
  if (cleaned.includes('```json') || cleaned.includes('`json') || cleaned.match(/^\s*\{\s*"content"/)) {
    // Try to extract content from JSON structure
    const contentMatch = cleaned.match(/"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
    if (contentMatch) {
      cleaned = contentMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    } else {
      // Just strip the code fences
      cleaned = cleaned
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/`json\s*/gi, '')
        .replace(/`/g, '');
    }
  }

  return cleaned
    // Remove bold markers but keep text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Remove italic markers
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove heading markers
    .replace(/^#{1,6}\s+/gm, '')
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Build widget for Perplexity research responses based on intent
const buildPerplexityWidget = (
  intent: DetectedIntent
): AIResponse['widget'] | undefined => {
  const commodity = intent.extractedEntities?.commodity;

  // For market_context, build a price_gauge or events_feed widget
  if (intent.category === 'market_context' && commodity) {
    // Try to get commodity data from mock
    const commodityData = getCommodity(commodity);
    if (commodityData) {
      // Transform to PriceGaugeData format (matches gemini.ts buildWidgetData)
      const currentPrice = commodityData.currentPrice || 8245;
      const percent30d = commodityData.priceChange?.percent || 0;
      const percent24h = percent30d / 30;
      const priceChange24h = currentPrice * (percent24h / 100);
      const priceChange30d = currentPrice * (percent30d / 100);
      const rawPosition = 50 + (percent30d * 2);
      const gaugePosition = Math.max(0, Math.min(100, rawPosition));

      // Use commodity's currency, default to USD
      const currency = commodityData.currency || 'USD';

      // Determine market based on region and currency
      const market = commodityData.currency === 'CNY' ? 'Shanghai' :
                     commodityData.region === 'europe' ? 'EU Market' :
                     commodityData.region === 'global' ? 'LME' :
                     commodityData.region?.toUpperCase() || 'Global';

      return {
        type: 'price_gauge',
        title: `${commodityData.name} Price Trends`,
        data: {
          commodity: commodityData.name,
          currentPrice: currentPrice,
          unit: commodityData.unit || 'mt',
          currency,
          lastUpdated: 'Beroe today',
          gaugeMin: currentPrice * 0.7,
          gaugeMax: currentPrice * 1.3,
          gaugePosition,
          change24h: {
            value: priceChange24h,
            percent: percent24h,
          },
          change30d: {
            value: priceChange30d,
            percent: percent30d,
          },
          market,
          tags: commodityData.priceChange?.direction === 'up'
            ? ['Rising Trend', 'Supply Pressure']
            : commodityData.priceChange?.direction === 'down'
              ? ['Softening', 'Demand Weak']
              : ['Stable'],
        },
      };
    }

    // Fallback: build events_feed from market events (matching EventsFeedData schema)
    const events = getMarketEvents(commodity);
    if (events && events.length > 0) {
      return {
        type: 'events_feed',
        title: `${commodity} Market Events`,
        data: {
          events: events.slice(0, 5).map(e => ({
            id: e.id,
            title: e.title,
            summary: e.summary,
            timestamp: e.timestamp,
            type: (e.category === 'price' ? 'news' :
                  e.category === 'supply' ? 'alert' :
                  e.category === 'regulation' ? 'update' : 'news') as 'news' | 'risk_change' | 'alert' | 'update',
            impact: e.impact,
            source: e.source,
          })),
        },
      };
    }
  }

  // For portfolio_overview, build risk_distribution widget
  if (intent.category === 'portfolio_overview') {
    const portfolio = getPortfolioSummary();
    return {
      type: 'risk_distribution',
      title: 'Portfolio Risk Overview',
      data: {
        distribution: {
          high: { count: portfolio.distribution.high },
          mediumHigh: { count: portfolio.distribution.mediumHigh },
          medium: { count: portfolio.distribution.medium },
          low: { count: portfolio.distribution.low },
          unrated: { count: portfolio.distribution.unrated },
        },
        totalSuppliers: portfolio.totalSuppliers,
        totalSpendFormatted: portfolio.totalSpendFormatted,
      },
    };
  }

  // For inflation queries, build spend impact or summary widget
  if (intent.category.startsWith('inflation_')) {
    const inflationSummary = getInflationSummary();
    return {
      type: 'inflation_summary_card',
      title: 'Inflation Impact Summary',
      data: inflationSummary,
    };
  }

  // For supplier_deep_dive, build supplier_risk_card widget
  if (intent.category === 'supplier_deep_dive') {
    const supplierName = intent.extractedEntities?.supplierName;
    if (supplierName) {
      // Try to find supplier in database (using sync MOCK_SUPPLIERS)
      const supplier = MOCK_SUPPLIERS.find(s =>
        s.name.toLowerCase().includes(supplierName.toLowerCase()) ||
        supplierName.toLowerCase().includes(s.name.toLowerCase())
      );

      if (supplier) {
        return {
          type: 'supplier_risk_card',
          title: `${supplier.name} Risk Profile`,
          data: transformSupplierToRiskCardData(supplier),
        };
      }

      // External supplier - create synthetic data matching SupplierRiskCardData shape
      return {
        type: 'supplier_risk_card',
        title: `${supplierName} Overview`,
        data: {
          supplierId: `research-${supplierName.toLowerCase().replace(/\s+/g, '-')}`,
          supplierName: supplierName,
          category: intent.extractedEntities?.category || 'Technology',
          location: {
            city: 'Unknown',
            country: intent.extractedEntities?.region || 'Global',
            region: 'Global' as const,
          },
          riskScore: 0,
          riskLevel: 'medium' as const,
          trend: 'stable' as const,
          spend: 0,
          spendFormatted: 'Not in portfolio',
          lastUpdated: new Date().toISOString(),
          keyFactors: [],
          isResearched: true,
        },
      };
    }
  }

  return undefined;
};

// Transform Perplexity response to unified format
const transformPerplexityResponse = (
  response: PerplexityResponse,
  intent: DetectedIntent
): Omit<AIResponse, 'id' | 'provider' | 'thinkingDuration'> => {
  // Use registry-based widget router to get proper artifact type
  const route = getWidgetRouteFromRegistry(intent.category, intent.subIntent);

  // Clean up markdown and structure the content
  const cleanedContent = cleanMarkdownContent(response.content);

  // Generate acknowledgement
  const acknowledgement = generateAcknowledgement(intent);

  // Extract first paragraph as headline for insight
  const paragraphs = cleanedContent.split(/\n\n+/);
  const firstParagraph = paragraphs[0] || '';
  const headline = firstParagraph.length > 80
    ? firstParagraph.slice(0, 77) + '...'
    : firstParagraph;

  // Build insight from content
  const insight: ResponseInsight = {
    headline: headline || 'Research Results',
    summary: paragraphs.slice(0, 2).join(' ').slice(0, 300),
    type: 'info',
    sentiment: 'neutral',
    factors: [],
  };

  // Build widget based on intent using mock data
  const widget = buildPerplexityWidget(intent);

  // Attach portfolio and suppliers data for artifact expansion
  // This ensures "View Details" works for Perplexity responses too
  const portfolio = route.requiresPortfolio ? getPortfolioSummary() : undefined;

  // Get suppliers based on intent
  let suppliers: Supplier[] | undefined;
  if (route.requiresSuppliers) {
    const supplierName = intent.extractedEntities?.supplierName;
    if (supplierName) {
      // Try to find the specific supplier
      const supplier = MOCK_SUPPLIERS.find(s =>
        s.name.toLowerCase().includes(supplierName.toLowerCase()) ||
        supplierName.toLowerCase().includes(s.name.toLowerCase())
      );
      if (supplier) {
        suppliers = [supplier];
      }
    }
    // If no specific supplier or not found, get followed suppliers
    if (!suppliers) {
      suppliers = MOCK_SUPPLIERS.filter(s => s.isFollowed);
    }
  }

  // Get risk changes for trend detection
  const riskChanges = route.requiresRiskChanges ? MOCK_RISK_CHANGES : undefined;

  // Determine result count for escalation
  const resultCount = suppliers?.length || (portfolio ? portfolio.totalSuppliers : 0);

  return {
    acknowledgement,
    content: cleanedContent,
    responseType: response.responseType,
    suggestions: response.suggestions,
    sources: response.sources,
    // Use widget router artifact type if Perplexity didn't provide one
    artifact: response.artifact || {
      type: route.artifactType,
      title: 'Research Results',
    },
    widget,
    insight,
    // Attach supporting data for artifact expansion
    portfolio,
    suppliers,
    riskChanges,
    escalation: determineEscalation(resultCount, intent.category),
    // Always use the original classified intent - don't let Perplexity response override
    // This prevents intent drift where Perplexity might misclassify the query
    intent,
    thinkingSteps: response.thinkingSteps,
  };
};

// Transform hybrid response (Gemini + Perplexity synthesized) to AIResponse format
const transformHybridResponse = (
  hybridResponse: HybridResponse,
  intent: DetectedIntent
): Omit<AIResponse, 'id' | 'provider' | 'thinkingDuration' | 'milestones' | 'canonical'> => {
  // Use registry-based widget router to get proper artifact type
  const route = getWidgetRouteFromRegistry(intent.category, intent.subIntent);

  // Clean up the synthesized content
  const cleanedContent = cleanMarkdownContent(hybridResponse.content);

  // Generate acknowledgement
  const acknowledgement = generateAcknowledgement(intent);

  // Extract suggestions based on synthesis metadata
  const suggestions: Suggestion[] = generateSuggestions(intent.category, {
    portfolio: undefined,
    suppliers: [],
    supplier: undefined,
    context: {
      hasBeroe: hybridResponse.synthesisMetadata.beroeClaimsCount > 0,
      hasWeb: hybridResponse.synthesisMetadata.webClaimsCount > 0,
    },
  });

  // Build insight from hybrid response
  const insight: ResponseInsight = hybridResponse.insight || {
    headline: 'Combined Analysis',
    summary: cleanedContent.slice(0, 200),
    type: 'info',
    sentiment: 'neutral',
    confidence: hybridResponse.confidence.level === 'high' ? 'high' : 'medium',
  };

  // Build sources from hybrid data with confidence
  const sources: Source[] = [];

  // Add internal sources
  for (const [citationId, citation] of Object.entries(hybridResponse.citations)) {
    if (citationId.startsWith('B')) {
      sources.push({
        type: 'beroe',
        name: citation.name,
      });
    } else if (citationId.startsWith('W')) {
      const webCitation = citation as { url?: string; name: string };
      sources.push({
        type: 'web',
        name: webCitation.name,
        url: webCitation.url,
      });
    }
  }

  // Determine result count for escalation
  const resultCount = Object.keys(hybridResponse.citations).length;

  // Build ResponseSources with citations map for inline badge rendering
  const responseSources = {
    web: sources.filter(s => s.type === 'web').map(s => ({
      name: s.name,
      url: s.url,
      domain: s.url ? new URL(s.url).hostname.replace('www.', '') : undefined,
    })),
    internal: sources.filter(s => s.type !== 'web').map(s => ({
      name: s.name,
      type: s.type as 'beroe' | 'dun_bradstreet' | 'ecovadis' | 'internal_data' | 'supplier_data',
    })),
    totalWebCount: sources.filter(s => s.type === 'web').length,
    totalInternalCount: sources.filter(s => s.type !== 'web').length,
    confidence: hybridResponse.confidence,
    // CRITICAL: Include citations map for inline citation badge rendering
    citations: hybridResponse.citations,
  };

  return {
    content: cleanedContent,
    acknowledgement,
    responseType: 'summary',
    suggestions,
    sources: responseSources as unknown as Source[], // Cast for backward compatibility
    artifact: {
      type: route.artifactType,
      title: 'Analysis Results',
    },
    widget: hybridResponse.widget,
    insight,
    escalation: determineEscalation(resultCount, intent.category),
    intent,
    // Include citations for inline [B1][W1] badge rendering
    citations: hybridResponse.citations,
  };
};

// Helper to generate strengths based on supplier data (for comparison widget)
const generateStrengths = (s: Supplier): string[] => {
  const strengths: string[] = [];
  const level = s.srs?.level;
  const trend = s.srs?.trend;

  if (level === 'low') strengths.push('Low Risk');
  else if (level === 'medium') strengths.push('Moderate Risk');

  if (trend === 'improving') strengths.push('Improving Trend');
  else if (trend === 'stable') strengths.push('Stable Performance');

  if (s.location?.region) strengths.push(s.location.region);

  // Ensure at least one strength
  if (strengths.length === 0) strengths.push('Established Supplier');

  return strengths.slice(0, 3);
};

// Helper to generate weaknesses based on supplier data (for comparison widget)
const generateWeaknesses = (s: Supplier): string[] => {
  const weaknesses: string[] = [];
  const level = s.srs?.level;
  const trend = s.srs?.trend;

  if (level === 'high') weaknesses.push('High Risk');
  else if (level === 'medium-high') weaknesses.push('Elevated Risk');

  if (trend === 'worsening') weaknesses.push('Declining Trend');

  if (!s.srs?.score) weaknesses.push('Unrated');

  // Ensure at least one item (empty array causes .slice() issues)
  if (weaknesses.length === 0) weaknesses.push('Limited Data');

  return weaknesses.slice(0, 3);
};

// Generate fully local response when APIs are unavailable
const generateLocalResponse = (
  message: string,
  intent: DetectedIntent
): Omit<AIResponse, 'id' | 'provider' | 'thinkingDuration' | 'thinkingSteps'> => {
  const portfolio = getPortfolioSummary();

  switch (intent.category) {
    case 'portfolio_overview': {
      const unratedCount = portfolio.distribution.unrated;
      const highRiskCount = portfolio.distribution.high;
      const mediumHighCount = portfolio.distribution.mediumHigh;
      const needsAttention = highRiskCount + mediumHighCount;

      // Handle by_dimension subIntent - comprehensive category analysis
      if (intent.subIntent === 'by_dimension') {
        const followedSuppliers = MOCK_SUPPLIERS.filter(s => s.isFollowed);
        const categoryBreakdown = getCategoryBreakdown(portfolio, followedSuppliers);
        const spendExposure = generateSpendExposureData(followedSuppliers);

        // Sort categories by risk (high risk count + avg score)
        const sortedCategories = [...categoryBreakdown].sort((a, b) => {
          const aRisk = a.highRisk * 100 + a.avgScore;
          const bRisk = b.highRisk * 100 + b.avgScore;
          return bRisk - aRisk;
        });

        // Identify hot spots
        const hotSpots = sortedCategories.filter(c => c.highRisk > 0 || c.avgScore > 60);

        // Build detailed category profiles with suppliers
        const categoryProfiles = sortedCategories.map(cat => {
          const catSuppliers = followedSuppliers
            .filter(s => s.category === cat.category)
            .sort((a, b) => (b.srs?.score ?? 0) - (a.srs?.score ?? 0));
          const highRiskSuppliers = catSuppliers.filter(s => s.srs?.level === 'high' || s.srs?.level === 'medium-high');
          const singleSource = cat.count === 1;
          return {
            category: cat.category,
            count: cat.count,
            spend: formatSpend(cat.spend),
            spendPercent: Math.round((cat.spend / portfolio.totalSpend) * 100),
            avgScore: cat.avgScore,
            highRiskCount: highRiskSuppliers.length,
            highRiskNames: highRiskSuppliers.map(s => `${s.name} (${s.srs?.score})`),
            allSuppliers: catSuppliers.map(s => ({ name: s.name, score: s.srs?.score ?? 0, level: s.srs?.level || 'unrated' })),
            singleSource,
            riskFactors: singleSource ? ['Single-source dependency'] : highRiskSuppliers.length > 0 ? ['Elevated supplier risk'] : [],
          };
        });

        // Build structured report content
        const sections: string[] = [];

        // 1. Category Risk Profile
        sections.push('## Category Risk Profile\n');
        categoryProfiles.forEach(cat => {
          sections.push(`**${cat.category}** — ${cat.count} supplier${cat.count > 1 ? 's' : ''}, ${cat.spend} (${cat.spendPercent}% of portfolio), Avg Risk Score: ${cat.avgScore}`);
        });

        // 2. Hot Spots
        sections.push('\n## Hot Spots\n');
        if (hotSpots.length > 0) {
          hotSpots.forEach(hs => {
            const profile = categoryProfiles.find(c => c.category === hs.category);
            const issues: string[] = [];
            if (profile?.singleSource) issues.push('single-source dependency');
            if (profile?.highRiskCount) issues.push(`${profile.highRiskCount} high-risk supplier${profile.highRiskCount > 1 ? 's' : ''}`);
            if (hs.avgScore > 70) issues.push('elevated category risk score');
            sections.push(`- **${hs.category}**: ${issues.join(', ') || 'requires monitoring'}`);
          });
        } else {
          sections.push('No critical hot spots identified.');
        }

        // 3. Deep Dive on Top Concerns
        sections.push('\n## Top Concerns — Supplier Details\n');
        const topConcerns = categoryProfiles.filter(c => c.highRiskCount > 0 || c.singleSource).slice(0, 3);
        if (topConcerns.length > 0) {
          topConcerns.forEach(concern => {
            sections.push(`**${concern.category}** (${concern.spend}):`);
            concern.allSuppliers.forEach(s => {
              const riskLabel = s.level === 'high' ? '🔴' : s.level === 'medium-high' ? '🟠' : s.level === 'medium' ? '🟡' : '🟢';
              sections.push(`  - ${riskLabel} ${s.name}: Score ${s.score} (${s.level})`);
            });
            if (concern.singleSource) {
              sections.push(`  ⚠️ *Single-source risk — evaluate alternatives*`);
            }
          });
        } else {
          sections.push('No high-concern categories requiring deep dive.');
        }

        // 4. Strategic Recommendations
        sections.push('\n## Strategic Recommendations\n');
        const singleSourceCats = categoryProfiles.filter(c => c.singleSource);
        const highRiskCats = categoryProfiles.filter(c => c.highRiskCount > 0);

        if (singleSourceCats.length > 0) {
          sections.push(`1. **Diversification Priority**: ${singleSourceCats.map(c => c.category).join(', ')} ${singleSourceCats.length === 1 ? 'has' : 'have'} single-source dependency. Identify and qualify alternative suppliers.`);
        }
        if (highRiskCats.length > 0) {
          sections.push(`2. **Risk Mitigation**: Implement supplier development programs for high-risk vendors in ${highRiskCats.slice(0, 2).map(c => c.category).join(', ')}.`);
        }
        sections.push(`3. **Monitoring**: Continue tracking the ${portfolio.distribution.unrated} unrated suppliers to close visibility gaps.`);

        return {
          content: sections.join('\n'),
          responseType: 'widget',
          suggestions: generateSuggestions(intent, { portfolio }),
          sources: [
            { name: 'Beroe Risk Analytics', type: 'beroe' as const },
            { name: 'Category Intelligence', type: 'beroe' as const },
            { name: 'Supplier Database', type: 'beroe' as const },
          ],
          portfolio,
          widget: {
            type: 'spend_exposure',
            title: 'Spend Exposure by Risk Level',
            data: spendExposure,
          },
          acknowledgement: "Here's your comprehensive category risk analysis.",
          insight: {
            headline: hotSpots.length > 0 ? `${hotSpots.length} Categories Need Attention` : 'Portfolio Well-Balanced',
            summary: `${categoryProfiles.length} categories analyzed. ${singleSourceCats.length > 0 ? `${singleSourceCats.length} single-source dependencies identified. ` : ''}${highRiskCats.length > 0 ? `${highRiskCats.reduce((sum, c) => sum + c.highRiskCount, 0)} high-risk suppliers across ${highRiskCats.length} categories.` : 'No critical supplier risks.'}`,
            detail: topConcerns[0] ? `Top concern: ${topConcerns[0].category} with ${topConcerns[0].highRiskNames[0] || 'single-source risk'}` : 'No immediate concerns',
            sentiment: singleSourceCats.length > 1 || highRiskCats.length > 2 ? 'negative' : hotSpots.length > 0 ? 'neutral' : 'positive',
          },
          artifact: { type: 'portfolio_dashboard', title: 'Category Risk Analysis' },
          escalation: determineEscalation(portfolio.totalSuppliers, 'portfolio_overview'),
          intent,
        };
      }

      // Default portfolio overview (no specific subIntent)
      const primaryConcern = unratedCount > 3
        ? `The ${unratedCount} unrated suppliers represent a visibility gap that may impact risk oversight.`
        : highRiskCount > 0
        ? `You have ${highRiskCount} high-risk suppliers that require attention.`
        : `Your portfolio is well-managed with most suppliers in low-risk categories.`;

      return {
        content: `You're monitoring ${portfolio.totalSuppliers} suppliers with ${portfolio.totalSpendFormatted} total spend. ${primaryConcern}`,
        responseType: 'widget',
        suggestions: generateSuggestions(intent, { portfolio }),
        sources: [
          { name: 'Beroe Risk Analytics', type: 'beroe' as const },
          { name: 'Portfolio Database', type: 'beroe' as const },
        ],
        portfolio,
        widget: {
          type: 'risk_distribution',
          title: 'Risk Portfolio Overview',
          data: {
            // Widget expects {count} objects and totalSpendFormatted
            distribution: {
              high: { count: portfolio.distribution.high },
              mediumHigh: { count: portfolio.distribution.mediumHigh },
              medium: { count: portfolio.distribution.medium },
              low: { count: portfolio.distribution.low },
              unrated: { count: portfolio.distribution.unrated },
            },
            totalSuppliers: portfolio.totalSuppliers,
            totalSpendFormatted: portfolio.totalSpendFormatted,
          },
        },
        acknowledgement: "Here's your portfolio at a glance.",
        insight: {
          headline: unratedCount > 3 ? `${unratedCount} Unrated Suppliers` : `${highRiskCount} High Risk Suppliers`,
          summary: `Your portfolio includes ${portfolio.totalSuppliers} monitored suppliers representing ${portfolio.totalSpendFormatted} in total spend. ${unratedCount > 3 ? `The ${unratedCount} unrated suppliers represent a visibility gap that should be addressed to ensure comprehensive risk coverage.` : highRiskCount > 0 ? `Focus attention on the ${highRiskCount} high-risk suppliers to mitigate potential disruptions.` : 'Most suppliers are in low-risk categories, indicating a well-managed portfolio.'}`,
          detail: `${needsAttention} suppliers need attention out of ${portfolio.totalSuppliers} total`,
          sentiment: highRiskCount > 2 || unratedCount > 5 ? 'negative' : 'neutral',
        },
        artifact: { type: 'portfolio_dashboard', title: 'Risk Portfolio Overview' },
        escalation: determineEscalation(portfolio.totalSuppliers, 'portfolio_overview'),
        intent,
      };
    }

    case 'filtered_discovery': {
      const riskLevel = intent.extractedEntities.riskLevel;
      const region = intent.extractedEntities.region;
      const filters: Record<string, unknown> = {};

      if (riskLevel) filters.riskLevel = riskLevel;
      if (region) filters.region = region;

      const suppliers = filterSuppliers(MOCK_SUPPLIERS, filters).filter(s => s.isFollowed);
      const filterDesc = [
        riskLevel ? `${riskLevel} risk` : '',
        region ? `in ${region}` : '',
      ].filter(Boolean).join(' ') || 'your criteria';

      return {
        content: `Found ${suppliers.length} supplier(s) matching ${filterDesc}.`,
        responseType: 'table',
        suggestions: generateSuggestions(intent, { suppliers, resultCount: suppliers.length }),
        suppliers,
        widget: {
          type: 'supplier_table',
          title: 'Filtered Suppliers',
          data: transformSuppliersToTableData(suppliers, filters as Record<string, string>),
        },
        acknowledgement: "Here are the matching suppliers.",
        artifact: { type: 'supplier_table', title: 'Filtered Suppliers', filters },
        escalation: determineEscalation(suppliers.length, 'filtered_discovery'),
        intent,
      };
    }

    case 'supplier_deep_dive': {
      // Try to find mentioned supplier
      const supplierNames = MOCK_SUPPLIERS.map(s => s.name.toLowerCase());
      const queryLower = message.toLowerCase();
      const matchedName = supplierNames.find(name =>
        queryLower.includes(name) || name.split(' ').some(part => queryLower.includes(part))
      );

      const supplier = matchedName
        ? MOCK_SUPPLIERS.find(s => s.name.toLowerCase() === matchedName)
        : MOCK_SUPPLIERS[0];

      if (supplier) {
        return {
          content: `${supplier.name} has a Supplier Risk Score of ${supplier.srs.score} (${supplier.srs.level.replace('-', ' ')}). ${supplier.srs.trend === 'worsening' ? 'The risk trend is worsening.' : supplier.srs.trend === 'improving' ? 'Risk is improving.' : 'Risk level is stable.'}`,
          responseType: 'widget',
          suggestions: generateSuggestions(intent, { suppliers: [supplier] }),
          suppliers: [supplier],
          widget: {
            type: 'supplier_risk_card',
            title: `${supplier.name} Risk Profile`,
            data: transformSupplierToRiskCardData(supplier),
          },
          acknowledgement: "Here's the detailed profile.",
          insight: {
            headline: `${supplier.name} Risk: ${supplier.srs.level.replace('-', ' ').toUpperCase()}`,
            detail: `Score: ${supplier.srs.score} | Trend: ${supplier.srs.trend}`,
            sentiment: supplier.srs.level === 'high' ? 'negative' : supplier.srs.level === 'low' ? 'positive' : 'neutral',
          },
          artifact: { type: 'supplier_detail', title: `${supplier.name} Risk Profile`, supplierId: supplier.id },
          escalation: determineEscalation(1, 'supplier_deep_dive'),
          intent,
        };
      }
      break;
    }

    case 'trend_detection': {
      const changes = MOCK_RISK_CHANGES;
      const riskChangesForSuggestions = changes.map(c => ({
        supplierName: c.supplierName,
        direction: c.direction,
        previousScore: c.previousScore,
        currentScore: c.currentScore,
      }));
      const worseningCount = changes.filter(c => c.direction === 'worsened').length;
      return {
        content: `${changes.length} supplier(s) with notable risk changes. ${worseningCount > 0 ? `${worseningCount} have worsened and may need attention.` : 'All changes are improvements.'}`,
        responseType: 'alert',
        suggestions: generateSuggestions(intent, { riskChanges: riskChangesForSuggestions, resultCount: changes.length }),
        riskChanges: changes, // Pass full RiskChange[] for componentSelector
        widget: {
          type: 'alert_card',
          title: 'Risk Changes',
          data: transformRiskChangesToAlertData(changes),
        },
        acknowledgement: "Spotted some changes.",
        insight: worseningCount > 0 ? {
          headline: `${worseningCount} Supplier(s) Risk Worsened`,
          detail: 'Review these suppliers for potential action',
          sentiment: 'negative',
        } : undefined,
        artifact: { type: 'supplier_table', title: 'Risk Changes' },
        escalation: determineEscalation(changes.length, 'trend_detection'),
        intent,
      };
    }

    case 'restricted_query':
      return {
        content: `This score is calculated from multiple weighted factors including financial health, operational metrics, and compliance indicators.\n\nTo see the full breakdown of contributing factors and scores, you'll need to view the detailed risk profile in the dashboard, as some data comes from partners with viewing restrictions.\n\nI can still help you compare this supplier to others or find alternatives if that would be useful.`,
        responseType: 'handoff',
        suggestions: generateSuggestions(intent, { hasHandoff: true }),
        handoff: {
          required: true,
          reason: 'Detailed factor scores require dashboard access due to partner data restrictions.',
          linkText: 'View Full Risk Profile in Dashboard',
          url: '/dashboard/risk-profile',
        },
        artifact: { type: 'supplier_detail', title: 'Risk Profile' },
        escalation: determineEscalation(0, 'restricted_query'),
        intent,
      };

    case 'action_trigger': {
      const action = intent.extractedEntities.action;
      if (action?.includes('alternative') || action?.includes('find')) {
        return {
          content: `I'll help you find alternative suppliers. Let me search for options that match your requirements.\n\nTo get the best matches, could you tell me:\n- Which category or industry?\n- Preferred regions?\n- Any specific requirements?`,
          responseType: 'summary',
          suggestions: generateSuggestions(intent, {}),
          escalation: determineEscalation(0, 'action_trigger'),
          intent,
        };
      }
      return {
        content: "I can help you take action on your supplier risk. What would you like to do? Options include finding alternatives for risky suppliers, setting up alerts for risk changes, creating a mitigation plan, or exporting data for reporting.",
        responseType: 'summary',
        suggestions: generateSuggestions(intent, {}),
        escalation: determineEscalation(0, 'action_trigger'),
        intent,
      };
    }

    case 'comparison': {
      // Get suppliers to compare - either mentioned or top risk
      const highRisk = filterSuppliers(MOCK_SUPPLIERS, { riskLevel: ['high', 'medium-high'] });
      const toCompare = highRisk.slice(0, 3);

      return {
        content: `Here's a side-by-side comparison. ${toCompare[0]?.name} has the highest risk exposure.`,
        responseType: 'table',
        suggestions: generateSuggestions(intent, { suppliers: toCompare }),
        suppliers: toCompare,
        widget: {
          type: 'comparison_table',
          title: 'Supplier Comparison',
          data: {
            suppliers: toCompare.map(s => ({
              id: s.id,
              name: s.name,
              riskScore: s.srs?.score ?? 0,
              riskLevel: s.srs?.level || 'unrated',
              category: s.category,
              location: s.location?.region || 'Unknown',
              spend: s.spendFormatted || formatSpend(s.spend),
              trend: s.srs?.trend || 'stable',
              strengths: generateStrengths(s),
              weaknesses: generateWeaknesses(s),
            })),
            comparisonDimensions: ['riskScore', 'riskLevel', 'trend', 'spend', 'category'],
          },
        },
        acknowledgement: "Here's how they stack up.",
        artifact: { type: 'supplier_comparison', title: 'Supplier Comparison' },
        escalation: determineEscalation(toCompare.length, 'comparison'),
        intent,
      };
    }

    case 'explanation_why': {
      return {
        content: `The Supplier Risk Score (SRS) is calculated from multiple weighted factors including ESG & Sustainability, Delivery Performance, Quality Metrics, Financial Health, Cybersecurity, and Compliance. The overall composite score ranges from 0-100 with risk level classification. Some detailed factor scores require dashboard access due to partner data restrictions. Want me to explain a specific supplier's situation?`,
        responseType: 'summary',
        suggestions: generateSuggestions(intent, {}),
        escalation: determineEscalation(0, 'explanation_why'),
        intent,
      };
    }

    case 'setup_config': {
      suggestionEngine.recordQuestion('setup_config');
      return {
        content: `I can help you set up supplier monitoring. Options include adding suppliers, configuring risk alerts, customizing weight settings, or bulk importing your supplier list. What would you like to configure?`,
        responseType: 'summary',
        suggestions: generateSuggestions(intent, {}),
        escalation: determineEscalation(0, 'setup_config'),
        intent,
      };
    }

    case 'reporting_export': {
      return {
        content: `I can generate several report types: a portfolio summary overview, supplier list CSV export, trend report showing risk changes over time, or an executive summary. Note that some detailed factor scores are excluded due to partner data restrictions.`,
        responseType: 'summary',
        suggestions: generateSuggestions(intent, {}),
        escalation: determineEscalation(0, 'reporting_export'),
        intent,
      };
    }

    case 'market_context': {
      // Provide actual market context from available data
      const followedSuppliers = MOCK_SUPPLIERS.filter(s => s.isFollowed);
      const highRiskSuppliers = followedSuppliers.filter(s => s.srs?.level === 'high' || s.srs?.level === 'medium-high');
      const worseningSuppliers = followedSuppliers.filter(s => s.srs?.trend === 'worsening');
      const categoryBreakdown = getCategoryBreakdown(portfolio, followedSuppliers);

      // Build actual market briefing from available data
      const sections: string[] = [];

      sections.push('## Portfolio Risk Summary\n');
      sections.push(`Monitoring ${portfolio.totalSuppliers} suppliers across ${categoryBreakdown.length} categories with ${portfolio.totalSpendFormatted} total spend.\n`);

      sections.push('## Risk Signals\n');
      if (highRiskSuppliers.length > 0) {
        sections.push(`**${highRiskSuppliers.length} High-Risk Suppliers:**`);
        highRiskSuppliers.slice(0, 5).forEach(s => {
          sections.push(`- ${s.name} (${s.category}): Score ${s.srs?.score}, ${s.srs?.trend} trend`);
        });
      }
      if (worseningSuppliers.length > 0) {
        sections.push(`\n**${worseningSuppliers.length} Suppliers with Worsening Trends:**`);
        worseningSuppliers.slice(0, 3).forEach(s => {
          sections.push(`- ${s.name}: ${s.srs?.score} (was improving, now worsening)`);
        });
      }

      sections.push('\n## Category Exposure\n');
      const sortedCats = [...categoryBreakdown].sort((a, b) => b.highRisk - a.highRisk);
      sortedCats.slice(0, 4).forEach(cat => {
        const riskNote = cat.highRisk > 0 ? ` ⚠️ ${cat.highRisk} high-risk` : '';
        sections.push(`- **${cat.category}**: ${cat.count} suppliers, ${formatSpend(cat.spend)}${riskNote}`);
      });

      sections.push('\n## Recommended Actions\n');
      if (highRiskSuppliers.length > 0) {
        sections.push(`1. Review the ${highRiskSuppliers.length} high-risk suppliers for mitigation opportunities`);
      }
      if (worseningSuppliers.length > 0) {
        sections.push(`2. Investigate root causes for ${worseningSuppliers.length} suppliers with worsening trends`);
      }
      sections.push(`3. Address visibility gaps: ${portfolio.distribution.unrated} suppliers remain unrated`);

      sections.push('\n*For real-time market news and external intelligence, enable web search mode.*');

      return {
        content: sections.join('\n'),
        responseType: 'widget',
        suggestions: generateSuggestions(intent, { portfolio }),
        sources: [
          { name: 'Beroe Risk Analytics', type: 'beroe' as const },
          { name: 'Portfolio Intelligence', type: 'beroe' as const },
        ],
        portfolio,
        widget: {
          type: 'risk_distribution',
          title: 'Portfolio Risk Overview',
          data: {
            distribution: {
              high: { count: portfolio.distribution.high },
              mediumHigh: { count: portfolio.distribution.mediumHigh },
              medium: { count: portfolio.distribution.medium },
              low: { count: portfolio.distribution.low },
              unrated: { count: portfolio.distribution.unrated },
            },
            totalSuppliers: portfolio.totalSuppliers,
            totalSpendFormatted: portfolio.totalSpendFormatted,
          },
        },
        acknowledgement: "Here's your portfolio risk briefing.",
        insight: {
          headline: highRiskSuppliers.length > 0 ? `${highRiskSuppliers.length} High-Risk Suppliers` : 'Portfolio Status',
          summary: `${portfolio.totalSuppliers} suppliers monitored. ${highRiskSuppliers.length} at elevated risk, ${worseningSuppliers.length} trending worse.`,
          detail: `Top concern: ${highRiskSuppliers[0]?.name || 'None'} in ${highRiskSuppliers[0]?.category || 'N/A'}`,
          sentiment: highRiskSuppliers.length > 2 ? 'negative' : 'neutral',
        },
        escalation: determineEscalation(portfolio.totalSuppliers, 'market_context'),
        intent,
      };
    }

    // ==========================================
    // INFLATION WATCH INTENTS
    // ==========================================
    case 'inflation_summary': {
      const summary = getInflationSummary();
      return {
        content: `${summary.period} Inflation Update: ${summary.headline} Overall portfolio impact is ${summary.overallChange.direction === 'up' ? '+' : ''}${summary.overallChange.percent}%.`,
        responseType: 'widget',
        suggestions: generateSuggestions(intent, {}),
        sources: [
          { name: 'Beroe Market Intelligence', type: 'beroe' as const },
          { name: 'Commodity Price Index', type: 'beroe' as const },
        ],
        widget: {
          type: 'inflation_summary_card',
          title: 'Monthly Inflation Summary',
          data: summary,
        },
        acknowledgement: "Here's the inflation overview.",
        insight: {
          headline: `Portfolio impact ${summary.overallChange.direction === 'up' ? '+' : ''}${summary.overallChange.percent}%`,
          summary: `${summary.headline} The overall portfolio is seeing a ${summary.overallChange.percent}% ${summary.overallChange.direction === 'up' ? 'increase' : 'decrease'} in costs this period. Review individual category trends to identify negotiation opportunities.`,
          detail: summary.headline,
          sentiment: summary.overallChange.direction === 'up' ? 'negative' : 'positive',
        },
        artifact: { type: 'inflation_dashboard', title: 'Inflation Dashboard' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        escalation: determineEscalation((summary as any).categories?.length || 5, 'inflation_summary'),
        intent,
      };
    }

    case 'inflation_drivers': {
      const commodity = intent.extractedEntities.commodity || 'Steel';
      const drivers = getCommodityDrivers(commodity);
      const topDriver = drivers.drivers[0];
      return {
        content: `${drivers.commodity} prices are ${drivers.priceChange.direction === 'up' ? 'up' : 'down'} ${drivers.priceChange.percent}% this period${topDriver ? `, driven primarily by ${topDriver.name.toLowerCase()} (${topDriver.contribution}% contribution)` : ''}. ${drivers.marketContext}`,
        responseType: 'widget',
        suggestions: generateSuggestions(intent, {}),
        sources: [
          { name: 'Beroe Price Analytics', type: 'beroe' as const },
          { name: 'Market Intelligence', type: 'beroe' as const },
          { name: 'Supplier Cost Data', type: 'beroe' as const },
        ],
        widget: {
          type: 'driver_breakdown_card',
          title: `${drivers.commodity} Price Drivers`,
          data: drivers,
        },
        acknowledgement: `Analyzing ${drivers.commodity} price trends.`,
        insight: {
          headline: `${drivers.commodity} prices ${drivers.priceChange.direction} ${drivers.priceChange.percent}%`,
          summary: `Key driver: ${topDriver?.name || 'Multiple factors'} contributing ${topDriver?.contribution || 0}% to the price movement. ${topDriver?.description || ''}`,
          detail: drivers.drivers[0]?.description || 'Multiple factors driving price movement',
          sentiment: drivers.priceChange.direction === 'up' ? 'negative' : 'positive',
        },
        artifact: { type: 'driver_analysis', title: `${drivers.commodity} Analysis` },
        escalation: determineEscalation(drivers.drivers.length, 'inflation_drivers'),
        intent,
      };
    }

    case 'inflation_impact': {
      const impact = getSpendImpact();
      return {
        content: `Total inflation impact on your portfolio is ${impact.totalImpact}, representing a ${impact.impactPercent}% ${impact.totalImpactDirection} ${impact.timeframe}. ${impact.recommendation}`,
        responseType: 'widget',
        suggestions: generateSuggestions(intent, {}),
        sources: [
          { name: 'Beroe Spend Analytics', type: 'beroe' as const },
          { name: 'Budget Tracking', type: 'beroe' as const },
        ],
        widget: {
          type: 'spend_impact_card',
          title: 'Spend Impact Analysis',
          data: impact,
        },
        acknowledgement: "Here's how inflation affects your spend.",
        insight: {
          headline: `${impact.totalImpact} total impact`,
          summary: `Current inflation trends are adding ${impact.totalImpact} to your portfolio spend, representing a ${impact.impactPercent}% ${impact.totalImpactDirection} ${impact.timeframe}. ${impact.recommendation}`,
          detail: impact.recommendation,
          sentiment: impact.totalImpactDirection === 'increase' ? 'negative' : 'positive',
        },
        artifact: { type: 'impact_analysis', title: 'Impact Analysis' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        escalation: determineEscalation((impact as any).categories?.length || 4, 'inflation_impact'),
        intent,
      };
    }

    case 'inflation_justification': {
      const supplier = intent.extractedEntities.supplier || 'Acme Steel';
      const commodity = intent.extractedEntities.commodity;
      const justification = getJustificationData(supplier, commodity);
      return {
        content: `${justification.supplierName} is requesting a ${justification.requestedIncrease}% increase on ${justification.commodity}. Verdict: ${justification.verdictLabel}. Market benchmark is ${justification.marketBenchmark}%.`,
        responseType: 'widget',
        suggestions: generateSuggestions(intent, {}),
        sources: [
          { name: 'Beroe Benchmarking', type: 'beroe' as const },
          { name: 'Market Rate Index', type: 'beroe' as const },
        ],
        widget: {
          type: 'justification_card',
          title: 'Price Increase Validation',
          data: justification,
        },
        acknowledgement: "Validating the price increase request.",
        insight: {
          headline: `Verdict: ${justification.verdictLabel}`,
          summary: `${justification.supplierName}'s requested ${justification.requestedIncrease}% increase on ${justification.commodity} is ${Math.abs(justification.requestedIncrease - justification.marketBenchmark).toFixed(1)}% ${justification.requestedIncrease > justification.marketBenchmark ? 'above' : 'below'} the current market benchmark of ${justification.marketBenchmark}%. ${justification.verdict === 'questionable' ? 'Consider negotiating or seeking alternative quotes.' : justification.verdict === 'justified' ? 'The request aligns with market conditions.' : 'Additional analysis recommended before decision.'}`,
          detail: `Request ${Math.abs(justification.requestedIncrease - justification.marketBenchmark).toFixed(1)}% ${justification.requestedIncrease > justification.marketBenchmark ? 'above' : 'below'} market`,
          sentiment: justification.verdict === 'questionable' ? 'negative' : justification.verdict === 'justified' ? 'positive' : 'neutral',
        },
        artifact: { type: 'justification_report', title: 'Justification Report' },
        escalation: determineEscalation(1, 'inflation_justification'),
        intent,
      };
    }

    case 'inflation_scenarios': {
      // Check if this is a price forecast query for a specific commodity
      const commodity = intent.extractedEntities.commodity;
      if (intent.subIntent === 'price_forecast' && commodity) {
        const commodityData = getCommodity(commodity);
        const drivers = getCommodityDrivers(commodity);

        if (commodityData) {
          const priceDirection = commodityData.priceChange?.direction || 'stable';
          const pricePercent = commodityData.priceChange?.percent || 0;
          const forecastTrend = pricePercent > 0 ? 'upward' : pricePercent < 0 ? 'downward' : 'stable';

          // Use commodity's currency, default to USD
          const currency = commodityData.currency || 'USD';
          const currencySymbol = currency === 'CNY' ? '¥' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

          // Determine market based on region and currency
          const market = currency === 'CNY' ? 'Shanghai' :
                         commodityData.region === 'europe' ? 'EU Market' :
                         commodityData.region === 'global' ? 'LME' :
                         commodityData.region?.toUpperCase() || 'Global';

          return {
            content: `**${commodityData.name} Price Forecast (Q1 2025)**\n\nCurrent price: ${currencySymbol}${commodityData.currentPrice?.toLocaleString() || '2,380'} per ${commodityData.unit || 'metric ton'}. The market is showing ${forecastTrend} momentum with ${Math.abs(pricePercent)}% change over the past 30 days.\n\n**Key Drivers:**\n${drivers.drivers.slice(0, 3).map(d => `- **${d.name}** (${d.contribution}% impact): ${d.description}`).join('\n')}\n\n**Outlook:** ${drivers.marketContext}`,
            responseType: 'widget',
            suggestions: generateSuggestions(intent, {}),
            sources: [
              { name: 'Beroe Price Analytics', type: 'beroe' as const },
              { name: currency === 'CNY' ? 'Shanghai Metals Market' : 'LME Market Data', type: 'web' as const, url: currency === 'CNY' ? 'https://www.smm.cn' : 'https://www.lme.com' },
              { name: 'CRU Group', type: 'web' as const, url: 'https://www.crugroup.com' },
            ],
            widget: {
              type: 'price_gauge',
              title: `${commodityData.name} Price`,
              data: {
                // PriceGaugeData format (numeric values)
                commodity: commodityData.name,
                currentPrice: commodityData.currentPrice || 0,
                unit: commodityData.unit || 'mt',
                currency,
                lastUpdated: 'Beroe today',
                gaugeMin: (commodityData.currentPrice || 0) * 0.7,
                gaugeMax: (commodityData.currentPrice || 0) * 1.3,
                // Clamp to [0, 100] to prevent rendering outside the arc
                gaugePosition: Math.max(0, Math.min(100, Math.round(50 + (pricePercent * 2)))),
                change24h: {
                  value: Math.abs((commodityData.currentPrice || 0) * (pricePercent / 30) / 100),
                  percent: pricePercent / 30,
                },
                change30d: {
                  value: Math.abs((commodityData.currentPrice || 0) * pricePercent / 100),
                  percent: pricePercent,
                },
                market,
                tags: priceDirection === 'up'
                  ? ['Rising Trend', 'Supply Pressure']
                  : priceDirection === 'down'
                    ? ['Softening', 'Demand Weak']
                    : ['Stable'],
              },
            },
            acknowledgement: `Here's the ${commodityData.name} price forecast.`,
            insight: {
              headline: `${commodityData.name} ${priceDirection === 'up' ? '+' : ''}${pricePercent}% (30d)`,
              summary: `${commodityData.name} prices are ${forecastTrend === 'upward' ? 'rising' : forecastTrend === 'downward' ? 'falling' : 'stable'}. ${drivers.marketContext}`,
              detail: `Primary driver: ${drivers.drivers[0]?.name || 'Market conditions'}`,
              sentiment: priceDirection === 'up' ? 'negative' : 'positive',
            },
            artifact: { type: 'commodity_dashboard', title: `${commodityData.name} Dashboard` },
            escalation: determineEscalation(1, 'inflation_scenarios'),
            intent,
          };
        }
      }

      // Default scenario handling
      const scenario = getScenarioData();
      const deltaLabel = `${scenario.delta.direction === 'up' ? '+' : '-'}${scenario.delta.amount} (${scenario.delta.percent}%)`;
      return {
        content: `Scenario: ${scenario.scenarioName}. ${scenario.description} Projected impact: ${deltaLabel}.`,
        responseType: 'widget',
        suggestions: generateSuggestions(intent, {}),
        sources: [
          { name: 'Beroe Forecasting', type: 'beroe' as const },
          { name: 'Scenario Modeling', type: 'beroe' as const },
        ],
        widget: {
          type: 'scenario_card',
          title: 'What-If Scenario',
          data: scenario,
        },
        acknowledgement: "Here's the scenario analysis.",
        insight: {
          headline: deltaLabel,
          summary: `${scenario.description} Under the "${scenario.scenarioName}" scenario, the projected impact is ${deltaLabel}. Use this analysis to inform budget planning and risk mitigation strategies.`,
          detail: scenario.description,
          sentiment: scenario.delta.direction === 'up' ? 'negative' : 'positive',
        },
        artifact: { type: 'scenario_planner', title: 'Scenario Planner' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        escalation: determineEscalation((scenario as any).variables?.length || 3, 'inflation_scenarios'),
        intent,
      };
    }
  }

  // Default fallback
  return {
    content: "I'd be happy to help you with your supplier risk analysis. What would you like to know about your portfolio?",
    responseType: 'summary',
    suggestions: generateSuggestions(intent, {}),
    escalation: determineEscalation(0, 'general'),
    intent,
  };
};

// Quick access functions
export const getQuickPortfolioSummary = (): ReturnType<typeof getPortfolioSummary> => {
  return getPortfolioSummary();
};

export const getQuickHighRiskSuppliers = (): Supplier[] => {
  return filterSuppliers(MOCK_SUPPLIERS, { riskLevel: ['high', 'medium-high'] });
};

// Check configuration status
export const getAIStatus = () => ({
  gemini: isGeminiConfigured(),
  perplexity: isPerplexityConfigured(),
  canOperate: isGeminiConfigured() || isPerplexityConfigured() || true, // Always true due to local fallback
});
