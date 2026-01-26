// Response Validator - Validates and repairs canonical responses
// Ensures all responses have required fields before rendering

import type {
  CanonicalResponse,
  ValidationResult,
  ResponseSources,
  CanonicalSuggestion,
} from '../types/responseSchema';
import type { DetectedIntent, IntentCategory } from '../types/intents';

// ============================================
// VALIDATION
// ============================================

/**
 * Validate a response object against the canonical schema
 */
export function validateResponse(response: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof response !== 'object' || response === null) {
    return {
      valid: false,
      errors: ['response is not an object'],
      repaired: false,
      original: response,
    };
  }

  const r = response as Record<string, unknown>;

  // Required fields
  if (typeof r.id !== 'string' || !r.id) {
    errors.push('missing id');
  }

  if (typeof r.acknowledgement !== 'string' || !r.acknowledgement) {
    errors.push('missing acknowledgement');
  }

  if (typeof r.narrative !== 'string') {
    errors.push('missing narrative');
  }

  if (typeof r.provider !== 'string' || !['gemini', 'perplexity', 'local'].includes(r.provider)) {
    errors.push('invalid provider');
  }

  // Optional field validation
  if (r.widget !== undefined) {
    if (typeof r.widget !== 'object' || r.widget === null) {
      errors.push('invalid widget');
    } else {
      const w = r.widget as Record<string, unknown>;
      if (typeof w.type !== 'string') {
        errors.push('widget missing type');
      }
    }
  }

  if (r.suggestions !== undefined && !Array.isArray(r.suggestions)) {
    errors.push('suggestions must be an array');
  }

  if (r.sources !== undefined) {
    const s = r.sources as Record<string, unknown>;
    if (typeof s !== 'object' || !Array.isArray(s.web) || !Array.isArray(s.internal)) {
      errors.push('invalid sources format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    repaired: false,
    original: response,
  };
}

// ============================================
// REPAIR / DEFAULTS
// ============================================

/**
 * Generate a default acknowledgement based on intent
 */
export function generateDefaultAcknowledgement(intent?: DetectedIntent): string {
  if (!intent) {
    return "Here's what I found.";
  }

  const acknowledgements: Partial<Record<IntentCategory, string>> = {
    portfolio_overview: "Here's your portfolio overview.",
    filtered_discovery: "I found these suppliers for you.",
    supplier_deep_dive: "Here's the supplier profile.",
    trend_detection: "Here are the recent changes.",
    explanation_why: "Let me explain.",
    action_trigger: "Here are your options.",
    comparison: "Here's the comparison.",
    setup_config: "I can help with that.",
    reporting_export: "Generating your report.",
    market_context: "Here's the market context.",
    inflation_summary: "Here's the inflation update.",
    inflation_drivers: "Here's what's driving prices.",
    inflation_impact: "Here's the impact analysis.",
    inflation_justification: "Let me validate that price.",
    inflation_scenarios: "Here's the scenario analysis.",
    inflation_communication: "Here's your briefing.",
    inflation_benchmark: "Here's the benchmark data.",
    restricted_query: "I can help with some of that.",
    general: "Here's what I found.",
  };

  return acknowledgements[intent.category] || "Here's what I found.";
}

/**
 * Generate default follow-up suggestions based on intent
 */
export function generateDefaultSuggestions(intent?: DetectedIntent): CanonicalSuggestion[] {
  if (!intent) {
    return [
      { id: 'def-1', text: 'Tell me more', icon: 'message' },
      { id: 'def-2', text: 'Show related data', icon: 'chart' },
      { id: 'def-3', text: 'Export this information', icon: 'document' },
    ];
  }

  const suggestionMap: Partial<Record<IntentCategory, CanonicalSuggestion[]>> = {
    portfolio_overview: [
      { id: 'po-1', text: 'Show high-risk suppliers', icon: 'search' },
      { id: 'po-2', text: 'What changed recently?', icon: 'alert' },
      { id: 'po-3', text: 'Break down by category', icon: 'chart' },
    ],
    filtered_discovery: [
      { id: 'fd-1', text: 'Compare these suppliers', icon: 'compare' },
      { id: 'fd-2', text: 'Find alternatives', icon: 'search' },
      { id: 'fd-3', text: 'Export this list', icon: 'document' },
    ],
    supplier_deep_dive: [
      { id: 'sd-1', text: 'Why this risk level?', icon: 'lightbulb' },
      { id: 'sd-2', text: 'Show risk history', icon: 'chart' },
      { id: 'sd-3', text: 'Find alternatives', icon: 'search' },
    ],
    trend_detection: [
      { id: 'td-1', text: 'Why did this change?', icon: 'lightbulb' },
      { id: 'td-2', text: 'Show affected suppliers', icon: 'search' },
      { id: 'td-3', text: 'Set up alerts', icon: 'alert' },
    ],
    market_context: [
      { id: 'mc-1', text: 'How does this affect my portfolio?', icon: 'chart' },
      { id: 'mc-2', text: 'Show exposed suppliers', icon: 'search' },
      { id: 'mc-3', text: 'What should I do?', icon: 'lightbulb' },
    ],
    inflation_summary: [
      { id: 'is-1', text: 'Why did prices change?', icon: 'lightbulb' },
      { id: 'is-2', text: 'Show my exposure', icon: 'chart' },
      { id: 'is-3', text: 'Generate executive brief', icon: 'document' },
    ],
    inflation_drivers: [
      { id: 'id-1', text: 'How does this impact my spend?', icon: 'chart' },
      { id: 'id-2', text: 'What can I do about it?', icon: 'lightbulb' },
      { id: 'id-3', text: 'Show price forecast', icon: 'chart' },
    ],
  };

  return suggestionMap[intent.category] || [
    { id: 'def-1', text: 'Tell me more', icon: 'message' },
    { id: 'def-2', text: 'Show related data', icon: 'chart' },
    { id: 'def-3', text: 'What should I do next?', icon: 'lightbulb' },
  ];
}

/**
 * Normalize sources to ResponseSources format
 */
export function normalizeSources(sources: unknown): ResponseSources | undefined {
  // Already in correct format
  if (
    typeof sources === 'object' &&
    sources !== null &&
    'web' in sources &&
    'internal' in sources
  ) {
    const s = sources as ResponseSources & { citations?: Record<string, unknown>; confidence?: unknown };
    const result: ResponseSources = {
      web: s.web || [],
      internal: s.internal || [],
      totalWebCount: s.totalWebCount || s.web?.length || 0,
      totalInternalCount: s.totalInternalCount || s.internal?.length || 0,
    };
    // Preserve citations map if present (used for inline [B1], [W1] badges)
    if (s.citations && Object.keys(s.citations).length > 0) {
      (result as ResponseSources & { citations: Record<string, unknown> }).citations = s.citations;
    }
    // Preserve confidence if present
    if (s.confidence) {
      result.confidence = s.confidence as ResponseSources['confidence'];
    }
    return result;
  }

  // Array format (legacy Source[])
  if (Array.isArray(sources)) {
    const webSources = sources
      .filter((s): s is { title: string; url: string; favicon?: string } =>
        typeof s === 'object' && s !== null && 'url' in s
      )
      .map(s => ({
        title: s.title || 'Source',
        url: s.url,
        favicon: s.favicon,
      }));

    const internalSources = sources
      .filter((s): s is { title: string; type: 'database' | 'report' | 'analysis' } =>
        typeof s === 'object' && s !== null && !('url' in s) && 'type' in s
      );

    if (webSources.length === 0 && internalSources.length === 0) {
      return undefined;
    }

    return {
      web: webSources,
      internal: internalSources,
      totalWebCount: webSources.length,
      totalInternalCount: internalSources.length,
    };
  }

  return undefined;
}

/**
 * Repair a response by adding missing required fields
 */
export function repairResponse(
  response: unknown,
  intent?: DetectedIntent
): CanonicalResponse {
  const r = (typeof response === 'object' && response !== null)
    ? response as Record<string, unknown>
    : {};

  // Generate ID if missing
  const id = typeof r.id === 'string' && r.id
    ? r.id
    : `resp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Generate acknowledgement if missing
  const acknowledgement = typeof r.acknowledgement === 'string' && r.acknowledgement
    ? r.acknowledgement
    : generateDefaultAcknowledgement(intent);

  // Use content or narrative
  let narrative = '';
  if (typeof r.narrative === 'string' && r.narrative) {
    narrative = r.narrative;
  } else if (typeof r.content === 'string' && r.content) {
    narrative = r.content;
  } else {
    narrative = "I found relevant information for your query.";
  }

  // Determine provider
  let provider: 'gemini' | 'perplexity' | 'local' = 'local';
  if (r.provider === 'gemini' || r.provider === 'perplexity' || r.provider === 'local') {
    provider = r.provider;
  }

  // Build repaired response
  const repaired: CanonicalResponse = {
    id,
    acknowledgement,
    narrative,
    provider,
  };

  // Copy over optional fields if valid
  if (typeof r.headline === 'string' && r.headline) {
    repaired.headline = r.headline;
  }

  if (Array.isArray(r.bullets) && r.bullets.every(b => typeof b === 'string')) {
    repaired.bullets = r.bullets as string[];
  }

  if (
    typeof r.widget === 'object' &&
    r.widget !== null &&
    typeof (r.widget as Record<string, unknown>).type === 'string'
  ) {
    repaired.widget = r.widget as CanonicalResponse['widget'];
  }

  if (
    typeof r.insight === 'object' &&
    r.insight !== null &&
    typeof (r.insight as Record<string, unknown>).headline === 'string'
  ) {
    repaired.insight = r.insight as CanonicalResponse['insight'];
  }

  if (
    typeof r.artifactContent === 'object' &&
    r.artifactContent !== null &&
    typeof (r.artifactContent as Record<string, unknown>).title === 'string'
  ) {
    repaired.artifactContent = r.artifactContent as CanonicalResponse['artifactContent'];
  }

  // Handle suggestions
  if (Array.isArray(r.suggestions) && r.suggestions.length > 0) {
    repaired.suggestions = r.suggestions.map((s, i) => {
      if (typeof s === 'object' && s !== null) {
        const suggestion = s as Record<string, unknown>;
        return {
          id: typeof suggestion.id === 'string' ? suggestion.id : `sug-${i}`,
          text: typeof suggestion.text === 'string' ? suggestion.text : String(suggestion.text || ''),
          icon: typeof suggestion.icon === 'string' ? suggestion.icon : undefined,
        };
      }
      return { id: `sug-${i}`, text: String(s) };
    });
  } else {
    // Generate default suggestions
    repaired.suggestions = generateDefaultSuggestions(intent);
  }

  // Normalize sources
  const normalizedSources = normalizeSources(r.sources);
  if (normalizedSources) {
    repaired.sources = normalizedSources;
  }

  // Copy intent if present
  if (r.intent !== undefined && typeof r.intent === 'object') {
    repaired.intent = r.intent as DetectedIntent;
  } else if (intent) {
    repaired.intent = intent;
  }

  return repaired;
}

// ============================================
// VALIDATION + REPAIR COMBINED
// ============================================

/**
 * Validate and optionally repair a response
 * Returns the original if valid, or a repaired version if not
 */
export function validateAndRepair(
  response: unknown,
  intent?: DetectedIntent
): { response: CanonicalResponse; validation: ValidationResult } {
  const validation = validateResponse(response);

  if (validation.valid) {
    return {
      response: response as CanonicalResponse,
      validation,
    };
  }

  const repaired = repairResponse(response, intent);
  return {
    response: repaired,
    validation: {
      ...validation,
      repaired: true,
    },
  };
}
