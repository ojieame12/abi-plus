// Widget Catalog - Defines all available widgets for AI responses
// The AI uses this to select appropriate visualizations

// ============================================
// WIDGET SIZE DEFINITIONS
// ============================================

export type WidgetSize = 'S' | 'M' | 'L';

export interface WidgetSizeConfig {
  size: WidgetSize;
  label: string;
  description: string;
  maxWidth: string;
  minHeight: string;
}

export const WIDGET_SIZES: Record<WidgetSize, WidgetSizeConfig> = {
  S: {
    size: 'S',
    label: 'Compact',
    description: 'Inline badge or single-line indicator',
    maxWidth: '320px',
    minHeight: '40px',
  },
  M: {
    size: 'M',
    label: 'Standard',
    description: 'Card-sized widget for chat responses',
    maxWidth: '480px',
    minHeight: '120px',
  },
  L: {
    size: 'L',
    label: 'Expanded',
    description: 'Full-width detailed view or artifact',
    maxWidth: '100%',
    minHeight: '300px',
  },
};

// ============================================
// WIDGET TYPE DEFINITIONS
// ============================================

export type WidgetType =
  // Portfolio & Overview
  | 'risk_distribution'     // Portfolio risk distribution (pie/donut)
  | 'portfolio_summary'     // Quick portfolio stats (suppliers, spend, avg risk)
  | 'metric_row'            // Simple metric display (3-4 KPIs)
  | 'spend_exposure'        // Spend-at-risk breakdown by level
  | 'health_scorecard'      // Portfolio health score with metrics

  // Supplier Focused
  | 'supplier_risk_card'    // Single supplier risk profile card
  | 'supplier_table'        // List of suppliers with key metrics
  | 'supplier_mini'         // Compact supplier badge (name + score)
  | 'comparison_table'      // Side-by-side supplier comparison

  // Trends & Alerts
  | 'trend_chart'           // Time series for risk/price changes
  | 'trend_indicator'       // Simple up/down/stable indicator
  | 'alert_card'            // Risk change notification
  | 'event_timeline'        // Timeline of events/changes
  | 'events_feed'           // News/events feed list

  // Market & Context
  | 'price_gauge'           // Commodity pricing with gauge visualization
  | 'market_card'           // Market news/context summary
  | 'benchmark_card'        // Industry benchmark comparison
  | 'news_item'             // Single news article card

  // Categories & Regions
  | 'category_breakdown'    // Spend/risk by category
  | 'category_badge'        // Single category indicator
  | 'region_map'            // Geographic distribution
  | 'region_list'           // List of regions with counts

  // Actions & Status
  | 'action_card'           // Confirmation/action result
  | 'handoff_card'          // Dashboard redirect
  | 'status_badge'          // Simple status indicator
  | 'score_breakdown'       // Detailed score factors

  // General Purpose
  | 'stat_card'             // Single stat with trend
  | 'info_card'             // General information display
  | 'quote_card'            // Key insight highlight
  | 'recommendation_card'   // AI recommendation with confidence
  | 'checklist_card'        // Action items/todos
  | 'progress_card'         // Setup/onboarding progress
  | 'executive_summary'     // Shareable summary card
  | 'data_list'             // Generic list display

  // Risk Analysis
  | 'factor_breakdown'      // Risk factor breakdown by tier
  | 'news_events'           // News & events feed
  | 'alternatives_preview'  // Alternative supplier preview
  | 'concentration_warning' // Portfolio concentration warning

  // Inflation Watch Widgets
  | 'inflation_summary_card'      // Monthly inflation overview
  | 'price_movement_table'        // Commodity price changes table
  | 'commodity_gauge'             // Single commodity with gauge
  | 'top_movers_list'             // Biggest price movers
  | 'driver_breakdown_card'       // Root cause analysis
  | 'factor_contribution_chart'   // Contributing factors breakdown
  | 'market_context_card'         // Macro context with news
  | 'spend_impact_card'           // Portfolio spend impact
  | 'exposure_heatmap'            // Category x Risk heatmap
  | 'budget_variance_card'        // Actual vs budgeted
  | 'justification_card'          // Price validation card
  | 'market_fairness_gauge'       // Price vs market gauge
  | 'negotiation_ammo_card'       // Negotiation data points
  | 'scenario_card'               // What-if result
  | 'forecast_chart'              // Price forecast
  | 'sensitivity_table'           // Impact at price levels
  | 'executive_brief_card'        // Shareable exec summary
  | 'talking_points_card'         // Key stakeholder points

  // Text Only
  | 'none';                 // Text-only response

// ============================================
// WIDGET VARIANT MAPPING (Size Support)
// ============================================

export interface WidgetVariant {
  type: WidgetType;
  sizes: WidgetSize[];
  defaultSize: WidgetSize;
  component: string;
  componentS?: string;  // Small variant component
  componentL?: string;  // Large/artifact component
}

export const WIDGET_VARIANTS: WidgetVariant[] = [
  // Portfolio
  { type: 'risk_distribution', sizes: ['M', 'L'], defaultSize: 'M', component: 'RiskDistributionWidget', componentL: 'PortfolioDashboardArtifact' },
  { type: 'portfolio_summary', sizes: ['S', 'M'], defaultSize: 'M', component: 'PortfolioOverviewCard', componentS: 'MetricRowWidget' },
  { type: 'metric_row', sizes: ['S', 'M'], defaultSize: 'S', component: 'MetricRowWidget' },
  { type: 'spend_exposure', sizes: ['M', 'L'], defaultSize: 'M', component: 'SpendExposureWidget' },
  { type: 'health_scorecard', sizes: ['M', 'L'], defaultSize: 'M', component: 'HealthScorecardWidget' },

  // Supplier
  { type: 'supplier_risk_card', sizes: ['M', 'L'], defaultSize: 'M', component: 'SupplierRiskCardWidget', componentL: 'SupplierDetailArtifact' },
  { type: 'supplier_table', sizes: ['M', 'L'], defaultSize: 'M', component: 'SupplierTableWidget', componentL: 'SupplierTableArtifact' },
  { type: 'supplier_mini', sizes: ['S'], defaultSize: 'S', component: 'SupplierMiniCard' },
  { type: 'comparison_table', sizes: ['M', 'L'], defaultSize: 'M', component: 'ComparisonTableWidget', componentL: 'ComparisonArtifact' },

  // Trends
  { type: 'trend_chart', sizes: ['M', 'L'], defaultSize: 'M', component: 'TrendChartWidget' },
  { type: 'trend_indicator', sizes: ['S', 'M'], defaultSize: 'S', component: 'TrendBadge' },
  { type: 'alert_card', sizes: ['M'], defaultSize: 'M', component: 'AlertCardWidget' },
  { type: 'event_timeline', sizes: ['M', 'L'], defaultSize: 'M', component: 'EventTimelineWidget' },
  { type: 'events_feed', sizes: ['M', 'L'], defaultSize: 'M', component: 'EventsFeedWidget' },

  // Market
  { type: 'price_gauge', sizes: ['M', 'L'], defaultSize: 'M', component: 'PriceGaugeWidget' },
  { type: 'market_card', sizes: ['M'], defaultSize: 'M', component: 'NewsItemCard' },
  // benchmark_card - not implemented, commented out
  // { type: 'benchmark_card', sizes: ['M'], defaultSize: 'M', component: 'BenchmarkCard' },
  { type: 'news_item', sizes: ['S', 'M'], defaultSize: 'S', component: 'NewsItemCard' },

  // Categories & Regions
  { type: 'category_breakdown', sizes: ['M', 'L'], defaultSize: 'M', component: 'CategoryBreakdownWidget' },
  { type: 'category_badge', sizes: ['S'], defaultSize: 'S', component: 'CategoryBadge' },
  { type: 'region_map', sizes: ['M', 'L'], defaultSize: 'M', component: 'RegionMapWidget' },
  { type: 'region_list', sizes: ['S', 'M'], defaultSize: 'S', component: 'RegionListWidget' },

  // Actions
  { type: 'action_card', sizes: ['M'], defaultSize: 'M', component: 'ActionConfirmationCard' },
  { type: 'handoff_card', sizes: ['M'], defaultSize: 'M', component: 'HandoffCard' },
  { type: 'status_badge', sizes: ['S'], defaultSize: 'S', component: 'StatusBadge' },
  { type: 'score_breakdown', sizes: ['M', 'L'], defaultSize: 'M', component: 'ScoreBreakdownWidget' },

  // General Purpose
  { type: 'stat_card', sizes: ['S', 'M'], defaultSize: 'M', component: 'StatCard' },
  { type: 'info_card', sizes: ['M'], defaultSize: 'M', component: 'InfoCard' },
  { type: 'quote_card', sizes: ['S', 'M'], defaultSize: 'M', component: 'QuoteCard' },
  { type: 'recommendation_card', sizes: ['M', 'L'], defaultSize: 'M', component: 'RecommendationCard' },
  { type: 'checklist_card', sizes: ['M'], defaultSize: 'M', component: 'ChecklistCard' },
  { type: 'progress_card', sizes: ['M'], defaultSize: 'M', component: 'ProgressCard' },
  { type: 'executive_summary', sizes: ['M', 'L'], defaultSize: 'M', component: 'ExecutiveSummaryCard' },
  { type: 'data_list', sizes: ['S', 'M'], defaultSize: 'M', component: 'DataListCard' },

  // Risk Analysis
  { type: 'factor_breakdown', sizes: ['M', 'L'], defaultSize: 'M', component: 'FactorBreakdownCard', componentL: 'FactorBreakdownArtifact' },
  { type: 'news_events', sizes: ['M', 'L'], defaultSize: 'M', component: 'NewsEventsCard', componentL: 'NewsEventsArtifact' },
  { type: 'alternatives_preview', sizes: ['M', 'L'], defaultSize: 'M', component: 'AlternativesPreviewCard', componentL: 'AlternativesArtifact' },
  { type: 'concentration_warning', sizes: ['M'], defaultSize: 'M', component: 'ConcentrationWarningCard' },

  // Inflation Watch
  { type: 'inflation_summary_card', sizes: ['M', 'L'], defaultSize: 'M', component: 'InflationSummaryCard', componentL: 'InflationDashboardArtifact' },
  { type: 'price_movement_table', sizes: ['M', 'L'], defaultSize: 'M', component: 'PriceMovementTable', componentL: 'InflationDashboardArtifact' },
  { type: 'commodity_gauge', sizes: ['M', 'L'], defaultSize: 'M', component: 'CommodityGaugeCard', componentL: 'CommodityDashboardArtifact' },
  { type: 'top_movers_list', sizes: ['S', 'M'], defaultSize: 'M', component: 'TopMoversCard' },
  { type: 'driver_breakdown_card', sizes: ['M', 'L'], defaultSize: 'M', component: 'DriverBreakdownCard', componentL: 'DriverAnalysisArtifact' },
  { type: 'factor_contribution_chart', sizes: ['M', 'L'], defaultSize: 'M', component: 'FactorContributionChart' },
  { type: 'market_context_card', sizes: ['M'], defaultSize: 'M', component: 'MarketContextCard' },
  { type: 'spend_impact_card', sizes: ['M', 'L'], defaultSize: 'M', component: 'SpendImpactCard', componentL: 'ImpactAnalysisArtifact' },
  { type: 'exposure_heatmap', sizes: ['M', 'L'], defaultSize: 'M', component: 'ExposureHeatmap' },
  { type: 'budget_variance_card', sizes: ['M'], defaultSize: 'M', component: 'BudgetVarianceCard' },
  { type: 'justification_card', sizes: ['M', 'L'], defaultSize: 'M', component: 'JustificationCard', componentL: 'JustificationReportArtifact' },
  { type: 'market_fairness_gauge', sizes: ['M'], defaultSize: 'M', component: 'MarketFairnessGauge' },
  { type: 'negotiation_ammo_card', sizes: ['M'], defaultSize: 'M', component: 'NegotiationAmmoCard' },
  { type: 'scenario_card', sizes: ['M', 'L'], defaultSize: 'M', component: 'ScenarioCard', componentL: 'ScenarioPlannerArtifact' },
  { type: 'forecast_chart', sizes: ['M', 'L'], defaultSize: 'M', component: 'ForecastChart' },
  { type: 'sensitivity_table', sizes: ['M', 'L'], defaultSize: 'M', component: 'SensitivityTable' },
  { type: 'executive_brief_card', sizes: ['M', 'L'], defaultSize: 'M', component: 'ExecutiveBriefCard', componentL: 'ExecutivePresentationArtifact' },
  { type: 'talking_points_card', sizes: ['M'], defaultSize: 'M', component: 'TalkingPointsCard' },

  // None
  { type: 'none', sizes: [], defaultSize: 'M', component: '' },
];

// ============================================
// WIDGET DATA SCHEMAS
// ============================================

export interface PriceGaugeData {
  commodity: string;
  currentPrice: number;
  unit: string;              // "mt", "lb", "kg"
  currency: string;          // "USD", "EUR"
  lastUpdated: string;
  gaugeMin: number;
  gaugeMax: number;
  gaugePosition: number;     // 0-100 percentage
  change24h: { value: number; percent: number };
  change30d: { value: number; percent: number };
  market: string;            // "LME Grade A", "COMEX", etc.
  tags?: string[];           // ["Increased EV", "Supply Concern"]
}

export interface SupplierRiskCardData {
  supplierId: string;
  supplierName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'medium-high' | 'high';
  trend: 'improving' | 'stable' | 'worsening';
  category: string;
  location: { city: string; country: string; region: string };
  spend: number;
  spendFormatted: string;
  lastUpdated: string;
  keyFactors?: { name: string; impact: 'positive' | 'negative' | 'neutral' }[];
}

export interface RiskDistributionData {
  totalSuppliers: number;
  totalSpend: number;
  totalSpendFormatted: string;
  distribution: {
    high: { count: number; spend: number; percent: number };
    mediumHigh: { count: number; spend: number; percent: number };
    medium: { count: number; spend: number; percent: number };
    low: { count: number; spend: number; percent: number };
    unrated: { count: number; spend: number; percent: number };
  };
  topRiskCategories?: { name: string; count: number }[];
}

export interface SupplierTableData {
  suppliers: Array<{
    id: string;
    name: string;
    riskScore: number;
    riskLevel: string;
    trend: string;
    category: string;
    country: string;
    spend: string;
  }>;
  totalCount: number;
  filters?: Record<string, string>;
  sortBy?: string;
}

export interface ComparisonTableData {
  suppliers: Array<{
    id: string;
    name: string;
    riskScore: number;
    riskLevel: string;
    category: string;
    location: string;
    spend: string;
    trend: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  comparisonDimensions: string[];  // What's being compared
  recommendation?: string;
}

export interface TrendChartData {
  title: string;
  dataPoints: Array<{
    date: string;
    value: number;
    label?: string;
  }>;
  changeDirection: 'up' | 'down' | 'stable';
  changeSummary: string;
  unit?: string;
  suppliers?: string[];  // If tracking specific suppliers
}

export interface AlertCardData {
  alertType: 'risk_increase' | 'risk_decrease' | 'new_event' | 'threshold_breach';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  affectedSuppliers: Array<{
    name: string;
    previousScore?: number;
    currentScore?: number;
    change?: string;
  }>;
  timestamp: string;
  actionRequired: boolean;
  suggestedAction?: string;
}

export interface MetricRowData {
  metrics: Array<{
    label: string;
    value: string | number;
    subLabel?: string;
    change?: { value: number; direction: 'up' | 'down' };
    color?: 'default' | 'success' | 'warning' | 'danger';
  }>;
}

export interface CategoryBreakdownData {
  categories: Array<{
    name: string;
    supplierCount: number;
    totalSpend: number;
    spendFormatted: string;
    avgRiskScore: number;
    riskLevel: string;
  }>;
  sortBy: 'spend' | 'risk' | 'count';
}

export interface RegionMapData {
  regions: Array<{
    name: string;
    code: string;
    supplierCount: number;
    avgRiskScore: number;
    totalSpend: number;
  }>;
  highlightedRegion?: string;
}

// NEW DATA SCHEMAS FOR EXPANDED WIDGET TYPES

export interface PortfolioSummaryData {
  totalSuppliers: number;
  totalSpend: number;
  spendFormatted: string;
  avgRiskScore: number;
  riskTrend: 'improving' | 'stable' | 'worsening';
  highRiskCount: number;
  lastUpdated: string;
}

export interface SupplierMiniData {
  supplierId: string;
  supplierName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'medium-high' | 'high';
  trend: 'improving' | 'stable' | 'worsening';
  category?: string;
}

export interface TrendIndicatorData {
  direction: 'up' | 'down' | 'stable';
  value: number;
  percent: number;
  label: string;
  period: string;  // "24h", "7d", "30d"
}

export interface EventTimelineData {
  events: Array<{
    id: string;
    date: string;
    type: 'risk_change' | 'news' | 'alert' | 'action';
    title: string;
    description?: string;
    severity?: 'info' | 'warning' | 'critical';
    supplierId?: string;
    supplierName?: string;
  }>;
  timeRange: { start: string; end: string };
}

export interface MarketCardData {
  title: string;
  summary: string;
  source: string;
  sourceUrl?: string;
  timestamp: string;
  category: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relatedCommodities?: string[];
}

export interface BenchmarkCardData {
  metric: string;
  yourValue: number;
  industryAvg: number;
  percentile: number;
  trend: 'above' | 'at' | 'below';
  unit?: string;
}

export interface NewsItemData {
  title: string;
  source: string;
  sourceIcon?: string;
  timestamp: string;
  url?: string;
  category?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface CategoryBadgeData {
  name: string;
  supplierCount: number;
  riskLevel: 'low' | 'medium' | 'medium-high' | 'high';
  spend?: string;
}

export interface RegionListData {
  regions: Array<{
    name: string;
    code: string;
    supplierCount: number;
    avgRiskScore: number;
    flag?: string;
  }>;
  totalSuppliers: number;
}

export interface ActionCardData {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  title: string;
  description: string;
  actionType?: string;
  timestamp?: string;
  nextSteps?: string[];
}

export interface HandoffCardData {
  destination: string;
  destinationUrl?: string;
  reason: string;
  context?: string;
  supplierIds?: string[];
  variant?: 'standard' | 'warning' | 'inline';
}

export interface StatusBadgeData {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'warning';
  label: string;
  detail?: string;
}

export interface ScoreBreakdownData {
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'medium-high' | 'high';
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
    description?: string;
  }>;
  lastUpdated: string;
}

// NEW WIDGET DATA SCHEMAS

export interface SpendExposureData {
  totalSpend: number;
  totalSpendFormatted: string;
  breakdown: Array<{
    level: 'high' | 'medium-high' | 'medium' | 'low' | 'unrated';
    amount: number;
    formatted: string;
    percent: number;
    supplierCount: number;
  }>;
  highestExposure?: {
    supplierName: string;
    amount: string;
    riskLevel: string;
  };
}

export interface HealthScorecardData {
  overallScore: number;
  scoreLabel: string;
  metrics: Array<{
    label: string;
    value: string | number;
    target?: string | number;
    status: 'good' | 'warning' | 'critical';
    trend?: 'up' | 'down' | 'stable';
  }>;
  concerns?: Array<{
    title: string;
    severity: 'high' | 'medium' | 'low';
    count?: number;
  }>;
}

export interface EventsFeedData {
  events: Array<{
    id: string;
    type: 'news' | 'risk_change' | 'alert' | 'update';
    title: string;
    summary?: string;
    source?: string;
    timestamp: string;
    impact?: 'positive' | 'negative' | 'neutral';
    supplier?: string;
  }>;
}

export interface StatCardData {
  label: string;
  value: string | number;
  subLabel?: string;
  change?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    period?: string;
  };
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export interface InfoCardData {
  title: string;
  content: string;
  variant?: 'info' | 'success' | 'warning' | 'error' | 'help';
  bullets?: string[];
  footer?: string;
}

export interface QuoteCardData {
  quote: string;
  source?: string;
  attribution?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'insight';
  highlight?: string;
}

export interface RecommendationCardData {
  title: string;
  recommendation: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string[];
  type?: 'action' | 'insight' | 'warning' | 'opportunity';
  actions?: Array<{
    label: string;
    primary?: boolean;
  }>;
}

export interface ChecklistCardData {
  title: string;
  subtitle?: string;
  items: Array<{
    id: string;
    label: string;
    description?: string;
    completed?: boolean;
  }>;
}

export interface ProgressCardData {
  title: string;
  subtitle?: string;
  steps: Array<{
    id: string;
    label: string;
    description?: string;
    status: 'completed' | 'current' | 'upcoming';
  }>;
}

export interface ExecutiveSummaryData {
  title?: string;
  period?: string;
  keyPoints: Array<{
    text: string;
    type?: 'metric' | 'concern' | 'positive' | 'action';
    value?: string;
  }>;
  metrics?: Array<{
    label: string;
    value: string;
    change?: { value: number; direction: 'up' | 'down' };
  }>;
  focusAreas?: string[];
}

export interface DataListData {
  title: string;
  subtitle?: string;
  items: Array<{
    id: string;
    label: string;
    value?: string | number;
    sublabel?: string;
    status?: 'default' | 'success' | 'warning' | 'danger';
  }>;
  variant?: 'default' | 'compact' | 'detailed';
}

// Risk Analysis Widget Data Types
export interface FactorBreakdownData {
  supplierName: string;
  overallScore: number;
  level: 'low' | 'medium' | 'medium-high' | 'high' | 'unrated';
  factors: Array<{
    id: string;
    name: string;
    score: number | null;
    weight: number;
    tier: 'tier1' | 'tier2' | 'tier3';
    trend?: 'up' | 'down' | 'stable';
  }>;
}

export interface NewsEventsData {
  title?: string;
  events: Array<{
    id: string;
    date: string;
    headline: string;
    source: string;
    type: 'news' | 'alert' | 'regulatory' | 'financial';
    sentiment: 'positive' | 'negative' | 'neutral';
    impact?: 'high' | 'medium' | 'low';
    url?: string;
  }>;
  maxItems?: number;
}

export interface AlternativesPreviewData {
  currentSupplier: string;
  currentScore: number;
  alternatives: Array<{
    id: string;
    name: string;
    score: number;
    level: 'low' | 'medium' | 'medium-high' | 'high' | 'unrated';
    category: string;
    matchScore: number;
  }>;
}

export interface ConcentrationWarningData {
  type: 'supplier' | 'category' | 'region';
  entity: string;
  concentration: number;
  threshold: number;
  spend: string;
  recommendation: string;
  severity: 'high' | 'medium' | 'low';
}

// ============================================
// INFLATION WATCH WIDGET DATA SCHEMAS
// ============================================

export interface PriceChangeData {
  absolute: number;
  percent: number;
  direction: 'up' | 'down' | 'stable';
}

export interface InflationSummaryCardData {
  period: string;                    // "March 2024", "Q1 2024"
  headline: string;                  // AI-generated headline
  overallChange: PriceChangeData;    // Weighted average change
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

export interface PriceMovementTableData {
  period: string;
  commodities: Array<{
    id: string;
    name: string;
    category: string;
    currentPrice: number;
    unit: string;
    change: PriceChangeData;
    exposure: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  sortBy: 'change' | 'exposure' | 'name';
  totalCommodities: number;
}

export interface CommodityGaugeData {
  commodity: string;
  category: string;
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
    daily: PriceChangeData;
    monthly: PriceChangeData;
    yearly: PriceChangeData;
  };
  portfolioExposure?: {
    amount: string;
    supplierCount: number;
  };
  trend: 'bullish' | 'bearish' | 'stable';
}

export interface TopMoversListData {
  period: string;
  movers: Array<{
    commodity: string;
    change: PriceChangeData;
    impact: string;
    direction: 'up' | 'down';
  }>;
}

export interface DriverBreakdownCardData {
  commodity: string;
  priceChange: PriceChangeData;
  period: string;
  drivers: Array<{
    name: string;
    category: string;
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

export interface FactorContributionChartData {
  commodity: string;
  totalChange: PriceChangeData;
  contributions: Array<{
    factor: string;
    contribution: number;
    color: string;
  }>;
}

export interface MarketContextCardData {
  commodity: string;
  context: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  keyFactors: string[];
  sources: Array<{
    title: string;
    source: string;
    date: string;
    url?: string;
  }>;
}

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

export interface ExposureHeatmapData {
  rows: Array<{
    category: string;
    cells: Array<{
      riskLevel: string;
      exposure: number;
      exposureFormatted: string;
      color: string;
    }>;
  }>;
  columns: string[];                 // Risk levels
  totalExposure: string;
}

export interface BudgetVarianceCardData {
  period: string;
  budgeted: string;
  actual: string;
  variance: string;
  variancePercent: number;
  direction: 'over' | 'under';
  breakdown: Array<{
    category: string;
    budgeted: string;
    actual: string;
    variance: string;
  }>;
}

export type JustificationVerdict =
  | 'justified'              // Increase aligns with market
  | 'partially_justified'    // Some justification but room to negotiate
  | 'questionable'           // Increase exceeds market significantly
  | 'insufficient_data';     // Not enough data to determine

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

export interface MarketFairnessGaugeData {
  supplierPrice: number;
  marketAvg: number;
  marketLow: number;
  marketHigh: number;
  percentile: number;                // Where supplier falls (0-100)
  verdict: 'below_market' | 'at_market' | 'above_market';
  unit: string;
  commodity: string;
}

export interface NegotiationAmmoCardData {
  supplierName: string;
  commodity: string;
  dataPoints: Array<{
    label: string;
    yourValue: string;
    marketValue: string;
    advantage: 'buyer' | 'supplier' | 'neutral';
  }>;
  suggestedTalkingPoints: string[];
  targetPrice?: string;
}

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

export interface ForecastChartData {
  commodity: string;
  currentPrice: number;
  unit: string;
  forecast: {
    period: string;
    low: number;
    mid: number;
    high: number;
    confidence: number;
  };
  history: Array<{
    date: string;
    price: number;
  }>;
  projectedRange: Array<{
    date: string;
    low: number;
    mid: number;
    high: number;
  }>;
}

export interface SensitivityTableData {
  commodity: string;
  basePrice: number;
  scenarios: Array<{
    changePercent: number;
    newPrice: number;
    spendImpact: string;
    annualizedImpact: string;
  }>;
  currentExposure: string;
}

export interface ExecutiveBriefCardData {
  title: string;
  period: string;
  summary: string;                   // 2-3 sentence AI summary
  keyMetrics: Array<{
    label: string;
    value: string;
    change?: PriceChangeData;
    status: 'positive' | 'negative' | 'neutral';
  }>;
  highlights: Array<{
    type: 'concern' | 'opportunity' | 'action';
    text: string;
  }>;
  outlook: string;                   // Forward-looking statement
  shareableUrl?: string;
}

export interface TalkingPointsCardData {
  context: string;
  audience: 'executive' | 'board' | 'procurement' | 'supplier';
  points: Array<{
    headline: string;
    detail: string;
    data?: string;
  }>;
  recommendations: string[];
}

// Union type for all widget data
export type WidgetData =
  // Portfolio & Overview
  | { type: 'risk_distribution'; data: RiskDistributionData }
  | { type: 'portfolio_summary'; data: PortfolioSummaryData }
  | { type: 'metric_row'; data: MetricRowData }
  | { type: 'spend_exposure'; data: SpendExposureData }
  | { type: 'health_scorecard'; data: HealthScorecardData }

  // Supplier Focused
  | { type: 'supplier_risk_card'; data: SupplierRiskCardData }
  | { type: 'supplier_table'; data: SupplierTableData }
  | { type: 'supplier_mini'; data: SupplierMiniData }
  | { type: 'comparison_table'; data: ComparisonTableData }

  // Trends & Alerts
  | { type: 'trend_chart'; data: TrendChartData }
  | { type: 'trend_indicator'; data: TrendIndicatorData }
  | { type: 'alert_card'; data: AlertCardData }
  | { type: 'event_timeline'; data: EventTimelineData }
  | { type: 'events_feed'; data: EventsFeedData }

  // Market & Context
  | { type: 'price_gauge'; data: PriceGaugeData }
  | { type: 'market_card'; data: MarketCardData }
  | { type: 'benchmark_card'; data: BenchmarkCardData }
  | { type: 'news_item'; data: NewsItemData }

  // Categories & Regions
  | { type: 'category_breakdown'; data: CategoryBreakdownData }
  | { type: 'category_badge'; data: CategoryBadgeData }
  | { type: 'region_map'; data: RegionMapData }
  | { type: 'region_list'; data: RegionListData }

  // Actions & Status
  | { type: 'action_card'; data: ActionCardData }
  | { type: 'handoff_card'; data: HandoffCardData }
  | { type: 'status_badge'; data: StatusBadgeData }
  | { type: 'score_breakdown'; data: ScoreBreakdownData }

  // General Purpose
  | { type: 'stat_card'; data: StatCardData }
  | { type: 'info_card'; data: InfoCardData }
  | { type: 'quote_card'; data: QuoteCardData }
  | { type: 'recommendation_card'; data: RecommendationCardData }
  | { type: 'checklist_card'; data: ChecklistCardData }
  | { type: 'progress_card'; data: ProgressCardData }
  | { type: 'executive_summary'; data: ExecutiveSummaryData }
  | { type: 'data_list'; data: DataListData }

  // Risk Analysis
  | { type: 'factor_breakdown'; data: FactorBreakdownData }
  | { type: 'news_events'; data: NewsEventsData }
  | { type: 'alternatives_preview'; data: AlternativesPreviewData }
  | { type: 'concentration_warning'; data: ConcentrationWarningData }

  // Inflation Watch
  | { type: 'inflation_summary_card'; data: InflationSummaryCardData }
  | { type: 'price_movement_table'; data: PriceMovementTableData }
  | { type: 'commodity_gauge'; data: CommodityGaugeData }
  | { type: 'top_movers_list'; data: TopMoversListData }
  | { type: 'driver_breakdown_card'; data: DriverBreakdownCardData }
  | { type: 'factor_contribution_chart'; data: FactorContributionChartData }
  | { type: 'market_context_card'; data: MarketContextCardData }
  | { type: 'spend_impact_card'; data: SpendImpactCardData }
  | { type: 'exposure_heatmap'; data: ExposureHeatmapData }
  | { type: 'budget_variance_card'; data: BudgetVarianceCardData }
  | { type: 'justification_card'; data: JustificationCardData }
  | { type: 'market_fairness_gauge'; data: MarketFairnessGaugeData }
  | { type: 'negotiation_ammo_card'; data: NegotiationAmmoCardData }
  | { type: 'scenario_card'; data: ScenarioCardData }
  | { type: 'forecast_chart'; data: ForecastChartData }
  | { type: 'sensitivity_table'; data: SensitivityTableData }
  | { type: 'executive_brief_card'; data: ExecutiveBriefCardData }
  | { type: 'talking_points_card'; data: TalkingPointsCardData }

  // Text Only
  | { type: 'none'; data: null };

// ============================================
// WIDGET SELECTION RULES
// ============================================

export interface WidgetSelectionRule {
  widget: WidgetType;
  useWhen: string[];           // Intent categories
  requiredData: string[];      // What data must be available
  priority: number;            // Higher = preferred when multiple match
  description: string;         // For AI prompt
}

export const WIDGET_SELECTION_RULES: WidgetSelectionRule[] = [
  // Portfolio & Overview
  {
    widget: 'risk_distribution',
    useWhen: ['portfolio_overview'],
    requiredData: ['portfolio'],
    priority: 10,
    description: 'Shows overall risk distribution as a donut/pie chart with spend breakdown',
  },
  {
    widget: 'portfolio_summary',
    useWhen: ['portfolio_overview'],
    requiredData: ['portfolio'],
    priority: 8,
    description: 'Quick portfolio stats card with key metrics',
  },
  {
    widget: 'metric_row',
    useWhen: ['portfolio_overview', 'filtered_discovery'],
    requiredData: ['summary_metrics'],
    priority: 5,
    description: 'Simple row of 3-4 key metrics for quick insights',
  },
  {
    widget: 'spend_exposure',
    useWhen: ['portfolio_overview'],
    requiredData: ['portfolio'],
    priority: 9,
    description: 'Shows spend at risk breakdown by risk level with horizontal bars',
  },
  {
    widget: 'health_scorecard',
    useWhen: ['portfolio_overview'],
    requiredData: ['portfolio'],
    priority: 7,
    description: 'Portfolio health scorecard with overall score, metrics grid, concerns',
  },

  // Supplier Focused
  {
    widget: 'supplier_risk_card',
    useWhen: ['supplier_deep_dive'],
    requiredData: ['single_supplier'],
    priority: 10,
    description: 'Detailed card for a single supplier with risk score, trend, and key factors',
  },
  {
    widget: 'supplier_table',
    useWhen: ['filtered_discovery', 'trend_detection'],
    requiredData: ['supplier_list'],
    priority: 8,
    description: 'Sortable table of suppliers with risk scores and key metrics',
  },
  {
    widget: 'supplier_mini',
    useWhen: ['supplier_deep_dive', 'filtered_discovery'],
    requiredData: ['single_supplier'],
    priority: 3,
    description: 'Compact supplier badge for inline mentions',
  },
  {
    widget: 'comparison_table',
    useWhen: ['comparison'],
    requiredData: ['multiple_suppliers'],
    priority: 10,
    description: 'Side-by-side comparison of 2-4 suppliers across key dimensions',
  },

  // Trends & Alerts
  {
    widget: 'alert_card',
    useWhen: ['trend_detection'],
    requiredData: ['risk_changes'],
    priority: 9,
    description: 'Highlights recent risk changes with severity indicators',
  },
  {
    widget: 'trend_chart',
    useWhen: ['trend_detection', 'supplier_deep_dive'],
    requiredData: ['historical_data'],
    priority: 7,
    description: 'Time series chart showing risk or price trends over time',
  },
  {
    widget: 'trend_indicator',
    useWhen: ['trend_detection', 'portfolio_overview'],
    requiredData: ['trend_data'],
    priority: 4,
    description: 'Simple up/down/stable indicator with percentage',
  },
  {
    widget: 'event_timeline',
    useWhen: ['trend_detection', 'supplier_deep_dive'],
    requiredData: ['events'],
    priority: 6,
    description: 'Timeline of events and changes for a supplier or portfolio',
  },
  {
    widget: 'events_feed',
    useWhen: ['trend_detection', 'market_context'],
    requiredData: ['events'],
    priority: 7,
    description: 'News and events feed with impact badges and sources',
  },

  // Market & Context
  {
    widget: 'price_gauge',
    useWhen: ['market_context'],
    requiredData: ['commodity_price'],
    priority: 10,
    description: 'Gauge visualization for commodity prices with 24h/30d changes',
  },
  {
    widget: 'market_card',
    useWhen: ['market_context'],
    requiredData: ['market_news'],
    priority: 8,
    description: 'Market news and context summary card',
  },
  // benchmark_card - not implemented yet, removed from selection
  // {
  //   widget: 'benchmark_card',
  //   useWhen: ['market_context', 'comparison'],
  //   requiredData: ['benchmark_data'],
  //   priority: 7,
  //   description: 'Industry benchmark comparison card',
  // },
  {
    widget: 'news_item',
    useWhen: ['market_context'],
    requiredData: ['news'],
    priority: 5,
    description: 'Single news article card',
  },

  // Categories & Regions
  {
    widget: 'category_breakdown',
    useWhen: ['portfolio_overview', 'filtered_discovery'],
    requiredData: ['category_data'],
    priority: 6,
    description: 'Breakdown of suppliers/spend by category',
  },
  {
    widget: 'category_badge',
    useWhen: ['filtered_discovery'],
    requiredData: ['category'],
    priority: 3,
    description: 'Single category indicator badge',
  },
  {
    widget: 'region_map',
    useWhen: ['portfolio_overview', 'filtered_discovery'],
    requiredData: ['region_data'],
    priority: 6,
    description: 'Geographic distribution of suppliers and risk',
  },
  {
    widget: 'region_list',
    useWhen: ['portfolio_overview', 'filtered_discovery'],
    requiredData: ['regions'],
    priority: 4,
    description: 'List of regions with supplier counts',
  },

  // Actions & Status
  {
    widget: 'action_card',
    useWhen: ['action_trigger', 'setup_config'],
    requiredData: ['action_result'],
    priority: 9,
    description: 'Action confirmation or result card',
  },
  {
    widget: 'handoff_card',
    useWhen: ['restricted_query'],
    requiredData: ['handoff'],
    priority: 10,
    description: 'Dashboard redirect card',
  },
  {
    widget: 'status_badge',
    useWhen: ['setup_config', 'action_trigger'],
    requiredData: ['status'],
    priority: 3,
    description: 'Simple status indicator',
  },
  {
    widget: 'score_breakdown',
    useWhen: ['supplier_deep_dive', 'explanation_why'],
    requiredData: ['score_factors'],
    priority: 8,
    description: 'Detailed score breakdown with factors',
  },

  // General Purpose
  {
    widget: 'stat_card',
    useWhen: ['portfolio_overview', 'market_context', 'general'],
    requiredData: ['single_metric'],
    priority: 4,
    description: 'Single key metric with trend indicator',
  },
  {
    widget: 'info_card',
    useWhen: ['explanation_why', 'general', 'setup_config'],
    requiredData: [],
    priority: 5,
    description: 'General information card with title, content, optional bullets',
  },
  {
    widget: 'quote_card',
    useWhen: ['explanation_why', 'market_context'],
    requiredData: ['key_insight'],
    priority: 6,
    description: 'Key insight or quote highlight with sentiment',
  },
  {
    widget: 'recommendation_card',
    useWhen: ['portfolio_overview', 'supplier_deep_dive', 'action_trigger'],
    requiredData: ['recommendation'],
    priority: 8,
    description: 'AI recommendation with confidence level and reasoning',
  },
  {
    widget: 'checklist_card',
    useWhen: ['action_trigger', 'setup_config'],
    requiredData: ['action_items'],
    priority: 7,
    description: 'Interactive checklist with progress bar',
  },
  {
    widget: 'progress_card',
    useWhen: ['setup_config'],
    requiredData: ['setup_steps'],
    priority: 8,
    description: 'Setup or onboarding progress with step timeline',
  },
  {
    widget: 'executive_summary',
    useWhen: ['portfolio_overview', 'reporting_export'],
    requiredData: ['portfolio'],
    priority: 6,
    description: 'Shareable executive summary with key points, metrics, focus areas',
  },
  {
    widget: 'data_list',
    useWhen: ['filtered_discovery', 'general'],
    requiredData: ['list_items'],
    priority: 4,
    description: 'Generic list display with values and status indicators',
  },

  // Inflation Watch
  {
    widget: 'inflation_summary_card',
    useWhen: ['inflation_summary'],
    requiredData: ['inflation_summary'],
    priority: 10,
    description: 'Monthly inflation overview with key metrics, top movers, and portfolio impact',
  },
  {
    widget: 'price_movement_table',
    useWhen: ['inflation_summary'],
    requiredData: ['commodity_prices'],
    priority: 8,
    description: 'Table of commodity price changes with exposure amounts',
  },
  {
    widget: 'commodity_gauge',
    useWhen: ['inflation_summary', 'inflation_drivers'],
    requiredData: ['single_commodity'],
    priority: 9,
    description: 'Single commodity price gauge with historical range and portfolio exposure',
  },
  {
    widget: 'top_movers_list',
    useWhen: ['inflation_summary'],
    requiredData: ['commodity_prices'],
    priority: 7,
    description: 'Top 5 biggest price movers (up and down) for quick visibility',
  },
  {
    widget: 'driver_breakdown_card',
    useWhen: ['inflation_drivers'],
    requiredData: ['commodity_drivers'],
    priority: 10,
    description: 'Root cause analysis showing factors driving price changes with contribution percentages',
  },
  {
    widget: 'factor_contribution_chart',
    useWhen: ['inflation_drivers'],
    requiredData: ['commodity_drivers'],
    priority: 8,
    description: 'Visual breakdown of contributing factors as pie/bar chart',
  },
  {
    widget: 'market_context_card',
    useWhen: ['inflation_drivers', 'inflation_benchmark'],
    requiredData: ['market_context'],
    priority: 7,
    description: 'Macro context with news and sentiment analysis',
  },
  {
    widget: 'spend_impact_card',
    useWhen: ['inflation_impact'],
    requiredData: ['portfolio_exposure'],
    priority: 10,
    description: 'Portfolio spend impact from inflation with breakdown by category',
  },
  {
    widget: 'exposure_heatmap',
    useWhen: ['inflation_impact'],
    requiredData: ['portfolio_exposure'],
    priority: 8,
    description: 'Category vs risk level heatmap showing exposure concentration',
  },
  {
    widget: 'budget_variance_card',
    useWhen: ['inflation_impact'],
    requiredData: ['budget_data'],
    priority: 7,
    description: 'Actual vs budgeted spend variance due to inflation',
  },
  {
    widget: 'justification_card',
    useWhen: ['inflation_justification'],
    requiredData: ['price_justification'],
    priority: 10,
    description: 'Price increase validation with market comparison and negotiation leverage',
  },
  {
    widget: 'market_fairness_gauge',
    useWhen: ['inflation_justification', 'inflation_benchmark'],
    requiredData: ['market_benchmark'],
    priority: 8,
    description: 'Market fairness gauge showing price position vs market range',
  },
  {
    widget: 'negotiation_ammo_card',
    useWhen: ['inflation_justification'],
    requiredData: ['negotiation_data'],
    priority: 7,
    description: 'Data points and talking points for supplier negotiation',
  },
  {
    widget: 'scenario_card',
    useWhen: ['inflation_scenarios'],
    requiredData: ['scenario'],
    priority: 10,
    description: 'What-if scenario result showing projected impact and recommendations',
  },
  {
    widget: 'forecast_chart',
    useWhen: ['inflation_scenarios'],
    requiredData: ['price_forecast'],
    priority: 8,
    description: 'Price forecast visualization with confidence bands',
  },
  {
    widget: 'sensitivity_table',
    useWhen: ['inflation_scenarios'],
    requiredData: ['sensitivity_data'],
    priority: 7,
    description: 'Impact at different price levels for scenario planning',
  },
  {
    widget: 'executive_brief_card',
    useWhen: ['inflation_communication'],
    requiredData: ['inflation_summary'],
    priority: 10,
    description: 'Shareable executive summary with key metrics and highlights',
  },
  {
    widget: 'talking_points_card',
    useWhen: ['inflation_communication'],
    requiredData: ['talking_points'],
    priority: 8,
    description: 'Key points for stakeholder meetings organized by audience',
  },

  // Text Only
  {
    widget: 'none',
    useWhen: ['general', 'setup_config', 'reporting_export', 'explanation_why'],
    requiredData: [],
    priority: 1,
    description: 'Text-only response without visualization',
  },
];

// ============================================
// WIDGET SHOWCASE FOR AI PROMPTS
// ============================================

export const WIDGET_SHOWCASE = `
## Available Widgets

Choose ONE widget based on query type. Widgets come in sizes: S (compact badge), M (card), L (expanded/artifact).

### PORTFOLIO & OVERVIEW

**risk_distribution** (M, L)
Use for: Portfolio overview, "show my risk"
Shows: Donut chart with risk level breakdown

**portfolio_summary** (S, M)
Use for: Quick portfolio stats
Shows: Key metrics (suppliers, spend, avg risk)

**metric_row** (S, M)
Use for: Quick stats, KPIs
Shows: 3-4 key metrics in a row

**spend_exposure** (M, L)
Use for: "What's my dollar exposure?", spend at risk
Shows: Spend breakdown by risk level with bars, highest exposure callout

**health_scorecard** (M, L)
Use for: "Give me a health check", portfolio health
Shows: Overall score circle, metrics grid, concerns list

### SUPPLIER FOCUSED

**supplier_risk_card** (M, L)
Use for: Single supplier queries, "tell me about [supplier]"
Shows: Card with score gauge, trend, location, key factors

**supplier_table** (M, L)
Use for: List queries, "show high risk suppliers"
Shows: Sortable table with key columns (top 5-10)

**supplier_mini** (S)
Use for: Inline supplier mention
Shows: Compact badge with name and score

**comparison_table** (M, L)
Use for: "Compare X and Y", "which is safer"
Shows: Side-by-side with strengths/weaknesses (2-4 suppliers)

### TRENDS & ALERTS

**alert_card** (M)
Use for: Risk changes, "any alerts"
Shows: Change notifications with severity

**trend_chart** (M, L)
Use for: Historical trends, score over time
Shows: Time series line chart

**trend_indicator** (S, M)
Use for: Simple change indicator
Shows: Up/down arrow with percentage

**event_timeline** (M, L)
Use for: Recent events for supplier/portfolio
Shows: Timeline of changes and events

**events_feed** (M, L)
Use for: News and events feed, "any news?"
Shows: List of news/alerts with impact badges, sources

### MARKET & CONTEXT

**price_gauge** (M, L)
Use for: Commodity/market queries
Shows: Current price with gauge and 24h/30d changes

**market_card** (M)
Use for: Market news summary
Shows: News headline with source and sentiment

**benchmark_card** (M)
Use for: Industry comparison
Shows: Your value vs industry average

**news_item** (S, M)
Use for: Single news article
Shows: Headline, source, timestamp

### CATEGORIES & REGIONS

**category_breakdown** (M, L)
Use for: Category analysis
Shows: Categories with supplier counts and risk

**category_badge** (S)
Use for: Inline category mention
Shows: Category name with risk indicator

**region_map** (M, L)
Use for: Geographic distribution
Shows: Map with supplier locations

**region_list** (S, M)
Use for: Regional breakdown
Shows: List of regions with counts

### ACTIONS & STATUS

**action_card** (M)
Use for: Action confirmation/result
Shows: Status, message, next steps

**handoff_card** (M)
Use for: Dashboard redirect
Shows: Link to detailed view with context

**status_badge** (S)
Use for: Simple status
Shows: Status indicator with label

**score_breakdown** (M, L)
Use for: Explain risk score
Shows: Factor-by-factor breakdown

### GENERAL PURPOSE

**stat_card** (S, M)
Use for: Single key metric highlight
Shows: Big number with trend indicator, label

**info_card** (M)
Use for: General information, tips, explanations
Shows: Icon, title, content, optional bullets

**quote_card** (S, M)
Use for: Key insight highlight, important quote
Shows: Quoted text with sentiment color, source

**recommendation_card** (M, L)
Use for: AI recommendations, suggestions
Shows: Title, confidence level, reasoning, action buttons

**checklist_card** (M)
Use for: Action items, todo lists
Shows: Checkable items, progress bar

**progress_card** (M)
Use for: Setup progress, onboarding
Shows: Steps with status, completion indicator

**executive_summary** (M, L)
Use for: Summaries for leadership, shareable reports
Shows: Key points, metrics, focus areas, copy/share buttons

**data_list** (S, M)
Use for: Generic lists of items
Shows: Items with values, status dots, optional icons

### INFLATION & PRICING

**inflation_summary_card** (M, L)
Use for: Monthly inflation overview, "what changed this month"
Shows: Period headline, key price changes, portfolio impact, top drivers

**price_movement_table** (M, L)
Use for: Commodity price table, "show price changes"
Shows: Table with prices, changes, exposure for each commodity

**commodity_gauge** (M, L)
Use for: Single commodity price, "what's the price of steel"
Shows: Price gauge with range, daily/monthly changes, portfolio exposure

**top_movers_list** (S, M)
Use for: Quick view of biggest changes
Shows: Top 5 increases and decreases with impact

**driver_breakdown_card** (M, L)
Use for: "Why did steel go up", root cause analysis
Shows: Contributing factors with impact %, market context, sources

**spend_impact_card** (M, L)
Use for: "How does this affect my spend", portfolio exposure
Shows: Total impact amount, breakdown by category, most affected areas

**justification_card** (M, L)
Use for: "Is this price increase fair", supplier negotiation
Shows: Market comparison, verdict, negotiation points, recommendation

**market_fairness_gauge** (M)
Use for: Price validation, market benchmarking
Shows: Supplier price vs market range with percentile

**scenario_card** (M, L)
Use for: "What if prices rise 10%", scenario planning
Shows: Assumption, current vs projected, delta, recommendations

**forecast_chart** (M, L)
Use for: Price forecasts, future projections
Shows: Historical prices + forecast range with confidence bands

**executive_brief_card** (M, L)
Use for: "Help me explain to leadership", stakeholder communication
Shows: Summary, key metrics, highlights, outlook, shareable format

**talking_points_card** (M)
Use for: Stakeholder meeting prep
Shows: Key points organized by audience with data support

### TEXT ONLY

**none**
Use for: Explanations, config, general chat
No visualization needed.
`;

// ============================================
// HELPER FUNCTIONS
// ============================================

export const selectWidgetForIntent = (
  intentCategory: string,
  availableData: string[]
): WidgetType => {
  const matchingRules = WIDGET_SELECTION_RULES
    .filter(rule =>
      rule.useWhen.includes(intentCategory) &&
      rule.requiredData.every(req => availableData.includes(req))
    )
    .sort((a, b) => b.priority - a.priority);

  return matchingRules[0]?.widget || 'none';
};

export const getWidgetDescription = (widgetType: WidgetType): string => {
  const rule = WIDGET_SELECTION_RULES.find(r => r.widget === widgetType);
  return rule?.description || 'No description available';
};

// Size-related helpers
export const getWidgetVariant = (widgetType: WidgetType): WidgetVariant | undefined => {
  return WIDGET_VARIANTS.find(v => v.type === widgetType);
};

export const getWidgetSizes = (widgetType: WidgetType): WidgetSize[] => {
  const variant = getWidgetVariant(widgetType);
  return variant?.sizes || [];
};

export const getWidgetDefaultSize = (widgetType: WidgetType): WidgetSize => {
  const variant = getWidgetVariant(widgetType);
  return variant?.defaultSize || 'M';
};

export const getWidgetComponent = (widgetType: WidgetType, size?: WidgetSize): string | null => {
  const variant = getWidgetVariant(widgetType);
  if (!variant) return null;

  if (size === 'S' && variant.componentS) return variant.componentS;
  if (size === 'L' && variant.componentL) return variant.componentL;
  return variant.component || null;
};

export const supportsSize = (widgetType: WidgetType, size: WidgetSize): boolean => {
  const sizes = getWidgetSizes(widgetType);
  return sizes.includes(size);
};

// Get all widgets that support a specific size
export const getWidgetsBySize = (size: WidgetSize): WidgetType[] => {
  return WIDGET_VARIANTS
    .filter(v => v.sizes.includes(size))
    .map(v => v.type);
};

// Get widget categories
export const WIDGET_CATEGORIES = {
  portfolio: ['risk_distribution', 'portfolio_summary', 'metric_row'] as WidgetType[],
  supplier: ['supplier_risk_card', 'supplier_table', 'supplier_mini', 'comparison_table'] as WidgetType[],
  trends: ['trend_chart', 'trend_indicator', 'alert_card', 'event_timeline'] as WidgetType[],
  market: ['price_gauge', 'market_card', 'benchmark_card', 'news_item'] as WidgetType[],
  categories: ['category_breakdown', 'category_badge', 'region_map', 'region_list'] as WidgetType[],
  actions: ['action_card', 'handoff_card', 'status_badge', 'score_breakdown'] as WidgetType[],
};
