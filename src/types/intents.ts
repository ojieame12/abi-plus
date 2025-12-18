// Intent classification types based on spec

export type IntentCategory =
  | 'portfolio_overview'    // A: "What's my risk exposure?"
  | 'filtered_discovery'    // B: "Show high-risk suppliers in Europe"
  | 'supplier_deep_dive'    // C: "Tell me about Apple Inc"
  | 'trend_detection'       // D: "Any risk changes recently?"
  | 'explanation_why'       // E: "Why is this score?"
  | 'action_trigger'        // F: "Find alternatives for Apple"
  | 'comparison'            // G: "Compare these suppliers"
  | 'setup_config'          // H: "Set up alerts"
  | 'reporting_export'      // I: "Generate a report"
  | 'market_context'        // Market research triggers
  | 'restricted_query'      // X: Needs dashboard handoff
  | 'general';              // Fallback for unclear intents

// Sub-intents for more granular routing
export type SubIntent =
  // Portfolio sub-intents
  | 'overall_summary'       // A1: General overview
  | 'spend_weighted'        // A2: Dollar exposure
  | 'by_dimension'          // A3: By category/region
  | 'benchmark'             // A4: Peer comparison → triggers research
  // Discovery sub-intents
  | 'by_risk_level'         // B1
  | 'by_risk_factor'        // B2
  | 'by_attribute'          // B3
  | 'compound_filter'       // B4
  // Supplier sub-intents
  | 'supplier_overview'     // C1
  | 'score_inquiry'         // C2
  | 'news_events'           // C3 → triggers research
  | 'industry_context'      // C4 → triggers research
  | 'historical'            // C5
  // Trend sub-intents
  | 'recent_changes'        // D1
  | 'change_direction'      // D2
  | 'why_changed'           // D3 → may trigger research
  | 'projections'           // D4 → triggers research
  // Action sub-intents
  | 'find_alternatives'     // F1 → triggers discovery module
  | 'mitigation_plan'       // F2
  | 'communication_help'    // F3
  | 'strategic_advice'      // F4 → triggers research
  | 'none';

export type ResponseType =
  | 'summary'      // Type A: Text-heavy, optional inline metrics
  | 'widget'       // Type B: Structured data card in chat
  | 'table'        // Type C: Tabular data with artifact expansion
  | 'alert'        // Type D: Proactive change notification
  | 'handoff';     // Type E: Restricted data, link to dashboard

export type ArtifactType =
  | 'supplier_table'      // List view with filters
  | 'supplier_detail'     // Single supplier tabbed view
  | 'comparison'          // Multi-supplier comparison
  | 'portfolio_dashboard' // Overview with charts
  | 'none';               // No artifact needed

export type WidgetType =
  | 'risk_score_badge'
  | 'risk_distribution_chart'
  | 'supplier_risk_card'
  | 'trend_change_indicator'
  | 'supplier_mini_table'
  | 'action_confirmation';

// Intent detection result
export interface DetectedIntent {
  category: IntentCategory;
  subIntent: SubIntent;
  confidence: number; // 0-1
  responseType: ResponseType;
  artifactType: ArtifactType;
  extractedEntities: {
    supplierName?: string;
    supplierNames?: string[];  // For comparison
    riskLevel?: string;
    region?: string;
    category?: string;
    timeframe?: string;
    action?: string;
  };
  // Routing flags
  requiresHandoff: boolean;
  handoffReason?: string;
  requiresResearch: boolean;  // Should auto-trigger Perplexity
  researchContext?: string;   // What to research
  requiresDiscovery: boolean; // Should bridge to Supplier Discovery
  // Response escalation
  suggestedResultCount?: number; // Hint for widget vs artifact decision
}

// Suggestion types for different contexts
export interface ContextualSuggestion {
  id: string;
  text: string;
  icon: 'chart' | 'search' | 'lightbulb' | 'document' | 'message' | 'alert' | 'compare';
  intent: IntentCategory;
  priority: number; // 1 = highest
}

// Suggestions by context
export const ENTRY_POINT_SUGGESTIONS: ContextualSuggestion[] = [
  { id: '1', text: 'Show my risk overview', icon: 'chart', intent: 'portfolio_overview', priority: 1 },
  { id: '2', text: 'Any risk changes recently?', icon: 'alert', intent: 'trend_detection', priority: 2 },
  { id: '3', text: 'Which suppliers are high risk?', icon: 'search', intent: 'filtered_discovery', priority: 3 },
  { id: '4', text: 'Add suppliers to monitor', icon: 'document', intent: 'action_trigger', priority: 4 },
];

export const POST_OVERVIEW_SUGGESTIONS: ContextualSuggestion[] = [
  { id: '1', text: 'Show high-risk suppliers', icon: 'search', intent: 'filtered_discovery', priority: 1 },
  { id: '2', text: 'Why are 10 suppliers unrated?', icon: 'lightbulb', intent: 'general', priority: 2 },
  { id: '3', text: 'Set up risk alerts', icon: 'alert', intent: 'action_trigger', priority: 3 },
];

export const POST_FILTER_SUGGESTIONS: ContextualSuggestion[] = [
  { id: '1', text: 'Compare these suppliers', icon: 'compare', intent: 'supplier_deep_dive', priority: 1 },
  { id: '2', text: 'Find alternatives for highest risk', icon: 'search', intent: 'action_trigger', priority: 2 },
  { id: '3', text: 'Export this list', icon: 'document', intent: 'action_trigger', priority: 3 },
];

export const POST_SUPPLIER_DETAIL_SUGGESTIONS: ContextualSuggestion[] = [
  { id: '1', text: 'Why this risk level?', icon: 'lightbulb', intent: 'restricted_query', priority: 1 },
  { id: '2', text: 'Show risk history', icon: 'chart', intent: 'trend_detection', priority: 2 },
  { id: '3', text: 'Find alternatives', icon: 'search', intent: 'action_trigger', priority: 3 },
];

// Intent patterns for classification
export const INTENT_PATTERNS: Record<IntentCategory, RegExp[]> = {
  portfolio_overview: [
    /risk (exposure|overview|summary|posture)/i,
    /how.*(risk|portfolio)/i,
    /show.*(my|me).*(risk|portfolio)/i,
    /what('?s| is) my.*risk/i,
    /how many.*(supplier|high risk)/i,
  ],
  filtered_discovery: [
    /show.*(supplier|high|medium|low)/i,
    /which supplier/i,
    /list.*(supplier|high|risk)/i,
    /filter.*by/i,
    /supplier.*(in|with|from)/i,
    /(high|medium|low).risk.supplier/i,
  ],
  supplier_deep_dive: [
    /tell me about/i,
    /what('?s| is) the.*(score|risk).*(for|of)/i,
    /show me.*detail/i,
    /(view|see|look at).*supplier/i,
    /profile (for|of)/i,
  ],
  trend_detection: [
    /what.*changed/i,
    /recent.*change/i,
    /moved.*(to|from)/i,
    /trend/i,
    /worsening|improving/i,
    /this (week|month)/i,
    /any.*alert/i,
  ],
  explanation_why: [
    /why.*(high|low|medium|risk|score)/i,
    /what('?s| is) (driving|causing)/i,
    /explain.*(score|risk)/i,
    /how.*(calculated|computed)/i,
    /what.*factors/i,
  ],
  action_trigger: [
    /find alternative/i,
    /what.*(should|can) i do/i,
    /help me.*(mitigate|reduce)/i,
    /create.*(plan|workflow)/i,
  ],
  comparison: [
    /compare/i,
    /versus|vs\.?/i,
    /which.*(safer|better|riskier)/i,
    /side by side/i,
    /rank.*(supplier|by)/i,
  ],
  setup_config: [
    /set.?up.*alert/i,
    /add.*supplier/i,
    /configure/i,
    /import/i,
    /follow/i,
    /unfollow/i,
  ],
  reporting_export: [
    /export/i,
    /download/i,
    /generate.*(report|summary)/i,
    /create.*presentation/i,
    /summarize.*for/i,
  ],
  market_context: [
    /what('?s| is) happening.*(market|industry|sector)/i,
    /any news/i,
    /market.*(event|condition|trend)/i,
    /industry.*(trend|outlook|risk)/i,
    /is this normal/i,
    /how.*(compare|benchmark)/i,
    /geopolitical/i,
    /supply chain.*(disruption|issue)/i,
  ],
  restricted_query: [
    /breakdown.*score/i,
    /factor.*(score|detail|breakdown)/i,
    /show.*individual.*factor/i,
    /specific.*(score|rating)/i,
  ],
  general: [], // Fallback, no specific patterns
};

// Patterns that trigger automatic research (Perplexity)
export const RESEARCH_TRIGGERS: RegExp[] = [
  /what('?s| is) happening/i,
  /any news/i,
  /in the news/i,
  /market.*(event|condition|trend|outlook)/i,
  /industry.*(trend|outlook|risk|average|normal)/i,
  /is this normal/i,
  /how.*(compare|benchmark).*peer/i,
  /geopolitical/i,
  /supply chain.*(disruption|issue)/i,
  /what.*(might|could|will).*change/i,
  /forecast|predict|projection/i,
  /regulatory|compliance.*news/i,
  /what.*(others|peers|companies) do/i,
  /best practice/i,
];

// Check if query should trigger deep research
const shouldTriggerResearch = (query: string): { trigger: boolean; context?: string } => {
  for (const pattern of RESEARCH_TRIGGERS) {
    if (pattern.test(query)) {
      return { trigger: true, context: query };
    }
  }
  return { trigger: false };
};

// Detect sub-intent for granular routing
const detectSubIntent = (query: string, category: IntentCategory): SubIntent => {
  const q = query.toLowerCase();

  switch (category) {
    case 'portfolio_overview':
      if (/spend|dollar|exposure/i.test(q)) return 'spend_weighted';
      if (/by.*(category|region|location)/i.test(q)) return 'by_dimension';
      if (/compare.*peer|benchmark|normal/i.test(q)) return 'benchmark';
      return 'overall_summary';

    case 'supplier_deep_dive':
      if (/news|event|happening/i.test(q)) return 'news_events';
      if (/industry|market|sector/i.test(q)) return 'industry_context';
      if (/history|historical|over time/i.test(q)) return 'historical';
      if (/score/i.test(q)) return 'score_inquiry';
      return 'supplier_overview';

    case 'trend_detection':
      if (/why.*change/i.test(q)) return 'why_changed';
      if (/might|could|will|predict|forecast/i.test(q)) return 'projections';
      if (/worsen|improv/i.test(q)) return 'change_direction';
      return 'recent_changes';

    case 'action_trigger':
      if (/alternative/i.test(q)) return 'find_alternatives';
      if (/plan|strategy/i.test(q)) return 'mitigation_plan';
      if (/explain|present|stakeholder/i.test(q)) return 'communication_help';
      return 'none';

    default:
      return 'none';
  }
};

// Function to classify intent
export const classifyIntent = (query: string): DetectedIntent => {
  const normalizedQuery = query.toLowerCase().trim();

  // Check for research triggers first
  const researchCheck = shouldTriggerResearch(normalizedQuery);

  // Check each intent category
  for (const [category, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        const intentCategory = category as IntentCategory;
        const subIntent = detectSubIntent(normalizedQuery, intentCategory);

        // Determine if this sub-intent needs research
        const needsResearch = researchCheck.trigger ||
          subIntent === 'benchmark' ||
          subIntent === 'news_events' ||
          subIntent === 'industry_context' ||
          subIntent === 'projections' ||
          subIntent === 'strategic_advice' ||
          intentCategory === 'market_context';

        // Determine if needs discovery module
        const needsDiscovery = subIntent === 'find_alternatives' ||
          /find.*(supplier|alternative|option)/i.test(normalizedQuery);

        return {
          category: intentCategory,
          subIntent,
          confidence: 0.85,
          responseType: getResponseTypeForIntent(intentCategory),
          artifactType: getArtifactTypeForIntent(intentCategory),
          extractedEntities: extractEntities(normalizedQuery),
          requiresHandoff: intentCategory === 'restricted_query',
          handoffReason: intentCategory === 'restricted_query'
            ? 'Detailed factor scores require dashboard access due to partner data restrictions.'
            : undefined,
          requiresResearch: needsResearch,
          researchContext: needsResearch ? researchCheck.context || normalizedQuery : undefined,
          requiresDiscovery: needsDiscovery,
        };
      }
    }
  }

  // Fallback to general
  return {
    category: 'general',
    subIntent: 'none',
    confidence: 0.5,
    responseType: 'summary',
    artifactType: 'none',
    extractedEntities: extractEntities(normalizedQuery),
    requiresHandoff: false,
    requiresResearch: researchCheck.trigger,
    researchContext: researchCheck.context,
    requiresDiscovery: false,
  };
};

const getResponseTypeForIntent = (intent: IntentCategory): ResponseType => {
  switch (intent) {
    case 'portfolio_overview': return 'widget';
    case 'filtered_discovery': return 'table';
    case 'supplier_deep_dive': return 'widget';
    case 'trend_detection': return 'alert';
    case 'explanation_why': return 'summary';
    case 'action_trigger': return 'summary';
    case 'comparison': return 'table';
    case 'setup_config': return 'summary';
    case 'reporting_export': return 'summary';
    case 'market_context': return 'summary';
    case 'restricted_query': return 'handoff';
    default: return 'summary';
  }
};

const getArtifactTypeForIntent = (intent: IntentCategory): ArtifactType => {
  switch (intent) {
    case 'portfolio_overview': return 'portfolio_dashboard';
    case 'filtered_discovery': return 'supplier_table';
    case 'supplier_deep_dive': return 'supplier_detail';
    case 'trend_detection': return 'supplier_table';
    case 'explanation_why': return 'supplier_detail';
    case 'action_trigger': return 'none';
    case 'comparison': return 'comparison';
    case 'setup_config': return 'none';
    case 'reporting_export': return 'none';
    case 'market_context': return 'none';
    case 'restricted_query': return 'supplier_detail';
    default: return 'none';
  }
};

const extractEntities = (query: string): DetectedIntent['extractedEntities'] => {
  const entities: DetectedIntent['extractedEntities'] = {};

  // Extract risk level
  const riskMatch = query.match(/(high|medium-high|medium|low)\s*risk/i);
  if (riskMatch) entities.riskLevel = riskMatch[1].toLowerCase();

  // Extract region
  const regionPatterns = {
    'North America': /north america|usa|us|united states|canada|mexico/i,
    'Europe': /europe|eu|uk|germany|france|belgium/i,
    'Asia Pacific': /asia|apac|china|japan|india|singapore|thailand|vietnam/i,
    'Latin America': /latin america|south america|brazil|chile/i,
  };
  for (const [region, pattern] of Object.entries(regionPatterns)) {
    if (pattern.test(query)) {
      entities.region = region;
      break;
    }
  }

  // Extract action
  const actionMatch = query.match(/(find|create|export|download|compare|follow|unfollow|set.?up)/i);
  if (actionMatch) entities.action = actionMatch[1].toLowerCase();

  return entities;
};
