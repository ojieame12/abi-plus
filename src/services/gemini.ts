// Gemini API Service for fast conversational responses
import { composeSystemPrompt, parseAIResponse } from './prompts';
import type { ChatMessage, Suggestion } from '../types/chat';
import { generateId } from '../types/chat';
import { getPortfolioSummary, filterSuppliers, getSupplierByName, MOCK_SUPPLIERS, MOCK_RISK_CHANGES } from './mockData';
import type { DetectedIntent } from '../types/intents';
import { classifyIntent } from '../types/intents';
import type { Supplier } from '../types/supplier';
import type { WidgetData } from '../types/widgets';

const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash-exp'; // Gemini 2.0 Flash (free tier, stable)
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GeminiResponse {
  content: string;
  responseType: 'widget' | 'table' | 'summary' | 'alert' | 'handoff';
  suggestions: Suggestion[];
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
  };
  suppliers?: Supplier[]; // Matched suppliers for display
  portfolio?: ReturnType<typeof getPortfolioSummary>;
  intent?: DetectedIntent;
}

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

    // Extract widget data if present
    const widget = response.widget as { type: string; title?: string; data?: Record<string, unknown> } | undefined;

    // Extract insight if present
    const insight = response.insight as { headline: string; explanation: string } | undefined;

    return {
      content: (response.response as string) || '',
      responseType: widget?.type ? 'widget' : 'summary',
      suggestions,
      artifact: widget ? {
        type: widget.type,
        title: widget.title,
      } : undefined,
      insight: insight ? `${insight.headline}: ${insight.explanation}` : undefined,
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
    insight: parsed.insight,
    handoff: parsed.handoff,
  };

  // Add portfolio data for overview queries
  if (intent.category === 'portfolio_overview') {
    baseResponse.portfolio = getPortfolioSummary();
    if (!baseResponse.artifact) {
      baseResponse.artifact = { type: 'portfolio_dashboard', title: 'Risk Portfolio Overview' };
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
    baseResponse.suppliers = filterSuppliers(MOCK_SUPPLIERS, filters);
    baseResponse.artifact = { type: 'supplier_table', title: 'Filtered Suppliers', filters };
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
        content: `You're currently monitoring **${portfolio.totalSuppliers} suppliers** across your portfolio.\n\nHere's your risk distribution:\n- 🔴 High Risk: ${portfolio.distribution.high}\n- 🟠 Med-High: ${portfolio.distribution.mediumHigh}\n- 🟡 Medium: ${portfolio.distribution.medium}\n- 🟢 Low: ${portfolio.distribution.low}\n- ⚪ Unrated: ${portfolio.distribution.unrated}\n\nTotal spend exposure: ${portfolio.totalSpendFormatted}`,
        responseType: 'widget',
        suggestions: [
          { id: '1', text: 'Show high-risk suppliers', icon: 'search' },
          { id: '2', text: 'Why are some unrated?', icon: 'lightbulb' },
          { id: '3', text: 'Set up alerts', icon: 'alert' },
        ],
        portfolio,
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
        suggestions: [
          { id: '1', text: 'Compare these suppliers', icon: 'compare' },
          { id: '2', text: 'Find alternatives', icon: 'search' },
          { id: '3', text: 'Export list', icon: 'document' },
        ],
        suppliers,
        artifact: { type: 'supplier_table', title: 'Filtered Suppliers', filters },
        intent,
      };
    }

    case 'trend_detection':
      return {
        content: `I found **${MOCK_RISK_CHANGES.length} supplier(s)** with recent risk changes:\n\n${MOCK_RISK_CHANGES.map(c =>
          `${c.direction === 'worsened' ? '📉' : '📈'} **${c.supplierName}**: ${c.previousScore} → ${c.currentScore}`
        ).join('\n')}`,
        responseType: 'alert',
        suggestions: [
          { id: '1', text: 'View affected suppliers', icon: 'search' },
          { id: '2', text: 'Find alternatives', icon: 'search' },
          { id: '3', text: 'Set up alerts', icon: 'alert' },
        ],
        artifact: { type: 'supplier_table', title: 'Risk Changes' },
        intent,
      };

    case 'restricted_query':
      return {
        content: `This supplier's risk score is calculated from multiple weighted factors including financial health, operational metrics, and compliance indicators.\n\nTo see the full breakdown of contributing factors and scores, you'll need to view the detailed risk profile in the dashboard, as some data comes from partners with viewing restrictions.`,
        responseType: 'handoff',
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
