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

  // Supplier
  { type: 'supplier_risk_card', sizes: ['M', 'L'], defaultSize: 'M', component: 'SupplierRiskCardWidget', componentL: 'SupplierDetailArtifact' },
  { type: 'supplier_table', sizes: ['M', 'L'], defaultSize: 'M', component: 'SupplierTableWidget', componentL: 'SupplierTableArtifact' },
  { type: 'supplier_mini', sizes: ['S'], defaultSize: 'S', component: 'SupplierMiniCard' },
  { type: 'comparison_table', sizes: ['M', 'L'], defaultSize: 'M', component: 'ComparisonTableWidget', componentL: 'ComparisonArtifact' },

  // Trends
  { type: 'trend_chart', sizes: ['M', 'L'], defaultSize: 'M', component: 'TrendChartWidget' },
  { type: 'trend_indicator', sizes: ['S', 'M'], defaultSize: 'S', component: 'TrendChangeIndicator' },
  { type: 'alert_card', sizes: ['M'], defaultSize: 'M', component: 'AlertCardWidget' },
  { type: 'event_timeline', sizes: ['M', 'L'], defaultSize: 'M', component: 'EventTimelineWidget' },

  // Market
  { type: 'price_gauge', sizes: ['M', 'L'], defaultSize: 'M', component: 'PriceGaugeWidget' },
  { type: 'market_card', sizes: ['M'], defaultSize: 'M', component: 'MarketContextCard' },
  { type: 'benchmark_card', sizes: ['M'], defaultSize: 'M', component: 'BenchmarkCard' },
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

// Union type for all widget data
export type WidgetData =
  // Portfolio & Overview
  | { type: 'risk_distribution'; data: RiskDistributionData }
  | { type: 'portfolio_summary'; data: PortfolioSummaryData }
  | { type: 'metric_row'; data: MetricRowData }

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
  {
    widget: 'benchmark_card',
    useWhen: ['market_context', 'comparison'],
    requiredData: ['benchmark_data'],
    priority: 7,
    description: 'Industry benchmark comparison card',
  },
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
