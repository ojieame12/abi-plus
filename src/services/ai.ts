// AI Orchestration Layer - Routes between Gemini and Perplexity
import type { GeminiResponse } from './gemini';
import { callGemini, callGeminiV2, isGeminiConfigured } from './gemini';
import type { PerplexityResponse } from './perplexity';
import { callPerplexity, isPerplexityConfigured } from './perplexity';
import type { ChatMessage, Suggestion, Source } from '../types/chat';
import { generateId } from '../types/chat';
import type { DetectedIntent, IntentCategory } from '../types/intents';
import { classifyIntent } from '../types/intents';
import type { Supplier, RiskChange } from '../types/supplier';
import { getPortfolioSummary, filterSuppliers, MOCK_SUPPLIERS, MOCK_RISK_CHANGES } from './mockData';
import {
  transformSuppliersToTableData,
  transformRiskChangesToAlertData,
  transformSupplierToRiskCardData,
} from './widgetTransformers';
import { generateSuggestions, suggestionEngine } from './suggestionEngine';

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
  insight?: string | { text?: string; headline?: string; detail?: string; trend?: string; sentiment?: string };
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
  provider: 'gemini' | 'perplexity' | 'local';
  thinkingDuration?: string;
  thinkingSteps?: Array<{
    title: string;
    content: string;
    status: 'complete' | 'in_progress';
  }>;
  // Real milestones captured during processing
  milestones?: Milestone[];
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
}

export interface SendMessageOptions {
  mode: ThinkingMode;
  webSearchEnabled: boolean;
  conversationHistory?: ChatMessage[];
  // Pre-classified intent from builder - bypasses regex classification
  builderMeta?: BuilderMeta;
  // Callback for real-time milestone updates
  onMilestone?: MilestoneCallback;
}

// Simulate thinking duration for UX
const simulateThinkingDuration = (mode: ThinkingMode): string => {
  if (mode === 'fast') {
    const seconds = Math.floor(Math.random() * 3) + 1;
    return `${seconds}s`;
  } else {
    const minutes = Math.floor(Math.random() * 2) + 1;
    const seconds = Math.floor(Math.random() * 30);
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
};

// Generate thinking steps for display
const generateThinkingSteps = (
  intent: DetectedIntent,
  mode: ThinkingMode
): AIResponse['thinkingSteps'] => {
  const baseSteps = [
    {
      title: 'Query Analysis',
      content: `Intent: ${intent.category.replace('_', ' ')}`,
      status: 'complete' as const,
    },
  ];

  if (mode === 'reasoning') {
    return [
      ...baseSteps,
      {
        title: 'Research Strategy',
        content: 'Searching market intelligence and industry sources',
        status: 'complete' as const,
      },
      {
        title: 'Data Synthesis',
        content: 'Combining portfolio data with external research',
        status: 'complete' as const,
      },
      {
        title: 'Response Generation',
        content: 'Formulating actionable insights',
        status: 'complete' as const,
      },
    ];
  }

  return [
    ...baseSteps,
    {
      title: 'Portfolio Analysis',
      content: 'Analyzing your supplier data',
      status: 'complete' as const,
    },
  ];
};

// Main orchestration function
export const sendMessage = async (
  message: string,
  options: SendMessageOptions
): Promise<AIResponse> => {
  const { mode, webSearchEnabled, conversationHistory = [], builderMeta, onMilestone } = options;

  // Track milestones with real timestamps
  const startTime = Date.now();
  const milestones: Milestone[] = [];

  const emitMilestone = (
    event: Milestone['event'],
    label: string,
    value?: string | number
  ) => {
    const milestone: Milestone = {
      id: `${event}-${Date.now()}`,
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
    console.log('[AI] Using builder metadata for intent:', builderMeta.intent, builderMeta.subIntent);
    intent = {
      category: builderMeta.intent as IntentCategory,
      subIntent: builderMeta.subIntent as any,
      confidence: 1.0, // Deterministic from builder
      responseType: 'widget',
      artifactType: 'none',
      extractedEntities: {},
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

  // Determine which provider to use:
  // 1. User explicitly chose reasoning mode
  // 2. User enabled web search
  // 3. Intent automatically requires research (market context, news, benchmarks, etc.)
  const usePerplexity = mode === 'reasoning' || webSearchEnabled || intent.requiresResearch;
  const effectiveMode = intent.requiresResearch ? 'reasoning' : mode;

  // Emit provider selection milestone
  const providerName = usePerplexity && isPerplexityConfigured()
    ? 'Perplexity (web research)'
    : isGeminiConfigured()
      ? 'Gemini'
      : 'Local data';
  emitMilestone('provider_selected', providerName, providerName);

  try {
    let response: AIResponse;
    let provider: AIResponse['provider'];

    console.log('[AI] Intent classified:', intent.category, '| SubIntent:', intent.subIntent);
    console.log('[AI] Mode:', mode, '| WebSearch:', webSearchEnabled);
    console.log('[AI] Auto-research triggered:', intent.requiresResearch);
    console.log('[AI] Using provider:', usePerplexity ? 'perplexity' : 'gemini');

    if (usePerplexity && isPerplexityConfigured()) {
      console.log('[AI] Calling Perplexity for deep research...');
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
      const geminiResponse = await callGeminiV2(message, conversationHistory, intent);
      response = transformGeminiResponse(geminiResponse, intent);
      provider = 'gemini';
    } else {
      console.log('[AI] Using local fallback');
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

    return {
      ...response,
      id: generateId(),
      provider,
      thinkingDuration: actualDuration, // Real duration!
      milestones,
    };
  } catch (error) {
    console.error('[AI] Orchestration error:', error);
    emitMilestone('response_ready', 'Fallback response', Date.now() - startTime);

    return {
      ...generateLocalResponse(message, intent),
      id: generateId(),
      provider: 'local',
      thinkingDuration: `${Date.now() - startTime}ms`,
      milestones,
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
    sources: response.sources,
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

// Transform Perplexity response to unified format
const transformPerplexityResponse = (
  response: PerplexityResponse,
  intent: DetectedIntent
): Omit<AIResponse, 'id' | 'provider' | 'thinkingDuration'> => {
  // Use widget router to get proper artifact type
  const { getWidgetRoute } = require('./widgetRouter');
  const route = getWidgetRoute(intent.category, intent.subIntent);

  // Perplexity responses are typically research/summary - use 0 count for inline display
  return {
    content: response.content,
    responseType: response.responseType,
    suggestions: response.suggestions,
    sources: response.sources,
    // Use widget router artifact type if Perplexity didn't provide one
    artifact: response.artifact || {
      type: route.artifactType,
      title: 'Research Results',
    },
    insight: response.insight,
    escalation: determineEscalation(0, intent.category),
    intent: response.intent || intent,
    thinkingSteps: response.thinkingSteps,
  };
};

// Generate fully local response when APIs are unavailable
const generateLocalResponse = (
  message: string,
  intent: DetectedIntent
): Omit<AIResponse, 'id' | 'provider' | 'thinkingDuration' | 'thinkingSteps'> => {
  const portfolio = getPortfolioSummary();

  switch (intent.category) {
    case 'portfolio_overview':
      return {
        content: `Here's your portfolio at a glance. You have ${portfolio.distribution.high} high-risk suppliers that may need attention.`,
        responseType: 'widget',
        suggestions: generateSuggestions(intent, { portfolio }),
        portfolio,
        widget: {
          type: 'risk_distribution',
          title: 'Risk Portfolio Overview',
          data: {
            distribution: portfolio.distribution,
            totalSuppliers: portfolio.totalSuppliers,
            totalSpend: portfolio.totalSpendFormatted,
          },
        },
        acknowledgement: "Here's your portfolio overview.",
        insight: {
          headline: `${portfolio.distribution.high} High Risk Suppliers`,
          detail: `${portfolio.distribution.high + portfolio.distribution.mediumHigh} suppliers need attention out of ${portfolio.totalSuppliers} total`,
          sentiment: portfolio.distribution.high > 2 ? 'negative' : 'neutral',
        },
        artifact: { type: 'portfolio_dashboard', title: 'Risk Portfolio Overview' },
        escalation: determineEscalation(portfolio.totalSuppliers, 'portfolio_overview'),
        intent,
      };

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
        content: "I can help you take action on your supplier risk. What would you like to do?\n\n• **Find alternatives** for risky suppliers\n• **Set up alerts** for risk changes\n• **Create a mitigation plan**\n• **Export data** for reporting",
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
          data: { suppliers: toCompare },
        },
        acknowledgement: "Here's how they stack up.",
        artifact: { type: 'comparison', title: 'Supplier Comparison' },
        escalation: determineEscalation(toCompare.length, 'comparison'),
        intent,
      };
    }

    case 'explanation_why': {
      return {
        content: `**How Supplier Risk Scores Work**\n\nThe SRS (Supplier Risk Score) is calculated from multiple weighted factors:\n\n**Freely Visible:**\n• Overall composite score (0-100)\n• Risk level classification\n\n**Factor Categories** (weights vary):\n• ESG & Sustainability\n• Delivery Performance\n• Quality Metrics\n• Financial Health*\n• Cybersecurity*\n• Compliance*\n\n*Some factors require dashboard access due to partner data restrictions.\n\nWant me to explain a specific supplier's situation?`,
        responseType: 'summary',
        suggestions: generateSuggestions(intent, {}),
        escalation: determineEscalation(0, 'explanation_why'),
        intent,
      };
    }

    case 'setup_config': {
      suggestionEngine.recordQuestion('setup_config');
      return {
        content: `**Configuration Options**\n\nI can help you set up:\n\n📊 **Add Suppliers** - Search and add suppliers to monitor\n🔔 **Risk Alerts** - Get notified when scores change\n⚙️ **Weight Configuration** - Customize how risk is calculated\n📥 **Import** - Bulk upload your supplier list\n\nWhat would you like to configure?`,
        responseType: 'summary',
        suggestions: generateSuggestions(intent, {}),
        escalation: determineEscalation(0, 'setup_config'),
        intent,
      };
    }

    case 'reporting_export': {
      return {
        content: `**Export & Reporting Options**\n\nI can generate:\n\n📄 **Portfolio Summary** - Overview of your risk posture\n📊 **Supplier List** - CSV export of monitored suppliers\n📈 **Trend Report** - Risk changes over time\n📋 **Executive Summary** - Board-ready risk overview\n\n*Note: Some detailed factor scores are excluded due to partner data restrictions.*`,
        responseType: 'summary',
        suggestions: generateSuggestions(intent, {}),
        escalation: determineEscalation(0, 'reporting_export'),
        intent,
      };
    }

    case 'market_context': {
      // This would ideally trigger Perplexity, but fallback for local
      return {
        content: `I'd be happy to research market conditions for you. This type of query benefits from real-time market intelligence.\n\n**What I can analyze:**\n• Industry trends affecting your suppliers\n• Regional risk factors\n• Supply chain disruptions\n• Commodity price impacts\n\nLet me search for the latest information...`,
        responseType: 'summary',
        suggestions: generateSuggestions(intent, {}),
        escalation: determineEscalation(0, 'market_context'),
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
