// Inflation Watch Types
// Comprehensive type definitions for the Inflation Watch module integration

// ============================================
// INFLATION INTENT CATEGORIES
// ============================================

/**
 * Inflation-specific intent categories that extend the main IntentCategory type.
 * These map to the 5 core themes from the Inflation Watch module:
 *
 * 1. What Changed (Summary) - inflation_summary
 * 2. Why It Matters (Drivers) - inflation_drivers
 * 3. Impact Analysis (Portfolio) - inflation_impact
 * 4. Supplier Justification - inflation_justification
 * 5. Scenario Planning - inflation_scenarios
 */
export type InflationIntentCategory =
  | 'inflation_summary'        // "What changed this month?" - Overview of price movements
  | 'inflation_drivers'        // "Why did steel go up?" - Root cause analysis
  | 'inflation_impact'         // "How does this affect my spend?" - Portfolio exposure
  | 'inflation_justification'  // "Validate this price increase" - Supplier negotiation
  | 'inflation_scenarios'      // "What if prices rise 10%?" - What-if modeling
  | 'inflation_communication'  // "Help me explain this to leadership" - Stakeholder comms
  | 'inflation_benchmark';     // "Is this normal for the market?" - Market context

/**
 * Inflation sub-intents for granular routing
 */
export type InflationSubIntent =
  // Summary sub-intents
  | 'monthly_changes'           // Default summary view
  | 'category_changes'          // Changes by commodity category
  | 'region_changes'            // Geographic price variations
  | 'top_movers'                // Biggest price changes

  // Driver sub-intents
  | 'commodity_drivers'         // Why specific commodity changed
  | 'market_drivers'            // Macro factors (supply/demand, geopolitics)
  | 'supplier_drivers'          // Supplier-specific factors
  | 'historical_drivers'        // Historical context for changes

  // Impact sub-intents
  | 'spend_impact'              // Dollar impact on portfolio
  | 'category_exposure'         // Exposure by category
  | 'supplier_exposure'         // Exposure by supplier
  | 'risk_correlation'          // Inflation + risk score correlation

  // Justification sub-intents
  | 'validate_increase'         // Is this increase justified?
  | 'negotiate_support'         // Data to support negotiation
  | 'supplier_comparison'       // Compare across suppliers
  | 'market_fairness'           // Is price fair vs market?

  // Scenario sub-intents
  | 'price_forecast'            // Future price projections
  | 'what_if_increase'          // Model price increase scenarios
  | 'what_if_supplier'          // Model supplier switch scenarios
  | 'budget_impact'             // Budget planning scenarios

  // Communication sub-intents
  | 'executive_brief'           // Summary for leadership
  | 'procurement_report'        // Detailed procurement report
  | 'supplier_letter'           // Communication to supplier
  | 'stakeholder_deck'          // Presentation materials

  | 'none';

// ============================================
// INFLATION WIDGET TYPES
// ============================================

/**
 * Inflation-specific widget types.
 * These render in the chat stream and can expand to artifact panels.
 */
export type InflationWidgetType =
  // Summary Widgets
  | 'inflation_summary_card'      // Monthly overview with key metrics
  | 'price_movement_table'        // Table of price changes by commodity
  | 'commodity_gauge'             // Single commodity with gauge + changes
  | 'top_movers_list'             // Top 5 biggest movers (up/down)

  // Driver Widgets
  | 'driver_breakdown_card'       // Root cause analysis card
  | 'factor_contribution_chart'   // Pie/bar of contributing factors
  | 'market_context_card'         // Macro context with news
  | 'historical_comparison'       // This period vs history

  // Impact Widgets
  | 'spend_impact_card'           // Dollar impact on portfolio
  | 'exposure_heatmap'            // Category x Risk heatmap
  | 'affected_suppliers_table'    // Suppliers affected by price change
  | 'budget_variance_card'        // Actual vs budgeted spend

  // Justification Widgets
  | 'justification_card'          // Price increase validation
  | 'market_fairness_gauge'       // Is price fair vs market
  | 'negotiation_ammo_card'       // Data points for negotiation
  | 'supplier_price_comparison'   // Compare prices across suppliers

  // Scenario Widgets
  | 'scenario_card'               // What-if scenario result
  | 'forecast_chart'              // Price forecast visualization
  | 'sensitivity_table'           // Impact at different price levels
  | 'alternative_scenario_card'   // Alternative sourcing scenario

  // Communication Widgets
  | 'executive_brief_card'        // Shareable exec summary
  | 'talking_points_card'         // Key points for stakeholder meetings
  | 'trend_narrative_card';       // AI-generated trend story

// ============================================
// INFLATION ARTIFACT TYPES
// ============================================

/**
 * Inflation-specific artifact types for the right panel.
 * These provide deep-dive views with full interactivity.
 */
export type InflationArtifactType =
  // Dashboards
  | 'inflation_dashboard'         // Full inflation overview dashboard
  | 'commodity_dashboard'         // Single commodity deep dive
  | 'category_inflation_view'     // Category-level inflation analysis

  // Analysis Views
  | 'driver_analysis'             // Full driver breakdown with charts
  | 'impact_analysis'             // Portfolio impact analysis
  | 'historical_analysis'         // Historical trends and patterns

  // Action Views
  | 'justification_report'        // Full justification report
  | 'negotiation_prep'            // Negotiation preparation view
  | 'scenario_planner'            // Interactive what-if planner

  // Export/Communication Views
  | 'inflation_report_builder'    // Configure and generate reports
  | 'executive_presentation'      // Presentation-ready view
  | 'supplier_communication';     // Draft supplier communications

// ============================================
// INFLATION DATA SCHEMAS
// ============================================

/**
 * Core commodity price data structure
 */
export interface CommodityPrice {
  commodityId: string;
  name: string;
  category: CommodityCategory;
  currentPrice: number;
  previousPrice: number;
  unit: string;              // "mt", "lb", "kg", "barrel", etc.
  currency: string;          // "USD", "EUR", etc.
  market: string;            // "LME", "COMEX", "CME", etc.
  lastUpdated: string;
  changes: {
    daily: PriceChange;
    weekly: PriceChange;
    monthly: PriceChange;
    quarterly: PriceChange;
    yearly: PriceChange;
  };
  forecast?: PriceForecast;
  history: PriceHistoryPoint[];
}

export interface PriceChange {
  absolute: number;
  percent: number;
  direction: 'up' | 'down' | 'stable';
}

export interface PriceForecast {
  period: string;            // "30d", "90d", "1y"
  low: number;
  mid: number;
  high: number;
  confidence: number;        // 0-100
  factors: string[];         // Key factors influencing forecast
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  volume?: number;
  event?: string;            // Notable event on this date
}

export type CommodityCategory =
  | 'metals'
  | 'energy'
  | 'agriculture'
  | 'chemicals'
  | 'packaging'
  | 'logistics'
  | 'other';

/**
 * Inflation driver/factor structure
 */
export interface InflationDriver {
  id: string;
  name: string;
  category: DriverCategory;
  impact: 'high' | 'medium' | 'low';
  direction: 'inflationary' | 'deflationary' | 'neutral';
  contribution: number;      // Percentage contribution to price change
  description: string;
  sources?: string[];        // News/data sources
  relatedCommodities?: string[];
}

export type DriverCategory =
  | 'supply'                 // Supply constraints, production issues
  | 'demand'                 // Demand changes, consumption patterns
  | 'geopolitical'           // Tariffs, sanctions, conflicts
  | 'environmental'          // Weather, natural disasters, ESG
  | 'currency'               // FX movements
  | 'logistics'              // Shipping, freight, transportation
  | 'regulatory'             // Policy changes, compliance
  | 'market_speculation';    // Market dynamics, speculation

/**
 * Portfolio inflation exposure
 */
export interface InflationExposure {
  totalExposure: number;             // Total spend exposed to inflation
  totalExposureFormatted: string;
  impactAmount: number;              // Estimated dollar impact
  impactAmountFormatted: string;
  impactPercent: number;             // % change in spend
  byCommodity: CommodityExposure[];
  byCategory: CategoryExposure[];
  bySupplier: SupplierExposure[];
  byRiskLevel: RiskLevelExposure[];
}

export interface CommodityExposure {
  commodityId: string;
  commodityName: string;
  category: CommodityCategory;
  exposure: number;
  exposureFormatted: string;
  priceChange: PriceChange;
  supplierCount: number;
  topSuppliers: string[];
}

export interface CategoryExposure {
  category: string;
  exposure: number;
  exposureFormatted: string;
  percentOfTotal: number;
  commodities: string[];
  avgPriceChange: number;
  riskLevel: 'high' | 'medium' | 'low';
}

export interface SupplierExposure {
  supplierId: string;
  supplierName: string;
  exposure: number;
  exposureFormatted: string;
  commodities: string[];
  priceImpact: number;
  priceImpactFormatted: string;
  riskScore?: number;
  justificationStatus?: 'pending' | 'validated' | 'disputed';
}

export interface RiskLevelExposure {
  riskLevel: 'high' | 'medium-high' | 'medium' | 'low';
  exposure: number;
  exposureFormatted: string;
  percentOfTotal: number;
  supplierCount: number;
  avgPriceImpact: number;
}

/**
 * Supplier price justification
 */
export interface PriceJustification {
  supplierId: string;
  supplierName: string;
  commodity: string;
  requestedIncrease: number;           // Requested % increase
  marketIncrease: number;              // Market benchmark % increase
  variance: number;                    // Difference from market
  verdict: JustificationVerdict;
  marketComparison: {
    supplierPrice: number;
    marketAvg: number;
    marketLow: number;
    marketHigh: number;
    percentile: number;                // Where supplier falls (0-100)
  };
  factors: JustificationFactor[];
  recommendation: string;
  negotiationPoints: string[];
  supportingData: SupportingDataPoint[];
}

export type JustificationVerdict =
  | 'justified'              // Increase aligns with market
  | 'partially_justified'    // Some justification but room to negotiate
  | 'questionable'           // Increase exceeds market significantly
  | 'insufficient_data';     // Not enough data to determine

export interface JustificationFactor {
  name: string;
  claimed: number;           // What supplier claims
  market: number;            // What market shows
  delta: number;             // Difference
  verdict: 'supports' | 'neutral' | 'disputes';
}

export interface SupportingDataPoint {
  type: 'index' | 'news' | 'contract' | 'history';
  title: string;
  value?: string;
  source: string;
  date: string;
  url?: string;
}

/**
 * Scenario planning types
 */
export interface InflationScenario {
  id: string;
  name: string;
  description: string;
  type: ScenarioType;
  assumptions: ScenarioAssumption[];
  results: ScenarioResults;
  createdAt: string;
  updatedAt: string;
}

export type ScenarioType =
  | 'price_increase'         // Model commodity price increase
  | 'supplier_switch'        // Model switching suppliers
  | 'volume_change'          // Model volume changes
  | 'multi_factor';          // Combined scenario

export interface ScenarioAssumption {
  factor: string;            // What's being changed
  currentValue: number;
  projectedValue: number;
  changePercent: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ScenarioResults {
  baselineSpend: number;
  projectedSpend: number;
  delta: number;
  deltaFormatted: string;
  deltaPercent: number;
  impactByCategory: Array<{
    category: string;
    baseline: number;
    projected: number;
    delta: number;
  }>;
  impactBySupplier: Array<{
    supplierId: string;
    supplierName: string;
    baseline: number;
    projected: number;
    delta: number;
  }>;
  recommendations: string[];
  risks: string[];
  opportunities: string[];
}

// ============================================
// WIDGET DATA SCHEMAS
// ============================================

/**
 * Data schema for inflation_summary_card widget
 */
export interface InflationSummaryCardData {
  period: string;                    // "March 2024", "Q1 2024"
  headline: string;                  // AI-generated headline
  overallChange: PriceChange;        // Weighted average change
  topIncreases: Array<{
    commodity: string;
    change: number;
    impact: string;                  // "$2.5M impact"
  }>;
  topDecreases: Array<{
    commodity: string;
    change: number;
    benefit: string;                 // "$500K savings"
  }>;
  portfolioImpact: {
    amount: string;
    percent: number;
    direction: 'increase' | 'decrease';
  };
  keyDrivers: string[];              // Top 3 drivers
  lastUpdated: string;
}

/**
 * Data schema for driver_breakdown_card widget
 */
export interface DriverBreakdownCardData {
  commodity: string;
  priceChange: PriceChange;
  period: string;
  drivers: Array<{
    name: string;
    category: DriverCategory;
    contribution: number;            // % contribution to change
    direction: 'up' | 'down';
    description: string;
  }>;
  marketContext?: string;            // Brief market context
  sources?: Array<{
    title: string;
    source: string;
    url?: string;
  }>;
}

/**
 * Data schema for spend_impact_card widget
 */
export interface SpendImpactCardData {
  totalImpact: string;               // "$5.2M"
  totalImpactDirection: 'increase' | 'decrease';
  impactPercent: number;
  timeframe: string;                 // "vs. last quarter"
  breakdown: Array<{
    category: string;
    amount: string;
    percent: number;
    direction: 'up' | 'down';
  }>;
  mostAffected: {
    type: 'category' | 'supplier' | 'commodity';
    name: string;
    impact: string;
  };
  recommendation?: string;
}

/**
 * Data schema for justification_card widget
 */
export interface JustificationCardData {
  supplierName: string;
  commodity: string;
  requestedIncrease: number;         // Percentage
  marketBenchmark: number;           // Market average increase
  verdict: JustificationVerdict;
  verdictLabel: string;              // Human-readable verdict
  keyPoints: Array<{
    point: string;
    supports: boolean;               // Supports supplier or buyer
  }>;
  recommendation: string;
  negotiationLeverage: 'strong' | 'moderate' | 'weak';
}

/**
 * Data schema for scenario_card widget
 */
export interface ScenarioCardData {
  scenarioName: string;
  description: string;
  assumption: string;                // "Steel prices increase 15%"
  currentState: {
    label: string;
    value: string;
  };
  projectedState: {
    label: string;
    value: string;
  };
  delta: {
    amount: string;
    percent: number;
    direction: 'up' | 'down';
  };
  confidence: 'high' | 'medium' | 'low';
  topImpacts: string[];              // Top 3 impact areas
  recommendation?: string;
}

/**
 * Data schema for executive_brief_card widget
 */
export interface ExecutiveBriefCardData {
  title: string;
  period: string;
  summary: string;                   // 2-3 sentence AI summary
  keyMetrics: Array<{
    label: string;
    value: string;
    change?: PriceChange;
    status: 'positive' | 'negative' | 'neutral';
  }>;
  highlights: Array<{
    type: 'concern' | 'opportunity' | 'action';
    text: string;
  }>;
  outlook: string;                   // Forward-looking statement
  shareableUrl?: string;
}

/**
 * Data schema for commodity_gauge widget (extends existing price_gauge)
 */
export interface CommodityGaugeData {
  commodity: string;
  category: CommodityCategory;
  currentPrice: number;
  unit: string;
  currency: string;
  market: string;
  lastUpdated: string;
  gauge: {
    min: number;
    max: number;
    position: number;                // 0-100 percentage
    zones: Array<{
      start: number;
      end: number;
      color: string;
      label: string;
    }>;
  };
  changes: {
    daily: PriceChange;
    monthly: PriceChange;
    yearly: PriceChange;
  };
  portfolioExposure?: {
    amount: string;
    supplierCount: number;
  };
  trend: 'bullish' | 'bearish' | 'stable';
  nextUpdate?: string;
}

/**
 * Data schema for price_movement_table widget
 */
export interface PriceMovementTableData {
  period: string;
  commodities: Array<{
    id: string;
    name: string;
    category: CommodityCategory;
    currentPrice: number;
    unit: string;
    change: PriceChange;
    exposure: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  sortBy: 'change' | 'exposure' | 'name';
  totalCommodities: number;
}

// ============================================
// ARTIFACT PAYLOAD TYPES
// ============================================

/**
 * Payload for inflation_dashboard artifact
 */
export interface InflationDashboardPayload {
  type: 'inflation_dashboard';
  period: string;
  summary: InflationSummaryCardData;
  priceMovements: PriceMovementTableData;
  exposure: InflationExposure;
  drivers: InflationDriver[];
  alerts: Array<{
    id: string;
    type: 'spike' | 'drop' | 'volatility' | 'forecast';
    commodity: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  aiContent?: {
    title: string;
    overview: string;
    keyPoints: string[];
    recommendations: string[];
  };
}

/**
 * Payload for commodity_dashboard artifact
 */
export interface CommodityDashboardPayload {
  type: 'commodity_dashboard';
  commodity: CommodityPrice;
  drivers: InflationDriver[];
  exposure: CommodityExposure;
  affectedSuppliers: SupplierExposure[];
  historicalComparison: Array<{
    period: string;
    price: number;
    change: number;
  }>;
  forecast?: PriceForecast;
  relatedCommodities?: Array<{
    name: string;
    correlation: number;
    change: PriceChange;
  }>;
  aiContent?: {
    title: string;
    overview: string;
    keyPoints: string[];
    recommendations: string[];
  };
}

/**
 * Payload for driver_analysis artifact
 */
export interface DriverAnalysisPayload {
  type: 'driver_analysis';
  commodity: string;
  period: string;
  priceChange: PriceChange;
  drivers: InflationDriver[];
  driverContributions: Array<{
    driver: string;
    category: DriverCategory;
    contribution: number;
  }>;
  marketNews: Array<{
    title: string;
    source: string;
    date: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    url?: string;
  }>;
  historicalDrivers?: Array<{
    period: string;
    topDriver: string;
    change: number;
  }>;
  aiContent?: {
    title: string;
    overview: string;
    keyPoints: string[];
    recommendations: string[];
  };
}

/**
 * Payload for impact_analysis artifact
 */
export interface ImpactAnalysisPayload {
  type: 'impact_analysis';
  period: string;
  exposure: InflationExposure;
  riskCorrelation: {
    highRiskHighExposure: number;     // % of exposure in high-risk suppliers
    concentrationRisk: Array<{
      type: 'commodity' | 'supplier' | 'region';
      name: string;
      concentration: number;
    }>;
  };
  budgetImpact: {
    originalBudget: number;
    projectedSpend: number;
    variance: number;
    variancePercent: number;
  };
  mitigationOptions: Array<{
    action: string;
    potentialSavings: string;
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
  }>;
  aiContent?: {
    title: string;
    overview: string;
    keyPoints: string[];
    recommendations: string[];
  };
}

/**
 * Payload for justification_report artifact
 */
export interface JustificationReportPayload {
  type: 'justification_report';
  justification: PriceJustification;
  historicalPricing: Array<{
    date: string;
    supplierPrice: number;
    marketPrice: number;
  }>;
  competitorPricing?: Array<{
    supplier: string;
    price: number;
    delta: number;
  }>;
  contractTerms?: {
    escalationClause: boolean;
    indexTied: boolean;
    renegotiationDate?: string;
  };
  aiContent?: {
    title: string;
    overview: string;
    keyPoints: string[];
    recommendations: string[];
  };
}

/**
 * Payload for scenario_planner artifact
 */
export interface ScenarioPlannerPayload {
  type: 'scenario_planner';
  scenarios: InflationScenario[];
  baselineData: {
    totalSpend: number;
    byCategory: Array<{ category: string; spend: number }>;
    bySupplier: Array<{ supplier: string; spend: number }>;
  };
  availableFactors: Array<{
    factor: string;
    currentValue: number;
    unit: string;
    historicalRange: { min: number; max: number };
  }>;
  aiContent?: {
    title: string;
    overview: string;
    keyPoints: string[];
    recommendations: string[];
  };
}

// ============================================
// API DATA CONTRACTS
// ============================================

/**
 * Request/response types for inflation APIs
 */

export interface GetInflationSummaryRequest {
  period?: string;           // "2024-03", "Q1-2024"
  categories?: CommodityCategory[];
  portfolioId?: string;
}

export interface GetInflationSummaryResponse {
  summary: InflationSummaryCardData;
  commodities: CommodityPrice[];
  exposure: InflationExposure;
}

export interface GetCommodityDetailsRequest {
  commodityId: string;
  period?: string;
  includeHistory?: boolean;
  includeForecast?: boolean;
}

export interface GetCommodityDetailsResponse {
  commodity: CommodityPrice;
  drivers: InflationDriver[];
  exposure: CommodityExposure;
  relatedSuppliers: SupplierExposure[];
}

export interface ValidatePriceIncreaseRequest {
  supplierId: string;
  commodity: string;
  requestedIncrease: number;
  effectiveDate?: string;
}

export interface ValidatePriceIncreaseResponse {
  justification: PriceJustification;
}

export interface CreateScenarioRequest {
  name: string;
  type: ScenarioType;
  assumptions: ScenarioAssumption[];
}

export interface CreateScenarioResponse {
  scenario: InflationScenario;
}

export interface GetPortfolioExposureRequest {
  portfolioId?: string;
  commodityIds?: string[];
  period?: string;
}

export interface GetPortfolioExposureResponse {
  exposure: InflationExposure;
}

// ============================================
// INTENT PATTERN EXTENSIONS
// ============================================

/**
 * Regex patterns for detecting inflation-related intents
 */
export const INFLATION_INTENT_PATTERNS: Record<InflationIntentCategory, RegExp[]> = {
  inflation_summary: [
    /what('?s| is| has).*(changed|happening).*(price|inflation|cost)/i,
    /price.*(change|movement|update)/i,
    /inflation.*(summary|overview|update)/i,
    /commodity.*(price|cost).*(this|last).*month/i,
    /cost.*(increase|decrease).*(summary|overview)/i,
    /monthly.*(inflation|price).*report/i,
  ],
  inflation_drivers: [
    /why.*(price|cost|inflation).*(up|down|increase|decrease|change)/i,
    /what('?s| is).*(driving|causing|behind).*(price|cost|inflation)/i,
    /explain.*(price|cost).*(increase|decrease|change)/i,
    /root cause.*(price|inflation)/i,
    /factors?.*(affecting|impacting|driving).*(price|cost)/i,
  ],
  inflation_impact: [
    /how.*(affect|impact).*(my|our).*(spend|budget|portfolio|cost)/i,
    /what('?s| is).*(my|our).*(exposure|impact)/i,
    /inflation.*(impact|exposure|effect)/i,
    /(spend|cost|budget).*(at risk|exposed|impacted)/i,
    /how much.*(cost|spend).*(increase|go up|affected)/i,
  ],
  inflation_justification: [
    /is.*(this|the).*(price|increase).*(justified|fair|reasonable)/i,
    /validate.*(price|increase|cost)/i,
    /should.*(accept|agree|pay).*(price|increase)/i,
    /supplier.*(asking|requesting|claiming).*(increase|more)/i,
    /fair.*(price|increase|market)/i,
    /negotiate.*(price|increase|supplier)/i,
  ],
  inflation_scenarios: [
    /what if.*(price|cost|inflation).*(increase|go up|rise)/i,
    /scenario.*(price|cost|inflation)/i,
    /model.*(price|cost).*(change|increase)/i,
    /forecast.*(price|cost|spend)/i,
    /if.*(price|cost).*(rise|increase|go up).*(%|percent)/i,
    /project.*(price|spend|cost)/i,
  ],
  inflation_communication: [
    /help.*(explain|present|communicate).*(price|cost|inflation)/i,
    /how.*(explain|present|tell).*(leadership|executive|stakeholder|board)/i,
    /executive.*(summary|brief|report).*(inflation|price|cost)/i,
    /stakeholder.*(communication|update|report)/i,
    /talking points?.*(price|inflation|cost)/i,
  ],
  inflation_benchmark: [
    /is.*(this|the).*(price|increase).*(normal|typical|expected)/i,
    /how.*(compare|benchmark).*(market|industry|peer)/i,
    /market.*(average|benchmark|rate).*(price|increase)/i,
    /industry.*(price|rate|benchmark)/i,
    /what.*(others|competitors|peers).*(paying|charged)/i,
  ],
};

// ============================================
// WIDGET SELECTION RULES (INFLATION)
// ============================================

import type { WidgetSelectionRule } from './widgets';

export const INFLATION_WIDGET_RULES: WidgetSelectionRule[] = [
  {
    widget: 'inflation_summary_card' as any,
    useWhen: ['inflation_summary'],
    requiredData: ['inflation_summary'],
    priority: 10,
    description: 'Monthly inflation overview with key metrics and portfolio impact',
  },
  {
    widget: 'price_movement_table' as any,
    useWhen: ['inflation_summary'],
    requiredData: ['commodity_prices'],
    priority: 8,
    description: 'Table of commodity price changes with exposure amounts',
  },
  {
    widget: 'commodity_gauge' as any,
    useWhen: ['inflation_summary', 'inflation_drivers'],
    requiredData: ['single_commodity'],
    priority: 9,
    description: 'Single commodity price gauge with changes and portfolio exposure',
  },
  {
    widget: 'driver_breakdown_card' as any,
    useWhen: ['inflation_drivers'],
    requiredData: ['commodity_drivers'],
    priority: 10,
    description: 'Root cause analysis showing factors driving price changes',
  },
  {
    widget: 'spend_impact_card' as any,
    useWhen: ['inflation_impact'],
    requiredData: ['portfolio_exposure'],
    priority: 10,
    description: 'Portfolio spend impact from inflation with breakdown by category',
  },
  {
    widget: 'justification_card' as any,
    useWhen: ['inflation_justification'],
    requiredData: ['price_justification'],
    priority: 10,
    description: 'Price increase validation with market comparison and verdict',
  },
  {
    widget: 'scenario_card' as any,
    useWhen: ['inflation_scenarios'],
    requiredData: ['scenario'],
    priority: 10,
    description: 'What-if scenario result showing projected impact',
  },
  {
    widget: 'executive_brief_card' as any,
    useWhen: ['inflation_communication'],
    requiredData: ['inflation_summary'],
    priority: 10,
    description: 'Shareable executive summary with key metrics and highlights',
  },
  {
    widget: 'market_fairness_gauge' as any,
    useWhen: ['inflation_benchmark', 'inflation_justification'],
    requiredData: ['market_benchmark'],
    priority: 8,
    description: 'Market fairness gauge showing price position vs market',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Determine if a query is inflation-related
 */
export const isInflationQuery = (query: string): boolean => {
  const normalizedQuery = query.toLowerCase();

  for (const patterns of Object.values(INFLATION_INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Classify inflation intent
 */
export const classifyInflationIntent = (
  query: string
): { category: InflationIntentCategory; subIntent: InflationSubIntent; confidence: number } | null => {
  const normalizedQuery = query.toLowerCase();

  for (const [category, patterns] of Object.entries(INFLATION_INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        return {
          category: category as InflationIntentCategory,
          subIntent: detectInflationSubIntent(normalizedQuery, category as InflationIntentCategory),
          confidence: 0.85,
        };
      }
    }
  }

  return null;
};

/**
 * Detect sub-intent for granular routing
 */
const detectInflationSubIntent = (
  query: string,
  category: InflationIntentCategory
): InflationSubIntent => {
  const q = query.toLowerCase();

  switch (category) {
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
      if (/compare|comparison|vs/i.test(q)) return 'supplier_comparison';
      if (/negotiate|negotiation/i.test(q)) return 'negotiate_support';
      if (/market|fair/i.test(q)) return 'market_fairness';
      return 'validate_increase';

    case 'inflation_scenarios':
      if (/supplier|switch|alternative/i.test(q)) return 'what_if_supplier';
      if (/budget/i.test(q)) return 'budget_impact';
      if (/forecast|predict/i.test(q)) return 'price_forecast';
      return 'what_if_increase';

    case 'inflation_communication':
      if (/executive|leadership|board/i.test(q)) return 'executive_brief';
      if (/procurement|detailed/i.test(q)) return 'procurement_report';
      if (/supplier|letter/i.test(q)) return 'supplier_letter';
      if (/presentation|deck|slides/i.test(q)) return 'stakeholder_deck';
      return 'executive_brief';

    default:
      return 'none';
  }
};

/**
 * Get widget type for inflation intent
 */
export const getInflationWidgetType = (
  category: InflationIntentCategory,
  _subIntent: InflationSubIntent
): InflationWidgetType => {
  const widgetMap: Record<InflationIntentCategory, InflationWidgetType> = {
    inflation_summary: 'inflation_summary_card',
    inflation_drivers: 'driver_breakdown_card',
    inflation_impact: 'spend_impact_card',
    inflation_justification: 'justification_card',
    inflation_scenarios: 'scenario_card',
    inflation_communication: 'executive_brief_card',
    inflation_benchmark: 'market_fairness_gauge',
  };

  return widgetMap[category];
};

/**
 * Get artifact type for inflation intent
 */
export const getInflationArtifactType = (
  category: InflationIntentCategory
): InflationArtifactType => {
  const artifactMap: Record<InflationIntentCategory, InflationArtifactType> = {
    inflation_summary: 'inflation_dashboard',
    inflation_drivers: 'driver_analysis',
    inflation_impact: 'impact_analysis',
    inflation_justification: 'justification_report',
    inflation_scenarios: 'scenario_planner',
    inflation_communication: 'executive_presentation',
    inflation_benchmark: 'inflation_dashboard',
  };

  return artifactMap[category];
};

// ============================================
// PROMPT HELPERS
// ============================================

/**
 * Widget showcase for AI prompts (inflation section)
 */
export const INFLATION_WIDGET_SHOWCASE = `
### INFLATION & PRICING

**inflation_summary_card** (M, L)
Use for: Monthly inflation overview, "what changed this month"
Shows: Period headline, key price changes, portfolio impact, top drivers

**commodity_gauge** (M, L)
Use for: Single commodity price query, "what's the price of steel"
Shows: Price gauge with historical range, daily/monthly changes, portfolio exposure

**driver_breakdown_card** (M, L)
Use for: "Why did steel go up", root cause analysis
Shows: Contributing factors with impact %, market context, sources

**spend_impact_card** (M, L)
Use for: "How does this affect my spend", portfolio exposure
Shows: Total impact amount, breakdown by category/supplier, mitigation options

**justification_card** (M, L)
Use for: "Is this price increase fair", supplier negotiation support
Shows: Market comparison, verdict, negotiation points, supporting data

**scenario_card** (M, L)
Use for: "What if prices rise 10%", scenario planning
Shows: Assumption, current vs projected, delta, confidence, recommendations

**executive_brief_card** (M, L)
Use for: "Help me explain to leadership", stakeholder communication
Shows: Summary, key metrics, highlights, outlook, shareable format
`;
