// Widget Router - Deterministic mapping from Intent to Widget Type
// The widget type is determined by intent, AI only generates content
// NOTE: This now uses widgetRegistry.ts as the source of truth for mappings

import type { IntentCategory, SubIntent, ArtifactType } from '../types/intents';
import type { WidgetType } from '../types/widgets';
import { getWidgetsForIntent, type WidgetRegistryEntry } from './widgetRegistry';

// ============================================
// INTENT TO WIDGET TYPE MAPPING
// ============================================

export interface WidgetRoute {
  widgetType: WidgetType;
  artifactType: string;
  requiresSuppliers: boolean;
  requiresPortfolio: boolean;
  requiresRiskChanges: boolean;
  requiresHandoff?: boolean;
}

// Primary widget for each intent category
// Artifact types must match registry: insight_detail, trend_analysis, factor_breakdown, news_events,
// supplier_detail, supplier_comparison, supplier_table, supplier_alternatives,
// alert_config, export_builder, watchlist_manage, assessment_request,
// category_overview, portfolio_dashboard, regional_analysis, spend_analysis
const DEFAULT_ROUTE: WidgetRoute = {
  widgetType: 'none',
  artifactType: 'portfolio_dashboard',
  requiresSuppliers: false,
  requiresPortfolio: false,
  requiresRiskChanges: false,
};

const INTENT_WIDGET_MAP: Partial<Record<IntentCategory, WidgetRoute>> = {
  portfolio_overview: {
    widgetType: 'risk_distribution',
    artifactType: 'portfolio_dashboard',
    requiresSuppliers: false,
    requiresPortfolio: true,
    requiresRiskChanges: false,
  },
  filtered_discovery: {
    widgetType: 'supplier_table',
    artifactType: 'supplier_table',
    requiresSuppliers: true,
    requiresPortfolio: false,
    requiresRiskChanges: false,
  },
  supplier_deep_dive: {
    widgetType: 'supplier_risk_card',
    artifactType: 'supplier_detail',
    requiresSuppliers: true,
    requiresPortfolio: false,
    requiresRiskChanges: false,
  },
  trend_detection: {
    widgetType: 'alert_card',
    artifactType: 'trend_analysis',
    requiresSuppliers: true,
    requiresPortfolio: false,
    requiresRiskChanges: true,
  },
  comparison: {
    widgetType: 'comparison_table',
    artifactType: 'supplier_comparison',
    requiresSuppliers: true,
    requiresPortfolio: false,
    requiresRiskChanges: false,
  },
  action_trigger: {
    widgetType: 'supplier_table',
    artifactType: 'supplier_alternatives',
    requiresSuppliers: true,
    requiresPortfolio: false,
    requiresRiskChanges: false,
  },
  explanation_why: {
    widgetType: 'supplier_table',
    artifactType: 'factor_breakdown',
    requiresSuppliers: true,
    requiresPortfolio: true,
    requiresRiskChanges: false,
  },
  market_context: {
    widgetType: 'none', // Price gauges not implemented yet - use text response
    artifactType: 'news_events',
    requiresSuppliers: false,
    requiresPortfolio: false,
    requiresRiskChanges: false,
  },
  setup_config: {
    widgetType: 'none',
    artifactType: 'alert_config',
    requiresSuppliers: false,
    requiresPortfolio: false,
    requiresRiskChanges: false,
  },
  reporting_export: {
    widgetType: 'none',
    artifactType: 'export_builder',
    requiresSuppliers: false,
    requiresPortfolio: false,
    requiresRiskChanges: false,
  },
  restricted_query: {
    widgetType: 'none', // No widget, just handoff message
    artifactType: 'supplier_detail',
    requiresSuppliers: false,
    requiresPortfolio: false,
    requiresRiskChanges: false,
    requiresHandoff: true,
  },
  general: {
    ...DEFAULT_ROUTE,
  },
};

// Sub-intent overrides (more specific routing)
const SUBINTENT_OVERRIDES: Partial<Record<SubIntent, Partial<WidgetRoute>>> = {
  find_alternatives: {
    widgetType: 'alternatives_preview',
    artifactType: 'supplier_alternatives',
    requiresSuppliers: true,
  },
  news_events: {
    widgetType: 'events_feed',
    artifactType: 'none',
  },
  spend_weighted: {
    widgetType: 'spend_exposure',
    artifactType: 'portfolio_dashboard',
    requiresPortfolio: true,
  },
  by_dimension: {
    widgetType: 'category_breakdown',
    artifactType: 'portfolio_dashboard',
    requiresPortfolio: true,
    requiresSuppliers: true,
  },
};

// ============================================
// ROUTER FUNCTION
// ============================================

export function getWidgetRoute(
  intent: IntentCategory,
  subIntent?: SubIntent
): WidgetRoute {
  // Start with base intent mapping
  const baseRoute = INTENT_WIDGET_MAP[intent] ?? INTENT_WIDGET_MAP.general ?? DEFAULT_ROUTE;

  // Apply sub-intent override if exists
  if (subIntent && SUBINTENT_OVERRIDES[subIntent]) {
    return {
      ...baseRoute,
      ...SUBINTENT_OVERRIDES[subIntent],
    };
  }

  return baseRoute;
}

// ============================================
// CONTENT SLOTS - What AI needs to generate
// ============================================

export interface AIContentSlots {
  // Greeting/acknowledgement shown above the response body
  acknowledgement?: string;

  // Main narrative (1-2 sentences before widget)
  narrative: string;

  // Widget-specific content
  widgetContent: {
    headline: string;      // Key insight in 5-10 words
    summary: string;       // 2-3 sentence explanation
    type: 'risk_alert' | 'opportunity' | 'info' | 'action_required';
    sentiment: 'positive' | 'negative' | 'neutral';
    factors?: Array<{
      title: string;
      detail: string;
      impact: 'positive' | 'negative' | 'neutral';
    }>;
  };

  // Expanded artifact panel content (matches prompt schema)
  artifactContent: {
    title: string;
    overview: string;              // 1-2 paragraph explanation
    keyPoints: string[];           // Key bullet points
    recommendations?: string[];    // Recommended actions
  };

  // Follow-up suggestions
  followUps: string[];

  // Researched company data (for external suppliers not in our database)
  researchedCompany?: {
    name: string;
    category: string;
    industry: string;
    headquarters: { city: string; country: string; region: string };
    overview: string;
    keyFactors: Array<{ name: string; impact: 'positive' | 'negative' | 'neutral' }>;
  };
}

// ============================================
// PROMPT TEMPLATE FOR CONTENT GENERATION
// ============================================

export function buildContentPrompt(
  widgetType: WidgetType,
  dataContext: string
): string {
  return `You are generating content for a ${widgetType} widget display.

## Your Task
Generate ONLY the content to populate the widget and surrounding UI. The widget type is already determined - you just need to provide the content.

## Data Context
${dataContext}

## Required Output (JSON)
\`\`\`json
{
  "narrative": "1-2 sentences introducing the data, NOT repeating what the widget shows",
  "widgetContent": {
    "headline": "Key insight in 5-10 words",
    "summary": "2-3 sentence explanation of what this means",
    "sentiment": "positive|negative|neutral",
    "factors": [
      { "title": "Factor Name", "detail": "Specific explanation", "impact": "positive|negative|neutral" }
    ]
  },
  "artifactContent": {
    "title": "Panel Title",
    "overview": "1-2 paragraph deep-dive explanation of the data and context",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
    "recommendations": ["Action 1", "Action 2"]
  },
  "followUps": ["Question 1?", "Question 2?", "Question 3?"]
}
\`\`\`

## Guidelines
- narrative: Brief intro, don't duplicate widget data
- headline: Most important takeaway
- summary: What it means and what to do about it
- factors: 2-4 contributing factors with their impact
- artifactContent: Deep-dive analysis for expanded panel with overview, key points, and recommendations
- followUps: 3 relevant next questions

Respond with ONLY the JSON, no other text.`;
}

// ============================================
// REGISTRY-BASED ROUTING (NEW)
// Uses unified widgetRegistry.ts as source of truth
// ============================================

/**
 * Get widget route from registry
 * Returns widget type and metadata based on intent
 */
export function getWidgetRouteFromRegistry(
  intent: IntentCategory,
  subIntent?: SubIntent
): WidgetRoute {
  // Get all widgets that handle this intent
  const widgets = getWidgetsForIntent(intent);

  if (widgets.length === 0) {
    // Fallback to general/none
    return {
      widgetType: 'none',
      artifactType: 'portfolio_dashboard',
      requiresSuppliers: false,
      requiresPortfolio: false,
      requiresRiskChanges: false,
    };
  }

  // If subIntent specified, find matching widget
  let selectedWidget: WidgetRegistryEntry | undefined;
  if (subIntent) {
    selectedWidget = widgets.find(w => w.subIntents?.includes(subIntent));
  }

  // Fall back to highest priority widget for this intent
  // When no subIntent is specified (or 'none'), prefer widgets without subIntent restrictions
  if (!selectedWidget) {
    // Filter to compatible widgets based on subIntent
    const compatibleWidgets = widgets.filter(w => {
      // If widget has specific subIntent requirements
      if (w.subIntents && w.subIntents.length > 0) {
        // Only include if the subIntent matches one of its requirements
        return subIntent && subIntent !== 'none' && w.subIntents.includes(subIntent);
      }
      // Widget has no subIntent restrictions - it's a default option for this intent
      return true;
    });

    selectedWidget = compatibleWidgets.sort((a, b) => b.priority - a.priority)[0];

    // If still no match (all widgets had subIntent requirements), fall back to any widget
    if (!selectedWidget) {
      selectedWidget = widgets.sort((a, b) => b.priority - a.priority)[0];
    }
  }

  return {
    widgetType: selectedWidget.type,
    artifactType: (selectedWidget.artifactType || 'none') as ArtifactType,
    // Include 'supplier' (singular) as well - widgets that need a single supplier still need the supplier lookup
    requiresSuppliers: selectedWidget.requiredData.includes('suppliers') || selectedWidget.requiredData.includes('supplier'),
    requiresPortfolio: selectedWidget.requiredData.includes('portfolio'),
    requiresRiskChanges: selectedWidget.requiredData.includes('riskChanges'),
    requiresHandoff: intent === 'restricted_query',
  };
}

/**
 * Get all widgets available for an intent (for debugging/documentation)
 */
export function getAvailableWidgetsForIntent(intent: IntentCategory): WidgetRegistryEntry[] {
  return getWidgetsForIntent(intent);
}
