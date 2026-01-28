// AI Orchestration Layer - Routes between Gemini and Perplexity
import type { GeminiResponse } from './gemini';
import { callGeminiV2, isGeminiConfigured, decomposeResearchQuery, fetchBeroeIntelligence } from './gemini';
import { generateDynamicIntake } from './deepResearchIntake';
import type { PerplexityResponse } from './perplexity';
import { callPerplexity, isPerplexityConfigured } from './perplexity';
import { synthesizeResearchReport, isDeepSeekConfigured, synthesizeTemplatedReport } from './deepseek';
import type { StructuredDataContext } from './deepseek';
import { getReportTemplate } from './reportTemplates';
import { ENRICHED_COMMODITIES } from './enrichedCommodityData';
import type { EnrichedCommodity } from '../types/enrichedData';
import type { ChatMessage, Suggestion, Source } from '../types/chat';
import { generateId } from '../types/chat';
// Deep Research types
import type { DeepResearchResponse, StudyType, CommandCenterProgress, ResearchInsight, ResearchAgent, CommandCenterStage, PhaseStatus } from '../types/deepResearch';
import { createDeepResearchResponse, getDefaultProcessingSteps, createInitialProgress, normalizeStage, initPhases } from '../types/deepResearch';
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
  // Deep Research mode: multi-stage research with clarifying questions and report generation
  deepResearchMode?: boolean;
  // Study type for deep research
  deepResearchStudyType?: StudyType;
  // Credits available for deep research
  creditsAvailable?: number;
}

// Note: simulateThinkingDuration and generateThinkingSteps removed - using real timing instead

// Main orchestration function
export const sendMessage = async (
  message: string,
  options: SendMessageOptions
): Promise<AIResponse> => {
  const { mode, webSearchEnabled, conversationHistory = [], builderMeta, onMilestone, hybridMode, managedCategories, deepResearchMode, deepResearchStudyType, creditsAvailable } = options;

  // ============================================
  // DEEP RESEARCH BYPASS - Must come BEFORE hybrid/standard routing
  // ============================================
  if (deepResearchMode) {
    console.log('[AI] Deep Research mode - bypassing standard/hybrid routing');
    const deepResearchResponse = await startDeepResearchFlow(message, {
      studyType: deepResearchStudyType,
      creditsAvailable: creditsAvailable || 0,
      conversationHistory,
    });

    // Return a minimal AIResponse that contains the deep research data
    // The actual rendering will be handled by DeepResearchMessage component
    return {
      id: generateId(),
      content: `Starting deep research: "${message}"`,
      responseType: 'summary',
      suggestions: [],
      escalation: {
        showInline: true,
        expandToArtifact: true,
        resultCount: 0,
        threshold: 0,
      },
      intent: {
        category: 'market_context',
        subIntent: 'briefing',
        confidence: 1.0,
        responseType: 'widget',
        artifactType: 'deep_research_progress',
        extractedEntities: {},
        requiresHandoff: false,
        requiresResearch: true,
        requiresDiscovery: false,
      },
      provider: 'hybrid',
      artifact: {
        type: 'deep_research_progress',
        title: 'Deep Research in Progress',
      },
      // Attach deep research response for component rendering
      deepResearch: deepResearchResponse,
    } as AIResponse & { deepResearch: DeepResearchResponse };
  }

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
    console.log('[AI] Auto-research triggered:', intent.requiresResearch,
      intent.requiresResearch ? `(reason: ${intent.researchContext ? 'research_trigger' : intent.subIntent})` : '');
    console.log('[AI] Hybrid mode:', hybridMode);
    console.log('[AI] Gemini configured:', isGeminiConfigured(), '| Perplexity configured:', isPerplexityConfigured());
    console.log('[AI] Provider decision: usePerplexity =', usePerplexity,
      `(mode=${mode}, webSearch=${webSearchEnabled}, requiresResearch=${intent.requiresResearch})`);

    // HYBRID MODE: Call both Gemini (Beroe) and Perplexity (Web) in parallel
    // Trigger hybrid when:
    // - hybridMode: explicitly requested by caller
    // - webSearchEnabled: user toggled web search on (always use hybrid to combine Beroe + Web)
    // This ensures Beroe data is always included when doing web research
    const shouldUseHybrid = hybridMode || webSearchEnabled;
    const finalProvider = shouldUseHybrid && isPerplexityConfigured() && isGeminiConfigured()
      ? 'hybrid'
      : (usePerplexity && isPerplexityConfigured() ? 'perplexity' : (isGeminiConfigured() ? 'gemini' : 'local'));
    console.log(`[AI] → ROUTING TO: ${finalProvider.toUpperCase()}`,
      `(shouldUseHybrid=${shouldUseHybrid}, usePerplexity=${usePerplexity})`);

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

      // Use enriched gauge bounds if available, otherwise estimate from price
      const gaugeMin = commodityData.priceFloor || currentPrice * 0.7;
      const gaugeMax = commodityData.priceCeiling || currentPrice * 1.3;

      // Calculate gauge position based on price floor/ceiling if available
      let enrichedGaugePosition = gaugePosition;
      if (commodityData.priceFloor && commodityData.priceCeiling) {
        const range = commodityData.priceCeiling - commodityData.priceFloor;
        const position = currentPrice - commodityData.priceFloor;
        enrichedGaugePosition = Math.max(0, Math.min(100, (position / range) * 100));
      }

      // Use benchmark index if available
      const enrichedMarket = commodityData.benchmarkIndex || market;

      return {
        type: 'price_gauge',
        title: `${commodityData.name} Price Trends`,
        data: {
          commodity: commodityData.name,
          currentPrice: currentPrice,
          unit: commodityData.unit || 'mt',
          currency,
          lastUpdated: 'Beroe today',
          gaugeMin,
          gaugeMax,
          gaugePosition: enrichedGaugePosition,
          change24h: {
            value: priceChange24h,
            percent: percent24h,
          },
          change30d: {
            value: priceChange30d,
            percent: percent30d,
          },
          market: enrichedMarket,
          tags: commodityData.priceChange?.direction === 'up'
            ? ['Rising Trend', 'Supply Pressure']
            : commodityData.priceChange?.direction === 'down'
              ? ['Softening', 'Demand Weak']
              : ['Stable'],

          // Enriched Market Insights fields (for the new insights row)
          sentiment: commodityData.sentiment,
          volatility30d: commodityData.volatility30d,
          supplyRisk: commodityData.supplyRisk,
          supplyRiskScore: commodityData.supplyRiskScore,
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
                // Use enriched price bounds if available
                gaugeMin: commodityData.priceFloor || (commodityData.currentPrice || 0) * 0.7,
                gaugeMax: commodityData.priceCeiling || (commodityData.currentPrice || 0) * 1.3,
                // Calculate gauge position from enriched bounds if available
                gaugePosition: commodityData.priceFloor && commodityData.priceCeiling
                  ? Math.max(0, Math.min(100, (((commodityData.currentPrice || 0) - commodityData.priceFloor) / (commodityData.priceCeiling - commodityData.priceFloor)) * 100))
                  : Math.max(0, Math.min(100, Math.round(50 + (pricePercent * 2)))),
                change24h: {
                  value: Math.abs((commodityData.currentPrice || 0) * (pricePercent / 30) / 100),
                  percent: pricePercent / 30,
                },
                change30d: {
                  value: Math.abs((commodityData.currentPrice || 0) * pricePercent / 100),
                  percent: pricePercent,
                },
                // Use benchmark index if available
                market: commodityData.benchmarkIndex || market,
                tags: priceDirection === 'up'
                  ? ['Rising Trend', 'Supply Pressure']
                  : priceDirection === 'down'
                    ? ['Softening', 'Demand Weak']
                    : ['Stable'],

                // Enriched Market Insights fields (for the new insights row)
                sentiment: commodityData.sentiment,
                volatility30d: commodityData.volatility30d,
                supplyRisk: commodityData.supplyRisk,
                supplyRiskScore: commodityData.supplyRiskScore,
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

// ============================================
// DEEP RESEARCH FLOW
// ============================================

interface DeepResearchFlowOptions {
  studyType?: StudyType;
  creditsAvailable: number;
  conversationHistory: ChatMessage[];
}

/**
 * Start the deep research flow - returns intake questions or starts processing
 * This is the entry point for deep research mode
 */
export const startDeepResearchFlow = async (
  query: string,
  options: DeepResearchFlowOptions
): Promise<DeepResearchResponse> => {
  const { studyType = 'market_analysis', creditsAvailable, conversationHistory } = options;

  // Detect if query is a meta-request (e.g., "do a deep research on this topic")
  // and extract the actual topic from conversation history
  let resolvedQuery = query;
  const metaPatterns = /\b(deep research|research this|analyze this|study this|look into this|research on this|do.*research|investigate this)\b/i;

  if (metaPatterns.test(query) && conversationHistory.length > 0) {
    // Find the last substantive user message that isn't a meta-request
    const userMessages = conversationHistory
      .filter(m => m.role === 'user')
      .filter(m => !metaPatterns.test(m.content))
      .filter(m => m.content.length > 10); // Filter out very short messages

    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1];
      resolvedQuery = lastUserMessage.content;
      console.log('[DeepResearch] Resolved meta-request to actual topic:', { original: query, resolved: resolvedQuery });
    } else {
      // Try to extract topic from the current query itself
      const topicMatch = query.match(/(?:research|analyze|study|investigate|look into)\s+(?:on\s+)?(?:the\s+)?(?:topic\s+(?:of\s+)?)?["']?([^"']+?)["']?\s*$/i);
      if (topicMatch && topicMatch[1] && topicMatch[1].length > 5) {
        resolvedQuery = topicMatch[1].trim();
        console.log('[DeepResearch] Extracted topic from query:', { original: query, extracted: resolvedQuery });
      }
    }
  }

  // Generate a unique job ID for this research session
  const jobId = `dr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Determine credits required based on study type
  const creditsRequired = getCreditsRequiredForStudy(studyType);

  console.log('[DeepResearch] Starting flow:', { jobId, query: resolvedQuery, studyType, creditsAvailable, creditsRequired });

  // Check if user has enough credits
  if (creditsAvailable < creditsRequired) {
    return {
      type: 'deep_research',
      jobId,
      query: resolvedQuery,
      studyType,
      phase: 'error',
      creditsAvailable,
      creditsRequired,
      error: {
        message: `Insufficient credits. This research requires ${creditsRequired} credits, but you have ${creditsAvailable}.`,
        code: 'INSUFFICIENT_CREDITS',
        canRetry: false,
      },
    };
  }

  // Generate dynamic intake questions from context
  // Uses two-layer engine: deterministic slots + optional LLM enhancement
  const intake = await generateDynamicIntake(
    resolvedQuery,
    studyType,
    conversationHistory,
    { useLLM: isGeminiConfigured() }
  );

  console.log('[DeepResearch] Dynamic intake generated:', {
    questions: intake.questions.length,
    prefilled: Object.keys(intake.prefilledAnswers || {}).length,
    canSkip: intake.canSkip,
    skipReason: intake.skipReason,
  });

  return {
    type: 'deep_research',
    jobId,
    query: resolvedQuery,
    studyType,
    phase: 'intake',
    creditsAvailable,
    creditsRequired,
    intake,
  };
};

/**
 * Get credits required for a study type
 */
const getCreditsRequiredForStudy = (studyType: StudyType): number => {
  const creditMap: Record<StudyType, number> = {
    sourcing_study: 750,
    cost_model: 600,
    market_analysis: 500,
    supplier_assessment: 400,
    risk_assessment: 450,
    custom: 500,
  };
  return creditMap[studyType] || 500;
};

/**
 * Confirm intake and start processing
 * Called after user answers clarifying questions
 */
export const confirmDeepResearchIntake = async (
  jobId: string,
  query: string,
  answers: Record<string, string | string[]>,
  studyType: StudyType = 'market_analysis',
  creditsAvailable: number = 0
): Promise<DeepResearchResponse> => {
  console.log('[DeepResearch] Confirming intake:', { jobId, answers });

  // Transition to processing phase
  return {
    type: 'deep_research',
    jobId,
    query,
    studyType,
    phase: 'processing',
    creditsAvailable,
    creditsRequired: getCreditsRequiredForStudy(studyType),
    processing: {
      steps: getDefaultProcessingSteps(),
      currentStepIndex: 0,
      elapsedTime: 0,
      sourcesCollected: 0,
    },
  };
};

// ============================================
// STRUCTURED DATA MATCHING
// ============================================

/** Scored commodity match result */
interface ScoredCommodity {
  commodity: EnrichedCommodity;
  score: number; // 0-100, higher = stronger match
  matchType: 'exact' | 'category' | 'subcategory';
}

/**
 * Match commodities against query using scored tiers.
 * Only returns commodities above a confidence threshold (score >= 60).
 * Sorted by score descending so best match is used first.
 */
const extractRelevantCommodities = (
  query: string,
  intakeAnswers?: Record<string, string | string[]>
): EnrichedCommodity[] => {
  const queryLower = query.toLowerCase();

  // Extract category from intake answers if available
  const categoryAnswer = intakeAnswers?.category;
  const categoryStr = Array.isArray(categoryAnswer) ? categoryAnswer.join(' ') : (categoryAnswer || '');
  const combinedSearch = `${queryLower} ${categoryStr.toLowerCase()}`;

  const scored: ScoredCommodity[] = [];

  for (const commodity of ENRICHED_COMMODITIES) {
    const nameLower = commodity.name.toLowerCase();
    const slugLower = commodity.slug.toLowerCase();
    const catLower = commodity.category.toLowerCase();
    const subCatLower = (commodity.subcategory || '').toLowerCase();

    let score = 0;
    let matchType: ScoredCommodity['matchType'] = 'category';

    // Exact name/slug match in query — strongest signal
    if (combinedSearch.includes(nameLower) || combinedSearch.includes(slugLower)) {
      score = 100;
      matchType = 'exact';
    }
    // Subcategory match (e.g., "non-ferrous" matches aluminum)
    else if (subCatLower && combinedSearch.includes(subCatLower)) {
      score = 40;
      matchType = 'subcategory';
    }
    // Broad category match (e.g., "metals" matches everything in metals)
    else if (combinedSearch.includes(catLower)) {
      score = 25;
      matchType = 'category';
    }

    if (score > 0) {
      scored.push({ commodity, score, matchType });
    }
  }

  // Only include commodities above the confidence threshold
  const MIN_SCORE = 60;
  const qualified = scored
    .filter(s => s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    console.log(`[AI] Commodity scoring:`,
      scored.map(s => `${s.commodity.name}=${s.score}(${s.matchType})`).join(', '));
    console.log(`[AI] Qualified (>=${MIN_SCORE}): ${qualified.length > 0 ? qualified.map(s => s.commodity.name).join(', ') : 'none — LLM extraction will handle visuals'}`);
  }

  return qualified.map(s => s.commodity);
};

/**
 * Execute deep research processing
 * Uses Perplexity for web research and DeepSeek R1 for synthesis
 * Returns updates via callback with structured CommandCenterProgress
 */
// Global timeout for entire research process (3 minutes)
const GLOBAL_RESEARCH_TIMEOUT_MS = 180000;

export const executeDeepResearch = async (
  jobId: string,
  query: string,
  answers: Record<string, string | string[]>,
  studyType: StudyType = 'market_analysis',
  onProgress?: (update: DeepResearchResponse) => void
): Promise<DeepResearchResponse> => {
  console.log('[DeepResearch] Executing research:', { jobId, query, studyType });
  console.log('[DeepResearch] API Status - Perplexity:', isPerplexityConfigured(), 'DeepSeek:', isDeepSeekConfigured());

  const startTime = Date.now();

  // Create timeout promise that returns a timeout error after GLOBAL_RESEARCH_TIMEOUT_MS
  const timeoutPromise = new Promise<DeepResearchResponse>((resolve) => {
    setTimeout(() => {
      console.warn('[DeepResearch] Global timeout reached after', GLOBAL_RESEARCH_TIMEOUT_MS / 1000, 'seconds');
      resolve({
        type: 'deep_research',
        jobId,
        query,
        studyType,
        phase: 'error',
        creditsAvailable: 0,
        creditsRequired: getCreditsRequiredForStudy(studyType),
        commandCenterProgress: createInitialProgress(),
        error: {
          message: 'Research took too long and was stopped. Please try a more focused query.',
          canRetry: true,
        },
      });
    }, GLOBAL_RESEARCH_TIMEOUT_MS);
  });

  // Race the actual execution against the timeout
  return Promise.race([timeoutPromise, executeDeepResearchCore(jobId, query, answers, studyType, onProgress, startTime)]);
};

// Core implementation (separated for timeout wrapping)
const executeDeepResearchCore = async (
  jobId: string,
  query: string,
  answers: Record<string, string | string[]>,
  studyType: StudyType,
  onProgress: ((update: DeepResearchResponse) => void) | undefined,
  startTime: number
): Promise<DeepResearchResponse> => {
  const allSources: Source[] = [];
  const INSIGHT_STREAM_MAX = 50;

  // Global source registry for URL deduplication
  const sourceKeySet = new Set<string>();

  const normalizeUrl = (url?: string): string | null => {
    if (!url) return null;
    try {
      const u = new URL(url);
      return `${u.host}${u.pathname}`.toLowerCase().replace(/\/+$/, '');
    } catch { return url.toLowerCase(); }
  };

  const getSourceKey = (source: Source): string | null => {
    const urlKey = normalizeUrl(source.url);
    if (urlKey) return `url:${urlKey}`;
    const name = source.name?.trim().toLowerCase();
    const snippet = source.snippet?.trim().toLowerCase();
    if (name || snippet) {
      return `meta:${name || ''}|${snippet ? snippet.slice(0, 80) : ''}`;
    }
    return null;
  };

  const addSourceIfUnique = (source: Source): boolean => {
    const key = getSourceKey(source);
    if (key && sourceKeySet.has(key)) return false;
    if (key) sourceKeySet.add(key);
    allSources.push(source);
    return true;
  };

  // Initialize Command Center Progress
  const ccProgress: CommandCenterProgress = createInitialProgress();
  ccProgress.startedAt = startTime;

  // Helper to add insight to stream
  const addInsight = (text: string, source: 'beroe' | 'web' | 'internal' | 'synthesis', sourceLabel?: string) => {
    const insight: ResearchInsight = {
      id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      text: text.slice(0, 200),
      source,
      sourceLabel: sourceLabel || (source === 'web' ? 'Web Research' : source === 'synthesis' ? 'Report Synthesis' : 'Internal Data'),
      timestamp: Date.now(),
    };
    ccProgress.insightStream.push(insight);
    if (ccProgress.insightStream.length > INSIGHT_STREAM_MAX) {
      ccProgress.insightStream.splice(0, ccProgress.insightStream.length - INSIGHT_STREAM_MAX);
    }
  };

  // Helper to emit progress updates (throttled to avoid excessive re-renders)
  let _progressTimer: ReturnType<typeof setTimeout> | null = null;
  const PROGRESS_THROTTLE_MS = 300;

  const _doEmit = () => {
    ccProgress.elapsedMs = Date.now() - startTime;

    const response: DeepResearchResponse = {
      type: 'deep_research',
      jobId,
      query,
      studyType,
      phase: 'processing',
      creditsAvailable: 0,
      creditsRequired: getCreditsRequiredForStudy(studyType),
      commandCenterProgress: {
        ...ccProgress,
        agents: ccProgress.agents.map(a => ({ ...a, sources: [...a.sources], insights: [...a.insights] })),
        insightStream: [...ccProgress.insightStream],
        tags: [...ccProgress.tags],
        phases: ccProgress.phases.map(p => ({ ...p })),
        completedStages: [...ccProgress.completedStages],
      },
    };
    onProgress?.(response);
  };

  /**
   * Throttled progress emitter.
   * Pass `force: true` for stage transitions (plan → research → synthesis → delivery → complete)
   * that must appear instantly. Otherwise updates are batched at 300ms intervals.
   */
  const emitProgress = (force = false) => {
    if (force) {
      if (_progressTimer) { clearTimeout(_progressTimer); _progressTimer = null; }
      _doEmit();
      return;
    }
    // Coalesce rapid-fire updates
    if (_progressTimer) return; // already scheduled
    _progressTimer = setTimeout(() => {
      _progressTimer = null;
      _doEmit();
    }, PROGRESS_THROTTLE_MS);
  };

  // Flush any pending throttled update (call at stage boundaries)
  const flushProgress = () => {
    if (_progressTimer) { clearTimeout(_progressTimer); _progressTimer = null; }
    _doEmit();
  };

  // Pipeline stage transition helper — closes out current phases, records completed stage, opens new stage
  const transitionStage = (newStage: CommandCenterStage) => {
    const prev = normalizeStage(ccProgress.stage);
    if (prev !== 'complete' && prev !== newStage) {
      // Complete any remaining phases from the outgoing stage
      ccProgress.phases.forEach(p => {
        if (p.status !== 'complete') { p.status = 'complete'; p.completedAt = Date.now(); }
      });
      if (!ccProgress.completedStages.includes(prev)) {
        ccProgress.completedStages.push(prev);
      }
    }
    ccProgress.stage = newStage;
    ccProgress.phases = initPhases(newStage);
  };

  // Update a specific phase within the current stage
  const updatePhase = (phaseId: string, status: PhaseStatus, detail?: string) => {
    const phase = ccProgress.phases.find(p => p.id === phaseId);
    if (!phase) return;
    if (status === 'active' && !phase.startedAt) phase.startedAt = Date.now();
    if (status === 'complete' && !phase.completedAt) phase.completedAt = Date.now();
    phase.status = status;
    if (detail) phase.detail = detail;
  };

  try {
    // ============================
    // STAGE 1: DECOMPOSE (Gemini Flash)
    // ============================
    transitionStage('plan');
    updatePhase('plan.decomposition', 'active');
    emitProgress(true);

    // Build context from intake answers
    const answerContext = Object.entries(answers)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');

    const decomposed = await decomposeResearchQuery(query, studyType, answerContext);
    updatePhase('plan.decomposition', 'complete');
    updatePhase('plan.deduplication', 'active');
    emitProgress();

    // Deduplicate agent queries — drop agents whose query is >85% similar to an existing one.
    // Gemini says "non-overlapping" but often produces near-duplicate queries.
    const dedupeAgents = (agents: typeof decomposed.agents) => {
      const kept: typeof agents = [];
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).sort().join(' ');
      const jaccard = (a: string, b: string): number => {
        const setA = new Set(normalize(a).split(' '));
        const setB = new Set(normalize(b).split(' '));
        const intersection = [...setA].filter(w => setB.has(w)).length;
        const union = new Set([...setA, ...setB]).size;
        return union === 0 ? 0 : intersection / union;
      };
      for (const agent of agents) {
        if (kept.some(k => jaccard(k.query, agent.query) > 0.85)) {
          console.log('[DeepResearch] Dropping near-duplicate agent:', agent.name, '–', agent.query.slice(0, 60));
          continue;
        }
        kept.push(agent);
      }
      return kept;
    };
    decomposed.agents = dedupeAgents(decomposed.agents);
    updatePhase('plan.deduplication', 'complete', `${decomposed.agents.length} agents after dedup`);
    updatePhase('plan.assignment', 'active');

    ccProgress.agents = decomposed.agents.map((a, i) => ({
      id: `agent-${i}`,
      name: a.name,
      query: a.query,
      category: a.category,
      status: 'queued' as const,
      sourcesFound: 0,
      uniqueSourcesFound: 0,
      insights: [],
      sources: [],
      findings: '',
    }));
    ccProgress.tags = decomposed.tags;
    updatePhase('plan.assignment', 'complete', `${ccProgress.agents.length} agents queued`);
    emitProgress(true); // force: agents list just set

    console.log('[DeepResearch] Decomposed into', ccProgress.agents.length, 'agents');

    // ============================
    // STAGE 2: PARALLEL RESEARCH (Beroe + N × Perplexity, concurrency=3)
    // ============================
    transitionStage('research');
    updatePhase('research.internal', 'active', 'parallel');
    updatePhase('research.web', 'active', 'parallel');
    emitProgress(true);

    const CONCURRENCY = 3;

    const runAgent = async (agent: ResearchAgent) => {
      agent.status = 'researching';
      agent.startedAt = Date.now();
      ccProgress.activeAgentId = agent.id;
      emitProgress(true); // force: agent status change is a key UI moment

      if (!isPerplexityConfigured()) {
        agent.status = 'error';
        agent.error = 'Perplexity API not configured';
        agent.completedAt = Date.now();
        ccProgress.totalSources = allSources.length;
        emitProgress(true);
        return;
      }

      try {
        const response = await callPerplexity(agent.query, []);
        agent.findings = response.content;
        agent.sourcesFound = response.sources?.length || 0;

        let uniqueCount = 0;
        for (const src of (response.sources || [])) {
          const source: Source = { name: src.name, url: src.url, type: 'web', snippet: src.snippet };
          agent.sources.push(source);
          if (addSourceIfUnique(source)) uniqueCount++;
          if (src.snippet && src.snippet.length > 20) {
            agent.insights.push(src.snippet.slice(0, 200));
            addInsight(src.snippet.slice(0, 200), 'web', src.name);
          }
        }
        agent.uniqueSourcesFound = uniqueCount;
        agent.status = 'complete';
        agent.completedAt = Date.now();
      } catch (err) {
        agent.status = 'error';
        agent.error = err instanceof Error ? err.message : 'Research failed';
        agent.completedAt = Date.now();
      }

      ccProgress.totalSources = allSources.length;
      ccProgress.totalSourcesRaw += agent.sourcesFound;
      emitProgress(true); // force: agent finished — update counters immediately
    };

    // Run Beroe intelligence fetch in parallel with Perplexity agents
    const beroePromise = isGeminiConfigured()
      ? fetchBeroeIntelligence(query, studyType, answerContext).then(beroe => {
          if (beroe.content) {
            addInsight('Beroe market intelligence received', 'beroe', 'Beroe Intelligence');
            // Add Beroe sources with 'beroe' type for [B#] citations
            for (const src of beroe.sources) {
              const source: Source = { name: src.name, type: src.type, snippet: src.snippet, url: src.url };
              addSourceIfUnique(source);
            }
            ccProgress.totalSources = allSources.length;
            emitProgress();
          }
          return beroe;
        }).catch(err => {
          console.error('[DeepResearch] Beroe intelligence fetch failed:', err);
          return { content: '', sources: [] };
        })
      : Promise.resolve({ content: '', sources: [] });

    // Execute Perplexity agents with concurrency limit
    const runAllAgents = async () => {
      const agentQueue = [...ccProgress.agents];
      const executing: Promise<void>[] = [];
      for (const agent of agentQueue) {
        const p = runAgent(agent).then(() => {
          executing.splice(executing.indexOf(p), 1);
        });
        executing.push(p);
        if (executing.length >= CONCURRENCY) {
          await Promise.race(executing);
        }
      }
      await Promise.all(executing);
    };

    // Run Beroe and Perplexity agents in parallel
    const [beroeResult] = await Promise.all([beroePromise, runAllAgents()]);

    console.log('[DeepResearch] All agents complete. Unique sources:', allSources.length, 'Raw total:', ccProgress.totalSourcesRaw, 'Beroe content:', beroeResult.content.length > 0 ? 'yes' : 'no');

    // ============================
    // STAGE 3: SYNTHESIZE (DeepSeek R1)
    // ============================
    flushProgress(); // flush any pending research-phase updates
    // Close out research phases before transitioning
    updatePhase('research.internal', 'complete');
    updatePhase('research.web', 'complete');
    updatePhase('research.consolidation', 'complete', `${allSources.length} unique sources`);
    transitionStage('synthesis');
    updatePhase('synthesis.template', 'active');
    ccProgress.activeAgentId = null;
    emitProgress(true);

    // Combine findings from all successful web agents (no Beroe here)
    const webFindings = ccProgress.agents
      .filter(a => a.status === 'complete' && a.findings)
      .map(a => `## ${a.name}\n${a.findings}`)
      .join('\n\n---\n\n');

    // Keep Beroe intelligence separate so DeepSeek can distinguish data sources
    const beroeFindings = beroeResult.content || '';
    const combinedFindings = [beroeFindings ? `## Beroe Market Intelligence\n${beroeFindings}` : '', webFindings].filter(Boolean).join('\n\n---\n\n');

    let report: import('../types/deepResearch').DeepResearchReport;

    // Get the report template for this study type
    const reportTemplate = getReportTemplate(studyType);
    console.log('[DeepResearch] Using template:', reportTemplate.name);
    updatePhase('synthesis.template', 'complete', reportTemplate.name);
    updatePhase('synthesis.writing', 'active');
    emitProgress();

    // Extract regions and timeframe from answers
    const regions = Array.isArray(answers.region) ? answers.region : answers.region ? [answers.region] : undefined;
    const timeframe = typeof answers.timeframe === 'string' ? answers.timeframe : undefined;

    // Track section progress
    const totalSections = reportTemplate.sections.length;
    let sectionsComplete = 0;

    // Extract relevant enriched commodity data for structured visual generation
    const relevantCommodities = extractRelevantCommodities(query, answers);
    // Determine match confidence: 'exact' if any commodity scored 100 (name/slug match)
    const hasExactCommodityMatch = relevantCommodities.length > 0 &&
      ENRICHED_COMMODITIES.some(c => {
        const qLower = query.toLowerCase();
        return qLower.includes(c.name.toLowerCase()) || qLower.includes(c.slug.toLowerCase());
      });
    const structuredData: StructuredDataContext | undefined = relevantCommodities.length > 0
      ? {
          commodities: relevantCommodities,
          region: regions?.[0],
          timeframe,
          matchConfidence: hasExactCommodityMatch ? 'exact' : 'broad',
        }
      : undefined;

    if (structuredData) {
      console.log('[DeepResearch] Structured data available:', {
        commodities: structuredData.commodities.map(c => c.name),
        matchConfidence: structuredData.matchConfidence,
        region: structuredData.region || 'Global',
        timeframe: structuredData.timeframe || 'Current',
      });
    }

    if (isDeepSeekConfigured() && combinedFindings) {
      // Heartbeat: emit progress every 5s during synthesis so UI doesn't appear frozen
      const HEARTBEAT_INTERVAL_MS = 5000;
      let heartbeatCount = 0;
      const heartbeatInterval = setInterval(() => {
        heartbeatCount++;
        const currentSection = ccProgress.synthesis?.currentSectionTitle || 'report';
        addInsight(`Still synthesizing ${currentSection}... (${heartbeatCount * 5}s)`, 'synthesis', 'Report Generation');
        emitProgress();
      }, HEARTBEAT_INTERVAL_MS);

      try {
        console.log('[DeepResearch] Calling DeepSeek R1 for template-driven synthesis...');
        console.log('[DeepResearch] Sources breakdown:', {
          total: allSources.length,
          beroe: allSources.filter(s => s.type === 'beroe' || s.type === 'internal_data').length,
          web: allSources.filter(s => s.type === 'web').length,
        });

        // Note: synthesizeTemplatedReport reassigns citationIds based on source.type
        // Beroe/internal → [B1], [B2], Web → [W1], [W2], etc.
        report = await synthesizeTemplatedReport(
          reportTemplate,
          {
            query,
            studyType,
            regions: regions as string[] | undefined,
            timeframe,
            webFindings,
            beroeFindings: beroeFindings || undefined,
            sources: allSources.map(s => ({
              ...s,
              citationId: '', // Will be assigned by synthesizeTemplatedReport based on type
              snippet: s.snippet || '',
            })),
            intakeAnswers: answers,
            structuredData,
          },
          (status) => {
            // Update synthesis progress
            if (status.startsWith('Writing section:')) {
              const sectionTitle = status.replace('Writing section:', '').replace('...', '').trim();
              ccProgress.synthesis = {
                currentSection: sectionTitle.toLowerCase().replace(/\s+/g, '_'),
                currentSectionTitle: sectionTitle,
                sectionsComplete,
                totalSections,
              };
              addInsight(`Synthesizing: ${sectionTitle}`, 'synthesis', 'Report Generation');
            }
            if (status.startsWith('Validating citations')) {
              sectionsComplete = totalSections; // Writing done
              if (ccProgress.synthesis) {
                ccProgress.synthesis.sectionsComplete = sectionsComplete;
              }
              updatePhase('synthesis.writing', 'complete');
              updatePhase('synthesis.quality', 'active');
            }
            if (status.startsWith('Extracting visuals: starting')) {
              updatePhase('synthesis.quality', 'complete');
              updatePhase('synthesis.visuals', 'active');
            }
            if (status.startsWith('Extracting visuals:') && !status.includes('starting')) {
              const detail = status.replace('Extracting visuals:', '').trim();
              if (detail && !detail.includes('complete')) {
                addInsight(`Extracting charts: ${detail}`, 'synthesis', 'Data Visualization');
              }
            }
            if (status === 'Extracting visuals: complete') {
              updatePhase('synthesis.visuals', 'complete');
            }
            if (status.includes('Finalizing')) {
              sectionsComplete++;
              if (ccProgress.synthesis) {
                ccProgress.synthesis.sectionsComplete = sectionsComplete;
              }
            }

            // Synthesis updates are infrequent (per section), so force-emit
            emitProgress(true);
          }
        );

        clearInterval(heartbeatInterval);

        // Override some fields with job-specific data
        report.id = `dr-report-${jobId}`;
        report.queryOriginal = query;

        console.log('[DeepResearch] Template synthesis complete:', {
          sections: report.sections.length,
          citations: Object.keys(report.citations || {}).length,
          qualityScore: report.qualityMetrics?.completenessScore,
        });
      } catch (error) {
        clearInterval(heartbeatInterval);
        console.error('[DeepResearch] DeepSeek template synthesis error:', error);
        const fallbackData = createFallbackReport(query, combinedFindings, studyType);
        report = convertFallbackToReport(fallbackData, jobId, query, studyType, answers, allSources, startTime);
      }
    } else {
      console.log('[DeepResearch] Using fallback synthesis (DeepSeek not configured or no findings)');
      const fallbackData = createFallbackReport(query, combinedFindings || 'Research data collected from available sources.', studyType);
      report = convertFallbackToReport(fallbackData, jobId, query, studyType, answers, allSources, startTime);
    }

    // Ensure all synthesis phases are complete before transitioning
    updatePhase('synthesis.writing', 'complete');
    updatePhase('synthesis.quality', 'complete');
    updatePhase('synthesis.visuals', 'complete');
    flushProgress();

    // Delivery stage: report assembly + finalization
    transitionStage('delivery');
    updatePhase('delivery.assembly', 'active');
    emitProgress(true);

    updatePhase('delivery.assembly', 'complete');
    updatePhase('delivery.presentation', 'active');
    emitProgress();

    updatePhase('delivery.presentation', 'complete');
    updatePhase('delivery.export', 'complete');
    emitProgress(true);

    // Finalize
    transitionStage('complete');
    emitProgress(true);
    const totalProcessingTime = report.totalProcessingTime ?? (Date.now() - startTime);
    const creditsUsed = report.creditsUsed ?? getCreditsRequiredForStudy(studyType);
    if (!report.totalProcessingTime) {
      report.totalProcessingTime = totalProcessingTime;
    }
    if (!report.creditsUsed) {
      report.creditsUsed = creditsUsed;
    }

    ccProgress.elapsedMs = totalProcessingTime;

    console.log('[DeepResearch] Research complete:', {
      jobId,
      uniqueSources: allSources.length,
      rawSources: ccProgress.totalSourcesRaw,
      agents: ccProgress.agents.length,
      processingTime: totalProcessingTime,
      sectionsGenerated: report.sections.length,
      insightsCollected: ccProgress.insightStream.length,
      tagsFound: ccProgress.tags.length,
    });

    return {
      type: 'deep_research',
      jobId,
      query,
      studyType,
      phase: 'complete',
      creditsAvailable: 0,
      creditsRequired: creditsUsed,
      report,
      commandCenterProgress: ccProgress,
    };

  } catch (error) {
    console.error('[DeepResearch] Fatal error:', error);
    flushProgress();

    return {
      type: 'deep_research',
      jobId,
      query,
      studyType,
      phase: 'error',
      creditsAvailable: 0,
      creditsRequired: getCreditsRequiredForStudy(studyType),
      commandCenterProgress: ccProgress,
      error: {
        message: error instanceof Error ? error.message : 'Research failed unexpectedly',
        canRetry: true,
      },
    };
  }
};

// Fallback report when DeepSeek is unavailable
const createFallbackReport = (
  query: string,
  findings: string,
  studyType: StudyType
): {
  title: string;
  summary: string;
  sections: { id: string; title: string; content: string }[];
  keyFindings: string[];
} => {
  return {
    title: `${query} - ${studyType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
    summary: `This report provides analysis based on your query: "${query}". Information has been gathered from multiple sources and synthesized below.`,
    sections: [
      {
        id: 'findings',
        title: 'Research Findings',
        content: findings,
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        content: `Based on the research findings, consider:\n\n- **Monitor market developments** closely for changes in pricing or supply dynamics\n- **Evaluate supplier relationships** against the market context\n- **Develop contingency plans** for potential disruptions`,
      },
    ],
    keyFindings: [
      'Research completed successfully',
      'Multiple sources consulted',
      'See detailed findings above',
    ],
  };
};

// Convert fallback data to full report structure
const convertFallbackToReport = (
  fallbackData: ReturnType<typeof createFallbackReport>,
  jobId: string,
  query: string,
  studyType: StudyType,
  answers: Record<string, string | string[]>,
  allSources: Source[],
  startTime: number
): import('../types/deepResearch').DeepResearchReport => {
  const totalProcessingTime = Date.now() - startTime;
  const creditsUsed = getCreditsRequiredForStudy(studyType);

  return {
    id: `dr-report-${jobId}`,
    title: fallbackData.title,
    summary: fallbackData.summary,
    studyType,
    metadata: {
      title: fallbackData.title,
      date: new Date().toISOString().split('T')[0],
      templateId: studyType,
      version: '1.0',
    },
    tableOfContents: fallbackData.sections.map((s, idx) => ({
      id: s.id,
      title: s.title,
      level: 0,
    })),
    sections: fallbackData.sections.map((section, idx) => ({
      id: section.id || `section-${idx}`,
      title: section.title,
      content: section.content,
      level: 0,
      citationIds: [],
      sources: allSources.slice(idx * 2, idx * 2 + 3),
    })),
    citations: {},
    references: [],
    allSources,
    generatedAt: new Date().toISOString(),
    queryOriginal: query,
    intakeAnswers: answers,
    totalProcessingTime,
    creditsUsed,
    canExport: true,
    qualityMetrics: {
      totalCitations: 0,
      sectionsWithCitations: 0,
      totalSections: fallbackData.sections.length,
      completenessScore: 50, // Lower score for fallback
    },
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
  deepseek: isDeepSeekConfigured(),
  canOperate: isGeminiConfigured() || isPerplexityConfigured() || true, // Always true due to local fallback
  canDeepResearch: isPerplexityConfigured() || isDeepSeekConfigured(), // Need at least one for deep research
});
