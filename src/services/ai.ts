// AI Orchestration Layer - Routes between Gemini and Perplexity
import type { GeminiResponse } from './gemini';
import { callGemini, isGeminiConfigured } from './gemini';
import type { PerplexityResponse } from './perplexity';
import { callPerplexity, isPerplexityConfigured } from './perplexity';
import type { ChatMessage, Suggestion, Source } from '../types/chat';
import { generateId } from '../types/chat';
import type { DetectedIntent } from '../types/intents';
import { classifyIntent } from '../types/intents';
import type { Supplier } from '../types/supplier';
import { getPortfolioSummary, filterSuppliers, MOCK_SUPPLIERS, MOCK_RISK_CHANGES } from './mockData';
import { generateSuggestions, suggestionEngine } from './suggestionEngine';

export type ThinkingMode = 'fast' | 'reasoning';

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
  insight?: string;
  handoff?: {
    required: boolean;
    reason: string;
    linkText: string;
    url?: string;
  };
  // Data for UI rendering
  suppliers?: Supplier[];
  portfolio?: ReturnType<typeof getPortfolioSummary>;
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

export interface SendMessageOptions {
  mode: ThinkingMode;
  webSearchEnabled: boolean;
  conversationHistory?: ChatMessage[];
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
  const { mode, webSearchEnabled, conversationHistory = [] } = options;

  // Classify intent - now includes smart research detection
  const intent = classifyIntent(message);

  // Determine which provider to use:
  // 1. User explicitly chose reasoning mode
  // 2. User enabled web search
  // 3. Intent automatically requires research (market context, news, benchmarks, etc.)
  const usePerplexity = mode === 'reasoning' || webSearchEnabled || intent.requiresResearch;
  const effectiveMode = intent.requiresResearch ? 'reasoning' : mode;

  // Generate thinking metadata
  const thinkingDuration = simulateThinkingDuration(effectiveMode);
  const thinkingSteps = generateThinkingSteps(intent, effectiveMode);

  try {
    let response: AIResponse;

    console.log('[AI] Intent classified:', intent.category, '| SubIntent:', intent.subIntent);
    console.log('[AI] Mode:', mode, '| WebSearch:', webSearchEnabled);
    console.log('[AI] Auto-research triggered:', intent.requiresResearch);
    console.log('[AI] Using provider:', usePerplexity ? 'perplexity' : 'gemini');
    console.log('[AI] Gemini configured:', isGeminiConfigured());
    console.log('[AI] Perplexity configured:', isPerplexityConfigured());

    if (usePerplexity && isPerplexityConfigured()) {
      console.log('[AI] Calling Perplexity for deep research...');
      const perplexityResponse = await callPerplexity(message, conversationHistory);
      response = transformPerplexityResponse(perplexityResponse, intent);
    } else if (isGeminiConfigured()) {
      console.log('[AI] Calling Gemini...');
      const geminiResponse = await callGemini(message, conversationHistory);
      console.log('[AI] Gemini response received');
      response = transformGeminiResponse(geminiResponse, intent);
    } else {
      // Both APIs unavailable - use local fallback
      console.log('[AI] No API configured, using local fallback');
      response = generateLocalResponse(message, intent);
    }

    console.log('[AI] Response ready, content length:', response.content.length);

    return {
      ...response,
      id: generateId(),
      provider: usePerplexity ? 'perplexity' : (isGeminiConfigured() ? 'gemini' : 'local'),
      thinkingDuration,
      thinkingSteps: mode === 'reasoning' ? thinkingSteps : response.thinkingSteps,
    };
  } catch (error) {
    console.error('[AI] Orchestration error:', error);
    return {
      ...generateLocalResponse(message, intent),
      id: generateId(),
      provider: 'local',
      thinkingDuration,
      thinkingSteps,
    };
  }
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
    artifact: response.artifact,
    insight: response.insight,
    handoff: response.handoff,
    suppliers: response.suppliers,
    portfolio: response.portfolio,
    escalation: determineEscalation(resultCount, intent.category),
    intent: response.intent || intent,
  };
};

// Transform Perplexity response to unified format
const transformPerplexityResponse = (
  response: PerplexityResponse,
  intent: DetectedIntent
): Omit<AIResponse, 'id' | 'provider' | 'thinkingDuration'> => {
  // Perplexity responses are typically research/summary - use 0 count for inline display
  return {
    content: response.content,
    responseType: response.responseType,
    suggestions: response.suggestions,
    sources: response.sources,
    artifact: response.artifact,
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
        content: `You're monitoring **${portfolio.totalSuppliers} suppliers** with total spend of ${portfolio.totalSpendFormatted}.\n\n**Risk Distribution:**\n- 🔴 High Risk: ${portfolio.distribution.high}\n- 🟠 Med-High: ${portfolio.distribution.mediumHigh}\n- 🟡 Medium: ${portfolio.distribution.medium}\n- 🟢 Low: ${portfolio.distribution.low}\n- ⚪ Unrated: ${portfolio.distribution.unrated}\n\nYour highest risk exposure is with suppliers in the High Risk category. Would you like to review them?`,
        responseType: 'widget',
        suggestions: generateSuggestions(intent, { portfolio }),
        portfolio,
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
        content: `Found **${suppliers.length} supplier(s)** matching ${filterDesc}.\n\n${suppliers.length > 0
          ? suppliers.slice(0, 3).map(s =>
            `• **${s.name}** - SRS: ${s.srs.score} ${s.srs.level === 'high' ? '🔴' : s.srs.level === 'medium-high' ? '🟠' : s.srs.level === 'medium' ? '🟡' : '🟢'} | Spend: ${s.spendFormatted}`
          ).join('\n')
          : 'No suppliers match this filter.'
          }`,
        responseType: 'table',
        suggestions: generateSuggestions(intent, { suppliers, resultCount: suppliers.length }),
        suppliers,
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
          content: `**${supplier.name}** has a Supplier Risk Score of **${supplier.srs.score}** (${supplier.srs.level.replace('-', ' ')}).\n\n**Key Details:**\n- Category: ${supplier.category}\n- Location: ${supplier.location.city}, ${supplier.location.country}\n- Your Spend: ${supplier.spendFormatted}\n- Trend: ${supplier.srs.trend === 'worsening' ? '📈 Worsening' : supplier.srs.trend === 'improving' ? '📉 Improving' : '➡️ Stable'}\n- Last Updated: ${supplier.srs.lastUpdated}`,
          responseType: 'widget',
          suggestions: generateSuggestions(intent, { suppliers: [supplier] }),
          suppliers: [supplier],
          artifact: { type: 'supplier_detail', title: `${supplier.name} Risk Profile`, supplierId: supplier.id },
          escalation: determineEscalation(1, 'supplier_deep_dive'),
          intent,
        };
      }
      break;
    }

    case 'trend_detection': {
      const changes = MOCK_RISK_CHANGES;
      const riskChanges = changes.map(c => ({
        supplierName: c.supplierName,
        direction: c.direction,
        previousScore: c.previousScore,
        currentScore: c.currentScore,
      }));
      return {
        content: `I found **${changes.length} supplier(s)** with notable risk changes:\n\n${changes.map(c =>
          `${c.direction === 'worsened' ? '📉' : '📈'} **${c.supplierName}**: ${c.previousScore} → ${c.currentScore} (${c.direction === 'worsened' ? 'Now ' + c.currentLevel : 'Improved to ' + c.currentLevel})\n   Changed: ${c.changeDate}`
        ).join('\n\n')}\n\n${changes.some(c => c.direction === 'worsened')
          ? "⚠️ Apple Inc. moving to High Risk warrants attention given the spend exposure."
          : ""}`,
        responseType: 'alert',
        suggestions: generateSuggestions(intent, { riskChanges, resultCount: changes.length }),
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
        content: `Here's a comparison of ${toCompare.length} suppliers:\n\n${toCompare.map((s, i) =>
          `**${i + 1}. ${s.name}**\n   SRS: ${s.srs.score} (${s.srs.level}) | Spend: ${s.spendFormatted} | Trend: ${s.srs.trend}`
        ).join('\n\n')}\n\n**Summary:** ${toCompare[0]?.name} has the highest risk score. Consider reviewing alternatives.`,
        responseType: 'table',
        suggestions: generateSuggestions(intent, { suppliers: toCompare }),
        suppliers: toCompare,
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
