// Gemini API Service for fast conversational responses
import { composeSystemPrompt, parseAIResponse, buildContentGenerationPrompt } from './prompts';
import type { ChatMessage, Suggestion } from '../types/chat';
import { generateId } from '../types/chat';
import {
  fetchPortfolioData,
  getPortfolioSummary,
  filterSuppliers,
  getSupplierByName,
  getHighRiskSuppliers,
  getRecentRiskChanges,
  getAllSuppliers,
  type Supplier,
  type RiskChange,
  type RiskPortfolio,
} from './supplierDataClient';
import type { DetectedIntent } from '../types/intents';
import { classifyIntent } from '../types/intents';
import type { WidgetData, WidgetType } from '../types/widgets';
import { transformSupplierToRiskCardData, transformRiskChangesToAlertData } from './widgetTransformers';
import { getWidgetRoute, type AIContentSlots } from './widgetRouter';

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

// AI-generated artifact content for expanded panel
export interface ArtifactContent {
  title: string;
  overview: string;
  keyPoints: string[];
  recommendations?: string[];
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
  // AI-generated content for the artifact panel
  artifactContent?: ArtifactContent;
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
  portfolio?: RiskPortfolio;
  intent?: DetectedIntent;
  riskChanges?: RiskChange[]; // Risk changes for trend detection
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
const buildPortfolioContext = async (): Promise<string> => {
  try {
    const data = await fetchPortfolioData();
    const { portfolio, suppliers, highRiskSuppliers, riskChanges } = data;

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
${riskChanges.map(c => `- ${c.supplierName}: ${c.previousScore} → ${c.currentScore} (${c.direction})`).join('\n')}

ALL SUPPLIERS:
${suppliers.map(s => `- ${s.name} (${s.id}): SRS ${s.srs.score || 'Unrated'}, ${s.srs.level}, ${s.location.region}, ${s.category}, ${s.spendFormatted}`).join('\n')}
`;
  } catch (error) {
    console.error('[Gemini] Failed to build portfolio context:', error);
    return 'Portfolio data temporarily unavailable.';
  }
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
  const portfolioContext = await buildPortfolioContext();
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
    const enhancedResponse = await enhanceResponseWithData(parsed, intent, userMessage);

    return {
      ...enhancedResponse,
      intent,
    };
  } catch (error) {
    console.error('[Gemini] API call failed:', error);
    // Return fallback response using local data
    console.log('[Gemini] Using fallback response');
    return await generateFallbackResponse(intent, userMessage);
  }
};

// ============================================
// NEW ARCHITECTURE: callGeminiV2
// Widget type determined by intent, AI generates content only
// ============================================

interface FetchedData {
  portfolio?: RiskPortfolio;
  suppliers?: Supplier[];
  riskChanges?: RiskChange[];
  targetSupplier?: Supplier;
}

// Step 1: Fetch data based on intent requirements
async function fetchDataForIntent(
  intent: DetectedIntent,
  query: string
): Promise<FetchedData> {
  const route = getWidgetRoute(intent.category, intent.subIntent);
  const data: FetchedData = {};

  // Fetch portfolio if needed
  if (route.requiresPortfolio) {
    data.portfolio = await getPortfolioSummary();
  }

  // Fetch suppliers based on intent
  if (route.requiresSuppliers) {
    const allSuppliers = await getAllSuppliers();

    switch (intent.category) {
      case 'filtered_discovery': {
        const filters: Record<string, string | string[]> = {};
        if (intent.extractedEntities.riskLevel) {
          filters.riskLevel = intent.extractedEntities.riskLevel;
        }
        if (intent.extractedEntities.region) {
          filters.region = intent.extractedEntities.region;
        }
        data.suppliers = await filterSuppliers(filters);
        break;
      }

      case 'supplier_deep_dive': {
        // Find specific supplier
        const supplierName = intent.extractedEntities.supplierName;
        if (supplierName) {
          const supplier = await getSupplierByName(supplierName);
          if (supplier) {
            data.targetSupplier = supplier;
            data.suppliers = [supplier];
          }
        } else {
          // Try to find supplier name in query
          const matched = allSuppliers.find(s =>
            query.toLowerCase().includes(s.name.toLowerCase())
          );
          if (matched) {
            data.targetSupplier = matched;
            data.suppliers = [matched];
          }
        }
        break;
      }

      case 'action_trigger': {
        if (intent.subIntent === 'find_alternatives') {
          const supplierName = intent.extractedEntities.supplierName;
          let targetSupplier: Supplier | undefined;

          if (supplierName) {
            targetSupplier = allSuppliers.find(s =>
              s.name.toLowerCase().includes(supplierName.toLowerCase()) ||
              supplierName.toLowerCase().includes(s.name.toLowerCase())
            );
          } else {
            // Try to find supplier name in query
            targetSupplier = allSuppliers.find(s =>
              query.toLowerCase().includes(s.name.toLowerCase())
            );
          }

          if (targetSupplier) {
            data.targetSupplier = targetSupplier;
            // Find alternatives in same category
            const alternatives = allSuppliers.filter(s =>
              s.id !== targetSupplier!.id &&
              s.category === targetSupplier!.category &&
              (s.srs?.score || 100) < (targetSupplier!.srs?.score || 0)
            );
            data.suppliers = alternatives.length > 0 ? alternatives :
              allSuppliers.filter(s => s.id !== targetSupplier!.id && s.category === targetSupplier!.category);
          } else {
            data.suppliers = await getHighRiskSuppliers();
          }
        } else {
          data.suppliers = await getHighRiskSuppliers();
        }
        break;
      }

      case 'explanation_why': {
        // For "why unrated" queries, get unrated suppliers
        if (query.toLowerCase().includes('unrated')) {
          data.portfolio = await getPortfolioSummary();
          data.suppliers = allSuppliers.filter(s => !s.srs?.score || s.srs.level === 'unrated');
        } else {
          data.suppliers = await getHighRiskSuppliers();
        }
        break;
      }

      case 'comparison': {
        // Get suppliers mentioned in query
        const mentioned = allSuppliers.filter(s =>
          query.toLowerCase().includes(s.name.toLowerCase())
        );
        data.suppliers = mentioned.length >= 2 ? mentioned : allSuppliers.slice(0, 3);
        break;
      }

      default:
        data.suppliers = allSuppliers.slice(0, 10);
    }
  }

  // Fetch risk changes if needed
  if (route.requiresRiskChanges) {
    data.riskChanges = await getRecentRiskChanges();
    if (!data.suppliers) {
      const allSuppliers = await getAllSuppliers();
      data.suppliers = data.riskChanges.map(c =>
        allSuppliers.find(s => s.id === c.supplierId)
      ).filter(Boolean) as Supplier[];
    }
  }

  return data;
}

// Step 2: Build data context string for AI
function buildDataContext(
  intent: DetectedIntent,
  data: FetchedData,
  query: string
): string {
  const parts: string[] = [];

  parts.push(`User Query: "${query}"`);

  if (data.portfolio) {
    parts.push(`
Portfolio Summary:
- Total Suppliers: ${data.portfolio.totalSuppliers}
- Total Spend: ${data.portfolio.totalSpendFormatted}
- High Risk: ${data.portfolio.distribution.high}
- Medium-High: ${data.portfolio.distribution.mediumHigh}
- Medium: ${data.portfolio.distribution.medium}
- Low: ${data.portfolio.distribution.low}
- Unrated: ${data.portfolio.distribution.unrated}`);
  }

  if (data.targetSupplier) {
    const s = data.targetSupplier;
    parts.push(`
Target Supplier:
- Name: ${s.name}
- Risk Score: ${s.srs?.score ?? 'Unrated'} (${s.srs?.level || 'unrated'})
- Trend: ${s.srs?.trend || 'stable'}
- Category: ${s.category}
- Spend: ${s.spendFormatted}
- Location: ${s.location?.country || s.location?.region || 'Unknown'}`);
  }

  if (data.suppliers && data.suppliers.length > 0) {
    const supplierList = data.suppliers.slice(0, 10).map(s =>
      `- ${s.name}: Score ${s.srs?.score ?? 'N/A'} (${s.srs?.level || 'unrated'}), ${s.category}, ${s.spendFormatted}`
    ).join('\n');
    parts.push(`
Relevant Suppliers (${data.suppliers.length} total):
${supplierList}`);
  }

  if (data.riskChanges && data.riskChanges.length > 0) {
    const changesList = data.riskChanges.map(c =>
      `- ${c.supplierName}: ${c.previousScore} → ${c.currentScore} (${c.direction})`
    ).join('\n');
    parts.push(`
Recent Risk Changes:
${changesList}`);
  }

  return parts.join('\n');
}

// Step 3: Call AI for content generation
async function generateAIContent(
  widgetType: WidgetType,
  intentCategory: string,
  dataContext: string
): Promise<AIContentSlots | null> {
  const prompt = buildContentGenerationPrompt(widgetType, intentCategory, dataContext);

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1500,
    },
  };

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('[GeminiV2] API error:', response.status);
      return null;
    }

    const result = await response.json();
    const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON response
    try {
      // Remove markdown fences if present
      const jsonStr = textContent.replace(/```json\s*|\s*```/g, '').trim();
      return JSON.parse(jsonStr) as AIContentSlots;
    } catch {
      console.error('[GeminiV2] Failed to parse JSON:', textContent.slice(0, 200));
      return null;
    }
  } catch (error) {
    console.error('[GeminiV2] Request failed:', error);
    return null;
  }
}

// Step 4: Build widget data based on type and fetched data
function buildWidgetData(
  widgetType: WidgetType,
  data: FetchedData,
  aiContent: AIContentSlots | null
): WidgetData | undefined {
  if (widgetType === 'none') return undefined;

  switch (widgetType) {
    case 'risk_distribution':
      if (!data.portfolio) return undefined;
      return {
        type: 'risk_distribution',
        title: aiContent?.widgetContent?.headline || 'Portfolio Risk Overview',
        data: {
          distribution: data.portfolio.distribution,
          totalSuppliers: data.portfolio.totalSuppliers,
          totalSpend: data.portfolio.totalSpendFormatted,
        },
      };

    case 'supplier_table':
      if (!data.suppliers?.length) return undefined;
      return {
        type: 'supplier_table',
        title: aiContent?.widgetContent?.headline || 'Suppliers',
        data: {
          suppliers: transformSuppliersForWidget(data.suppliers),
          totalCount: data.suppliers.length,
          filters: {},
        },
      };

    case 'supplier_risk_card':
      if (!data.targetSupplier) return undefined;
      return {
        type: 'supplier_risk_card',
        title: `${data.targetSupplier.name} Risk Profile`,
        data: transformSupplierToRiskCardData(data.targetSupplier),
      };

    case 'alert_card':
      if (!data.riskChanges?.length) return undefined;
      return {
        type: 'alert_card',
        title: aiContent?.widgetContent?.headline || 'Risk Changes Detected',
        data: transformRiskChangesToAlertData(data.riskChanges),
      };

    case 'comparison_table':
      if (!data.suppliers || data.suppliers.length < 2) return undefined;
      return {
        type: 'comparison_table',
        title: aiContent?.widgetContent?.headline || 'Supplier Comparison',
        data: {
          suppliers: data.suppliers.slice(0, 4).map(s => ({
            id: s.id,
            name: s.name,
            riskScore: s.srs?.score ?? 0,
            riskLevel: s.srs?.level || 'unrated',
            trend: s.srs?.trend || 'stable',
            spend: s.spendFormatted,
            category: s.category,
          })),
        },
      };

    case 'alternatives_preview':
      // Need a target supplier and alternatives
      if (!data.targetSupplier || !data.suppliers?.length) return undefined;
      return {
        type: 'alternatives_preview',
        title: aiContent?.widgetContent?.headline || `Alternatives to ${data.targetSupplier.name}`,
        data: {
          currentSupplier: data.targetSupplier.name,
          currentScore: data.targetSupplier.srs?.score ?? 50,
          alternatives: data.suppliers
            .filter(s => s.id !== data.targetSupplier?.id) // Exclude the current supplier
            .slice(0, 3) // Show top 3 alternatives
            .map(s => ({
              id: s.id,
              name: s.name,
              score: s.srs?.score ?? 50,
              level: s.srs?.level || 'unrated',
              category: s.category,
              matchScore: calculateMatchScore(data.targetSupplier!, s),
            })),
        },
      };

    default:
      return undefined;
  }
}

// Helper to calculate match score between suppliers
function calculateMatchScore(current: Supplier, alternative: Supplier): number {
  let score = 70; // Base score

  // Same category = +15
  if (current.category === alternative.category) score += 15;

  // Similar location = +10 (compare by value, not identity)
  if (current.location?.region === alternative.location?.region) score += 5;
  if (current.location?.country === alternative.location?.country) score += 5;

  // Better risk score = +5
  if ((alternative.srs?.score ?? 100) < (current.srs?.score ?? 0)) score += 5;

  return Math.min(score, 98); // Cap at 98%
}

// Step 5: Assemble final response
export async function callGeminiV2(
  userMessage: string,
  _conversationHistory: ChatMessage[] = []
): Promise<GeminiResponse> {
  console.log('[GeminiV2] Processing:', userMessage);

  // 1. Classify intent
  const intent = classifyIntent(userMessage);
  const route = getWidgetRoute(intent.category, intent.subIntent);
  console.log('[GeminiV2] Intent:', intent.category, '→ Widget:', route.widgetType);

  // 2. Handle restricted_query with handoff
  if (route.requiresHandoff) {
    return {
      id: generateId(),
      content: `This supplier's risk score is calculated from multiple weighted factors including financial health, operational metrics, and compliance indicators.\n\nTo see the full breakdown of contributing factors and scores, you'll need to view the detailed risk profile in the dashboard, as some data comes from partners with viewing restrictions.`,
      responseType: 'handoff',
      acknowledgement: generateAcknowledgement(intent, userMessage),
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
      artifact: { type: route.artifactType, title: 'Supplier Risk Profile' },
      intent,
    };
  }

  // 3. Fetch data based on intent
  const data = await fetchDataForIntent(intent, userMessage);
  console.log('[GeminiV2] Data fetched:', {
    hasPortfolio: !!data.portfolio,
    supplierCount: data.suppliers?.length || 0,
    hasTarget: !!data.targetSupplier,
    riskChanges: data.riskChanges?.length || 0,
  });

  // 4. Build data context for AI
  const dataContext = buildDataContext(intent, data, userMessage);

  // 5. Call AI for content generation
  const aiContent = await generateAIContent(route.widgetType, intent.category, dataContext);

  // 6. Build widget data
  const widget = buildWidgetData(route.widgetType, data, aiContent);

  // 7. Build insight from AI content
  const insight: RichInsight | undefined = aiContent?.widgetContent ? {
    headline: aiContent.widgetContent.headline,
    summary: aiContent.widgetContent.summary,
    type: aiContent.widgetContent.type || 'info',
    sentiment: aiContent.widgetContent.sentiment || 'neutral',
    factors: aiContent.widgetContent.factors?.map(f => ({
      title: f.title,
      detail: f.detail,
      impact: f.impact as 'positive' | 'negative' | 'neutral',
      trend: f.impact === 'negative' ? 'down' : f.impact === 'positive' ? 'up' : 'stable',
    })),
    entity: data.targetSupplier
      ? { name: data.targetSupplier.name, type: 'supplier' }
      : data.portfolio
        ? { name: 'Supplier Portfolio', type: 'portfolio' }
        : undefined,
    actions: [
      { label: 'View Details', action: 'view_details', icon: 'profile' },
      { label: 'Export Report', action: 'export', icon: 'export' },
    ],
    sources: {
      internal: [
        { name: 'Beroe Risk Intelligence', type: 'risk' },
        { name: 'Portfolio Analytics', type: 'analytics' },
      ],
    },
    confidence: 'high',
    generatedAt: new Date().toISOString(),
  } : undefined;

  // 8. Build suggestions from AI follow-ups
  const suggestions: Suggestion[] = (aiContent?.followUps || []).slice(0, 3).map((text, i) => ({
    id: String(i + 1),
    text,
    icon: i === 0 ? 'search' : i === 1 ? 'lightbulb' : 'chart',
  }));

  // 9. Fallback content if AI failed
  const narrative = aiContent?.narrative || generateFallbackNarrative(intent, data);

  // 10. Determine response type
  const responseType = route.widgetType === 'none' ? 'summary' : 'widget';

  return {
    id: generateId(),
    content: narrative,
    responseType,
    acknowledgement: generateAcknowledgement(intent, userMessage),
    suggestions: suggestions.length > 0 ? suggestions : [
      { id: '1', text: 'Show my risk overview', icon: 'chart' },
      { id: '2', text: 'Which suppliers are high risk?', icon: 'search' },
      { id: '3', text: 'Any recent changes?', icon: 'alert' },
    ],
    widget,
    insight,
    suppliers: data.suppliers,
    portfolio: data.portfolio,
    riskChanges: data.riskChanges,
    artifact: {
      type: route.artifactType,
      title: aiContent?.artifactContent?.title || 'Details',
    },
    // Pass through AI-generated artifact content
    artifactContent: aiContent?.artifactContent,
    intent,
  };
}

// Fallback narrative when AI content generation fails
function generateFallbackNarrative(intent: DetectedIntent, data: FetchedData): string {
  switch (intent.category) {
    case 'portfolio_overview':
      if (data.portfolio) {
        const unrated = data.portfolio.distribution.unrated;
        const total = data.portfolio.totalSuppliers;
        return unrated > 2
          ? `You're monitoring ${total} suppliers. The ${unrated} unrated suppliers may need risk assessment.`
          : `You're monitoring ${total} suppliers with ${data.portfolio.totalSpendFormatted} total spend.`;
      }
      return 'Here is your portfolio overview.';

    case 'filtered_discovery':
      return data.suppliers?.length
        ? `Found ${data.suppliers.length} supplier(s) matching your criteria.`
        : 'No suppliers found matching your criteria.';

    case 'supplier_deep_dive':
      if (data.targetSupplier) {
        return `${data.targetSupplier.name} is currently ${data.targetSupplier.srs?.level || 'unrated'} risk.`;
      }
      return 'I could not find that supplier in your portfolio.';

    case 'action_trigger':
      if (data.targetSupplier && data.suppliers?.length) {
        return `Found ${data.suppliers.length} potential alternative(s) to ${data.targetSupplier.name}.`;
      }
      return data.suppliers?.length
        ? `Here are ${data.suppliers.length} high-risk suppliers that may need alternatives.`
        : 'No matching suppliers found.';

    case 'explanation_why':
      if (data.portfolio && data.suppliers?.length) {
        return `You have ${data.suppliers.length} unrated suppliers. These typically lack risk assessments from our intelligence partners.`;
      }
      return 'Let me explain that for you.';

    case 'trend_detection':
      return data.riskChanges?.length
        ? `${data.riskChanges.length} supplier(s) had risk changes recently.`
        : 'No recent risk changes detected.';

    default:
      return 'Here is what I found.';
  }
}

// ============================================
// ORIGINAL HELPERS (kept for compatibility)
// ============================================

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
const enhanceResponseWithData = async (
  parsed: Partial<GeminiResponse>,
  intent: DetectedIntent,
  query: string
): Promise<GeminiResponse> => {
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
    const portfolio = await getPortfolioSummary();
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
    const filters: Record<string, string | string[]> = {};
    if (intent.extractedEntities.riskLevel) {
      filters.riskLevel = intent.extractedEntities.riskLevel;
    }
    if (intent.extractedEntities.region) {
      filters.region = intent.extractedEntities.region;
    }
    const suppliers = await filterSuppliers(filters);
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
    const allSuppliers = await getAllSuppliers();
    const supplierNames = allSuppliers.map(s => s.name.toLowerCase());
    const matchedSupplier = supplierNames.find(name =>
      query.toLowerCase().includes(name) || name.includes(query.toLowerCase())
    );

    if (matchedSupplier) {
      const supplier = await getSupplierByName(matchedSupplier);
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
    const allSuppliers = await getAllSuppliers();
    const riskChangesData = await getRecentRiskChanges();
    const suppliersWithChanges = riskChangesData.map(change => {
      const supplier = allSuppliers.find(s => s.id === change.supplierId);
      return supplier;
    }).filter(Boolean) as Supplier[];

    baseResponse.suppliers = suppliersWithChanges;
    baseResponse.artifact = { type: 'supplier_table', title: 'Suppliers with Risk Changes' };
    // Build widget with proper data shape
    if (!baseResponse.widget) {
      baseResponse.widget = {
        type: 'alert_card',
        title: 'Risk Changes Detected',
        data: transformRiskChangesToAlertData(riskChangesData),
      };
    }
    // Include riskChanges for componentSelector
    baseResponse.riskChanges = riskChangesData;

    // Enrich insight with change data
    if (baseResponse.insight && riskChangesData.length > 0) {
      const criticalChange = riskChangesData.find(c => c.direction === 'worsened');
      const changeSupplier = criticalChange
        ? allSuppliers.find(s => s.id === criticalChange.supplierId)
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

  // Handle explanation_why for unrated queries
  if (intent.category === 'explanation_why') {
    const queryLower = query.toLowerCase();
    if (queryLower.includes('unrated')) {
      // Get portfolio to explain unrated suppliers
      const portfolio = await getPortfolioSummary();
      const unratedCount = portfolio.distribution.unrated;

      // Get unrated suppliers
      const allSuppliers = await getAllSuppliers();
      const unratedSuppliers = allSuppliers.filter(s => !s.srs?.score || s.srs.level === 'unrated');

      baseResponse.suppliers = unratedSuppliers;
      baseResponse.portfolio = portfolio;
      baseResponse.widget = {
        type: 'supplier_table',
        title: 'Unrated Suppliers',
        data: {
          suppliers: transformSuppliersForWidget(unratedSuppliers),
          totalCount: unratedSuppliers.length,
          filters: { riskLevel: 'unrated' },
        },
      };
      baseResponse.artifact = { type: 'supplier_table', title: 'Unrated Suppliers', filters: { riskLevel: 'unrated' } };

      // Provide explanation in content if not already set by LLM
      if (!baseResponse.content || baseResponse.content.includes("I'd be happy to help")) {
        baseResponse.content = `You have **${unratedCount} unrated suppliers**. Suppliers are typically unrated when they're newly added to your portfolio, haven't been assessed by our risk intelligence partners, or don't have sufficient public data for scoring. Consider requesting assessments for critical suppliers.`;
      }
    }
  }

  // Handle action_trigger (find alternatives, etc.)
  if (intent.category === 'action_trigger') {
    const category = intent.extractedEntities.category;
    let supplierName = intent.extractedEntities.supplierName;
    const isFindAlternatives = intent.subIntent === 'find_alternatives';

    // If supplier name is specified (or inferred), find that supplier and similar ones
    if (isFindAlternatives) {
      baseResponse.widget = undefined;
      baseResponse.artifact = undefined;
      const allSuppliers = await getAllSuppliers();
      if (!supplierName) {
        const queryLower = query.toLowerCase();
        const matchedSupplier = allSuppliers.find(s =>
          queryLower.includes(s.name.toLowerCase())
        );
        if (matchedSupplier) {
          supplierName = matchedSupplier.name;
        }
      }

      const targetSupplier = allSuppliers.find(s =>
        supplierName
          ? s.name.toLowerCase().includes(supplierName.toLowerCase()) ||
            supplierName.toLowerCase().includes(s.name.toLowerCase())
          : false
      );

      if (targetSupplier) {
        // Find alternatives in same category with lower risk
        const alternatives = allSuppliers.filter(s =>
          s.id !== targetSupplier.id &&
          s.category === targetSupplier.category &&
          (s.srs?.score || 100) < (targetSupplier.srs?.score || 0)
        );

        // If no lower-risk alternatives, show all in same category
        const suppliersToShow = alternatives.length > 0
          ? alternatives
          : allSuppliers.filter(s => s.id !== targetSupplier.id && s.category === targetSupplier.category);

        baseResponse.suppliers = suppliersToShow.length > 0 ? suppliersToShow : [targetSupplier];
        baseResponse.widget = {
          type: 'supplier_table',
          title: `Alternatives to ${targetSupplier.name}`,
          data: {
            suppliers: transformSuppliersForWidget(suppliersToShow.length > 0 ? suppliersToShow : [targetSupplier]),
            totalCount: suppliersToShow.length || 1,
            filters: { category: targetSupplier.category },
          },
        };
        baseResponse.artifact = { type: 'supplier_table', title: 'Supplier Alternatives' };

        if (!baseResponse.content || baseResponse.content.includes("I'd be happy to help")) {
          if (suppliersToShow.length > 0) {
            baseResponse.content = `Found **${suppliersToShow.length} potential alternative(s)** to ${targetSupplier.name} in the ${targetSupplier.category} category.`;
          } else {
            baseResponse.content = `No direct alternatives found for ${targetSupplier.name} in your portfolio. Consider expanding your supplier base in the ${targetSupplier.category} category.`;
          }
        }
      } else {
        // Supplier not found - show message
        if (!baseResponse.content || baseResponse.content.includes("I'd be happy to help")) {
          baseResponse.content = supplierName
            ? `I couldn't find "${supplierName}" in your portfolio. Would you like me to show high-risk suppliers that may need alternatives?`
            : 'I could not match a supplier name, so I pulled high-risk suppliers that may need alternatives.';
        }
        const highRisk = await getHighRiskSuppliers();
        baseResponse.suppliers = highRisk;
        if (highRisk.length > 0) {
          baseResponse.widget = {
            type: 'supplier_table',
            title: 'High-Risk Suppliers',
            data: {
              suppliers: transformSuppliersForWidget(highRisk),
              totalCount: highRisk.length,
              filters: { riskLevel: 'high' },
            },
          };
          baseResponse.artifact = { type: 'supplier_table', title: 'Supplier Alternatives' };
        }
      }
    } else if (!baseResponse.widget) {
      // Original logic for category-based or general action triggers
      let suppliers = await getHighRiskSuppliers();

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
const generateFallbackResponse = async (intent: DetectedIntent, query: string): Promise<GeminiResponse> => {
  const portfolio = await getPortfolioSummary();

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
      const filters: Record<string, string | string[]> = {};
      if (intent.extractedEntities.riskLevel) {
        filters.riskLevel = intent.extractedEntities.riskLevel;
      }
      const suppliers = await filterSuppliers(filters);
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
      const allSuppliers = await getAllSuppliers();
      const riskChangesData = await getRecentRiskChanges();
      const suppliersWithChanges = riskChangesData.map(change => {
        const supplier = allSuppliers.find(s => s.id === change.supplierId);
        return supplier;
      }).filter(Boolean) as Supplier[];

      const worsened = riskChangesData.filter(c => c.direction === 'worsened');
      const critical = worsened.length > 0 ? worsened[0] : null;

      return {
        content: `**${riskChangesData.length} suppliers** had risk score changes recently.${critical ? ` ${critical.supplierName}'s increase to ${critical.currentScore} (${critical.currentLevel}) requires attention.` : ''}`,
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
            changes: riskChangesData,
            suppliers: suppliersWithChanges,
          },
        },
        artifact: { type: 'supplier_table', title: 'Risk Changes' },
        intent,
      };
    }

    case 'supplier_deep_dive': {
      // Try to extract supplier name from query
      const allSuppliers = await getAllSuppliers();
      const supplierNames = allSuppliers.map(s => s.name.toLowerCase());
      const matchedSupplier = supplierNames.find(name =>
        query.toLowerCase().includes(name) || name.includes(query.toLowerCase())
      );

      if (matchedSupplier) {
        const supplier = await getSupplierByName(matchedSupplier);
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
      const category = intent.extractedEntities.category;
      let supplierName = intent.extractedEntities.supplierName;
      const isFindAlternatives = intent.subIntent === 'find_alternatives';
      let suppliers: Supplier[] = [];
      let title = 'High-Risk Suppliers';
      let content = '';

      // If supplier name is specified, find alternatives for that supplier
      if (isFindAlternatives) {
        const allSuppliers = await getAllSuppliers();
        if (!supplierName) {
          const queryLower = query.toLowerCase();
          const matchedSupplier = allSuppliers.find(s =>
            queryLower.includes(s.name.toLowerCase())
          );
          if (matchedSupplier) {
            supplierName = matchedSupplier.name;
          }
        }

        const targetSupplier = allSuppliers.find(s =>
          supplierName
            ? s.name.toLowerCase().includes(supplierName.toLowerCase()) ||
              supplierName.toLowerCase().includes(s.name.toLowerCase())
            : false
        );

        if (targetSupplier) {
          // Find alternatives in same category with lower risk
          const alternatives = allSuppliers.filter(s =>
            s.id !== targetSupplier.id &&
            s.category === targetSupplier.category &&
            (s.srs?.score || 100) < (targetSupplier.srs?.score || 0)
          );

          suppliers = alternatives.length > 0
            ? alternatives
            : allSuppliers.filter(s => s.id !== targetSupplier.id && s.category === targetSupplier.category);

          title = `Alternatives to ${targetSupplier.name}`;
          content = suppliers.length > 0
            ? `Found **${suppliers.length} potential alternative(s)** to ${targetSupplier.name} in the ${targetSupplier.category} category.`
            : `No direct alternatives found for ${targetSupplier.name} in your portfolio. Consider expanding your supplier base in the ${targetSupplier.category} category.`;

          if (suppliers.length === 0) {
            suppliers = [targetSupplier];
          }
        } else {
          // Supplier not found
          suppliers = await getHighRiskSuppliers();
          content = supplierName
            ? `I couldn't find "${supplierName}" in your portfolio. Here are high-risk suppliers that may need alternatives.`
            : 'I could not match a supplier name, so I pulled high-risk suppliers that may need alternatives.';
        }
      } else {
        // Original logic for category-based or general action triggers
        suppliers = await getHighRiskSuppliers();

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

        // If no high-risk in category, show all in category
        if (suppliers.length === 0 && category) {
          const allSuppliers = await getAllSuppliers();
          suppliers = allSuppliers.filter(s =>
            s.category?.toLowerCase().includes(category.toLowerCase())
          );
        }

        // Fallback to all high-risk
        if (suppliers.length === 0) {
          suppliers = await getHighRiskSuppliers();
        }

        title = category ? `${category} Suppliers` : 'High-Risk Suppliers';
        const subIntent = intent.subIntent;
        const actionText = subIntent === 'find_alternatives'
          ? 'Here are the high-risk suppliers you may want to find alternatives for'
          : 'Here are the suppliers requiring action';
        content = `${actionText}. ${suppliers.length > 0 ? `I found **${suppliers.length}** supplier(s)${category ? ` in ${category}` : ''} to review.` : 'No matching suppliers found.'}`;
      }

      return {
        content,
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
          title,
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

    case 'explanation_why': {
      // Handle unrated queries
      const queryLower = query.toLowerCase();
      if (queryLower.includes('unrated')) {
        const portfolio = await getPortfolioSummary();
        const unratedCount = portfolio.distribution.unrated;
        const allSuppliers = await getAllSuppliers();
        const unratedSuppliers = allSuppliers.filter(s => !s.srs?.score || s.srs.level === 'unrated');

        return {
          content: `You have **${unratedCount} unrated suppliers**. Suppliers are typically unrated when they're newly added to your portfolio, haven't been assessed by our risk intelligence partners, or don't have sufficient public data for scoring. Consider requesting assessments for critical suppliers.`,
          responseType: 'table',
          acknowledgement: generateAcknowledgement(intent, query),
          suggestions: [
            { id: '1', text: 'Request risk assessment', icon: 'alert' },
            { id: '2', text: 'Show high-risk suppliers', icon: 'search' },
            { id: '3', text: 'View portfolio overview', icon: 'chart' },
          ],
          suppliers: unratedSuppliers,
          portfolio,
          widget: {
            type: 'supplier_table',
            title: 'Unrated Suppliers',
            data: {
              suppliers: transformSuppliersForWidget(unratedSuppliers),
              totalCount: unratedSuppliers.length,
              filters: { riskLevel: 'unrated' },
            },
          },
          artifact: { type: 'supplier_table', title: 'Unrated Suppliers', filters: { riskLevel: 'unrated' } },
          intent,
        };
      }

      // Generic explanation fallback
      return {
        content: "I can help explain risk scores, supplier ratings, and portfolio metrics. Could you be more specific about what you'd like me to explain?",
        responseType: 'summary',
        acknowledgement: generateAcknowledgement(intent, query),
        suggestions: [
          { id: '1', text: 'Show portfolio overview', icon: 'chart' },
          { id: '2', text: 'How are scores calculated?', icon: 'lightbulb' },
          { id: '3', text: 'Which factors matter most?', icon: 'search' },
        ],
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
