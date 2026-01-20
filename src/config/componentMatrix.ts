// Component Association Matrix
// Maps intents → response types → widgets → React components

import type { IntentCategory } from '../types/intents';
import type { WidgetType } from '../types/widgets';

// ============================================
// RESPONSE SECTION TYPES
// ============================================

export type ResponseSection =
  | 'thought_process'      // Collapsible thinking display
  | 'main_content'         // Primary text response
  | 'inline_widget'        // Widget embedded in chat
  | 'insight_banner'       // Key takeaway highlight
  | 'sources'              // Web + internal source attribution
  | 'follow_ups'           // Suggested next actions
  | 'handoff_card'         // Dashboard redirect
  | 'feedback_actions';    // Download, thumbs, refresh

// ============================================
// COMPONENT REGISTRY
// ============================================

export interface ComponentMapping {
  section: ResponseSection;
  component: string;
  path: string;
  variants?: string[];
  usedFor: string[];
}

export const COMPONENT_REGISTRY: ComponentMapping[] = [
  // THOUGHT PROCESS
  {
    section: 'thought_process',
    component: 'ThoughtProcess',
    path: 'components/chat/ThoughtProcess.tsx',
    usedFor: ['All responses in reasoning mode'],
  },

  // MAIN CONTENT (text handled by AIResponse children)

  // INLINE WIDGETS - Portfolio
  {
    section: 'inline_widget',
    component: 'RiskDistributionWidget',
    path: 'components/widgets/RiskDistributionWidget.tsx',
    usedFor: ['portfolio_overview'],
  },
  {
    section: 'inline_widget',
    component: 'PortfolioOverviewCard',
    path: 'components/risk/PortfolioOverviewCard.tsx',
    variants: ['standard', 'compact'],
    usedFor: ['portfolio_overview'],
  },
  {
    section: 'inline_widget',
    component: 'RiskDistributionChart',
    path: 'components/risk/RiskDistributionChart.tsx',
    variants: ['full', 'inline'],
    usedFor: ['portfolio_overview', 'filtered_discovery'],
  },

  // INLINE WIDGETS - Supplier
  {
    section: 'inline_widget',
    component: 'SupplierRiskCardWidget',
    path: 'components/widgets/SupplierRiskCardWidget.tsx',
    usedFor: ['supplier_deep_dive'],
  },
  {
    section: 'inline_widget',
    component: 'SupplierRiskCard',
    path: 'components/risk/SupplierRiskCard.tsx',
    variants: ['full', 'compact', 'alert'],
    usedFor: ['supplier_deep_dive', 'trend_detection'],
  },

  // INLINE WIDGETS - Tables
  {
    section: 'inline_widget',
    component: 'SupplierTableWidget',
    path: 'components/widgets/SupplierTableWidget.tsx',
    usedFor: ['filtered_discovery'],
  },
  {
    section: 'inline_widget',
    component: 'SupplierMiniTable',
    path: 'components/risk/SupplierMiniTable.tsx',
    usedFor: ['filtered_discovery', 'trend_detection'],
  },
  {
    section: 'inline_widget',
    component: 'DataTable',
    path: 'components/chat/DataTable.tsx',
    usedFor: ['filtered_discovery', 'comparison'],
  },

  // INLINE WIDGETS - Comparison
  {
    section: 'inline_widget',
    component: 'ComparisonTableWidget',
    path: 'components/widgets/ComparisonTableWidget.tsx',
    usedFor: ['comparison'],
  },

  // INLINE WIDGETS - Alerts/Trends
  {
    section: 'inline_widget',
    component: 'AlertCardWidget',
    path: 'components/widgets/AlertCardWidget.tsx',
    usedFor: ['trend_detection'],
  },
  {
    section: 'inline_widget',
    component: 'TrendChangeIndicator',
    path: 'components/risk/TrendChangeIndicator.tsx',
    variants: ['inline', 'card', 'alert'],
    usedFor: ['trend_detection', 'supplier_deep_dive'],
  },
  {
    section: 'inline_widget',
    component: 'EventAlertCard',
    path: 'components/risk/EventAlertCard.tsx',
    usedFor: ['market_context', 'trend_detection'],
  },

  // INLINE WIDGETS - Market/Price
  {
    section: 'inline_widget',
    component: 'PriceGaugeWidget',
    path: 'components/widgets/PriceGaugeWidget.tsx',
    variants: ['full', 'compact'],
    usedFor: ['market_context'],
  },
  {
    section: 'inline_widget',
    component: 'MarketContextCard',
    path: 'components/risk/MarketContextCard.tsx',
    variants: ['full', 'inline'],
    usedFor: ['market_context'],
  },
  {
    section: 'inline_widget',
    component: 'BenchmarkCard',
    path: 'components/risk/BenchmarkCard.tsx',
    usedFor: ['market_context', 'comparison'],
  },

  // INLINE WIDGETS - Metrics
  {
    section: 'inline_widget',
    component: 'MetricRowWidget',
    path: 'components/widgets/MetricRowWidget.tsx',
    usedFor: ['portfolio_overview', 'market_context'],
  },

  // INSIGHT BANNER
  {
    section: 'insight_banner',
    component: 'InsightBanner',
    path: 'components/chat/InsightBanner.tsx',
    variants: ['full', 'badge'],
    usedFor: ['All responses with key insights'],
  },
  {
    section: 'insight_banner',
    component: 'InsightBar',
    path: 'components/chat/InsightBar.tsx',
    usedFor: ['All responses with key insights'],
  },

  // SOURCES
  {
    section: 'sources',
    component: 'SourcesDisplay',
    path: 'components/chat/SourcesDisplay.tsx',
    variants: ['full', 'compact'],
    usedFor: ['All responses with sources'],
  },
  {
    section: 'sources',
    component: 'SourceAttribution',
    path: 'components/chat/SourceAttribution.tsx',
    usedFor: ['All responses with sources'],
  },

  // FOLLOW-UPS
  {
    section: 'follow_ups',
    component: 'SuggestedFollowUps',
    path: 'components/chat/SuggestedFollowUps.tsx',
    usedFor: ['All responses'],
  },
  {
    section: 'follow_ups',
    component: 'SuggestedActions',
    path: 'components/risk/SuggestedActions.tsx',
    variants: ['horizontal', 'vertical', 'grid'],
    usedFor: ['action_trigger', 'setup_config'],
  },
  {
    section: 'follow_ups',
    component: 'QuickPrompts',
    path: 'components/risk/SuggestedActions.tsx',
    usedFor: ['Entry point, general'],
  },

  // HANDOFF
  {
    section: 'handoff_card',
    component: 'HandoffCard',
    path: 'components/risk/HandoffCard.tsx',
    variants: ['standard', 'inline', 'warning'],
    usedFor: ['restricted_query'],
  },
  {
    section: 'handoff_card',
    component: 'DataRestrictionNotice',
    path: 'components/risk/HandoffCard.tsx',
    usedFor: ['restricted_query'],
  },

  // FEEDBACK
  {
    section: 'feedback_actions',
    component: 'ResponseFeedback',
    path: 'components/chat/ResponseFeedback.tsx',
    usedFor: ['All responses'],
  },

  // ACTION CONFIRMATION
  {
    section: 'inline_widget',
    component: 'ActionConfirmationCard',
    path: 'components/risk/ActionConfirmationCard.tsx',
    variants: ['success', 'warning', 'info', 'error'],
    usedFor: ['action_trigger', 'setup_config'],
  },
];

// ============================================
// INTENT → COMPONENT MATRIX
// ============================================

export interface IntentComponentMapping {
  intent: IntentCategory;
  responseType: string;
  primaryWidget: string | null;
  secondaryWidgets: string[];
  artifactComponent: string | null;
  showsInsight: boolean;
  showsSources: boolean;
  showsHandoff: boolean;
}

export const INTENT_COMPONENT_MATRIX: IntentComponentMapping[] = [
  {
    intent: 'portfolio_overview',
    responseType: 'widget',
    primaryWidget: 'RiskDistributionWidget',
    secondaryWidgets: ['PortfolioOverviewCard', 'MetricRowWidget'],
    artifactComponent: 'PortfolioDashboardArtifact',
    showsInsight: true,
    showsSources: false,
    showsHandoff: false,
  },
  {
    intent: 'filtered_discovery',
    responseType: 'table',
    primaryWidget: 'SupplierTableWidget',
    secondaryWidgets: ['SupplierMiniTable', 'DataTable'],
    artifactComponent: 'SupplierTableArtifact',
    showsInsight: true,
    showsSources: false,
    showsHandoff: false,
  },
  {
    intent: 'supplier_deep_dive',
    responseType: 'widget',
    primaryWidget: 'SupplierRiskCardWidget',
    secondaryWidgets: ['SupplierRiskCard', 'TrendChangeIndicator'],
    artifactComponent: 'SupplierDetailArtifact',
    showsInsight: true,
    showsSources: false,
    showsHandoff: false,
  },
  {
    intent: 'trend_detection',
    responseType: 'alert',
    primaryWidget: 'AlertCardWidget',
    secondaryWidgets: ['TrendChangeIndicator', 'SupplierMiniTable'],
    artifactComponent: 'SupplierTableArtifact',
    showsInsight: true,
    showsSources: false,
    showsHandoff: false,
  },
  {
    intent: 'comparison',
    responseType: 'table',
    primaryWidget: 'ComparisonTableWidget',
    secondaryWidgets: ['BenchmarkCard', 'DataTable'],
    artifactComponent: 'ComparisonArtifact',
    showsInsight: true,
    showsSources: false,
    showsHandoff: false,
  },
  {
    intent: 'explanation_why',
    responseType: 'summary',
    primaryWidget: null,
    secondaryWidgets: [],
    artifactComponent: null,
    showsInsight: false,
    showsSources: false,
    showsHandoff: false,
  },
  {
    intent: 'action_trigger',
    responseType: 'summary',
    primaryWidget: null,
    secondaryWidgets: ['SuggestedActions', 'ActionConfirmationCard'],
    artifactComponent: null,
    showsInsight: false,
    showsSources: false,
    showsHandoff: false,
  },
  {
    intent: 'setup_config',
    responseType: 'summary',
    primaryWidget: null,
    secondaryWidgets: ['SuggestedActions'],
    artifactComponent: null,
    showsInsight: false,
    showsSources: false,
    showsHandoff: false,
  },
  {
    intent: 'reporting_export',
    responseType: 'summary',
    primaryWidget: null,
    secondaryWidgets: ['ActionConfirmationCard'],
    artifactComponent: null,
    showsInsight: false,
    showsSources: false,
    showsHandoff: false,
  },
  {
    intent: 'market_context',
    responseType: 'summary',
    primaryWidget: 'MarketContextCard',
    secondaryWidgets: ['PriceGaugeWidget', 'EventAlertCard', 'BenchmarkCard'],
    artifactComponent: null,
    showsInsight: true,
    showsSources: true,
    showsHandoff: false,
  },
  {
    intent: 'restricted_query',
    responseType: 'handoff',
    primaryWidget: null,
    secondaryWidgets: ['HandoffCard', 'DataRestrictionNotice'],
    artifactComponent: 'SupplierDetailArtifact',
    showsInsight: false,
    showsSources: false,
    showsHandoff: true,
  },
  {
    intent: 'general',
    responseType: 'summary',
    primaryWidget: null,
    secondaryWidgets: ['QuickPrompts'],
    artifactComponent: null,
    showsInsight: false,
    showsSources: false,
    showsHandoff: false,
  },
];

// ============================================
// WIDGET TYPE → COMPONENT MAPPING
// ============================================

export const WIDGET_TO_COMPONENT: Partial<Record<WidgetType, {
  primary: string;
  alternates: string[];
  artifactExpansion: string | null;
}>> = {
  // Portfolio & Overview
  risk_distribution: {
    primary: 'RiskDistributionWidget',
    alternates: ['PortfolioOverviewCard', 'RiskDistributionChart'],
    artifactExpansion: 'PortfolioDashboardArtifact',
  },
  portfolio_summary: {
    primary: 'PortfolioOverviewCard',
    alternates: ['MetricRowWidget'],
    artifactExpansion: 'PortfolioDashboardArtifact',
  },
  metric_row: {
    primary: 'MetricRowWidget',
    alternates: [],
    artifactExpansion: null,
  },

  // Supplier Focused
  supplier_risk_card: {
    primary: 'SupplierRiskCardWidget',
    alternates: ['SupplierRiskCard'],
    artifactExpansion: 'SupplierDetailArtifact',
  },
  supplier_table: {
    primary: 'SupplierTableWidget',
    alternates: ['SupplierMiniTable', 'DataTable'],
    artifactExpansion: 'SupplierTableArtifact',
  },
  supplier_mini: {
    primary: 'SupplierMiniCard',
    alternates: ['RiskScoreBadge'],
    artifactExpansion: null,
  },
  comparison_table: {
    primary: 'ComparisonTableWidget',
    alternates: ['DataTable'],
    artifactExpansion: 'ComparisonArtifact',
  },

  // Trends & Alerts
  trend_chart: {
    primary: 'TrendChartWidget',
    alternates: ['TrendChangeIndicator'],
    artifactExpansion: null,
  },
  trend_indicator: {
    primary: 'TrendChangeIndicator',
    alternates: [],
    artifactExpansion: null,
  },
  alert_card: {
    primary: 'AlertCardWidget',
    alternates: ['EventAlertCard'],
    artifactExpansion: null,
  },
  event_timeline: {
    primary: 'EventTimelineWidget',
    alternates: ['EventAlertCard'],
    artifactExpansion: null,
  },

  // Market & Context
  price_gauge: {
    primary: 'PriceGaugeWidget',
    alternates: [],
    artifactExpansion: null,
  },
  market_card: {
    primary: 'MarketContextCard',
    alternates: [],
    artifactExpansion: null,
  },
  benchmark_card: {
    primary: 'BenchmarkCard',
    alternates: [],
    artifactExpansion: null,
  },
  news_item: {
    primary: 'NewsItemCard',
    alternates: [],
    artifactExpansion: null,
  },

  // Categories & Regions
  category_breakdown: {
    primary: 'CategoryBreakdownWidget',
    alternates: ['RiskDistributionChart'],
    artifactExpansion: null,
  },
  category_badge: {
    primary: 'CategoryBadge',
    alternates: [],
    artifactExpansion: null,
  },
  region_map: {
    primary: 'RegionMapWidget',
    alternates: [],
    artifactExpansion: null,
  },
  region_list: {
    primary: 'RegionListWidget',
    alternates: [],
    artifactExpansion: null,
  },

  // Actions & Status
  action_card: {
    primary: 'ActionConfirmationCard',
    alternates: [],
    artifactExpansion: null,
  },
  handoff_card: {
    primary: 'HandoffCard',
    alternates: [],
    artifactExpansion: 'SupplierDetailArtifact',
  },
  status_badge: {
    primary: 'StatusBadge',
    alternates: [],
    artifactExpansion: null,
  },
  score_breakdown: {
    primary: 'ScoreBreakdownWidget',
    alternates: ['SupplierRiskCard'],
    artifactExpansion: 'SupplierDetailArtifact',
  },

  // Text Only
  none: {
    primary: '',
    alternates: [],
    artifactExpansion: null,
  },
};

// ============================================
// GAPS IDENTIFIED - COMPONENTS TO BUILD
// ============================================

export const COMPONENT_GAPS = [
  // New widget components needed
  { component: 'TrendChartWidget', status: 'needed', priority: 'high', fallback: 'TrendChangeIndicator' },
  { component: 'EventTimelineWidget', status: 'needed', priority: 'medium', fallback: 'EventAlertCard' },
  { component: 'CategoryBreakdownWidget', status: 'needed', priority: 'medium', fallback: 'RiskDistributionChart' },
  { component: 'RegionMapWidget', status: 'needed', priority: 'low', fallback: null },
  { component: 'RegionListWidget', status: 'needed', priority: 'low', fallback: null },
  { component: 'NewsItemCard', status: 'needed', priority: 'medium', fallback: 'MarketContextCard' },
  { component: 'SupplierMiniCard', status: 'needed', priority: 'medium', fallback: 'RiskScoreBadge' },
  { component: 'CategoryBadge', status: 'needed', priority: 'low', fallback: null },
  { component: 'StatusBadge', status: 'needed', priority: 'low', fallback: null },
  { component: 'ScoreBreakdownWidget', status: 'needed', priority: 'medium', fallback: 'SupplierRiskCard' },
];

// ============================================
// DUPLICATES IDENTIFIED
// ============================================

export const COMPONENT_DUPLICATES = [
  {
    components: ['RiskDistributionWidget', 'RiskDistributionChart', 'PortfolioOverviewCard'],
    purpose: 'Show risk distribution',
    recommendation: 'Use RiskDistributionWidget as primary, others for specific contexts',
  },
  {
    components: ['SupplierRiskCardWidget', 'SupplierRiskCard'],
    purpose: 'Show single supplier details',
    recommendation: 'SupplierRiskCardWidget for chat, SupplierRiskCard for variants',
  },
  {
    components: ['SupplierTableWidget', 'SupplierMiniTable', 'DataTable'],
    purpose: 'Show supplier list',
    recommendation: 'SupplierTableWidget for chat, SupplierMiniTable for compact, DataTable for generic',
  },
  {
    components: ['InsightBanner', 'InsightBar'],
    purpose: 'Show key insight',
    recommendation: 'Consolidate into single InsightBanner with variants',
  },
  {
    components: ['SourcesDisplay', 'SourceAttribution'],
    purpose: 'Show sources',
    recommendation: 'Use SourcesDisplay (newer, better separated)',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getComponentsForIntent = (intent: IntentCategory): IntentComponentMapping | undefined => {
  return INTENT_COMPONENT_MATRIX.find(m => m.intent === intent);
};

export const getComponentForWidget = (widgetType: WidgetType): string | null => {
  return WIDGET_TO_COMPONENT[widgetType]?.primary || null;
};

export const getArtifactForIntent = (intent: IntentCategory): string | null => {
  const mapping = INTENT_COMPONENT_MATRIX.find(m => m.intent === intent);
  return mapping?.artifactComponent || null;
};
