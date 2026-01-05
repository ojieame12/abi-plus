// Gemini API Service for fast conversational responses
import { composeSystemPrompt, parseAIResponse } from './prompts';
import type { ChatMessage, Suggestion } from '../types/chat';
import { generateId } from '../types/chat';
import { getPortfolioSummary, filterSuppliers, getSupplierByName, MOCK_SUPPLIERS, MOCK_RISK_CHANGES } from './mockData';
import type { DetectedIntent } from '../types/intents';
import { classifyIntent } from '../types/intents';
import type { Supplier } from '../types/supplier';
import type { WidgetData } from '../types/widgets';
import { transformSupplierToRiskCardData, transformRiskChangesToAlertData } from './widgetTransformers';

const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash-exp'; // Gemini 2.0 Flash (free tier, stable)
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Rich insight structure for InsightDetailArtifact
export interface RichInsight {
  headline: string;
  summary: string;
  type: 'risk_alert' | 'opportunity' | 'info' | 'action_required';
  sentiment: 'positive' | 'negative' | 'neutral';
  factors?: Array<{
    title: string;
    detail: string;
    impact: 'positive' | 'negative' | 'neutral';
    trend?: 'up' | 'down' | 'stable';
  }>;
  // These are added by enhanceResponseWithData based on supplier/portfolio data
  entity?: {
    name: string;
    type: 'supplier' | 'category' | 'region' | 'portfolio';
  };
  metric?: {
    label: string;
    previousValue: number;
    currentValue: number;
    unit?: string;
    level?: string;
  };
  trendData?: number[];
  actions?: Array<{
    label: string;
    action: string;
    icon?: string;
  }>;
  sources?: {
    web?: Array<{ name: string; url?: string }>;
    internal?: Array<{ name: string; type: string }>;
  };
  confidence?: 'high' | 'medium' | 'low';
  generatedAt?: string;
}

export interface GeminiResponse {
  content: string;
  responseType: 'widget' | 'table' | 'summary' | 'alert' | 'handoff';
  suggestions: Suggestion[];
  sources?: Array<{ type: 'web' | 'beroe' | 'dnd' | 'ecovadis'; name?: string; url?: string }>;
  artifact?: {
    type: string;
    title?: string;
    filters?: Record<string, unknown>;
    supplierId?: string;
  };
  // Full widget specification from AI
  widget?: {
    type: string;
    title?: string;
    data?: unknown;
  };
  // Rich insight for InsightDetailArtifact
  insight?: RichInsight;
  // Response highlight header before body text
  acknowledgement?: string;
  handoff?: {
    required: boolean;
    reason: string;
    linkText: string;
  };
  suppliers?: Supplier[]; // Matched suppliers for display
  portfolio?: ReturnType<typeof getPortfolioSummary>;
  intent?: DetectedIntent;
  riskChanges?: typeof MOCK_RISK_CHANGES; // Risk changes for trend detection
}

// Generate contextual acknowledgement based on intent
const generateAcknowledgement = (intent: DetectedIntent, query: string): string => {
  const acks: Record<string, string[]> = {
    portfolio_overview: [
      "Here's your portfolio overview.",
      "Let me show you your risk landscape.",
      "Here's what I found in your portfolio.",
    ],
    filtered_discovery: [
      "Found what you're looking for.",
      "Here are the matching suppliers.",
      "I've filtered your suppliers.",
    ],
    supplier_deep_dive: [
      "Here's the detailed profile.",
      "Let me break that down for you.",
      "I've pulled up the full analysis.",
    ],
    trend_detection: [
      "Spotted some changes.",
      "Here's what's shifted recently.",
      "Let me highlight the trends.",
    ],
    comparison: [
      "Ready for comparison.",
      "Here's how they stack up.",
      "I've lined them up for you.",
    ],
    explanation_why: [
      "Great question.",
      "Let me explain that.",
      "Here's why.",
    ],
    restricted_query: [
      "I found some relevant data.",
      "Let me help with that.",
    ],
    general: [
      "Here's what I found.",
      "Let me help with that.",
    ],
  };

  const options = acks[intent.category] || acks.general;
  return options[Math.floor(Math.random() * options.length)];
};

// Build context about user's portfolio to inject into prompts
const buildPortfolioContext = (): string => {
  const portfolio = getPortfolioSummary();
  const highRiskSuppliers = filterSuppliers(MOCK_SUPPLIERS, { riskLevel: ['high', 'medium-high'] });

  return `
CURRENT USER PORTFOLIO DATA:
- Total suppliers monitored: ${portfolio.totalSuppliers}
- Total spend: ${portfolio.totalSpendFormatted}
- Risk distribution:
  - High Risk: ${portfolio.distribution.high}
  - Medium-High Risk: ${portfolio.distribution.mediumHigh}
  - Medium Risk: ${portfolio.distribution.medium}
  - Low Risk: ${portfolio.distribution.low}
  - Unrated: ${portfolio.distribution.unrated}

HIGH RISK SUPPLIERS:
${highRiskSuppliers.map(s => `- ${s.name}: SRS ${s.srs.score} (${s.srs.level}), Spend: ${s.spendFormatted}, Category: ${s.category}`).join('\n')}

RECENT RISK CHANGES:
${MOCK_RISK_CHANGES.map(c => `- ${c.supplierName}: ${c.previousScore} → ${c.currentScore} (${c.direction})`).join('\n')}

ALL SUPPLIERS:
${MOCK_SUPPLIERS.map(s => `- ${s.name} (${s.id}): SRS ${s.srs.score || 'Unrated'}, ${s.srs.level}, ${s.location.region}, ${s.category}, ${s.spendFormatted}`).join('\n')}
`;
};

// Parse the LLM response (expects structured JSON)
const parseGeminiResponse = (text: string): Partial<GeminiResponse> => {
  // Use the structured parser from prompts.ts
  const parsed = parseAIResponse(text);

  if (parsed) {
    // Transform structured AI output to GeminiResponse format
    const response = parsed as Record<string, unknown>;

    // Extract follow-ups and convert to suggestions
    const followUps = (response.followUps as string[]) || [];
    const suggestions: Suggestion[] = followUps.slice(0, 3).map((text, i) => ({
      id: String(i + 1),
      text,
      icon: i === 0 ? 'search' : i === 1 ? 'lightbulb' : 'chart',
    }));

    // Extract widget data if present - PRESERVE THE FULL WIDGET SPEC
    const widgetRaw = response.widget as { type: string; title?: string; data?: Record<string, unknown> } | undefined;

    // Extract rich insight if present
    const insightRaw = response.insight as {
      headline?: string;
      summary?: string;
      explanation?: string; // Legacy field
      type?: string;
      sentiment?: string;
      factors?: Array<{ title: string; detail: string; impact: string }>;
    } | undefined;

    // Build rich insight object
    let insight: RichInsight | undefined;
    if (insightRaw?.headline) {
      insight = {
        headline: insightRaw.headline,
        summary: insightRaw.summary || insightRaw.explanation || '',
        type: (insightRaw.type as RichInsight['type']) || 'info',
        sentiment: (insightRaw.sentiment as RichInsight['sentiment']) || 'neutral',
        factors: insightRaw.factors?.map(f => ({
          title: f.title,
          detail: f.detail,
          impact: f.impact as 'positive' | 'negative' | 'neutral',
          trend: f.impact === 'negative' ? 'down' : f.impact === 'positive' ? 'up' : 'stable',
        })),
        generatedAt: new Date().toISOString(),
      };
    }

    // Build full WidgetData if widget is present
    const widget: WidgetData | undefined = widgetRaw ? {
      type: widgetRaw.type as WidgetData['type'],
      title: widgetRaw.title,
      data: widgetRaw.data || {},
    } : undefined;

    return {
      content: (response.response as string) || '',
      responseType: widgetRaw?.type ? 'widget' : 'summary',
      suggestions,
      artifact: widgetRaw ? {
        type: widgetRaw.type,
        title: widgetRaw.title,
      } : undefined,
      // IMPORTANT: Preserve full widget specification
      widget,
      // Rich insight for InsightDetailArtifact
      insight,
    };
  }

  // Fallback: treat as plain text response
  console.warn('[Gemini] Failed to parse as structured JSON, using text fallback');
  return {
    content: text,
    responseType: 'summary',
    suggestions: [
      { id: '1', text: 'Show my risk overview', icon: 'chart' },
      { id: '2', text: 'Which suppliers are high risk?', icon: 'search' },
      { id: '3', text: 'Any recent changes?', icon: 'alert' },
    ],
  };
};

// Main function to call Gemini API
export const callGemini = async (
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<GeminiResponse> => {
  // First, classify the intent locally
  const intent = classifyIntent(userMessage);

  // Build conversation history for context
  const historyMessages = conversationHistory.slice(-6).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  // Build the full prompt with portfolio context and structured output instructions
  const portfolioContext = buildPortfolioContext();
  const systemPrompt = composeSystemPrompt(intent.category, {
    includeThinking: false,
    includeExamples: true,
    portfolioContext,
  });

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      ...historyMessages,
      {
        role: 'user',
        parts: [{ text: `User query: "${userMessage}"\n\nRespond with valid JSON following the format specified above.` }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048, // Increased for structured output
    },
  };

  try {
    console.log('[Gemini] Making API call to:', GEMINI_API_URL);
    console.log('[Gemini] API Key configured:', Boolean(GEMINI_API_KEY));
    console.log('[Gemini] Model:', GEMINI_MODEL);

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Gemini] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini] API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Gemini] Response data:', JSON.stringify(data).slice(0, 500));

    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const parsed = parseGeminiResponse(textContent);

    // Enhance response with actual data based on intent
    const enhancedResponse = enhanceResponseWithData(parsed, intent, userMessage);

    return {
      ...enhancedResponse,
      intent,
    };
  } catch (error) {
    console.error('[Gemini] API call failed:', error);
    // Return fallback response using local data
    console.log('[Gemini] Using fallback response');
    return generateFallbackResponse(intent, userMessage);
  }
};

// Helper: Transform Supplier to flat format for SupplierTableWidget
const transformSuppliersForWidget = (suppliers: Supplier[]) => {
  return suppliers.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    country: s.location?.country || s.location?.region || 'Unknown',
    riskScore: s.srs?.score ?? 0,
    riskLevel: s.srs?.level || 'unrated',
    trend: s.srs?.trend || 'stable',
    spend: s.spendFormatted || s.spend?.toString() || '—',
  }));
};

// Helper: Build actions based on risk level and trend
const buildActionsForContext = (riskLevel?: string, trend?: string): RichInsight['actions'] => {
  const baseActions = [
    { label: 'View Full Profile', action: 'view_profile', icon: 'profile' },
  ];

  if (riskLevel === 'high' || riskLevel === 'medium-high') {
    return [
      ...baseActions,
      { label: 'Escalate to Procurement', action: 'escalate', icon: 'escalate' },
      { label: 'Find Alternatives', action: 'find_alternatives', icon: 'compare' },
    ];
  }

  if (trend === 'worsening') {
    return [
      ...baseActions,
      { label: 'Set Alert', action: 'set_alert', icon: 'alert' },
      { label: 'Add to Watchlist', action: 'add_watchlist', icon: 'watchlist' },
    ];
  }

  return [
    ...baseActions,
    { label: 'Export Report', action: 'export', icon: 'export' },
  ];
};

// Helper: Generate trend data from score history or fake it
const generateTrendData = (currentScore: number, trend: string): number[] => {
  const data: number[] = [];
  let value = currentScore;

  for (let i = 8; i >= 0; i--) {
    if (i === 8) {
      data.push(currentScore);
    } else {
      const variance = Math.floor(Math.random() * 5) + 2;
      if (trend === 'worsening') {
        value = Math.max(20, value - variance);
      } else if (trend === 'improving') {
        value = Math.min(95, value + variance);
      } else {
        value = value + (Math.random() > 0.5 ? variance : -variance);
        value = Math.max(20, Math.min(95, value));
      }
      data.unshift(value);
    }
  }

  return data;
};

// Enhance the LLM response with actual supplier data
const enhanceResponseWithData = (
  parsed: Partial<GeminiResponse>,
  intent: DetectedIntent,
  query: string
): GeminiResponse => {
  const baseResponse: GeminiResponse = {
    content: parsed.content || '',
    responseType: parsed.responseType || intent.responseType,
    suggestions: parsed.suggestions || [],
    artifact: parsed.artifact,
    widget: parsed.widget, // Preserve AI's widget spec
    insight: parsed.insight,
    acknowledgement: generateAcknowledgement(intent, query),
    handoff: parsed.handoff,
  };

  // Add portfolio data for overview queries
  if (intent.category === 'portfolio_overview') {
    const portfolio = getPortfolioSummary();
    baseResponse.portfolio = portfolio;
    if (!baseResponse.artifact) {
      baseResponse.artifact = { type: 'portfolio_dashboard', title: 'Risk Portfolio Overview' };
    }
    // Build widget if AI didn't provide one
    if (!baseResponse.widget) {
      baseResponse.widget = {
        type: 'risk_distribution',
        title: 'Risk Portfolio Overview',
        data: {
          distribution: portfolio.distribution,
          totalSuppliers: portfolio.totalSuppliers,
          totalSpend: portfolio.totalSpendFormatted,
        },
      };
    }

    // Enrich insight with portfolio data
    if (baseResponse.insight) {
      const unratedPercent = Math.round((portfolio.distribution.unrated / portfolio.totalSuppliers) * 100);
      baseResponse.insight = {
        ...baseResponse.insight,
        entity: { name: 'Supplier Portfolio', type: 'portfolio' },
        metric: {
          label: 'Unrated Suppliers',
          previousValue: unratedPercent - 5,
          currentValue: unratedPercent,
          unit: '%',
          level: unratedPercent > 50 ? 'high' : 'medium',
        },
        trendData: generateTrendData(unratedPercent, 'stable'),
        actions: [
          { label: 'View All Suppliers', action: 'view_all', icon: 'profile' },
          { label: 'Request Ratings', action: 'request_ratings', icon: 'alert' },
          { label: 'Export Report', action: 'export', icon: 'export' },
        ],
        sources: {
          internal: [
            { name: 'Beroe Risk Intelligence', type: 'risk' },
            { name: 'Portfolio Analytics', type: 'analytics' },
          ],
        },
        confidence: 'high',
      };
    }
  }

  // Add filtered suppliers for discovery queries
  if (intent.category === 'filtered_discovery') {
    const filters: Record<string, unknown> = {};
    if (intent.extractedEntities.riskLevel) {
      filters.riskLevel = intent.extractedEntities.riskLevel;
    }
    if (intent.extractedEntities.region) {
      filters.region = intent.extractedEntities.region;
    }
    const suppliers = filterSuppliers(MOCK_SUPPLIERS, filters);
    baseResponse.suppliers = suppliers;
    baseResponse.artifact = { type: 'supplier_table', title: 'Filtered Suppliers', filters };
    // Build widget with transformed data for SupplierTableWidget
    if (!baseResponse.widget) {
      baseResponse.widget = {
        type: 'supplier_table',
        title: 'Filtered Suppliers',
        data: {
          suppliers: transformSuppliersForWidget(suppliers),
          totalCount: suppliers.length,
          filters,
        },
      };
    }

    // Enrich insight with filtered suppliers data
    if (baseResponse.insight && suppliers.length > 0) {
      const highRiskSupplier = suppliers.find(s => s.srs?.level === 'high');
      baseResponse.insight = {
        ...baseResponse.insight,
        entity: highRiskSupplier
          ? { name: highRiskSupplier.name, type: 'supplier' }
          : { name: `${suppliers.length} Suppliers`, type: 'category' },
        metric: highRiskSupplier?.srs ? {
          label: 'Risk Score',
          previousValue: highRiskSupplier.srs.previousScore || (highRiskSupplier.srs.score || 0) - 10,
          currentValue: highRiskSupplier.srs.score || 0,
          unit: 'points',
          level: highRiskSupplier.srs.level,
        } : undefined,
        trendData: highRiskSupplier?.srs
          ? (highRiskSupplier.srs.scoreHistory || generateTrendData(highRiskSupplier.srs.score || 50, highRiskSupplier.srs.trend || 'stable'))
          : undefined,
        actions: buildActionsForContext(highRiskSupplier?.srs?.level, highRiskSupplier?.srs?.trend),
        sources: {
          internal: [
            { name: 'Beroe Risk Intelligence', type: 'risk' },
            { name: 'Supplier Performance Data', type: 'performance' },
          ],
        },
        confidence: 'high',
      };
    }
  }

  // Add specific supplier for deep-dive
  if (intent.category === 'supplier_deep_dive') {
    // Try to extract supplier name from query
    const supplierNames = MOCK_SUPPLIERS.map(s => s.name.toLowerCase());
    const matchedSupplier = supplierNames.find(name =>
      query.toLowerCase().includes(name) || name.includes(query.toLowerCase())
    );

    if (matchedSupplier) {
      const supplier = getSupplierByName(matchedSupplier);
      if (supplier) {
        baseResponse.suppliers = [supplier];
        baseResponse.artifact = {
          type: 'supplier_detail',
          title: `${supplier.name} Risk Profile`,
          supplierId: supplier.id,
        };
        // Build widget with proper data shape
        if (!baseResponse.widget) {
          baseResponse.widget = {
            type: 'supplier_risk_card',
            title: `${supplier.name} Risk Profile`,
            data: transformSupplierToRiskCardData(supplier),
          };
        }

        // Enrich insight with supplier data
        if (baseResponse.insight) {
          baseResponse.insight = {
            ...baseResponse.insight,
            entity: { name: supplier.name, type: 'supplier' },
            metric: {
              label: 'Risk Score',
              previousValue: supplier.srs.previousScore || supplier.srs.score - 13,
              currentValue: supplier.srs.score,
              unit: 'points',
              level: supplier.srs.level,
            },
            trendData: supplier.srs.scoreHistory || generateTrendData(supplier.srs.score, supplier.srs.trend),
            actions: buildActionsForContext(supplier.srs.level, supplier.srs.trend),
            sources: {
              internal: [
                { name: 'Beroe Risk Intelligence', type: 'risk' },
                { name: 'D&B Financial Data', type: 'financial' },
                { name: 'EcoVadis Sustainability', type: 'esg' },
              ],
            },
            confidence: 'high',
          };
        }
      }
    }
  }

  // Handle trend detection
  if (intent.category === 'trend_detection') {
    const suppliersWithChanges = MOCK_RISK_CHANGES.map(change => {
      const supplier = MOCK_SUPPLIERS.find(s => s.id === change.supplierId);
      return supplier;
    }).filter(Boolean) as Supplier[];

    baseResponse.suppliers = suppliersWithChanges;
    baseResponse.artifact = { type: 'supplier_table', title: 'Suppliers with Risk Changes' };
    // Build widget with proper data shape
    if (!baseResponse.widget) {
      baseResponse.widget = {
        type: 'alert_card',
        title: 'Risk Changes Detected',
        data: transformRiskChangesToAlertData(MOCK_RISK_CHANGES),
      };
    }
    // Include riskChanges for componentSelector
    baseResponse.riskChanges = MOCK_RISK_CHANGES;

    // Enrich insight with change data
    if (baseResponse.insight && MOCK_RISK_CHANGES.length > 0) {
      const criticalChange = MOCK_RISK_CHANGES.find(c => c.direction === 'worsened');
      const changeSupplier = criticalChange
        ? MOCK_SUPPLIERS.find(s => s.id === criticalChange.supplierId)
        : suppliersWithChanges[0];

      if (changeSupplier) {
        baseResponse.insight = {
          ...baseResponse.insight,
          entity: { name: changeSupplier.name, type: 'supplier' },
          metric: criticalChange ? {
            label: 'Risk Score',
            previousValue: criticalChange.previousScore,
            currentValue: criticalChange.currentScore,
            unit: 'points',
            level: criticalChange.currentLevel,
          } : {
            label: 'Risk Score',
            previousValue: changeSupplier.srs.previousScore || changeSupplier.srs.score,
            currentValue: changeSupplier.srs.score,
            unit: 'points',
            level: changeSupplier.srs.level,
          },
          trendData: changeSupplier.srs.scoreHistory || generateTrendData(changeSupplier.srs.score, changeSupplier.srs.trend),
          actions: buildActionsForContext(changeSupplier.srs.level, changeSupplier.srs.trend),
          sources: {
            internal: [
              { name: 'Beroe Risk Intelligence', type: 'risk' },
              { name: 'Risk Change Alerts', type: 'alerts' },
            ],
          },
          confidence: 'high',
        };
      }
    }
  }

  // Handle action_trigger (find alternatives, etc.)
  if (intent.category === 'action_trigger' && !baseResponse.widget) {
    const category = intent.extractedEntities.category;
    let suppliers = MOCK_SUPPLIERS.filter(s =>
      s.srs?.level === 'high' || s.srs?.level === 'medium-high'
    );

    // Filter by category if specified
    if (category) {
      const categoryLower = category.toLowerCase();
      const categoryFiltered = suppliers.filter(s =>
        s.category?.toLowerCase().includes(categoryLower) ||
        categoryLower.includes(s.category?.toLowerCase() || '')
      );
      if (categoryFiltered.length > 0) {
        suppliers = categoryFiltered;
      }
    }

    if (suppliers.length > 0) {
      baseResponse.suppliers = suppliers;
      baseResponse.widget = {
        type: 'supplier_table',
        title: category ? `${category} Suppliers` : 'High-Risk Suppliers',
        data: {
          suppliers: transformSuppliersForWidget(suppliers),
          totalCount: suppliers.length,
          filters: category ? { category } : { riskLevel: 'high' },
        },
      };
      baseResponse.artifact = { type: 'supplier_table', title: 'Supplier Alternatives' };
    }
  }

  // Handle restricted queries
  if (intent.category === 'restricted_query') {
    baseResponse.responseType = 'handoff';
    baseResponse.handoff = {
      required: true,
      reason: intent.handoffReason || 'Detailed factor scores require dashboard access.',
      linkText: 'View Full Risk Profile in Dashboard',
    };
  }

  return baseResponse;
};

// Generate fallback response when API fails
const generateFallbackResponse = (intent: DetectedIntent, query: string): GeminiResponse => {
  const portfolio = getPortfolioSummary();

  switch (intent.category) {
    case 'portfolio_overview':
      return {
        content: `You're monitoring **${portfolio.totalSuppliers} suppliers** with **${portfolio.totalSpendFormatted}** total spend.${portfolio.distribution.unrated > 2 ? ` The ${portfolio.distribution.unrated} unrated suppliers may need risk assessment.` : portfolio.distribution.high > 0 ? ` You have ${portfolio.distribution.high} high-risk suppliers requiring attention.` : ''}`,
        responseType: 'widget',
        acknowledgement: generateAcknowledgement(intent, query),
        suggestions: [
          { id: '1', text: 'Show high-risk suppliers', icon: 'search' },
          { id: '2', text: 'Why are some unrated?', icon: 'lightbulb' },
          { id: '3', text: 'Set up alerts', icon: 'alert' },
        ],
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
        artifact: { type: 'portfolio_dashboard', title: 'Risk Portfolio Overview' },
        intent,
      };

    case 'filtered_discovery': {
      const filters: Record<string, unknown> = {};
      if (intent.extractedEntities.riskLevel) {
        filters.riskLevel = intent.extractedEntities.riskLevel;
      }
      const suppliers = filterSuppliers(MOCK_SUPPLIERS, filters);
      return {
        content: `Found **${suppliers.length} supplier(s)** matching your criteria.`,
        responseType: 'table',
        acknowledgement: generateAcknowledgement(intent, query),
        suggestions: [
          { id: '1', text: 'Compare these suppliers', icon: 'compare' },
          { id: '2', text: 'Find alternatives', icon: 'search' },
          { id: '3', text: 'Export list', icon: 'document' },
        ],
        suppliers,
        widget: {
          type: 'supplier_table',
          title: 'Filtered Suppliers',
          data: {
            suppliers: transformSuppliersForWidget(suppliers),
            totalCount: suppliers.length,
            filters,
          },
        },
        artifact: { type: 'supplier_table', title: 'Filtered Suppliers', filters },
        intent,
      };
    }

    case 'trend_detection': {
      const suppliersWithChanges = MOCK_RISK_CHANGES.map(change => {
        const supplier = MOCK_SUPPLIERS.find(s => s.id === change.supplierId);
        return supplier;
      }).filter(Boolean) as Supplier[];

      const worsened = MOCK_RISK_CHANGES.filter(c => c.direction === 'worsened');
      const critical = worsened.length > 0 ? worsened[0] : null;

      return {
        content: `**${MOCK_RISK_CHANGES.length} suppliers** had risk score changes recently.${critical ? ` ${critical.supplierName}'s increase to ${critical.currentScore} (${critical.currentLevel}) requires attention.` : ''}`,
        responseType: 'alert',
        acknowledgement: generateAcknowledgement(intent, query),
        suggestions: [
          { id: '1', text: 'View affected suppliers', icon: 'search' },
          { id: '2', text: 'Find alternatives', icon: 'search' },
          { id: '3', text: 'Set up alerts', icon: 'alert' },
        ],
        suppliers: suppliersWithChanges,
        widget: {
          type: 'alert_card',
          title: 'Risk Changes Detected',
          data: {
            changes: MOCK_RISK_CHANGES,
            suppliers: suppliersWithChanges,
          },
        },
        artifact: { type: 'supplier_table', title: 'Risk Changes' },
        intent,
      };
    }

    case 'supplier_deep_dive': {
      // Try to extract supplier name from query
      const supplierNames = MOCK_SUPPLIERS.map(s => s.name.toLowerCase());
      const matchedSupplier = supplierNames.find(name =>
        query.toLowerCase().includes(name) || name.includes(query.toLowerCase())
      );

      if (matchedSupplier) {
        const supplier = getSupplierByName(matchedSupplier);
        if (supplier) {
          const trendText = supplier.srs.trend === 'worsening' ? 'trending upward (worsening)' :
                           supplier.srs.trend === 'improving' ? 'trending downward (improving)' : 'stable';
          return {
            content: `**${supplier.name}** is currently ${supplier.srs.level} risk and ${trendText}.${supplier.srs.level === 'high' || supplier.srs.level === 'medium-high' ? ' You may want to review their risk factors or find alternatives.' : ''}`,
            responseType: 'widget',
            acknowledgement: generateAcknowledgement(intent, query),
            suggestions: [
              { id: '1', text: `Why is ${supplier.name.split(' ')[0]} this risk level?`, icon: 'lightbulb' },
              { id: '2', text: 'Find alternatives', icon: 'search' },
              { id: '3', text: 'Compare with others', icon: 'compare' },
            ],
            suppliers: [supplier],
            widget: {
              type: 'supplier_risk_card',
              title: `${supplier.name} Risk Profile`,
              data: { supplier },
            },
            artifact: { type: 'supplier_detail', title: `${supplier.name} Risk Profile`, supplierId: supplier.id },
            intent,
          };
        }
      }

      return {
        content: "I couldn't find that supplier in your portfolio. Try asking about a specific supplier by name.",
        responseType: 'summary',
        acknowledgement: "Let me check on that.",
        suggestions: [
          { id: '1', text: 'Show all suppliers', icon: 'search' },
          { id: '2', text: 'Show high-risk suppliers', icon: 'alert' },
        ],
        intent,
      };
    }

    case 'action_trigger': {
      // Find high-risk suppliers, optionally filtered by category
      const category = intent.extractedEntities.category;
      let suppliers = MOCK_SUPPLIERS.filter(s =>
        s.srs?.level === 'high' || s.srs?.level === 'medium-high'
      );

      // Filter by category if specified
      if (category) {
        const categoryLower = category.toLowerCase();
        suppliers = suppliers.filter(s =>
          s.category?.toLowerCase().includes(categoryLower) ||
          categoryLower.includes(s.category?.toLowerCase() || '')
        );
      }

      // If no high-risk in category, show all in category
      if (suppliers.length === 0 && category) {
        suppliers = MOCK_SUPPLIERS.filter(s =>
          s.category?.toLowerCase().includes(category.toLowerCase())
        );
      }

      // Fallback to all high-risk
      if (suppliers.length === 0) {
        suppliers = MOCK_SUPPLIERS.filter(s =>
          s.srs?.level === 'high' || s.srs?.level === 'medium-high'
        );
      }

      const subIntent = intent.subIntent;
      const actionText = subIntent === 'find_alternatives'
        ? 'Here are the high-risk suppliers you may want to find alternatives for'
        : 'Here are the suppliers requiring action';

      return {
        content: `${actionText}. ${suppliers.length > 0 ? `I found **${suppliers.length}** supplier(s)${category ? ` in ${category}` : ''} to review.` : 'No matching suppliers found.'}`,
        responseType: 'table',
        acknowledgement: generateAcknowledgement(intent, query),
        suggestions: [
          { id: '1', text: 'Compare these suppliers', icon: 'compare' },
          { id: '2', text: 'Show alternatives in this category', icon: 'search' },
          { id: '3', text: 'Export comparison', icon: 'document' },
        ],
        suppliers,
        widget: {
          type: 'supplier_table',
          title: category ? `${category} Suppliers` : 'High-Risk Suppliers',
          data: {
            suppliers: transformSuppliersForWidget(suppliers),
            totalCount: suppliers.length,
            filters: category ? { category } : { riskLevel: 'high' },
          },
        },
        artifact: { type: 'supplier_table', title: 'Supplier Alternatives' },
        intent,
      };
    }

    case 'restricted_query':
      return {
        content: `This supplier's risk score is calculated from multiple weighted factors including financial health, operational metrics, and compliance indicators.\n\nTo see the full breakdown of contributing factors and scores, you'll need to view the detailed risk profile in the dashboard, as some data comes from partners with viewing restrictions.`,
        responseType: 'handoff',
        acknowledgement: generateAcknowledgement(intent, query),
        suggestions: [
          { id: '1', text: 'Find alternatives', icon: 'search' },
          { id: '2', text: 'Compare with others', icon: 'compare' },
          { id: '3', text: 'View risk history', icon: 'chart' },
        ],
        handoff: {
          required: true,
          reason: 'Detailed factor scores require dashboard access due to partner data restrictions.',
          linkText: 'View Full Risk Profile in Dashboard',
        },
        artifact: { type: 'supplier_detail', title: 'Supplier Risk Profile' },
        intent,
      };

    default:
      return {
        content: "I'd be happy to help you analyze your supplier risk portfolio. What would you like to know?",
        responseType: 'summary',
        acknowledgement: generateAcknowledgement(intent, query),
        suggestions: [
          { id: '1', text: 'Show my risk overview', icon: 'chart' },
          { id: '2', text: 'Which suppliers are high risk?', icon: 'search' },
          { id: '3', text: 'Any recent changes?', icon: 'alert' },
        ],
        intent,
      };
  }
};

// Utility to check if API key is configured
export const isGeminiConfigured = (): boolean => {
  return Boolean(GEMINI_API_KEY);
};
