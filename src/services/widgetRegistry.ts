// Unified Widget Registry
// Single source of truth for widget definitions, intent mappings, and selection rules

import type { IntentCategory, SubIntent, ArtifactType } from '../types/intents';
import type { WidgetType, WidgetSize } from '../types/widgets';

// ============================================
// TYPES
// ============================================

export type WidgetCategory =
  | 'portfolio'
  | 'supplier'
  | 'trends'
  | 'market'
  | 'categories'
  | 'score'
  | 'general'
  | 'actions'
  | 'inflation';

export type RenderContext =
  | 'chat'
  | 'chat_compact'
  | 'panel'
  | 'panel_expanded'
  | 'standalone';

export type RequiredData =
  | 'portfolio'
  | 'suppliers'
  | 'supplier'
  | 'riskChanges'
  | 'events'
  | 'commodityData'
  | 'inflationSummary'
  | 'commodityDrivers'
  | 'portfolioExposure'
  | 'justificationData'
  | 'scenarioData'
  | 'none';

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

export interface WidgetRegistryEntry {
  // Identity
  id: string;
  type: WidgetType;
  component: string;
  name: string;

  // Categorization
  category: WidgetCategory;
  description: string;

  // Intent Mapping
  intents: IntentCategory[];
  subIntents?: SubIntent[];

  // Selection Rules
  priority: number;
  requiredData: RequiredData[];
  renderContexts: RenderContext[];

  // Sizing
  sizes: WidgetSize[];
  defaultSize: WidgetSize;

  // Artifact Escalation
  artifactType?: ArtifactType;
  expandsTo?: string;

  // Documentation
  props: PropDefinition[];
  demoData: Record<string, unknown>;
  usageExample: string;
}

// ============================================
// CATEGORY METADATA
// ============================================

export const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  portfolio: 'Portfolio & Overview',
  supplier: 'Supplier Focused',
  trends: 'Trends & Alerts',
  market: 'Market & Context',
  categories: 'Categories & Regions',
  score: 'Score & Breakdown',
  general: 'General Purpose',
  actions: 'Actions & Navigation',
  inflation: 'Inflation Watch',
};

export const CATEGORY_ORDER: WidgetCategory[] = [
  'portfolio',
  'supplier',
  'trends',
  'market',
  'categories',
  'score',
  'general',
  'actions',
  'inflation',
];

// ============================================
// SHARED DEMO DATA
// ============================================

// Full RiskDistributionData format for demo
const demoDistributionData = {
  totalSuppliers: 20,
  totalSpend: 10000000000,
  totalSpendFormatted: '$10.0B',
  distribution: {
    high: { count: 2, spend: 1500000000, percent: 15 },
    mediumHigh: { count: 1, spend: 800000000, percent: 8 },
    medium: { count: 3, spend: 3000000000, percent: 30 },
    low: { count: 4, spend: 2500000000, percent: 25 },
    unrated: { count: 10, spend: 2200000000, percent: 22 },
  },
};

const demoSuppliers = [
  { id: '1', name: 'Apple Inc.', category: 'Electronics', country: 'USA', srs: { score: 85, level: 'high' as const, trend: 'worsening' as const }, spend: '$10.0M', spendFormatted: '$10.0M' },
  { id: '2', name: 'Flash Cleaning', category: 'Services', country: 'Germany', srs: { score: 52, level: 'medium' as const, trend: 'stable' as const }, spend: '$2.1M', spendFormatted: '$2.1M' },
  { id: '3', name: 'Widget Co', category: 'Components', country: 'China', srs: { score: 38, level: 'low' as const, trend: 'improving' as const }, spend: '$850K', spendFormatted: '$850K' },
];

// ============================================
// WIDGET REGISTRY
// ============================================

export const WIDGET_REGISTRY: WidgetRegistryEntry[] = [
  // ============================================
  // PORTFOLIO & OVERVIEW
  // ============================================
  {
    id: 'risk-distribution-widget',
    type: 'risk_distribution',
    component: 'RiskDistributionWidget',
    name: 'RiskDistributionWidget',
    category: 'portfolio',
    description: 'Donut chart showing risk distribution across the portfolio with interactive segments.',
    intents: ['portfolio_overview'],
    subIntents: ['overall_summary'],
    priority: 110,
    requiredData: ['portfolio'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'portfolio_dashboard',
    expandsTo: 'PortfolioDashboardArtifact',
    props: [
      { name: 'distribution', type: 'RiskDistribution', required: true, description: 'Object with counts for each risk level (high, medium-high, medium, low, unrated)' },
      { name: 'totalSuppliers', type: 'number', required: true, description: 'Total number of suppliers in portfolio' },
      { name: 'onSegmentClick', type: '(level: string) => void', required: false, description: 'Callback when a segment is clicked' },
      { name: 'showLegend', type: 'boolean', required: false, default: 'true', description: 'Whether to show the legend' },
    ],
    demoData: {
      data: demoDistributionData,
    },
    usageExample: `<RiskDistributionWidget
  data={{
    totalSuppliers: 20,
    totalSpendFormatted: '$10.0B',
    distribution: {
      high: { count: 2, spend: 1500000000, percent: 15 },
      mediumHigh: { count: 1, spend: 800000000, percent: 8 },
      medium: { count: 3, spend: 3000000000, percent: 30 },
      low: { count: 4, spend: 2500000000, percent: 25 },
      unrated: { count: 10, spend: 2200000000, percent: 22 },
    },
  }}
/>`,
  },
  {
    id: 'metric-row-widget',
    type: 'metric_row',
    component: 'MetricRowWidget',
    name: 'MetricRowWidget',
    category: 'portfolio',
    description: 'Horizontal row of 3-4 key metrics with optional trends.',
    intents: ['portfolio_overview', 'filtered_discovery'],
    priority: 80,
    requiredData: ['portfolio'],
    renderContexts: ['chat', 'chat_compact'],
    sizes: ['M'],
    defaultSize: 'M',
    props: [
      { name: 'metrics', type: 'MetricItem[]', required: true, description: 'Array of metrics to display' },
      { name: 'variant', type: "'default' | 'compact'", required: false, default: "'default'", description: 'Display variant' },
    ],
    demoData: {
      data: {
        metrics: [
          { label: 'Total Suppliers', value: '45', change: { value: 3, direction: 'up' as const } },
          { label: 'High Risk', value: '14%', change: { value: 2, direction: 'up' as const } },
          { label: 'Avg SRS', value: '62' },
        ],
      },
    },
    usageExample: `<MetricRowWidget
  data={{
    metrics: [
      { label: 'Total Suppliers', value: '45' },
      { label: 'High Risk', value: '14%' },
    ],
  }}
/>`,
  },
  {
    id: 'spend-exposure-widget',
    type: 'spend_exposure',
    component: 'SpendExposureWidget',
    name: 'SpendExposureWidget',
    category: 'portfolio',
    description: 'Spend-at-risk breakdown showing dollar amounts by risk level.',
    intents: ['portfolio_overview'],
    subIntents: ['spend_weighted'],
    priority: 105,
    requiredData: ['portfolio'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'portfolio_dashboard',
    props: [
      { name: 'totalSpendFormatted', type: 'string', required: true, description: 'Formatted total spend (e.g., "$10.0B")' },
      { name: 'breakdown', type: 'SpendBreakdown[]', required: true, description: 'Array of spend by risk level' },
      { name: 'highestExposure', type: '{ supplierName, amount, riskLevel }', required: false, description: 'Highest single exposure' },
      { name: 'onViewDetails', type: '() => void', required: false, description: 'Callback to view details' },
    ],
    demoData: {
      totalSpendFormatted: '$10.0B',
      breakdown: [
        { level: 'high', formatted: '$1.5B', percent: 15, supplierCount: 2 },
        { level: 'medium', formatted: '$3.0B', percent: 30, supplierCount: 4 },
        { level: 'low', formatted: '$2.5B', percent: 25, supplierCount: 3 },
      ],
      highestExposure: { supplierName: 'Acme Corp', amount: '$1.2B', riskLevel: 'high' },
    },
    usageExample: `<SpendExposureWidget
  totalSpendFormatted="$10.0B"
  breakdown={[
    { level: 'high', formatted: '$1.5B', percent: 15, supplierCount: 2 },
  ]}
/>`,
  },
  {
    id: 'health-scorecard-widget',
    type: 'health_scorecard',
    component: 'HealthScorecardWidget',
    name: 'HealthScorecardWidget',
    category: 'portfolio',
    description: 'Portfolio health overview with score circle and key metrics grid.',
    intents: ['portfolio_overview'],
    priority: 95,
    requiredData: ['portfolio'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'portfolio_dashboard',
    props: [
      { name: 'overallScore', type: 'number', required: true, description: 'Overall health score (0-100)' },
      { name: 'scoreLabel', type: 'string', required: true, description: 'Label for the score (e.g., "Moderate Health")' },
      { name: 'metrics', type: 'HealthMetric[]', required: true, description: 'Array of health metrics' },
      { name: 'concerns', type: 'Concern[]', required: false, description: 'Array of concerns to highlight' },
    ],
    demoData: {
      overallScore: 68,
      scoreLabel: 'Moderate Health',
      metrics: [
        { label: 'High Risk', value: '14%', target: '<10%', status: 'warning' },
        { label: 'Coverage', value: '28%', target: '>80%', status: 'critical' },
      ],
      concerns: [
        { title: 'High China concentration', severity: 'high', count: 15 },
      ],
    },
    usageExample: `<HealthScorecardWidget
  overallScore={68}
  scoreLabel="Moderate Health"
  metrics={[...]}
  concerns={[...]}
/>`,
  },

  // ============================================
  // SUPPLIER FOCUSED
  // ============================================
  {
    id: 'supplier-risk-card-widget',
    type: 'supplier_risk_card',
    component: 'SupplierRiskCardWidget',
    name: 'SupplierRiskCardWidget',
    category: 'supplier',
    description: 'Detailed supplier risk profile card with score, trend, and key factors.',
    intents: ['supplier_deep_dive'],
    subIntents: ['supplier_overview', 'score_inquiry'],
    priority: 100,
    requiredData: ['supplier'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'supplier_detail',
    expandsTo: 'SupplierDetailArtifact',
    props: [
      { name: 'data', type: 'SupplierRiskCardData', required: true, description: 'Supplier data object' },
      { name: 'onViewDetails', type: '() => void', required: false, description: 'Callback to view full details' },
      { name: 'onFindAlternatives', type: '() => void', required: false, description: 'Callback to find alternatives' },
    ],
    demoData: {
      data: {
        supplierId: '1',
        supplierName: 'Apple Inc.',
        riskScore: 85,
        riskLevel: 'high',
        trend: 'worsening',
        category: 'Electronics',
        location: { city: 'Cupertino', country: 'USA', region: 'North America' },
        spendFormatted: '$10.0M',
        lastUpdated: 'May 3, 2024',
      },
    },
    usageExample: `<SupplierRiskCardWidget
  data={{
    supplierId: '1',
    supplierName: 'Apple Inc.',
    riskScore: 85,
    riskLevel: 'high',
    trend: 'worsening',
    category: 'Electronics',
    location: { city: 'Cupertino', country: 'USA', region: 'North America' },
    spendFormatted: '$10.0M',
    lastUpdated: 'May 3, 2024',
  }}
/>`,
  },
  {
    id: 'supplier-table-widget',
    type: 'supplier_table',
    component: 'SupplierTableWidget',
    name: 'SupplierTableWidget',
    category: 'supplier',
    description: 'Sortable table of suppliers with risk scores and key metrics.',
    intents: ['filtered_discovery', 'action_trigger', 'explanation_why'],
    subIntents: ['by_risk_level', 'by_risk_factor', 'by_attribute', 'compound_filter'],
    priority: 100,
    requiredData: ['suppliers'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'supplier_table',
    expandsTo: 'SupplierTableArtifact',
    props: [
      { name: 'data', type: 'SupplierTableData', required: true, description: 'Table data with suppliers array' },
      { name: 'onRowClick', type: '(supplier) => void', required: false, description: 'Callback when row is clicked' },
      { name: 'onViewAll', type: '() => void', required: false, description: 'Callback to view all suppliers' },
    ],
    demoData: {
      data: {
        suppliers: demoSuppliers,
        totalCount: 14,
        columns: ['name', 'category', 'riskScore', 'spend'],
      },
    },
    usageExample: `<SupplierTableWidget
  data={{
    suppliers: [...],
    totalCount: 14,
  }}
  onRowClick={(supplier) => console.log(supplier)}
/>`,
  },
  {
    id: 'supplier-mini-card',
    type: 'supplier_mini',
    component: 'SupplierMiniCard',
    name: 'SupplierMiniCard',
    category: 'supplier',
    description: 'Compact inline supplier badge with risk score.',
    intents: ['supplier_deep_dive', 'filtered_discovery'],
    priority: 60,
    requiredData: ['supplier'],
    renderContexts: ['chat_compact'],
    sizes: ['S'],
    defaultSize: 'S',
    props: [
      { name: 'data', type: 'SupplierMiniData', required: true, description: 'Mini supplier data' },
      { name: 'onClick', type: '() => void', required: false, description: 'Click handler' },
    ],
    demoData: {
      data: {
        supplierId: '1',
        supplierName: 'Apple Inc.',
        riskScore: 85,
        riskLevel: 'high',
        trend: 'worsening',
        category: 'Electronics',
      },
    },
    usageExample: `<SupplierMiniCard
  data={{
    supplierName: 'Apple Inc.',
    riskScore: 85,
    riskLevel: 'high',
  }}
  onClick={() => {}}
/>`,
  },
  {
    id: 'comparison-table-widget',
    type: 'comparison_table',
    component: 'ComparisonTableWidget',
    name: 'ComparisonTableWidget',
    category: 'supplier',
    description: 'Side-by-side comparison of 2-4 suppliers with metrics.',
    intents: ['comparison'],
    priority: 100,
    requiredData: ['suppliers'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'L',
    artifactType: 'supplier_comparison',
    expandsTo: 'ComparisonArtifact',
    props: [
      { name: 'data', type: 'ComparisonTableData', required: true, description: 'Comparison data with suppliers array' },
      { name: 'onSelectSupplier', type: '(supplier) => void', required: false, description: 'Callback when supplier selected' },
    ],
    demoData: {
      data: {
        suppliers: [
          { id: '1', name: 'Apple Inc.', riskScore: 85, riskLevel: 'high', category: 'Electronics', location: 'USA', spend: '$10.0M', trend: 'worsening', strengths: ['Strong quality', 'Global reach'], weaknesses: ['High risk score', 'Single source'] },
          { id: '2', name: 'Flash Cleaning', riskScore: 52, riskLevel: 'medium', category: 'Services', location: 'Germany', spend: '$2.1M', trend: 'stable', strengths: ['Good ESG rating', 'Competitive pricing'], weaknesses: ['Limited capacity', 'Regional only'] },
        ],
        comparisonDimensions: ['Risk Score', 'Spend', 'Location', 'Trend'],
        recommendation: 'Flash Cleaning offers lower risk with competitive pricing.',
      },
    },
    usageExample: `<ComparisonTableWidget
  data={{
    suppliers: [
      { id: '1', name: 'Apple Inc.', riskScore: 85, riskLevel: 'high', category: 'Electronics', location: 'USA', spend: '$10.0M', trend: 'worsening', strengths: ['Strong quality'], weaknesses: ['High risk'] },
    ],
    comparisonDimensions: ['Risk Score', 'Spend', 'Location', 'Trend'],
    recommendation: 'Flash Cleaning offers lower risk.',
  }}
/>`,
  },

  // ============================================
  // TRENDS & ALERTS
  // ============================================
  {
    id: 'alert-card-widget',
    type: 'alert_card',
    component: 'AlertCardWidget',
    name: 'AlertCardWidget',
    category: 'trends',
    description: 'Risk alert notification with severity and affected suppliers.',
    intents: ['trend_detection'],
    subIntents: ['recent_changes', 'change_direction'],
    priority: 100,
    requiredData: ['riskChanges'],
    renderContexts: ['chat'],
    sizes: ['M'],
    defaultSize: 'M',
    artifactType: 'supplier_table',
    props: [
      { name: 'data', type: 'AlertCardData', required: true, description: 'Alert data object' },
      { name: 'onViewDetails', type: '() => void', required: false, description: 'View details callback' },
    ],
    demoData: {
      data: {
        alertType: 'risk_increase',
        severity: 'warning',
        title: '2 suppliers moved to High Risk',
        affectedSuppliers: [
          { name: 'Apple Inc.', previousScore: 72, currentScore: 85, change: '+13' },
        ],
        timestamp: '2 hours ago',
        actionRequired: true,
        suggestedAction: 'Review affected suppliers',
      },
    },
    usageExample: `<AlertCardWidget
  data={{
    alertType: 'risk_increase',
    severity: 'warning',
    title: '2 suppliers moved to High Risk',
    affectedSuppliers: [...],
    timestamp: '2 hours ago',
    actionRequired: true,
  }}
/>`,
  },
  {
    id: 'trend-chart-widget',
    type: 'trend_chart',
    component: 'TrendChartWidget',
    name: 'TrendChartWidget',
    category: 'trends',
    description: 'Time series chart showing trends over time.',
    intents: ['trend_detection', 'supplier_deep_dive'],
    subIntents: ['historical'],
    priority: 90,
    requiredData: ['riskChanges'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    props: [
      { name: 'data', type: 'TrendChartData', required: true, description: 'Chart data with data points' },
      { name: 'height', type: 'number', required: false, default: '200', description: 'Chart height in pixels' },
    ],
    demoData: {
      data: {
        title: 'Portfolio Risk Score',
        dataPoints: [
          { date: 'Jan', value: 52 },
          { date: 'Feb', value: 55 },
          { date: 'Mar', value: 62 },
          { date: 'Apr', value: 68 },
        ],
        changeDirection: 'up',
        changeSummary: '+16 points over 4 months',
      },
    },
    usageExample: `<TrendChartWidget
  data={{
    title: 'Portfolio Risk Score',
    dataPoints: [
      { date: 'Jan', value: 52 },
      { date: 'Feb', value: 55 },
    ],
  }}
/>`,
  },
  {
    id: 'trend-change-indicator',
    type: 'trend_indicator',
    component: 'TrendChangeIndicator',
    name: 'TrendChangeIndicator',
    category: 'trends',
    description: 'Simple trend indicator showing score change.',
    intents: ['trend_detection'],
    priority: 70,
    requiredData: ['riskChanges'],
    renderContexts: ['chat_compact'],
    sizes: ['S', 'M'],
    defaultSize: 'S',
    props: [
      { name: 'previousScore', type: 'number', required: true, description: 'Previous score value' },
      { name: 'currentScore', type: 'number', required: true, description: 'Current score value' },
      { name: 'variant', type: "'inline' | 'card' | 'alert'", required: false, default: "'inline'", description: 'Display variant' },
      { name: 'changeDate', type: 'string', required: false, description: 'Date of change' },
    ],
    demoData: {
      previousScore: 72,
      currentScore: 85,
      previousLevel: 'medium',
      currentLevel: 'high',
      changeDate: 'May 3, 2024',
      variant: 'card',
    },
    usageExample: `<TrendChangeIndicator
  previousScore={72}
  currentScore={85}
  variant="card"
/>`,
  },
  {
    id: 'event-timeline-widget',
    type: 'event_timeline',
    component: 'EventTimelineWidget',
    name: 'EventTimelineWidget',
    category: 'trends',
    description: 'Timeline of events and changes with icons and dates.',
    intents: ['trend_detection', 'supplier_deep_dive'],
    priority: 85,
    requiredData: ['events'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    props: [
      { name: 'data', type: 'EventTimelineData', required: true, description: 'Timeline data with events array' },
      { name: 'onEventClick', type: '(id: string) => void', required: false, description: 'Event click handler' },
    ],
    demoData: {
      data: {
        events: [
          { id: '1', date: '2024-05-06', type: 'alert', title: 'Risk increased', severity: 'critical' },
          { id: '2', date: '2024-05-03', type: 'news', title: 'Market update', severity: 'warning' },
        ],
        timeRange: { start: 'Apr 1', end: 'May 6' },
      },
    },
    usageExample: `<EventTimelineWidget
  data={{
    events: [...],
    timeRange: { start: 'Apr 1', end: 'May 6' },
  }}
/>`,
  },
  {
    id: 'events-feed-widget',
    type: 'events_feed',
    component: 'EventsFeedWidget',
    name: 'EventsFeedWidget',
    category: 'trends',
    description: 'Feed of recent events and alerts.',
    intents: ['trend_detection', 'market_context'],
    subIntents: ['news_events'],
    priority: 95,
    requiredData: ['events'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    props: [
      { name: 'events', type: 'EventItem[]', required: true, description: 'Array of events' },
      { name: 'onViewAll', type: '() => void', required: false, description: 'View all callback' },
      { name: 'onEventClick', type: '(id: string) => void', required: false, description: 'Event click handler' },
    ],
    demoData: {
      events: [
        { id: '1', type: 'alert', title: 'Apple Inc. moved to High', timestamp: '2h ago', impact: 'negative' },
        { id: '2', type: 'news', title: 'Semiconductor shortage update', timestamp: '5h ago', impact: 'negative' },
      ],
    },
    usageExample: `<EventsFeedWidget
  events={[
    { id: '1', type: 'alert', title: 'Risk increased', timestamp: '2h ago' },
  ]}
/>`,
  },

  // ============================================
  // MARKET & CONTEXT
  // ============================================
  {
    id: 'price-gauge-widget',
    type: 'price_gauge',
    component: 'PriceGaugeWidget',
    name: 'PriceGaugeWidget',
    category: 'market',
    description: 'Commodity price indicator with gauge visualization.',
    intents: ['market_context', 'inflation_scenarios'],
    subIntents: ['commodity_drivers', 'price_forecast', 'none'],  // Also for price forecast queries
    priority: 110,  // Higher than scenario_card (100) for price_forecast with commodityData
    requiredData: ['commodityData'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M'],
    defaultSize: 'M',
    artifactType: 'commodity_dashboard',
    expandsTo: 'CommodityDashboardArtifact',
    props: [
      { name: 'commodity', type: 'string', required: true, description: 'Commodity name' },
      { name: 'currentPrice', type: 'number', required: true, description: 'Current price (numeric)' },
      { name: 'unit', type: 'string', required: true, description: 'Price unit (mt, lb, kg)' },
      { name: 'currency', type: 'string', required: true, description: 'Currency code (USD, EUR)' },
      { name: 'gaugePosition', type: 'number', required: true, description: 'Gauge position 0-100' },
      { name: 'change24h', type: '{ value: number, percent: number }', required: true, description: '24h change (numeric)' },
      { name: 'change30d', type: '{ value: number, percent: number }', required: true, description: '30d change (numeric)' },
      { name: 'market', type: 'string', required: true, description: 'Market identifier (LME, COMEX)' },
    ],
    demoData: {
      data: {
        commodity: 'Copper',
        currentPrice: 8245,
        unit: 'mt',
        currency: 'USD',
        lastUpdated: 'Beroe today',
        gaugeMin: 5772,
        gaugeMax: 10719,
        gaugePosition: 50,
        change24h: { value: -125, percent: -1.5 },
        change30d: { value: -320, percent: -3.7 },
        market: 'LME',
        tags: ['Softening', 'Demand Weak'],
      },
    },
    usageExample: `<PriceGaugeWidget
  data={{
    commodity: "Copper",
    currentPrice: 8245,
    unit: "mt",
    currency: "USD",
    gaugePosition: 50,
    change24h: { value: -125, percent: -1.5 },
    change30d: { value: -320, percent: -3.7 },
    market: "LME"
  }}
/>`,
  },
  {
    id: 'news-item-card',
    type: 'news_item',
    component: 'NewsItemCard',
    name: 'NewsItemCard',
    category: 'market',
    description: 'News article card with source and sentiment.',
    intents: ['market_context'],
    priority: 85,
    requiredData: ['none'],
    renderContexts: ['chat'],
    sizes: ['S', 'M'],
    defaultSize: 'M',
    props: [
      { name: 'data', type: 'NewsItemData', required: true, description: 'News item data' },
      { name: 'size', type: "'S' | 'M'", required: false, default: "'M'", description: 'Card size' },
      { name: 'onClick', type: '() => void', required: false, description: 'Click handler' },
    ],
    demoData: {
      data: {
        title: 'Semiconductor shortage affects Q2 production',
        source: 'Reuters',
        timestamp: '2h ago',
        category: 'Supply Chain',
        sentiment: 'negative',
      },
    },
    usageExample: `<NewsItemCard
  data={{
    title: 'Semiconductor shortage...',
    source: 'Reuters',
    timestamp: '2h ago',
    sentiment: 'negative',
  }}
/>`,
  },

  // ============================================
  // CATEGORIES & REGIONS
  // ============================================
  {
    id: 'category-breakdown-widget',
    type: 'category_breakdown',
    component: 'CategoryBreakdownWidget',
    name: 'CategoryBreakdownWidget',
    category: 'categories',
    description: 'Breakdown of spend and risk by category.',
    intents: ['portfolio_overview', 'filtered_discovery'],
    subIntents: ['by_dimension'],
    priority: 105,
    requiredData: ['portfolio', 'suppliers'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'portfolio_dashboard',
    props: [
      { name: 'data', type: 'CategoryBreakdownData', required: true, description: 'Category breakdown data' },
      { name: 'onCategoryClick', type: '(name: string) => void', required: false, description: 'Category click handler' },
    ],
    demoData: {
      data: {
        categories: [
          { name: 'Electronics', supplierCount: 8, spendFormatted: '$45M', avgRiskScore: 68 },
          { name: 'Raw Materials', supplierCount: 12, spendFormatted: '$32M', avgRiskScore: 52 },
        ],
      },
    },
    usageExample: `<CategoryBreakdownWidget
  data={{
    categories: [
      { name: 'Electronics', supplierCount: 8, spendFormatted: '$45M' },
    ],
  }}
/>`,
  },
  {
    id: 'region-list-widget',
    type: 'region_list',
    component: 'RegionListWidget',
    name: 'RegionListWidget',
    category: 'categories',
    description: 'List of regions with supplier counts and flags.',
    intents: ['portfolio_overview', 'filtered_discovery'],
    subIntents: ['by_dimension'],
    priority: 90,
    requiredData: ['portfolio'],
    renderContexts: ['chat'],
    sizes: ['S', 'M'],
    defaultSize: 'M',
    props: [
      { name: 'data', type: 'RegionListData', required: true, description: 'Region list data' },
      { name: 'size', type: "'S' | 'M'", required: false, default: "'M'", description: 'Widget size' },
      { name: 'onRegionClick', type: '(code: string) => void', required: false, description: 'Region click handler' },
    ],
    demoData: {
      data: {
        regions: [
          { name: 'United States', code: 'US', supplierCount: 12, avgRiskScore: 48, flag: '🇺🇸' },
          { name: 'China', code: 'CN', supplierCount: 15, avgRiskScore: 65, flag: '🇨🇳' },
        ],
        totalSuppliers: 45,
      },
    },
    usageExample: `<RegionListWidget
  data={{
    regions: [
      { name: 'United States', code: 'US', supplierCount: 12, flag: '🇺🇸' },
    ],
  }}
/>`,
  },
  {
    id: 'category-badge',
    type: 'category_badge',
    component: 'CategoryBadge',
    name: 'CategoryBadge',
    category: 'categories',
    description: 'Compact category indicator badge.',
    intents: ['filtered_discovery'],
    priority: 50,
    requiredData: ['none'],
    renderContexts: ['chat_compact'],
    sizes: ['S'],
    defaultSize: 'S',
    props: [
      { name: 'data', type: 'CategoryBadgeData', required: true, description: 'Badge data' },
      { name: 'onClick', type: '() => void', required: false, description: 'Click handler' },
    ],
    demoData: {
      data: {
        name: 'Electronics',
        supplierCount: 8,
        riskLevel: 'medium-high',
        spend: '$45M',
      },
    },
    usageExample: `<CategoryBadge
  data={{ name: 'Electronics', supplierCount: 8, riskLevel: 'medium-high' }}
/>`,
  },
  {
    id: 'status-badge',
    type: 'status_badge',
    component: 'StatusBadge',
    name: 'StatusBadge',
    category: 'categories',
    description: 'Simple status indicator badge.',
    intents: ['setup_config', 'action_trigger'],
    priority: 50,
    requiredData: ['none'],
    renderContexts: ['chat_compact'],
    sizes: ['S', 'M'],
    defaultSize: 'S',
    props: [
      { name: 'data', type: 'StatusBadgeData', required: true, description: 'Status data' },
      { name: 'size', type: "'S' | 'M'", required: false, default: "'S'", description: 'Badge size' },
    ],
    demoData: {
      data: {
        status: 'active',
        label: 'Active',
        detail: 'Last sync 2h ago',
      },
    },
    usageExample: `<StatusBadge
  data={{ status: 'active', label: 'Active' }}
/>`,
  },

  // ============================================
  // SCORE & BREAKDOWN
  // ============================================
  {
    id: 'score-breakdown-widget',
    type: 'score_breakdown',
    component: 'ScoreBreakdownWidget',
    name: 'ScoreBreakdownWidget',
    category: 'score',
    description: 'Detailed breakdown of risk score factors.',
    intents: ['supplier_deep_dive', 'explanation_why'],
    priority: 95,
    requiredData: ['supplier'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'supplier_detail',
    props: [
      { name: 'data', type: 'ScoreBreakdownData', required: true, description: 'Score breakdown data' },
      { name: 'onExpand', type: '() => void', required: false, description: 'Expand callback' },
    ],
    demoData: {
      data: {
        totalScore: 72,
        riskLevel: 'medium-high',
        factors: [
          { name: 'Financial Health', score: 78, weight: 25, impact: 'negative' },
          { name: 'ESG Compliance', score: 65, weight: 20, impact: 'negative' },
          { name: 'Delivery Performance', score: 85, weight: 20, impact: 'positive' },
        ],
        lastUpdated: '2 days ago',
      },
    },
    usageExample: `<ScoreBreakdownWidget
  data={{
    totalScore: 72,
    riskLevel: 'medium-high',
    factors: [...],
  }}
/>`,
  },
  {
    id: 'factor-breakdown-card',
    type: 'factor_breakdown',
    component: 'FactorBreakdownCard',
    name: 'FactorBreakdownCard',
    category: 'score',
    description: 'Risk factors breakdown by tier with scores.',
    intents: ['supplier_deep_dive', 'explanation_why'],
    subIntents: ['score_inquiry'],
    priority: 90,
    requiredData: ['supplier'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'supplier_detail',
    props: [
      { name: 'supplierName', type: 'string', required: true, description: 'Supplier name' },
      { name: 'overallScore', type: 'number', required: true, description: 'Overall risk score' },
      { name: 'level', type: 'RiskLevel', required: true, description: 'Risk level' },
      { name: 'factors', type: 'Factor[]', required: true, description: 'Array of factors' },
    ],
    demoData: {
      supplierName: 'Apple Inc.',
      overallScore: 85,
      level: 'high',
      factors: [
        { id: '1', name: 'Financial Health', score: 78, weight: 25, tier: 'tier1' },
        { id: '2', name: 'ESG', score: 65, weight: 20, tier: 'tier2' },
      ],
    },
    usageExample: `<FactorBreakdownCard
  supplierName="Apple Inc."
  overallScore={85}
  level="high"
  factors={[...]}
/>`,
  },

  // ============================================
  // GENERAL PURPOSE
  // ============================================
  {
    id: 'stat-card',
    type: 'stat_card',
    component: 'StatCard',
    name: 'StatCard',
    category: 'general',
    description: 'Single statistic display with optional trend indicator.',
    intents: ['portfolio_overview', 'market_context', 'general'],
    priority: 70,
    requiredData: ['none'],
    renderContexts: ['chat', 'chat_compact'],
    sizes: ['S', 'M'],
    defaultSize: 'M',
    props: [
      { name: 'label', type: 'string', required: true, description: 'Stat label' },
      { name: 'value', type: 'string | number', required: true, description: 'Stat value' },
      { name: 'change', type: '{ value, direction, period }', required: false, description: 'Change indicator' },
      { name: 'color', type: "'default' | 'success' | 'warning' | 'danger'", required: false, default: "'default'", description: 'Color theme' },
      { name: 'icon', type: 'LucideIcon', required: false, description: 'Optional icon' },
    ],
    demoData: {
      label: 'High Risk Suppliers',
      value: 14,
      change: { value: 12, direction: 'up', period: 'vs last month' },
      color: 'danger',
    },
    usageExample: `<StatCard
  label="High Risk Suppliers"
  value={14}
  change={{ value: 12, direction: 'up' }}
  color="danger"
/>`,
  },
  {
    id: 'info-card',
    type: 'info_card',
    component: 'InfoCard',
    name: 'InfoCard',
    category: 'general',
    description: 'Informational card with optional bullets and actions.',
    intents: ['explanation_why', 'general', 'setup_config'],
    priority: 75,
    requiredData: ['none'],
    renderContexts: ['chat'],
    sizes: ['M'],
    defaultSize: 'M',
    props: [
      { name: 'title', type: 'string', required: true, description: 'Card title' },
      { name: 'content', type: 'string', required: true, description: 'Main content text' },
      { name: 'variant', type: "'info' | 'success' | 'warning' | 'error'", required: false, default: "'info'", description: 'Visual variant' },
      { name: 'bullets', type: 'string[]', required: false, description: 'Bullet points' },
      { name: 'action', type: '{ label, onClick }', required: false, description: 'Action button' },
    ],
    demoData: {
      title: 'Understanding Risk Scores',
      content: 'SRS (Supplier Risk Score) is calculated from multiple data sources.',
      variant: 'info',
      bullets: ['Scores range from 0-100', 'Higher scores = higher risk'],
    },
    usageExample: `<InfoCard
  title="Understanding Risk Scores"
  content="SRS is calculated from multiple sources."
  variant="info"
  bullets={['Scores range from 0-100']}
/>`,
  },
  {
    id: 'quote-card',
    type: 'quote_card',
    component: 'QuoteCard',
    name: 'QuoteCard',
    category: 'general',
    description: 'Highlighted quote or insight with source attribution.',
    intents: ['explanation_why', 'market_context'],
    priority: 75,
    requiredData: ['none'],
    renderContexts: ['chat'],
    sizes: ['S', 'M'],
    defaultSize: 'M',
    props: [
      { name: 'quote', type: 'string', required: true, description: 'Quote text' },
      { name: 'source', type: 'string', required: false, description: 'Source attribution' },
      { name: 'sentiment', type: "'positive' | 'negative' | 'neutral'", required: false, description: 'Sentiment indicator' },
      { name: 'highlight', type: 'string', required: false, description: 'Word/phrase to highlight' },
    ],
    demoData: {
      quote: 'Copper prices down 2.3% month-over-month due to softening demand.',
      source: 'Beroe Market Intelligence',
      sentiment: 'negative',
      highlight: '2.3%',
    },
    usageExample: `<QuoteCard
  quote="Copper prices down 2.3%..."
  source="Beroe"
  sentiment="negative"
/>`,
  },
  {
    id: 'recommendation-card',
    type: 'recommendation_card',
    component: 'RecommendationCard',
    name: 'RecommendationCard',
    category: 'general',
    description: 'AI recommendation with confidence level and reasoning.',
    intents: ['portfolio_overview', 'supplier_deep_dive', 'action_trigger'],
    priority: 85,
    requiredData: ['none'],
    renderContexts: ['chat'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    props: [
      { name: 'title', type: 'string', required: true, description: 'Recommendation title' },
      { name: 'recommendation', type: 'string', required: true, description: 'Main recommendation text' },
      { name: 'confidence', type: "'high' | 'medium' | 'low'", required: true, description: 'Confidence level' },
      { name: 'reasoning', type: 'string[]', required: false, description: 'Supporting reasons' },
      { name: 'actions', type: 'Action[]', required: false, description: 'Action buttons' },
    ],
    demoData: {
      title: 'Diversify China Exposure',
      recommendation: 'Consider adding suppliers from Vietnam or India.',
      confidence: 'high',
      reasoning: ['15 suppliers in China (33%)', 'Geopolitical tensions increasing'],
      actions: [{ label: 'Find Alternatives', primary: true }],
    },
    usageExample: `<RecommendationCard
  title="Diversify China Exposure"
  recommendation="Consider alternatives..."
  confidence="high"
  reasoning={[...]}
/>`,
  },
  {
    id: 'checklist-card',
    type: 'checklist_card',
    component: 'ChecklistCard',
    name: 'ChecklistCard',
    category: 'general',
    description: 'Interactive checklist with progress indicator.',
    intents: ['action_trigger', 'setup_config'],
    priority: 80,
    requiredData: ['none'],
    renderContexts: ['chat'],
    sizes: ['M'],
    defaultSize: 'M',
    props: [
      { name: 'title', type: 'string', required: true, description: 'Checklist title' },
      { name: 'items', type: 'ChecklistItem[]', required: true, description: 'Checklist items' },
      { name: 'interactive', type: 'boolean', required: false, default: 'false', description: 'Allow toggling items' },
      { name: 'showProgress', type: 'boolean', required: false, default: 'false', description: 'Show progress bar' },
    ],
    demoData: {
      title: 'Risk Mitigation Actions',
      subtitle: '3 of 5 complete',
      items: [
        { id: '1', label: 'Review high-risk suppliers', completed: true },
        { id: '2', label: 'Update ESG certifications', completed: true },
        { id: '3', label: 'Assess China alternatives', completed: false },
      ],
      showProgress: true,
    },
    usageExample: `<ChecklistCard
  title="Risk Mitigation Actions"
  items={[
    { id: '1', label: 'Review suppliers', completed: true },
  ]}
  showProgress
/>`,
  },
  {
    id: 'progress-card',
    type: 'progress_card',
    component: 'ProgressCard',
    name: 'ProgressCard',
    category: 'general',
    description: 'Step-by-step progress indicator.',
    intents: ['setup_config'],
    priority: 85,
    requiredData: ['none'],
    renderContexts: ['chat'],
    sizes: ['M'],
    defaultSize: 'M',
    props: [
      { name: 'title', type: 'string', required: true, description: 'Progress title' },
      { name: 'steps', type: 'ProgressStep[]', required: true, description: 'Progress steps' },
      { name: 'subtitle', type: 'string', required: false, description: 'Subtitle text' },
    ],
    demoData: {
      title: 'Onboarding Progress',
      subtitle: 'Setting up your risk profile',
      steps: [
        { id: '1', label: 'Upload supplier list', status: 'completed' },
        { id: '2', label: 'Connect data sources', status: 'completed' },
        { id: '3', label: 'Configure thresholds', status: 'current' },
        { id: '4', label: 'Set up alerts', status: 'upcoming' },
      ],
    },
    usageExample: `<ProgressCard
  title="Onboarding Progress"
  steps={[
    { id: '1', label: 'Upload list', status: 'completed' },
  ]}
/>`,
  },
  {
    id: 'executive-summary-card',
    type: 'executive_summary',
    component: 'ExecutiveSummaryCard',
    name: 'ExecutiveSummaryCard',
    category: 'general',
    description: 'Executive summary with key points and metrics.',
    intents: ['portfolio_overview', 'reporting_export'],
    priority: 80,
    requiredData: ['portfolio'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    props: [
      { name: 'title', type: 'string', required: false, description: 'Summary title' },
      { name: 'period', type: 'string', required: false, description: 'Time period' },
      { name: 'keyPoints', type: 'KeyPoint[]', required: true, description: 'Key points array' },
      { name: 'metrics', type: 'Metric[]', required: false, description: 'Summary metrics' },
      { name: 'focusAreas', type: 'string[]', required: false, description: 'Focus areas' },
    ],
    demoData: {
      title: 'Portfolio Risk Summary',
      period: 'Q2 2024',
      keyPoints: [
        { text: 'High risk suppliers increased to 14%', type: 'concern', value: '+3%' },
        { text: 'Coverage improved with 8 new assessments', type: 'positive' },
      ],
      focusAreas: ['China concentration', 'ESG compliance'],
    },
    usageExample: `<ExecutiveSummaryCard
  title="Portfolio Risk Summary"
  period="Q2 2024"
  keyPoints={[...]}
/>`,
  },
  {
    id: 'data-list-card',
    type: 'data_list',
    component: 'DataListCard',
    name: 'DataListCard',
    category: 'general',
    description: 'Generic list display with status indicators.',
    intents: ['filtered_discovery', 'general'],
    priority: 70,
    requiredData: ['none'],
    renderContexts: ['chat'],
    sizes: ['M'],
    defaultSize: 'M',
    props: [
      { name: 'title', type: 'string', required: true, description: 'List title' },
      { name: 'items', type: 'DataListItem[]', required: true, description: 'List items' },
      { name: 'variant', type: "'default' | 'compact' | 'detailed'", required: false, default: "'default'", description: 'Display variant' },
      { name: 'maxItems', type: 'number', required: false, description: 'Max items to show' },
    ],
    demoData: {
      title: 'Top Risk Factors',
      items: [
        { id: '1', label: 'China Concentration', value: '33%', status: 'danger' },
        { id: '2', label: 'ESG Gaps', value: '8 suppliers', status: 'warning' },
      ],
      variant: 'default',
    },
    usageExample: `<DataListCard
  title="Top Risk Factors"
  items={[
    { id: '1', label: 'China Concentration', value: '33%' },
  ]}
/>`,
  },

  // ============================================
  // ACTIONS & NAVIGATION
  // ============================================
  {
    id: 'handoff-card',
    type: 'handoff_card',
    component: 'HandoffCard',
    name: 'HandoffCard',
    category: 'actions',
    description: 'Card for redirecting to dashboard or external view.',
    intents: ['restricted_query'],
    priority: 100,
    requiredData: ['none'],
    renderContexts: ['chat'],
    sizes: ['M'],
    defaultSize: 'M',
    props: [
      { name: 'title', type: 'string', required: true, description: 'Card title' },
      { name: 'description', type: 'string', required: true, description: 'Description text' },
      { name: 'linkText', type: 'string', required: true, description: 'Link button text' },
      { name: 'onNavigate', type: '() => void', required: true, description: 'Navigation callback' },
      { name: 'variant', type: "'default' | 'warning'", required: false, default: "'default'", description: 'Visual variant' },
      { name: 'restrictions', type: 'string[]', required: false, description: 'List of restrictions' },
    ],
    demoData: {
      title: 'Dashboard Access Required',
      description: 'Detailed breakdown requires direct dashboard access.',
      linkText: 'Open Risk Profile in Dashboard',
      restrictions: ['Financial health details', 'Cybersecurity assessment'],
    },
    usageExample: `<HandoffCard
  title="Dashboard Access Required"
  description="Detailed breakdown requires..."
  linkText="Open Dashboard"
  onNavigate={() => {}}
/>`,
  },
  {
    id: 'action-confirmation-card',
    type: 'action_card',
    component: 'ActionConfirmationCard',
    name: 'ActionConfirmationCard',
    category: 'actions',
    description: 'Confirmation card for completed actions.',
    intents: ['action_trigger'],
    priority: 100,
    requiredData: ['none'],
    renderContexts: ['chat'],
    sizes: ['M'],
    defaultSize: 'M',
    props: [
      { name: 'status', type: "'success' | 'warning' | 'error'", required: true, description: 'Action status' },
      { name: 'title', type: 'string', required: true, description: 'Confirmation title' },
      { name: 'message', type: 'string', required: true, description: 'Confirmation message' },
      { name: 'onUndo', type: '() => void', required: false, description: 'Undo callback' },
      { name: 'onViewResult', type: '() => void', required: false, description: 'View result callback' },
    ],
    demoData: {
      status: 'success',
      title: 'Action Complete',
      message: 'Flash Cleaning has been unfollowed from your portfolio.',
      viewResultLabel: 'View Portfolio',
    },
    usageExample: `<ActionConfirmationCard
  status="success"
  title="Action Complete"
  message="Supplier unfollowed."
  onViewResult={() => {}}
/>`,
  },
  {
    id: 'alternatives-preview-card',
    type: 'alternatives_preview',
    component: 'AlternativesPreviewCard',
    name: 'AlternativesPreviewCard',
    category: 'actions',
    description: 'Preview of alternative suppliers.',
    intents: ['action_trigger'],
    subIntents: ['find_alternatives'],
    priority: 115,
    requiredData: ['suppliers'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M'],
    defaultSize: 'M',
    artifactType: 'supplier_table',
    expandsTo: 'AlternativesArtifact',
    props: [
      { name: 'currentSupplier', type: 'string', required: true, description: 'Current supplier name' },
      { name: 'currentScore', type: 'number', required: true, description: 'Current supplier risk score' },
      { name: 'alternatives', type: 'Alternative[]', required: true, description: 'Alternative suppliers' },
      { name: 'onViewAll', type: '() => void', required: false, description: 'View all callback' },
    ],
    demoData: {
      currentSupplier: 'Apple Inc.',
      currentScore: 85,
      alternatives: [
        { id: '1', name: 'Flash Cleaning', score: 52, level: 'medium', category: 'Services', matchScore: 85 },
        { id: '2', name: 'Widget Co', score: 38, level: 'low', category: 'Components', matchScore: 72 },
      ],
    },
    usageExample: `<AlternativesPreviewCard
  currentSupplier="Apple Inc."
  currentScore={85}
  alternatives={[...]}
/>`,
  },
  {
    id: 'concentration-warning-card',
    type: 'concentration_warning',
    component: 'ConcentrationWarningCard',
    name: 'ConcentrationWarningCard',
    category: 'actions',
    description: 'Warning card for portfolio concentration risks.',
    intents: ['portfolio_overview', 'filtered_discovery'],
    priority: 85,
    requiredData: ['portfolio'],
    renderContexts: ['chat'],
    sizes: ['M'],
    defaultSize: 'M',
    props: [
      { name: 'type', type: "'region' | 'category' | 'supplier'", required: true, description: 'Concentration type' },
      { name: 'name', type: 'string', required: true, description: 'Concentrated area name' },
      { name: 'percentage', type: 'number', required: true, description: 'Concentration percentage' },
      { name: 'threshold', type: 'number', required: true, description: 'Warning threshold' },
      { name: 'affectedSpend', type: 'string', required: false, description: 'Affected spend amount' },
    ],
    demoData: {
      type: 'region',
      name: 'China',
      percentage: 45,
      threshold: 30,
      affectedSpend: '$4.5B',
      supplierCount: 15,
    },
    usageExample: `<ConcentrationWarningCard
  type="region"
  name="China"
  percentage={45}
  threshold={30}
/>`,
  },

  // ============================================
  // INFLATION WATCH
  // ============================================
  {
    id: 'inflation-summary-card',
    type: 'inflation_summary_card',
    component: 'InflationSummaryCard',
    name: 'InflationSummaryCard',
    category: 'inflation',
    description: 'Monthly inflation overview with key price changes, portfolio impact, and top drivers.',
    intents: ['inflation_summary'],
    subIntents: ['monthly_changes', 'top_movers'],
    priority: 100,
    requiredData: ['inflationSummary'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'inflation_dashboard',
    expandsTo: 'InflationDashboardArtifact',
    props: [
      { name: 'period', type: 'string', required: true, description: 'Time period (e.g., "March 2024")' },
      { name: 'headline', type: 'string', required: true, description: 'AI-generated headline summary' },
      { name: 'overallChange', type: 'PriceChangeData', required: true, description: 'Weighted average change with absolute, percent, direction' },
      { name: 'topIncreases', type: 'Array<{ commodity, change, impact }>', required: true, description: 'Top commodities with price increases' },
      { name: 'topDecreases', type: 'Array<{ commodity, change, benefit }>', required: true, description: 'Top commodities with price decreases' },
      { name: 'portfolioImpact', type: '{ amount, percent, direction }', required: true, description: 'Total portfolio spend impact' },
      { name: 'keyDrivers', type: 'string[]', required: true, description: 'Top 3 drivers of price changes' },
      { name: 'lastUpdated', type: 'string', required: true, description: 'Last data update timestamp' },
      { name: 'onViewDetails', type: '() => void', required: false, description: 'Callback to view full dashboard' },
      { name: 'delay', type: 'number', required: false, default: '0', description: 'Animation delay in seconds' },
    ],
    demoData: {
      period: 'March 2024',
      headline: 'Steel and aluminum prices surge amid supply constraints',
      overallChange: { absolute: 125000000, percent: 4.2, direction: 'up' },
      topIncreases: [
        { commodity: 'Steel', change: 8.5, impact: '$2.5M impact' },
        { commodity: 'Aluminum', change: 6.2, impact: '$1.8M impact' },
      ],
      topDecreases: [
        { commodity: 'Copper', change: -2.3, benefit: '$500K savings' },
      ],
      portfolioImpact: { amount: '$5.2M', percent: 4.2, direction: 'increase' },
      keyDrivers: ['China production cuts', 'EV demand surge', 'Energy costs'],
      lastUpdated: '2 hours ago',
    },
    usageExample: `<InflationSummaryCard
  period="March 2024"
  headline="Steel and aluminum prices surge..."
  overallChange={{ absolute: 125000000, percent: 4.2, direction: 'up' }}
  topIncreases={[{ commodity: 'Steel', change: 8.5, impact: '$2.5M' }]}
  topDecreases={[{ commodity: 'Copper', change: -2.3, benefit: '$500K' }]}
  portfolioImpact={{ amount: '$5.2M', percent: 4.2, direction: 'increase' }}
  keyDrivers={['China production cuts', 'EV demand surge']}
  lastUpdated="2 hours ago"
/>`,
  },
  {
    id: 'driver-breakdown-card',
    type: 'driver_breakdown_card',
    component: 'DriverBreakdownCard',
    name: 'DriverBreakdownCard',
    category: 'inflation',
    description: 'Root cause analysis showing factors driving commodity price changes with contribution percentages.',
    intents: ['inflation_drivers'],
    subIntents: ['commodity_drivers', 'market_drivers'],
    priority: 100,
    requiredData: ['commodityDrivers'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'driver_analysis',
    expandsTo: 'DriverAnalysisArtifact',
    props: [
      { name: 'commodity', type: 'string', required: true, description: 'Commodity name being analyzed' },
      { name: 'priceChange', type: 'PriceChangeData', required: true, description: 'Overall price change data' },
      { name: 'period', type: 'string', required: true, description: 'Analysis period' },
      { name: 'drivers', type: 'Array<{ name, category, contribution, direction, description }>', required: true, description: 'Contributing factors with impact' },
      { name: 'marketContext', type: 'string', required: false, description: 'Brief market context summary' },
      { name: 'sources', type: 'Array<{ title, source, url? }>', required: false, description: 'Data sources' },
      { name: 'onViewDetails', type: '() => void', required: false, description: 'Callback to view full analysis' },
      { name: 'delay', type: 'number', required: false, default: '0', description: 'Animation delay' },
    ],
    demoData: {
      commodity: 'Steel',
      priceChange: { absolute: 85, percent: 8.5, direction: 'up' },
      period: 'March 2024',
      drivers: [
        { name: 'China Production Cuts', category: 'Supply', contribution: 45, direction: 'up', description: 'Major mills reducing output amid environmental regulations' },
        { name: 'EV Manufacturing Demand', category: 'Demand', contribution: 30, direction: 'up', description: 'Auto sector increasing steel procurement' },
        { name: 'Energy Costs', category: 'Cost', contribution: 25, direction: 'up', description: 'Natural gas prices affecting production costs' },
      ],
      marketContext: 'Global steel markets remain tight as supply constraints persist.',
      sources: [
        { title: 'Steel Market Report', source: 'Beroe' },
        { title: 'Commodity Outlook', source: 'Reuters' },
      ],
    },
    usageExample: `<DriverBreakdownCard
  commodity="Steel"
  priceChange={{ absolute: 85, percent: 8.5, direction: 'up' }}
  period="March 2024"
  drivers={[
    { name: 'China Production Cuts', category: 'Supply', contribution: 45, direction: 'up', description: '...' },
  ]}
  marketContext="Global steel markets remain tight..."
/>`,
  },
  {
    id: 'spend-impact-card',
    type: 'spend_impact_card',
    component: 'SpendImpactCard',
    name: 'SpendImpactCard',
    category: 'inflation',
    description: 'Portfolio spend impact from inflation with breakdown by category and most affected areas.',
    intents: ['inflation_impact'],
    subIntents: ['spend_impact', 'category_exposure'],
    priority: 100,
    requiredData: ['portfolioExposure'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'impact_analysis',
    expandsTo: 'ImpactAnalysisArtifact',
    props: [
      { name: 'totalImpact', type: 'string', required: true, description: 'Total impact amount (e.g., "$5.2M")' },
      { name: 'totalImpactDirection', type: "'increase' | 'decrease'", required: true, description: 'Impact direction' },
      { name: 'impactPercent', type: 'number', required: true, description: 'Impact as percentage of total spend' },
      { name: 'timeframe', type: 'string', required: true, description: 'Comparison timeframe (e.g., "vs. last quarter")' },
      { name: 'breakdown', type: 'Array<{ category, amount, percent, direction }>', required: true, description: 'Impact by category' },
      { name: 'mostAffected', type: '{ type, name, impact }', required: true, description: 'Most affected area' },
      { name: 'recommendation', type: 'string', required: false, description: 'AI recommendation' },
      { name: 'onViewDetails', type: '() => void', required: false, description: 'Callback to view details' },
      { name: 'delay', type: 'number', required: false, default: '0', description: 'Animation delay' },
    ],
    demoData: {
      totalImpact: '$5.2M',
      totalImpactDirection: 'increase',
      impactPercent: 4.2,
      timeframe: 'vs. last quarter',
      breakdown: [
        { category: 'Raw Materials', amount: '$3.1M', percent: 60, direction: 'up' },
        { category: 'Components', amount: '$1.5M', percent: 29, direction: 'up' },
        { category: 'Services', amount: '$0.6M', percent: 11, direction: 'up' },
      ],
      mostAffected: { type: 'category', name: 'Raw Materials', impact: '$3.1M' },
      recommendation: 'Consider hedging steel exposure through forward contracts.',
    },
    usageExample: `<SpendImpactCard
  totalImpact="$5.2M"
  totalImpactDirection="increase"
  impactPercent={4.2}
  timeframe="vs. last quarter"
  breakdown={[
    { category: 'Raw Materials', amount: '$3.1M', percent: 60, direction: 'up' },
  ]}
  mostAffected={{ type: 'category', name: 'Raw Materials', impact: '$3.1M' }}
/>`,
  },
  {
    id: 'justification-card',
    type: 'justification_card',
    component: 'JustificationCard',
    name: 'JustificationCard',
    category: 'inflation',
    description: 'Price increase validation with market comparison, verdict, and negotiation leverage assessment.',
    intents: ['inflation_justification'],
    subIntents: ['validate_increase', 'negotiate_support', 'market_fairness'],
    priority: 100,
    requiredData: ['justificationData'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'justification_report',
    expandsTo: 'JustificationReportArtifact',
    props: [
      { name: 'supplierName', type: 'string', required: true, description: 'Supplier requesting increase' },
      { name: 'commodity', type: 'string', required: true, description: 'Commodity name' },
      { name: 'requestedIncrease', type: 'number', required: true, description: 'Requested increase percentage' },
      { name: 'marketBenchmark', type: 'number', required: true, description: 'Market average increase' },
      { name: 'verdict', type: 'JustificationVerdict', required: true, description: 'justified | partially_justified | questionable | insufficient_data' },
      { name: 'verdictLabel', type: 'string', required: true, description: 'Human-readable verdict' },
      { name: 'keyPoints', type: 'Array<{ point, supports }>', required: true, description: 'Key findings (supports: true = supplier, false = buyer)' },
      { name: 'recommendation', type: 'string', required: true, description: 'Negotiation recommendation' },
      { name: 'negotiationLeverage', type: "'strong' | 'moderate' | 'weak'", required: true, description: 'Buyer leverage assessment' },
      { name: 'onViewDetails', type: '() => void', required: false, description: 'Callback to view full report' },
      { name: 'delay', type: 'number', required: false, default: '0', description: 'Animation delay' },
    ],
    demoData: {
      supplierName: 'Acme Steel',
      commodity: 'Cold Rolled Steel',
      requestedIncrease: 12,
      marketBenchmark: 8.5,
      verdict: 'partially_justified',
      verdictLabel: 'Partially Justified',
      keyPoints: [
        { point: 'Market prices increased 8.5% average', supports: true },
        { point: 'Supplier margin already above industry average', supports: false },
        { point: 'Alternative suppliers available at lower rates', supports: false },
      ],
      recommendation: 'Counter-offer at 9% increase with volume commitment for additional discount.',
      negotiationLeverage: 'moderate',
    },
    usageExample: `<JustificationCard
  supplierName="Acme Steel"
  commodity="Cold Rolled Steel"
  requestedIncrease={12}
  marketBenchmark={8.5}
  verdict="partially_justified"
  verdictLabel="Partially Justified"
  keyPoints={[{ point: 'Market prices increased 8.5%', supports: true }]}
  recommendation="Counter-offer at 9%..."
  negotiationLeverage="moderate"
/>`,
  },
  {
    id: 'scenario-card',
    type: 'scenario_card',
    component: 'ScenarioCard',
    name: 'ScenarioCard',
    category: 'inflation',
    description: 'What-if scenario result showing projected impact, confidence level, and recommendations.',
    intents: ['inflation_scenarios'],
    subIntents: ['what_if_increase', 'budget_impact', 'price_forecast'],
    priority: 100,
    requiredData: ['scenarioData'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'scenario_planner',
    expandsTo: 'ScenarioPlannerArtifact',
    props: [
      { name: 'scenarioName', type: 'string', required: true, description: 'Scenario name' },
      { name: 'description', type: 'string', required: true, description: 'Scenario description' },
      { name: 'assumption', type: 'string', required: true, description: 'Key assumption (e.g., "Steel prices increase 15%")' },
      { name: 'currentState', type: '{ label, value }', required: true, description: 'Current state' },
      { name: 'projectedState', type: '{ label, value }', required: true, description: 'Projected state' },
      { name: 'delta', type: '{ amount, percent, direction }', required: true, description: 'Change amount' },
      { name: 'confidence', type: "'high' | 'medium' | 'low'", required: true, description: 'Projection confidence' },
      { name: 'topImpacts', type: 'string[]', required: true, description: 'Top 3 impact areas' },
      { name: 'recommendation', type: 'string', required: false, description: 'Suggested action' },
      { name: 'onViewDetails', type: '() => void', required: false, description: 'View full scenario' },
      { name: 'onRunScenario', type: '() => void', required: false, description: 'Modify scenario' },
      { name: 'delay', type: 'number', required: false, default: '0', description: 'Animation delay' },
    ],
    demoData: {
      scenarioName: 'Steel Price Surge',
      description: 'Impact analysis if steel prices continue upward trend',
      assumption: 'Steel prices increase 15% over next quarter',
      currentState: { label: 'Current Q2 Spend', value: '$45.2M' },
      projectedState: { label: 'Projected Q3 Spend', value: '$52.0M' },
      delta: { amount: '$6.8M', percent: 15, direction: 'up' },
      confidence: 'medium',
      topImpacts: [
        'Raw materials budget +$4.2M',
        'Component costs +$1.8M',
        'Margin compression 2.1%',
      ],
      recommendation: 'Consider forward contracts to lock in current rates.',
    },
    usageExample: `<ScenarioCard
  scenarioName="Steel Price Surge"
  description="Impact if steel prices continue upward..."
  assumption="Steel prices increase 15%"
  currentState={{ label: 'Current Q2 Spend', value: '$45.2M' }}
  projectedState={{ label: 'Projected Q3 Spend', value: '$52.0M' }}
  delta={{ amount: '$6.8M', percent: 15, direction: 'up' }}
  confidence="medium"
  topImpacts={['Raw materials budget +$4.2M']}
/>`,
  },
  {
    id: 'executive-brief-card',
    type: 'executive_brief_card',
    component: 'ExecutiveBriefCard',
    name: 'ExecutiveBriefCard',
    category: 'inflation',
    description: 'Shareable executive summary with key metrics, highlights, and outlook for stakeholder communication.',
    intents: ['inflation_communication'],
    subIntents: ['executive_brief', 'stakeholder_deck'],
    priority: 100,
    requiredData: ['inflationSummary'],
    renderContexts: ['chat', 'panel'],
    sizes: ['M', 'L'],
    defaultSize: 'M',
    artifactType: 'executive_presentation',
    expandsTo: 'ExecutivePresentationArtifact',
    props: [
      { name: 'title', type: 'string', required: true, description: 'Brief title' },
      { name: 'period', type: 'string', required: true, description: 'Reporting period' },
      { name: 'summary', type: 'string', required: true, description: '2-3 sentence AI summary' },
      { name: 'keyMetrics', type: 'Array<{ label, value, change?, status }>', required: true, description: 'Key metrics with status' },
      { name: 'highlights', type: 'Array<{ type, text }>', required: true, description: 'Highlights (type: concern | opportunity | action)' },
      { name: 'outlook', type: 'string', required: true, description: 'Forward-looking statement' },
      { name: 'onShare', type: '() => void', required: false, description: 'Share callback' },
      { name: 'onCopy', type: '() => void', required: false, description: 'Copy callback' },
      { name: 'onViewDetails', type: '() => void', required: false, description: 'View full presentation' },
      { name: 'delay', type: 'number', required: false, default: '0', description: 'Animation delay' },
    ],
    demoData: {
      title: 'Inflation Impact Brief',
      period: 'Q1 2024',
      summary: 'Commodity prices increased 4.2% on average this quarter, driven primarily by steel and aluminum. Total portfolio impact is $5.2M, with raw materials accounting for 60% of the increase.',
      keyMetrics: [
        { label: 'Avg Price Change', value: '+4.2%', status: 'negative' },
        { label: 'Portfolio Impact', value: '$5.2M', status: 'negative' },
        { label: 'Hedged Exposure', value: '35%', status: 'neutral' },
        { label: 'Suppliers Affected', value: '28', status: 'negative' },
      ],
      highlights: [
        { type: 'concern', text: 'Steel prices up 8.5%, highest increase in 18 months' },
        { type: 'opportunity', text: 'Copper prices declining, potential for renegotiation' },
        { type: 'action', text: 'Review forward contracts for Q2 steel purchases' },
      ],
      outlook: 'Prices expected to stabilize in Q2 as supply constraints ease. Recommend maintaining hedging positions.',
    },
    usageExample: `<ExecutiveBriefCard
  title="Inflation Impact Brief"
  period="Q1 2024"
  summary="Commodity prices increased 4.2%..."
  keyMetrics={[
    { label: 'Avg Price Change', value: '+4.2%', status: 'negative' },
  ]}
  highlights={[
    { type: 'concern', text: 'Steel prices up 8.5%' },
  ]}
  outlook="Prices expected to stabilize..."
/>`,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get widget for a specific intent and data context
 */
export function getWidgetForIntent(
  intent: IntentCategory,
  subIntent?: SubIntent,
  availableData: RequiredData[] = [],
  renderContext: RenderContext = 'chat'
): WidgetRegistryEntry | null {
  const matches = WIDGET_REGISTRY.filter(w => {
    // Must match intent
    if (!w.intents.includes(intent)) return false;

    // If sub-intent specified, prefer widgets that handle it
    if (subIntent && w.subIntents && w.subIntents.length > 0) {
      // If widget has sub-intents and none match, deprioritize but don't exclude
      // This allows fallback to general intent widgets
    }

    // Must match render context
    if (!w.renderContexts.includes(renderContext)) return false;

    // Must have required data (or require 'none')
    const hasAllData = w.requiredData.every(
      req => req === 'none' || availableData.includes(req)
    );
    if (!hasAllData) return false;

    return true;
  });

  if (matches.length === 0) return null;

  // Sort by priority (and sub-intent match as secondary)
  matches.sort((a, b) => {
    // Boost priority if sub-intent matches
    const aSubMatch = subIntent && a.subIntents?.includes(subIntent) ? 10 : 0;
    const bSubMatch = subIntent && b.subIntents?.includes(subIntent) ? 10 : 0;

    return (b.priority + bSubMatch) - (a.priority + aSubMatch);
  });

  return matches[0];
}

/**
 * Get widget by ID
 */
export function getWidgetById(id: string): WidgetRegistryEntry | undefined {
  return WIDGET_REGISTRY.find(w => w.id === id);
}

/**
 * Get widget by type
 */
export function getWidgetByType(type: WidgetType): WidgetRegistryEntry | undefined {
  return WIDGET_REGISTRY.find(w => w.type === type);
}

/**
 * Get widget by component name
 */
export function getWidgetByComponent(component: string): WidgetRegistryEntry | undefined {
  return WIDGET_REGISTRY.find(w => w.component === component);
}

/**
 * Get widgets by category
 */
export function getWidgetsByCategory(category: WidgetCategory): WidgetRegistryEntry[] {
  return WIDGET_REGISTRY.filter(w => w.category === category);
}

/**
 * Search widgets by query
 */
export function searchWidgets(query: string): WidgetRegistryEntry[] {
  const lower = query.toLowerCase();
  return WIDGET_REGISTRY.filter(w =>
    w.name.toLowerCase().includes(lower) ||
    w.description.toLowerCase().includes(lower) ||
    w.component.toLowerCase().includes(lower) ||
    w.intents.some(i => i.toLowerCase().includes(lower))
  );
}

/**
 * Get category counts
 */
export function getCategoryCounts(): Record<WidgetCategory, number> {
  const counts = {} as Record<WidgetCategory, number>;
  CATEGORY_ORDER.forEach(cat => {
    counts[cat] = WIDGET_REGISTRY.filter(w => w.category === cat).length;
  });
  return counts;
}

/**
 * Get all widgets that handle a specific intent
 */
export function getWidgetsForIntent(intent: IntentCategory): WidgetRegistryEntry[] {
  return WIDGET_REGISTRY.filter(w => w.intents.includes(intent));
}

/**
 * Validate that all intents have at least one widget mapping
 */
export function validateIntentCoverage(allIntents: IntentCategory[]): {
  covered: IntentCategory[];
  uncovered: IntentCategory[];
} {
  const covered: IntentCategory[] = [];
  const uncovered: IntentCategory[] = [];

  allIntents.forEach(intent => {
    const widgets = getWidgetsForIntent(intent);
    if (widgets.length > 0) {
      covered.push(intent);
    } else {
      uncovered.push(intent);
    }
  });

  return { covered, uncovered };
}

/**
 * Get component name for a widget type (for dynamic rendering)
 */
export function getComponentForType(type: WidgetType): string | null {
  const widget = getWidgetByType(type);
  return widget?.component || null;
}

/**
 * Get artifact expansion component for a widget
 */
export function getArtifactComponent(type: WidgetType): string | null {
  const widget = getWidgetByType(type);
  return widget?.expandsTo || null;
}
