// Guided Prompt Builder Configuration
// Maps cascading selections to deterministic intents and widgets

import type { IntentCategory, SubIntent } from '../../types/intents';
import type { WidgetType } from '../../types/widgets';

// ============================================
// BUILDER LEVEL TYPES
// ============================================

export type BuilderDomain = 'risk' | 'market' | 'suppliers' | 'actions';
export type BuilderSubject = string; // Dynamic based on domain
export type BuilderAction = string;  // Dynamic based on subject

export interface BuilderSelection {
  domain: BuilderDomain | null;
  subject: BuilderSubject | null;
  action: BuilderAction | null;
  modifiers: Record<string, string>;
}

export interface BuilderOption {
  id: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface BuilderLevel {
  id: string;
  label: string;
  options: BuilderOption[];
}

// ============================================
// LEVEL 1: DOMAINS
// ============================================

export const BUILDER_DOMAINS: BuilderOption[] = [
  {
    id: 'risk',
    label: 'Risk',
    icon: 'shield',
    description: 'Portfolio risk, exposure, scores'
  },
  {
    id: 'market',
    label: 'Market',
    icon: 'trending-up',
    description: 'Prices, news, industry trends'
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: 'building',
    description: 'Specific suppliers, comparisons'
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: 'zap',
    description: 'Alerts, reports, workflows'
  },
];

// ============================================
// LEVEL 2: SUBJECTS (per domain)
// ============================================

export const BUILDER_SUBJECTS: Record<BuilderDomain, BuilderOption[]> = {
  risk: [
    { id: 'portfolio', label: 'Portfolio', description: 'Overall portfolio view' },
    { id: 'exposure', label: 'Exposure', description: 'Dollar at risk' },
    { id: 'changes', label: 'Changes', description: 'Recent movements' },
    { id: 'factors', label: 'Factors', description: 'What drives risk' },
  ],
  market: [
    { id: 'prices', label: 'Prices', description: 'Commodity prices' },
    { id: 'news', label: 'News', description: 'Industry news' },
    { id: 'trends', label: 'Trends', description: 'Market movements' },
    { id: 'disruptions', label: 'Disruptions', description: 'Supply chain events' },
  ],
  suppliers: [
    { id: 'specific', label: 'Specific', description: 'Look up one supplier' },
    { id: 'compare', label: 'Compare', description: 'Side-by-side comparison' },
    { id: 'find', label: 'Find', description: 'Search or filter' },
    { id: 'alternatives', label: 'Alternatives', description: 'Find replacements' },
  ],
  actions: [
    { id: 'alerts', label: 'Alerts', description: 'Set up notifications' },
    { id: 'reports', label: 'Reports', description: 'Generate summaries' },
    { id: 'monitor', label: 'Monitor', description: 'Track suppliers' },
    { id: 'export', label: 'Export', description: 'Download data' },
  ],
};

// ============================================
// LEVEL 3: ACTIONS (per subject)
// ============================================

export const BUILDER_ACTIONS: Record<string, BuilderOption[]> = {
  // Risk domain
  'risk:portfolio': [
    { id: 'overview', label: 'Overview', description: 'Full portfolio summary' },
    { id: 'distribution', label: 'Distribution', description: 'Risk breakdown' },
    { id: 'by_category', label: 'By Category', description: 'Group by category' },
    { id: 'by_region', label: 'By Region', description: 'Group by location' },
  ],
  'risk:exposure': [
    { id: 'total', label: 'Total Exposure', description: 'All spend at risk' },
    { id: 'by_level', label: 'By Level', description: 'High/medium/low' },
    { id: 'top_suppliers', label: 'Top Suppliers', description: 'Highest exposure' },
  ],
  'risk:changes': [
    { id: 'recent', label: 'Recent', description: 'Last 7-30 days' },
    { id: 'worsening', label: 'Worsening', description: 'Scores going up' },
    { id: 'improving', label: 'Improving', description: 'Scores going down' },
  ],
  'risk:factors': [
    { id: 'explain', label: 'Explain', description: 'Why this score' },
    { id: 'breakdown', label: 'Breakdown', description: 'Factor by factor' },
  ],

  // Market domain
  'market:prices': [
    { id: 'current', label: 'Current', description: 'Latest prices' },
    { id: 'history', label: 'History', description: 'Price over time' },
    { id: 'forecast', label: 'Forecast', description: 'Where prices heading' },
  ],
  'market:news': [
    { id: 'latest', label: 'Latest', description: 'Recent headlines' },
    { id: 'for_supplier', label: 'For Supplier', description: 'About specific supplier' },
    { id: 'for_category', label: 'For Category', description: 'About a category' },
  ],
  'market:trends': [
    { id: 'industry', label: 'Industry', description: 'Sector outlook' },
    { id: 'geopolitical', label: 'Geopolitical', description: 'Political factors' },
  ],
  'market:disruptions': [
    { id: 'active', label: 'Active', description: 'Current disruptions' },
    { id: 'affecting_me', label: 'Affecting Me', description: 'My suppliers' },
  ],

  // Suppliers domain
  'suppliers:specific': [
    { id: 'profile', label: 'Profile', description: 'Full details' },
    { id: 'risk_score', label: 'Risk Score', description: 'Score & factors' },
    { id: 'history', label: 'History', description: 'Score over time' },
    { id: 'news', label: 'News', description: 'Recent news' },
  ],
  'suppliers:compare': [
    { id: 'side_by_side', label: 'Side by Side', description: '2-4 suppliers' },
    { id: 'which_safer', label: 'Which Safer', description: 'Risk comparison' },
  ],
  'suppliers:find': [
    { id: 'high_risk', label: 'High Risk', description: 'Risky suppliers' },
    { id: 'by_category', label: 'By Category', description: 'In a category' },
    { id: 'by_region', label: 'By Region', description: 'In a region' },
    { id: 'attention', label: 'Need Attention', description: 'Requiring action' },
  ],
  'suppliers:alternatives': [
    { id: 'find', label: 'Find Alternatives', description: 'Replacement options' },
  ],

  // Actions domain
  'actions:alerts': [
    { id: 'setup', label: 'Set Up', description: 'Create new alert' },
    { id: 'view', label: 'View', description: 'See active alerts' },
  ],
  'actions:reports': [
    { id: 'executive', label: 'Executive', description: 'Leadership summary' },
    { id: 'compliance', label: 'Compliance', description: 'Compliance report' },
  ],
  'actions:monitor': [
    { id: 'add', label: 'Add Supplier', description: 'Start monitoring' },
    { id: 'list', label: 'View List', description: 'Monitored suppliers' },
  ],
  'actions:export': [
    { id: 'csv', label: 'CSV', description: 'Download data' },
    { id: 'pdf', label: 'PDF', description: 'Generate report' },
  ],
};

// ============================================
// LEVEL 4: MODIFIERS (optional filters)
// ============================================

export interface ModifierConfig {
  id: string;
  label: string;
  type: 'select' | 'text' | 'multi-select';
  options?: BuilderOption[];
  placeholder?: string;
  appliesTo: string[]; // Which action paths this modifier applies to
}

export const BUILDER_MODIFIERS: ModifierConfig[] = [
  {
    id: 'risk_level',
    label: 'Risk Level',
    type: 'select',
    options: [
      { id: 'high', label: 'High' },
      { id: 'medium-high', label: 'Medium-High' },
      { id: 'medium', label: 'Medium' },
      { id: 'low', label: 'Low' },
    ],
    appliesTo: ['risk:*', 'suppliers:find:*'],
  },
  {
    id: 'region',
    label: 'Region',
    type: 'select',
    options: [
      { id: 'north_america', label: 'North America' },
      { id: 'europe', label: 'Europe' },
      { id: 'asia_pacific', label: 'Asia Pacific' },
      { id: 'latin_america', label: 'Latin America' },
    ],
    appliesTo: ['risk:portfolio:by_region', 'suppliers:find:by_region'],
  },
  {
    id: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { id: 'electronics', label: 'Electronics' },
      { id: 'raw_materials', label: 'Raw Materials' },
      { id: 'logistics', label: 'Logistics' },
      { id: 'packaging', label: 'Packaging' },
      { id: 'services', label: 'Services' },
    ],
    appliesTo: ['risk:portfolio:by_category', 'suppliers:find:by_category', 'market:news:for_category'],
  },
  {
    id: 'timeframe',
    label: 'Timeframe',
    type: 'select',
    options: [
      { id: '7d', label: 'Last 7 days' },
      { id: '30d', label: 'Last 30 days' },
      { id: '90d', label: 'Last 90 days' },
    ],
    appliesTo: ['risk:changes:*', 'market:prices:history'],
  },
  {
    id: 'supplier_name',
    label: 'Supplier',
    type: 'text',
    placeholder: 'Enter supplier name...',
    appliesTo: ['suppliers:specific:*', 'suppliers:alternatives:*', 'market:news:for_supplier'],
  },
  {
    id: 'commodity',
    label: 'Commodity',
    type: 'select',
    options: [
      { id: 'copper', label: 'Copper' },
      { id: 'aluminum', label: 'Aluminum' },
      { id: 'steel', label: 'Steel' },
      { id: 'lithium', label: 'Lithium' },
      { id: 'rare_earth', label: 'Rare Earth' },
    ],
    appliesTo: ['market:prices:*'],
  },
];

// ============================================
// INTENT & WIDGET MAPPING
// ============================================

export interface RouteMapping {
  path: string;
  intent: IntentCategory;
  subIntent: SubIntent;
  widgets: WidgetType[];
  promptTemplate: string;
  requiresResearch?: boolean;
  requiresSupplierInput?: boolean;
}

export const ROUTE_MAPPINGS: RouteMapping[] = [
  // Risk > Portfolio paths
  {
    path: 'risk:portfolio:overview',
    intent: 'portfolio_overview',
    subIntent: 'overall_summary',
    widgets: ['risk_distribution', 'portfolio_summary', 'health_scorecard'],
    promptTemplate: 'Show me an overview of my supplier risk portfolio',
  },
  {
    path: 'risk:portfolio:distribution',
    intent: 'portfolio_overview',
    subIntent: 'overall_summary',
    widgets: ['risk_distribution', 'spend_exposure'],
    promptTemplate: 'Show me the risk distribution across my portfolio',
  },
  {
    path: 'risk:portfolio:by_category',
    intent: 'portfolio_overview',
    subIntent: 'by_dimension',
    widgets: ['category_breakdown'],
    promptTemplate: 'Show my portfolio risk broken down by category{{modifier:category}}',
  },
  {
    path: 'risk:portfolio:by_region',
    intent: 'portfolio_overview',
    subIntent: 'by_dimension',
    widgets: ['region_map', 'region_list'],
    promptTemplate: 'Show my portfolio risk broken down by region{{modifier:region}}',
  },

  // Risk > Exposure paths
  {
    path: 'risk:exposure:total',
    intent: 'portfolio_overview',
    subIntent: 'spend_weighted',
    widgets: ['spend_exposure', 'metric_row'],
    promptTemplate: 'What is my total spend exposure at risk?',
  },
  {
    path: 'risk:exposure:by_level',
    intent: 'portfolio_overview',
    subIntent: 'spend_weighted',
    widgets: ['spend_exposure'],
    promptTemplate: 'Show my spend exposure broken down by risk level',
  },
  {
    path: 'risk:exposure:top_suppliers',
    intent: 'filtered_discovery',
    subIntent: 'by_risk_level',
    widgets: ['supplier_table'],
    promptTemplate: 'Which suppliers have the highest spend at risk?',
  },

  // Risk > Changes paths
  {
    path: 'risk:changes:recent',
    intent: 'trend_detection',
    subIntent: 'recent_changes',
    widgets: ['alert_card', 'events_feed'],
    promptTemplate: 'What risk changes have occurred{{modifier:timeframe}}?',
  },
  {
    path: 'risk:changes:worsening',
    intent: 'trend_detection',
    subIntent: 'change_direction',
    widgets: ['alert_card', 'supplier_table'],
    promptTemplate: 'Which suppliers have worsening risk scores{{modifier:timeframe}}?',
  },
  {
    path: 'risk:changes:improving',
    intent: 'trend_detection',
    subIntent: 'change_direction',
    widgets: ['alert_card', 'supplier_table'],
    promptTemplate: 'Which suppliers have improving risk scores{{modifier:timeframe}}?',
  },

  // Risk > Factors paths
  {
    path: 'risk:factors:explain',
    intent: 'explanation_why',
    subIntent: 'none',
    widgets: ['score_breakdown', 'info_card'],
    promptTemplate: 'Explain what factors drive risk scores',
  },
  {
    path: 'risk:factors:breakdown',
    intent: 'explanation_why',
    subIntent: 'none',
    widgets: ['factor_breakdown', 'score_breakdown'],
    promptTemplate: 'Show me a detailed breakdown of risk factors',
    requiresSupplierInput: true,
  },

  // Market > Prices paths
  {
    path: 'market:prices:current',
    intent: 'market_context',
    subIntent: 'none',
    widgets: ['price_gauge', 'stat_card'],
    promptTemplate: 'What is the current price of {{modifier:commodity}}?',
    requiresResearch: true,
  },
  {
    path: 'market:prices:history',
    intent: 'market_context',
    subIntent: 'none',
    widgets: ['trend_chart', 'price_gauge'],
    promptTemplate: 'Show me the price history for {{modifier:commodity}}{{modifier:timeframe}}',
    requiresResearch: true,
  },
  {
    path: 'market:prices:forecast',
    intent: 'market_context',
    subIntent: 'none',
    widgets: ['trend_chart', 'recommendation_card'],
    promptTemplate: 'What is the price forecast for {{modifier:commodity}}?',
    requiresResearch: true,
  },

  // Market > News paths
  {
    path: 'market:news:latest',
    intent: 'market_context',
    subIntent: 'none',
    widgets: ['events_feed', 'news_item'],
    promptTemplate: 'What are the latest supply chain news?',
    requiresResearch: true,
  },
  {
    path: 'market:news:for_supplier',
    intent: 'supplier_deep_dive',
    subIntent: 'news_events',
    widgets: ['news_events', 'events_feed'],
    promptTemplate: 'Show me recent news about {{modifier:supplier_name}}',
    requiresResearch: true,
    requiresSupplierInput: true,
  },
  {
    path: 'market:news:for_category',
    intent: 'market_context',
    subIntent: 'none',
    widgets: ['events_feed', 'market_card'],
    promptTemplate: 'What is the latest news for {{modifier:category}}?',
    requiresResearch: true,
  },

  // Market > Trends paths
  {
    path: 'market:trends:industry',
    intent: 'market_context',
    subIntent: 'none',
    widgets: ['market_card', 'recommendation_card'],
    promptTemplate: 'What are the current industry trends affecting supply chains?',
    requiresResearch: true,
  },
  {
    path: 'market:trends:geopolitical',
    intent: 'market_context',
    subIntent: 'none',
    widgets: ['events_feed', 'alert_card'],
    promptTemplate: 'What geopolitical factors are affecting supply chains?',
    requiresResearch: true,
  },

  // Market > Disruptions paths
  {
    path: 'market:disruptions:active',
    intent: 'market_context',
    subIntent: 'none',
    widgets: ['alert_card', 'events_feed'],
    promptTemplate: 'What active supply chain disruptions should I know about?',
    requiresResearch: true,
  },
  {
    path: 'market:disruptions:affecting_me',
    intent: 'trend_detection',
    subIntent: 'recent_changes',
    widgets: ['alert_card', 'supplier_table'],
    promptTemplate: 'Are there any disruptions affecting my suppliers?',
    requiresResearch: true,
  },

  // Suppliers > Specific paths
  {
    path: 'suppliers:specific:profile',
    intent: 'supplier_deep_dive',
    subIntent: 'supplier_overview',
    widgets: ['supplier_risk_card'],
    promptTemplate: 'Tell me about {{modifier:supplier_name}}',
    requiresSupplierInput: true,
  },
  {
    path: 'suppliers:specific:risk_score',
    intent: 'supplier_deep_dive',
    subIntent: 'score_inquiry',
    widgets: ['supplier_risk_card', 'score_breakdown'],
    promptTemplate: 'What is the risk score for {{modifier:supplier_name}}?',
    requiresSupplierInput: true,
  },
  {
    path: 'suppliers:specific:history',
    intent: 'supplier_deep_dive',
    subIntent: 'historical',
    widgets: ['trend_chart', 'event_timeline'],
    promptTemplate: 'Show me the risk history for {{modifier:supplier_name}}',
    requiresSupplierInput: true,
  },
  {
    path: 'suppliers:specific:news',
    intent: 'supplier_deep_dive',
    subIntent: 'news_events',
    widgets: ['news_events', 'events_feed'],
    promptTemplate: 'Show me recent news about {{modifier:supplier_name}}',
    requiresResearch: true,
    requiresSupplierInput: true,
  },

  // Suppliers > Compare paths
  {
    path: 'suppliers:compare:side_by_side',
    intent: 'comparison',
    subIntent: 'none',
    widgets: ['comparison_table'],
    promptTemplate: 'Compare these suppliers side by side',
    requiresSupplierInput: true,
  },
  {
    path: 'suppliers:compare:which_safer',
    intent: 'comparison',
    subIntent: 'none',
    widgets: ['comparison_table', 'recommendation_card'],
    promptTemplate: 'Which supplier has lower risk?',
    requiresSupplierInput: true,
  },

  // Suppliers > Find paths
  {
    path: 'suppliers:find:high_risk',
    intent: 'filtered_discovery',
    subIntent: 'by_risk_level',
    widgets: ['supplier_table', 'alert_card'],
    promptTemplate: 'Show me my high-risk suppliers',
  },
  {
    path: 'suppliers:find:by_category',
    intent: 'filtered_discovery',
    subIntent: 'by_attribute',
    widgets: ['supplier_table'],
    promptTemplate: 'Show me suppliers in {{modifier:category}}',
  },
  {
    path: 'suppliers:find:by_region',
    intent: 'filtered_discovery',
    subIntent: 'by_attribute',
    widgets: ['supplier_table', 'region_map'],
    promptTemplate: 'Show me suppliers in {{modifier:region}}',
  },
  {
    path: 'suppliers:find:attention',
    intent: 'filtered_discovery',
    subIntent: 'by_risk_level',
    widgets: ['supplier_table', 'alert_card'],
    promptTemplate: 'Which suppliers need my attention?',
  },

  // Suppliers > Alternatives paths
  {
    path: 'suppliers:alternatives:find',
    intent: 'action_trigger',
    subIntent: 'find_alternatives',
    widgets: ['alternatives_preview', 'supplier_table'],
    promptTemplate: 'Find alternative suppliers for {{modifier:supplier_name}}',
    requiresSupplierInput: true,
  },

  // Actions > Alerts paths
  {
    path: 'actions:alerts:setup',
    intent: 'setup_config',
    subIntent: 'none',
    widgets: ['action_card', 'checklist_card'],
    promptTemplate: 'Help me set up risk alerts',
  },
  {
    path: 'actions:alerts:view',
    intent: 'setup_config',
    subIntent: 'none',
    widgets: ['data_list', 'alert_card'],
    promptTemplate: 'Show my active alerts',
  },

  // Actions > Reports paths
  {
    path: 'actions:reports:executive',
    intent: 'reporting_export',
    subIntent: 'none',
    widgets: ['executive_summary'],
    promptTemplate: 'Generate an executive summary of my portfolio',
  },
  {
    path: 'actions:reports:compliance',
    intent: 'reporting_export',
    subIntent: 'none',
    widgets: ['executive_summary', 'checklist_card'],
    promptTemplate: 'Generate a compliance report',
  },

  // Actions > Monitor paths
  {
    path: 'actions:monitor:add',
    intent: 'setup_config',
    subIntent: 'none',
    widgets: ['action_card'],
    promptTemplate: 'Add a supplier to monitoring',
    requiresSupplierInput: true,
  },
  {
    path: 'actions:monitor:list',
    intent: 'setup_config',
    subIntent: 'none',
    widgets: ['supplier_table', 'data_list'],
    promptTemplate: 'Show my monitored suppliers',
  },

  // Actions > Export paths
  {
    path: 'actions:export:csv',
    intent: 'reporting_export',
    subIntent: 'none',
    widgets: ['action_card'],
    promptTemplate: 'Export my portfolio data as CSV',
  },
  {
    path: 'actions:export:pdf',
    intent: 'reporting_export',
    subIntent: 'none',
    widgets: ['action_card'],
    promptTemplate: 'Generate a PDF report',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getSubjectsForDomain(domain: BuilderDomain): BuilderOption[] {
  return BUILDER_SUBJECTS[domain] || [];
}

export function getActionsForSubject(domain: BuilderDomain, subject: string): BuilderOption[] {
  const key = `${domain}:${subject}`;
  return BUILDER_ACTIONS[key] || [];
}

export function getModifiersForPath(domain: BuilderDomain, subject: string, action: string): ModifierConfig[] {
  const path = `${domain}:${subject}:${action}`;

  return BUILDER_MODIFIERS.filter(mod => {
    return mod.appliesTo.some(pattern => {
      // Handle wildcards
      if (pattern.endsWith(':*')) {
        const prefix = pattern.slice(0, -2);
        return path.startsWith(prefix);
      }
      if (pattern.includes(':*:')) {
        const [start, , end] = pattern.split(':');
        return path.startsWith(start) && path.endsWith(end);
      }
      return pattern === path;
    });
  });
}

export function getRouteMappingForPath(path: string): RouteMapping | undefined {
  return ROUTE_MAPPINGS.find(r => r.path === path);
}

export function buildPath(selection: BuilderSelection): string {
  if (!selection.domain || !selection.subject || !selection.action) {
    return '';
  }
  return `${selection.domain}:${selection.subject}:${selection.action}`;
}

export function buildPrompt(selection: BuilderSelection): string {
  const path = buildPath(selection);
  const mapping = getRouteMappingForPath(path);

  if (!mapping) {
    return '';
  }

  let prompt = mapping.promptTemplate;

  // Replace modifier placeholders
  Object.entries(selection.modifiers).forEach(([key, value]) => {
    const placeholder = `{{modifier:${key}}}`;
    if (prompt.includes(placeholder)) {
      prompt = prompt.replace(placeholder, value);
    }
  });

  // Clean up unused placeholders
  prompt = prompt.replace(/\{\{modifier:\w+\}\}/g, '');

  return prompt.trim();
}

// Pre-built quick prompts for common paths
export const QUICK_PROMPTS = [
  { path: 'risk:portfolio:overview', label: 'Risk Overview', icon: 'shield' },
  { path: 'risk:changes:recent', label: 'Recent Changes', icon: 'trending-up' },
  { path: 'suppliers:find:high_risk', label: 'High-Risk Suppliers', icon: 'alert-triangle' },
  { path: 'market:news:latest', label: 'Market News', icon: 'newspaper' },
];
