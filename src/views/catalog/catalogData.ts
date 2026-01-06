// Widget Catalog Data
// Comprehensive documentation for all widgets

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
  | 'actions';

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

export interface WidgetCatalogEntry {
  id: string;
  name: string;
  component: string;
  category: WidgetCategory;
  description: string;
  sizes: ('S' | 'M' | 'L')[];
  defaultSize: 'S' | 'M' | 'L';
  props: PropDefinition[];
  demoData: Record<string, any>;
  usageExample: string;
}

export const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  portfolio: 'Portfolio & Overview',
  supplier: 'Supplier Focused',
  trends: 'Trends & Alerts',
  market: 'Market & Context',
  categories: 'Categories & Regions',
  score: 'Score & Breakdown',
  general: 'General Purpose',
  actions: 'Actions & Navigation',
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
];

// ============================================
// SHARED DEMO DATA
// ============================================

export const demoDistribution = {
  high: 2,
  'medium-high': 1,
  medium: 3,
  low: 4,
  unrated: 10,
};

export const demoSupplier = {
  id: '1',
  name: 'Apple Inc.',
  duns: '372280056',
  category: 'Electronics',
  location: { city: 'Cupertino', country: 'USA', region: 'North America' },
  spend: 10000000,
  spendFormatted: '$10.0M',
  criticality: 'high' as const,
  srs: {
    score: 85,
    level: 'high' as const,
    trend: 'worsening' as const,
    lastUpdated: 'May 3, 2024',
  },
};

export const demoSuppliers = [
  { id: '1', name: 'Apple Inc.', category: 'Electronics', location: 'USA', srs: { score: 85, level: 'high' as const, trend: 'worsening' as const }, spend: '$10.0M', spendFormatted: '$10.0M' },
  { id: '2', name: 'Flash Cleaning', category: 'Services', location: 'Germany', srs: { score: 52, level: 'medium' as const, trend: 'stable' as const }, spend: '$2.1M', spendFormatted: '$2.1M' },
  { id: '3', name: 'Widget Co', category: 'Components', location: 'China', srs: { score: 38, level: 'low' as const, trend: 'improving' as const }, spend: '$850K', spendFormatted: '$850K' },
];

// ============================================
// WIDGET CATALOG ENTRIES
// ============================================

export const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  // ============================================
  // PORTFOLIO & OVERVIEW
  // ============================================
  {
    id: 'risk-distribution-widget',
    name: 'RiskDistributionWidget',
    component: 'RiskDistributionWidget',
    category: 'portfolio',
    description: 'Donut chart showing risk distribution across the portfolio with interactive segments.',
    sizes: ['M', 'L'],
    defaultSize: 'M',
    props: [
      { name: 'distribution', type: 'RiskDistribution', required: true, description: 'Object with counts for each risk level (high, medium-high, medium, low, unrated)' },
      { name: 'totalSuppliers', type: 'number', required: true, description: 'Total number of suppliers in portfolio' },
      { name: 'onSegmentClick', type: '(level: string) => void', required: false, description: 'Callback when a segment is clicked' },
      { name: 'showLegend', type: 'boolean', required: false, default: 'true', description: 'Whether to show the legend' },
    ],
    demoData: {
      distribution: demoDistribution,
      totalSuppliers: 20,
    },
    usageExample: `<RiskDistributionWidget
  distribution={{ high: 2, 'medium-high': 1, medium: 3, low: 4, unrated: 10 }}
  totalSuppliers={20}
  onSegmentClick={(level) => console.log(level)}
/>`,
  },
  {
    id: 'metric-row-widget',
    name: 'MetricRowWidget',
    component: 'MetricRowWidget',
    category: 'portfolio',
    description: 'Horizontal row of 3-4 key metrics with optional trends.',
    sizes: ['M'],
    defaultSize: 'M',
    props: [
      { name: 'metrics', type: 'MetricItem[]', required: true, description: 'Array of metrics to display' },
      { name: 'variant', type: "'default' | 'compact'", required: false, default: "'default'", description: 'Display variant' },
    ],
    demoData: {
      metrics: [
        { label: 'Total Suppliers', value: '45', change: { value: 3, direction: 'up' } },
        { label: 'High Risk', value: '14%', change: { value: 2, direction: 'up' } },
        { label: 'Avg SRS', value: '62' },
      ],
    },
    usageExample: `<MetricRowWidget
  metrics={[
    { label: 'Total Suppliers', value: '45' },
    { label: 'High Risk', value: '14%' },
  ]}
/>`,
  },
  {
    id: 'spend-exposure-widget',
    name: 'SpendExposureWidget',
    component: 'SpendExposureWidget',
    category: 'portfolio',
    description: 'Spend-at-risk breakdown showing dollar amounts by risk level.',
    sizes: ['M', 'L'],
    defaultSize: 'M',
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
    name: 'HealthScorecardWidget',
    component: 'HealthScorecardWidget',
    category: 'portfolio',
    description: 'Portfolio health overview with score circle and key metrics grid.',
    sizes: ['M', 'L'],
    defaultSize: 'M',
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
    name: 'SupplierRiskCardWidget',
    component: 'SupplierRiskCardWidget',
    category: 'supplier',
    description: 'Detailed supplier risk profile card with score, trend, and key factors.',
    sizes: ['M', 'L'],
    defaultSize: 'M',
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
    name: 'SupplierTableWidget',
    component: 'SupplierTableWidget',
    category: 'supplier',
    description: 'Sortable table of suppliers with risk scores and key metrics.',
    sizes: ['M', 'L'],
    defaultSize: 'M',
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
    name: 'SupplierMiniCard',
    component: 'SupplierMiniCard',
    category: 'supplier',
    description: 'Compact inline supplier badge with risk score.',
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
    name: 'ComparisonTableWidget',
    component: 'ComparisonTableWidget',
    category: 'supplier',
    description: 'Side-by-side comparison of 2-4 suppliers with metrics.',
    sizes: ['M', 'L'],
    defaultSize: 'L',
    props: [
      { name: 'data', type: 'ComparisonTableData', required: true, description: 'Comparison data with suppliers array' },
      { name: 'onSelectSupplier', type: '(supplier) => void', required: false, description: 'Callback when supplier selected' },
    ],
    demoData: {
      data: {
        suppliers: [
          { id: '1', name: 'Apple Inc.', riskScore: 85, pros: ['Strong quality'], cons: ['High risk'] },
          { id: '2', name: 'Flash Cleaning', riskScore: 52, pros: ['Good ESG'], cons: ['Lower capacity'] },
        ],
      },
    },
    usageExample: `<ComparisonTableWidget
  data={{
    suppliers: [
      { id: '1', name: 'Apple Inc.', riskScore: 85, ... },
      { id: '2', name: 'Flash Cleaning', riskScore: 52, ... },
    ],
  }}
/>`,
  },

  // ============================================
  // TRENDS & ALERTS
  // ============================================
  {
    id: 'alert-card-widget',
    name: 'AlertCardWidget',
    component: 'AlertCardWidget',
    category: 'trends',
    description: 'Risk alert notification with severity and affected suppliers.',
    sizes: ['M'],
    defaultSize: 'M',
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
    name: 'TrendChartWidget',
    component: 'TrendChartWidget',
    category: 'trends',
    description: 'Time series chart showing trends over time.',
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
    name: 'TrendChangeIndicator',
    component: 'TrendChangeIndicator',
    category: 'trends',
    description: 'Simple trend indicator showing score change.',
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
    name: 'EventTimelineWidget',
    component: 'EventTimelineWidget',
    category: 'trends',
    description: 'Timeline of events and changes with icons and dates.',
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
    name: 'EventsFeedWidget',
    component: 'EventsFeedWidget',
    category: 'trends',
    description: 'Feed of recent events and alerts.',
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
    name: 'PriceGaugeWidget',
    component: 'PriceGaugeWidget',
    category: 'market',
    description: 'Commodity price indicator with gauge visualization.',
    sizes: ['M'],
    defaultSize: 'M',
    props: [
      { name: 'title', type: 'string', required: true, description: 'Commodity name' },
      { name: 'price', type: 'string', required: true, description: 'Current price' },
      { name: 'unit', type: 'string', required: true, description: 'Price unit' },
      { name: 'change24h', type: '{ value, percent, direction }', required: true, description: '24h change' },
      { name: 'change30d', type: '{ value, percent, direction }', required: true, description: '30d change' },
    ],
    demoData: {
      title: 'Copper',
      price: '$8,245',
      unit: 'per metric ton',
      lastChecked: '2h ago',
      change24h: { value: '-$125', percent: '-1.5%', direction: 'down' },
      change30d: { value: '-$320', percent: '-3.7%', direction: 'down' },
      market: 'LME',
    },
    usageExample: `<PriceGaugeWidget
  title="Copper"
  price="$8,245"
  unit="per metric ton"
  change24h={{ value: '-$125', percent: '-1.5%', direction: 'down' }}
  change30d={{ value: '-$320', percent: '-3.7%', direction: 'down' }}
/>`,
  },
  {
    id: 'news-item-card',
    name: 'NewsItemCard',
    component: 'NewsItemCard',
    category: 'market',
    description: 'News article card with source and sentiment.',
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
    name: 'CategoryBreakdownWidget',
    component: 'CategoryBreakdownWidget',
    category: 'categories',
    description: 'Breakdown of spend and risk by category.',
    sizes: ['M', 'L'],
    defaultSize: 'M',
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
    name: 'RegionListWidget',
    component: 'RegionListWidget',
    category: 'categories',
    description: 'List of regions with supplier counts and flags.',
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
    name: 'CategoryBadge',
    component: 'CategoryBadge',
    category: 'categories',
    description: 'Compact category indicator badge.',
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
    name: 'StatusBadge',
    component: 'StatusBadge',
    category: 'categories',
    description: 'Simple status indicator badge.',
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
    name: 'ScoreBreakdownWidget',
    component: 'ScoreBreakdownWidget',
    category: 'score',
    description: 'Detailed breakdown of risk score factors.',
    sizes: ['M', 'L'],
    defaultSize: 'M',
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
    name: 'FactorBreakdownCard',
    component: 'FactorBreakdownCard',
    category: 'score',
    description: 'Risk factors breakdown by tier with scores.',
    sizes: ['M', 'L'],
    defaultSize: 'M',
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
    name: 'StatCard',
    component: 'StatCard',
    category: 'general',
    description: 'Single statistic display with optional trend indicator.',
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
    name: 'InfoCard',
    component: 'InfoCard',
    category: 'general',
    description: 'Informational card with optional bullets and actions.',
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
    name: 'QuoteCard',
    component: 'QuoteCard',
    category: 'general',
    description: 'Highlighted quote or insight with source attribution.',
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
    name: 'RecommendationCard',
    component: 'RecommendationCard',
    category: 'general',
    description: 'AI recommendation with confidence level and reasoning.',
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
    name: 'ChecklistCard',
    component: 'ChecklistCard',
    category: 'general',
    description: 'Interactive checklist with progress indicator.',
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
    name: 'ProgressCard',
    component: 'ProgressCard',
    category: 'general',
    description: 'Step-by-step progress indicator.',
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
    name: 'ExecutiveSummaryCard',
    component: 'ExecutiveSummaryCard',
    category: 'general',
    description: 'Executive summary with key points and metrics.',
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
    name: 'DataListCard',
    component: 'DataListCard',
    category: 'general',
    description: 'Generic list display with status indicators.',
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
    name: 'HandoffCard',
    component: 'HandoffCard',
    category: 'actions',
    description: 'Card for redirecting to dashboard or external view.',
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
    name: 'ActionConfirmationCard',
    component: 'ActionConfirmationCard',
    category: 'actions',
    description: 'Confirmation card for completed actions.',
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
    name: 'AlternativesPreviewCard',
    component: 'AlternativesPreviewCard',
    category: 'actions',
    description: 'Preview of alternative suppliers.',
    sizes: ['M'],
    defaultSize: 'M',
    props: [
      { name: 'currentSupplier', type: 'string', required: true, description: 'Current supplier name' },
      { name: 'alternatives', type: 'Alternative[]', required: true, description: 'Alternative suppliers' },
      { name: 'onViewAll', type: '() => void', required: false, description: 'View all callback' },
    ],
    demoData: {
      currentSupplier: 'Apple Inc.',
      alternatives: [
        { id: '1', name: 'Flash Cleaning', riskScore: 52, match: 85 },
        { id: '2', name: 'Widget Co', riskScore: 38, match: 72 },
      ],
    },
    usageExample: `<AlternativesPreviewCard
  currentSupplier="Apple Inc."
  alternatives={[...]}
/>`,
  },
  {
    id: 'concentration-warning-card',
    name: 'ConcentrationWarningCard',
    component: 'ConcentrationWarningCard',
    category: 'actions',
    description: 'Warning card for portfolio concentration risks.',
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
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getWidgetsByCategory = (category: WidgetCategory): WidgetCatalogEntry[] => {
  return WIDGET_CATALOG.filter(w => w.category === category);
};

export const getWidgetById = (id: string): WidgetCatalogEntry | undefined => {
  return WIDGET_CATALOG.find(w => w.id === id);
};

export const searchWidgets = (query: string): WidgetCatalogEntry[] => {
  const lower = query.toLowerCase();
  return WIDGET_CATALOG.filter(w =>
    w.name.toLowerCase().includes(lower) ||
    w.description.toLowerCase().includes(lower) ||
    w.component.toLowerCase().includes(lower)
  );
};

export const getCategoryCounts = (): Record<WidgetCategory, number> => {
  const counts = {} as Record<WidgetCategory, number>;
  CATEGORY_ORDER.forEach(cat => {
    counts[cat] = WIDGET_CATALOG.filter(w => w.category === cat).length;
  });
  return counts;
};
