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
  // Inflation Watch Categories
  | 'inflation_summary'     // "What changed this month?" - Price overview
  | 'inflation_drivers'     // "Why did steel go up?" - Root cause
  | 'inflation_impact'      // "How does this affect my spend?" - Portfolio exposure
  | 'inflation_justification' // "Validate this price increase" - Supplier negotiation
  | 'inflation_scenarios'   // "What if prices rise 10%?" - What-if modeling
  | 'inflation_communication' // "Help me explain this to leadership"
  | 'inflation_benchmark'   // "Is this normal for the market?"
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
  // Inflation sub-intents
  | 'monthly_changes'       // Inflation summary default
  | 'category_changes'      // Changes by commodity category
  | 'region_changes'        // Geographic price variations
  | 'top_movers'            // Biggest price changes
  | 'commodity_drivers'     // Why specific commodity changed
  | 'market_drivers'        // Macro factors
  | 'supplier_drivers'      // Supplier-specific factors
  | 'historical_drivers'    // Historical context
  | 'spend_impact'          // Dollar impact on portfolio
  | 'category_exposure'     // Exposure by category
  | 'supplier_exposure'     // Exposure by supplier
  | 'risk_correlation'      // Inflation + risk score correlation
  | 'validate_increase'     // Is this increase justified?
  | 'negotiate_support'     // Data for negotiation
  | 'market_fairness'       // Is price fair vs market?
  | 'price_forecast'        // Future price projections
  | 'what_if_increase'      // Model price increase scenarios
  | 'what_if_supplier'      // Model supplier switch scenarios
  | 'budget_impact'         // Budget planning scenarios
  | 'executive_brief'       // Summary for leadership
  | 'procurement_report'    // Detailed procurement report
  | 'supplier_letter'       // Communication to supplier
  | 'stakeholder_deck'      // Presentation materials
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
  // Inflation artifacts
  | 'inflation_dashboard'     // Full inflation overview
  | 'commodity_dashboard'     // Single commodity deep dive
  | 'driver_analysis'         // Driver breakdown analysis
  | 'impact_analysis'         // Portfolio impact analysis
  | 'justification_report'    // Price justification report
  | 'scenario_planner'        // What-if scenario planner
  | 'executive_presentation'  // Stakeholder communication
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
    commodity?: string;  // For inflation queries
    supplier?: string;   // Alternative to supplierName
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
  { id: '2', text: 'Why are 10 suppliers unrated?', icon: 'lightbulb', intent: 'explanation_why', priority: 2 },
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
    /how.*(risk|exposure).*(portfolio|suppliers)/i,
    /how.*(portfolio|suppliers).*(doing|performing|status|look)/i,
    /show.*(my|me).*(risk|portfolio)/i,
    /what('?s| is) my.*risk/i,
    /how many.*(supplier|high risk)/i,
    /give me.*(portfolio|risk).*(summary|overview)/i,
    /summary of.*(my|the|our).*(portfolio|supplier|risk)/i,
    /supplier risk portfolio/i,
    /portfolio (summary|overview|status)/i,
    /overview of.*(supplier|portfolio|risk)/i,
  ],
  filtered_discovery: [
    /show.*(supplier|high|medium|low)/i,
    /which.*(supplier|of my supplier)/i,
    /list.*(supplier|high|risk)/i,
    /filter.*by/i,
    /supplier.*(in|with|from)/i,
    /(high|medium|low).risk.supplier/i,
    /need.*(attention|review|action)/i,
    /require.*(attention|review|action)/i,
    /immediate.*(attention|action)/i,
    /at risk/i,
    /risky supplier/i,
    /supplier.*(attention|review)/i,
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
    /why.*(high|low|medium|risk|score|unrated)/i,
    /why are.*(supplier|vendors?).*unrated/i,
    /what('?s| is) (driving|causing)/i,
    /explain.*(score|risk|unrated)/i,
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
  // Inflation Watch Patterns
  inflation_summary: [
    /what('?s| is| has).*(changed|happening).*(price|inflation|cost)/i,
    /price.*(change|movement|update)/i,
    /inflation.*(summary|overview|update)/i,
    /commodity.*(price|cost).*(this|last).*month/i,
    /cost.*(increase|decrease).*(summary|overview)/i,
    /monthly.*(inflation|price).*report/i,
    /what.*(price|cost).*(changed|moved)/i,
    /show.*(price|inflation).*(changes|movement)/i,
    // Added for Home suggestions
    /highest.*(inflation|price.*increase)/i,
    /price.*spikes?/i,
    /spikes?.*(above|over|more than)/i,
    /significant.*price.*(movement|change)/i,
    /which.*(commodity|categories).*(highest|most).*(inflation|increase)/i,
  ],
  inflation_drivers: [
    /why.*(price|cost|inflation).*(up|down|increase|decrease|change)/i,
    /what('?s| is).*(driving|causing|behind).*(price|cost|inflation)/i,
    /explain.*(price|cost).*(increase|decrease|change)/i,
    /root cause.*(price|inflation)/i,
    /factors?.*(affecting|impacting|driving).*(price|cost)/i,
    /why did.*(price|cost|steel|aluminum|copper|commodity)/i,
    // Price trend queries for specific commodities
    /price.*trend.*(for|of|in)/i,
    /what.*price.*trend/i,
    /(steel|aluminum|copper|corrugated|packaging|commodity|metal).*(price|trend)/i,
    /trend.*(steel|aluminum|copper|corrugated|packaging|commodity|metal)/i,
    /how.*(?:is|are).*(steel|aluminum|copper|corrugated).*(price|doing|performing)/i,
  ],
  inflation_impact: [
    /impact.*(my|our).*(spend|budget|portfolio|cost)/i,
    /how.*(affect|impact).*(my|our).*(spend|budget|portfolio|cost)/i,
    /what('?s| is).*(my|our).*(exposure|impact)/i,
    /inflation.*(impact|exposure|effect)/i,
    /(spend|cost|budget).*(at risk|exposed|impacted)/i,
    /how much.*(cost|spend).*(increase|go up|affected)/i,
    /dollar.*(impact|exposure)/i,
    /(my|our).*(exposure|impact).*(inflation|price)/i,
  ],
  inflation_justification: [
    /is.*(this|the).*(price|increase).*(justified|fair|reasonable)/i,
    /validate.*(price|increase|cost)/i,
    /should.*(accept|agree|pay).*(price|increase)/i,
    /supplier.*(asking|requesting|claiming).*(increase|more)/i,
    /fair.*(price|increase|market)/i,
    /negotiate.*(price|increase|supplier)/i,
    /justified.*(price|increase|cost)/i,
    /price increase.*(valid|legitimate|reasonable)/i,
  ],
  inflation_scenarios: [
    /what if.*(price|cost|inflation).*(increase|go up|rise)/i,
    /scenario.*(price|cost|inflation)/i,
    /model.*(price|cost).*(change|increase)/i,
    /forecast.*(price|cost|spend)/i,
    /(price|cost).*forecast/i,
    /price.*(outlook|projection|prediction)/i,
    /(outlook|projection|prediction).*(price|cost)/i,
    /if.*(price|cost).*(rise|increase|go up).*(%|percent)/i,
    /project.*(price|spend|cost)/i,
    /what.*(happen|would).*(price|cost).*(increase|rise)/i,
    // Commodity-specific forecasts
    /(steel|aluminum|copper|commodity|metal|corrugated|packaging).*(forecast|outlook|projection)/i,
    /forecast.*(steel|aluminum|copper|commodity|metal|corrugated|packaging)/i,
  ],
  inflation_communication: [
    /help.*(explain|present|communicate).*(price|cost|inflation)/i,
    /how.*(explain|present|tell).*(leadership|executive|stakeholder|board)/i,
    /executive.*(summary|brief|report).*(inflation|price|cost)/i,
    /stakeholder.*(communication|update|report)/i,
    /talking points?.*(price|inflation|cost)/i,
    /prepare.*(presentation|brief).*(inflation|price)/i,
  ],
  inflation_benchmark: [
    /is.*(this|the).*(price|increase).*(normal|typical|expected)/i,
    /how.*(compare|benchmark).*(market|industry|peer)/i,
    /market.*(average|benchmark|rate).*(price|increase)/i,
    /industry.*(price|rate|benchmark)/i,
    /what.*(others|competitors|peers).*(paying|charged)/i,
    /normal.*(price|increase|market)/i,
  ],
  general: [], // Fallback, no specific patterns
};

// Prioritize more specific intents to avoid broad matches swallowing queries.
const INTENT_PRIORITY: IntentCategory[] = [
  // Inflation intents
  'inflation_summary',
  'inflation_drivers',
  'inflation_impact',
  'inflation_justification',
  'inflation_scenarios',
  'inflation_communication',
  'inflation_benchmark',
  // Market research
  'market_context',
  // Risk-specific intents
  'restricted_query',
  'explanation_why',
  'trend_detection',
  'comparison',
  'action_trigger',
  'supplier_deep_dive',
  'filtered_discovery',
  'portfolio_overview',
  // Configuration & exports
  'setup_config',
  'reporting_export',
  // Fallback
  'general',
];

// Guard to avoid routing market/price queries into portfolio_overview
const PORTFOLIO_MARKET_GUARD = /(price|inflation|commodity|market|benchmark|index|forecast|outlook|cpi|ppi)/i;
const PORTFOLIO_RISK_SIGNAL = /(risk|exposure|distribution|high[- ]?risk|unrated|portfolio risk|risk posture|risk overview)/i;

// Patterns that trigger automatic research (Perplexity)
// Note: price/commodity forecasts use Beroe data, not external research
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

// Patterns that indicate commodity/price queries - these use Beroe data, not external research
const PRICE_DATA_PATTERNS = [
  /price\s*(forecast|outlook|projection|prediction)/i,
  /(steel|aluminum|copper|corrugated|packaging|commodity|metal)\s*(forecast|outlook|projection|prediction|price)/i,
  /(forecast|outlook|projection|prediction)\s*(for|of)\s*(steel|aluminum|copper|corrugated|packaging|commodity|metal)/i,
];

// Check if query should trigger deep research
const shouldTriggerResearch = (query: string): { trigger: boolean; context?: string } => {
  // Check if this is a price/commodity query that should use Beroe data instead
  for (const pricePattern of PRICE_DATA_PATTERNS) {
    if (pricePattern.test(query)) {
      return { trigger: false }; // Use Beroe data, not external research
    }
  }

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

    // Inflation sub-intent detection
    case 'inflation_summary':
      if (/category|categories/i.test(q)) return 'category_changes';
      if (/region|geographic|country/i.test(q)) return 'region_changes';
      if (/top|biggest|most/i.test(q)) return 'top_movers';
      return 'monthly_changes';

    case 'inflation_drivers':
      if (/supplier/i.test(q)) return 'supplier_drivers';
      if (/market|macro|economy/i.test(q)) return 'market_drivers';
      if (/history|historical|past/i.test(q)) return 'historical_drivers';
      return 'commodity_drivers';

    case 'inflation_impact':
      if (/supplier/i.test(q)) return 'supplier_exposure';
      if (/category|categories/i.test(q)) return 'category_exposure';
      if (/risk/i.test(q)) return 'risk_correlation';
      return 'spend_impact';

    case 'inflation_justification':
      if (/compare|comparison|vs/i.test(q)) return 'market_fairness';
      if (/negotiate|negotiation/i.test(q)) return 'negotiate_support';
      return 'validate_increase';

    case 'inflation_scenarios':
      if (/supplier|switch|alternative/i.test(q)) return 'what_if_supplier';
      if (/budget/i.test(q)) return 'budget_impact';
      if (/forecast|predict|outlook|projection/i.test(q)) return 'price_forecast';
      return 'what_if_increase';

    case 'inflation_communication':
      if (/procurement|detailed/i.test(q)) return 'procurement_report';
      if (/supplier|letter/i.test(q)) return 'supplier_letter';
      if (/presentation|deck|slides/i.test(q)) return 'stakeholder_deck';
      return 'executive_brief';

    case 'inflation_benchmark':
      return 'market_fairness';

    case 'market_context':
      // Distinguish between news/events queries and price queries
      if (/news|event|happening|update|recent|latest|headline/i.test(q)) return 'news_events';
      if (/trend|price|cost|forecast|outlook/i.test(q)) return 'commodity_drivers';
      return 'news_events'; // Default to news for market context

    default:
      return 'none';
  }
};

// Function to classify intent
export const classifyIntent = (query: string): DetectedIntent => {
  const normalizedQuery = query.toLowerCase().trim();

  // Check for research triggers first
  const researchCheck = shouldTriggerResearch(normalizedQuery);

  // Check each intent category in priority order
  for (const category of INTENT_PRIORITY) {
    if (
      category === 'portfolio_overview' &&
      PORTFOLIO_MARKET_GUARD.test(normalizedQuery) &&
      !PORTFOLIO_RISK_SIGNAL.test(normalizedQuery)
    ) {
      continue;
    }

    const patterns = INTENT_PATTERNS[category] || [];
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        const intentCategory = category;
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
    // Inflation intents
    case 'inflation_summary': return 'widget';
    case 'inflation_drivers': return 'widget';
    case 'inflation_impact': return 'widget';
    case 'inflation_justification': return 'widget';
    case 'inflation_scenarios': return 'widget';
    case 'inflation_communication': return 'widget';
    case 'inflation_benchmark': return 'widget';
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
    // Inflation intents
    case 'inflation_summary': return 'inflation_dashboard';
    case 'inflation_drivers': return 'driver_analysis';
    case 'inflation_impact': return 'impact_analysis';
    case 'inflation_justification': return 'justification_report';
    case 'inflation_scenarios': return 'scenario_planner';
    case 'inflation_communication': return 'executive_presentation';
    case 'inflation_benchmark': return 'inflation_dashboard';
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

  // Extract supplier name from "find alternatives for [supplier]" queries
  const alternativesPatterns = [
    /find\s+(?:alternative(?:s)?(?:\s+suppliers?)?)\s+(?:for|to|instead of)\s+(.+?)(?:\s*$|\s*[.,?!])/i,
    /alternatives?\s+(?:for|to|instead of)\s+(.+?)(?:\s*$|\s*[.,?!])/i,
  ];
  for (const pattern of alternativesPatterns) {
    const match = query.match(pattern);
    if (match) {
      entities.supplierName = match[1].trim();
      break;
    }
  }

  // Extract commodity name
  const commodityPatterns = [
    // "price trend for X" patterns
    /(?:price|trend|prices?)\s+(?:for|of|on)\s+([A-Za-z][A-Za-z\s&]+?)(?:\s+in\s+|\s*$|\s*[.,?!])/i,
    // Direct commodity mentions
    /\b(corrugated\s*boxes?|steel|aluminum|copper|plastics?|rubber|paper|pulp|resins?|silicones?|natural\s+gas|packaging|freight)\b/i,
    // "X prices" or "X price trend"
    /\b([A-Za-z][A-Za-z\s&]+?)\s+(?:price|prices|cost|costs)\b/i,
  ];
  for (const pattern of commodityPatterns) {
    const match = query.match(pattern);
    if (match) {
      entities.commodity = match[1].trim();
      break;
    }
  }

  // Extract category (supplier category/industry)
  const categoryPatterns: Record<string, RegExp> = {
    'Packaging': /\b(packaging|corrugated|boxes|cartons?|containers?|wrapping)\b/i,
    'Metals': /\b(metals?|steel|aluminum|copper|brass|zinc|iron|alloy)\b/i,
    'Chemicals': /\b(chemicals?|resins?|plastics?|polymers?|adhesives?|coatings?|solvents?)\b/i,
    'Electronics': /\b(electronics?|semiconductors?|chips?|circuit|pcb|components?)\b/i,
    'Energy': /\b(energy|oil|gas|natural gas|fuel|petroleum|power)\b/i,
    'Raw Materials': /\b(raw materials?|paper|pulp|rubber|silicones?|fibers?)\b/i,
    'Logistics': /\b(logistics?|freight|shipping|transportation|warehouse)\b/i,
    'Manufacturing': /\b(manufacturing|industrial|machinery|equipment)\b/i,
  };
  for (const [categoryName, pattern] of Object.entries(categoryPatterns)) {
    if (pattern.test(query)) {
      entities.category = categoryName;
      break;
    }
  }

  return entities;
};
