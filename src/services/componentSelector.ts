// Unified Component Selection Service
// Routes intents and data to the correct component configuration

import type { IntentCategory } from '../types/intents';
import type { WidgetType, WidgetData } from '../types/widgets';
import type { Supplier, Portfolio, RiskChange } from '../types/data';
import {
  transformSupplierToRiskCardData,
  transformSuppliersToComparisonData,
  mapRiskLevelToMarketContext,
} from './widgetTransformers';

// ============================================
// RENDER CONTEXT
// ============================================

export type RenderContext =
  | 'chat'           // Inline in chat response
  | 'chat_compact'   // Compact version in chat
  | 'panel'          // Artifact side panel
  | 'panel_expanded' // Full-screen artifact
  | 'standalone';    // Used outside chat (e.g., dashboard)

// ============================================
// COMPONENT CONFIGURATION
// ============================================

export interface ComponentConfig {
  componentType: string;
  variant?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  props: Record<string, unknown>;
  expandsTo?: string; // Artifact component for panel expansion
}

// ============================================
// DATA CONTEXT (what data is available)
// ============================================

export interface DataContext {
  // Intent info
  intent: IntentCategory;
  subIntent?: string;

  // Data available
  portfolio?: Portfolio;
  suppliers?: Supplier[];
  supplier?: Supplier; // Single supplier focus
  riskChanges?: RiskChange[];

  // Widget from AI
  widget?: WidgetData;

  // Response metadata
  resultCount?: number;
  hasHandoff?: boolean;
}

// ============================================
// COMPONENT SELECTION RULES
// ============================================

interface SelectionRule {
  id: string;
  matches: (ctx: DataContext, renderCtx: RenderContext) => boolean;
  priority: number;
  getConfig: (ctx: DataContext, renderCtx: RenderContext) => ComponentConfig;
}

const SELECTION_RULES: SelectionRule[] = [
  // ==========================================
  // PORTFOLIO OVERVIEW
  // ==========================================
  {
    id: 'portfolio_distribution_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'portfolio_overview' &&
      renderCtx === 'chat' &&
      !!ctx.portfolio,
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'RiskDistributionWidget',
      size: 'md',
      props: {
        data: {
          distribution: {
            high: { count: ctx.portfolio!.distribution.high },
            mediumHigh: { count: ctx.portfolio!.distribution.mediumHigh },
            medium: { count: ctx.portfolio!.distribution.medium },
            low: { count: ctx.portfolio!.distribution.low },
            unrated: { count: ctx.portfolio!.distribution.unrated },
          },
          totalSuppliers: ctx.portfolio!.totalSuppliers,
          totalSpendFormatted: ctx.portfolio!.spendFormatted || `$${ctx.portfolio!.totalSpend}`,
        },
      },
      expandsTo: 'PortfolioDashboardArtifact',
    }),
  },
  {
    id: 'portfolio_distribution_compact',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'portfolio_overview' &&
      renderCtx === 'chat_compact' &&
      !!ctx.portfolio,
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'RiskDistributionChart',
      variant: 'inline',
      size: 'sm',
      props: {
        distribution: ctx.portfolio!.distribution,
        totalSuppliers: ctx.portfolio!.totalSuppliers,
        compact: true,
      },
      expandsTo: 'PortfolioDashboardArtifact',
    }),
  },
  {
    id: 'portfolio_artifact',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'portfolio_overview' &&
      (renderCtx === 'panel' || renderCtx === 'panel_expanded'),
    priority: 100,
    getConfig: (ctx, renderCtx) => ({
      componentType: 'PortfolioDashboardArtifact',
      size: renderCtx === 'panel_expanded' ? 'full' : 'lg',
      props: {
        totalSuppliers: ctx.portfolio?.totalSuppliers || 0,
        distribution: ctx.portfolio?.distribution || {},
        trends: [],
        alerts: [],
        topMovers: [],
        lastUpdated: new Date().toISOString(),
      },
    }),
  },

  // ==========================================
  // FILTERED DISCOVERY (Supplier Lists)
  // ==========================================
  {
    id: 'supplier_table_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'filtered_discovery' &&
      renderCtx === 'chat' &&
      (ctx.suppliers?.length || 0) > 0,
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'SupplierTableWidget',
      size: 'md',
      props: {
        data: {
          suppliers: ctx.suppliers!.slice(0, 5).map(s => ({
            id: s.id,
            name: s.name,
            riskScore: s.srs?.score ?? 0,
            riskLevel: s.srs?.level ?? 'unrated',
            trend: s.srs?.trend ?? 'stable',
            spend: s.spendFormatted || `$${(s.spend / 1000000).toFixed(1)}M`,
            category: s.category,
            country: s.location?.country || '',
          })),
          totalCount: ctx.suppliers!.length,
          filters: {},
        },
      },
      expandsTo: 'SupplierTableArtifact',
    }),
  },
  {
    id: 'supplier_table_compact',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'filtered_discovery' &&
      renderCtx === 'chat_compact' &&
      (ctx.suppliers?.length || 0) > 0,
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'SupplierMiniTable',
      variant: 'compact',
      size: 'sm',
      props: {
        suppliers: ctx.suppliers!.slice(0, 3),
        totalCount: ctx.suppliers!.length,
        showTrend: true,
        showSpend: false,
        maxRows: 3,
      },
      expandsTo: 'SupplierTableArtifact',
    }),
  },
  {
    id: 'supplier_table_artifact',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'filtered_discovery' &&
      (renderCtx === 'panel' || renderCtx === 'panel_expanded'),
    priority: 100,
    getConfig: (ctx, renderCtx) => ({
      componentType: 'SupplierTableArtifact',
      size: renderCtx === 'panel_expanded' ? 'full' : 'lg',
      props: {
        suppliers: ctx.suppliers || [],
        totalCount: ctx.suppliers?.length || 0,
        categories: [...new Set(ctx.suppliers?.map(s => s.category) || [])],
        locations: [...new Set(ctx.suppliers?.map(s => s.location) || [])],
      },
    }),
  },

  // ==========================================
  // SUPPLIER DEEP DIVE
  // ==========================================
  {
    id: 'supplier_card_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'supplier_deep_dive' &&
      renderCtx === 'chat' &&
      !!ctx.supplier,
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'SupplierRiskCardWidget',
      size: 'md',
      props: {
        data: transformSupplierToRiskCardData(ctx.supplier!),
      },
      expandsTo: 'SupplierDetailArtifact',
    }),
  },
  {
    id: 'supplier_card_compact',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'supplier_deep_dive' &&
      renderCtx === 'chat_compact' &&
      !!ctx.supplier,
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'SupplierRiskCard',
      variant: 'compact',
      size: 'sm',
      props: {
        supplier: ctx.supplier,
      },
      expandsTo: 'SupplierDetailArtifact',
    }),
  },
  {
    id: 'supplier_detail_artifact',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'supplier_deep_dive' &&
      (renderCtx === 'panel' || renderCtx === 'panel_expanded'),
    priority: 100,
    getConfig: (ctx, renderCtx) => ({
      componentType: 'SupplierDetailArtifact',
      size: renderCtx === 'panel_expanded' ? 'full' : 'lg',
      props: {
        supplier: ctx.supplier,
      },
    }),
  },

  // ==========================================
  // TREND DETECTION
  // ==========================================
  {
    id: 'alert_card_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'trend_detection' &&
      renderCtx === 'chat' &&
      (ctx.riskChanges?.length || 0) > 0,
    priority: 100,
    getConfig: (ctx) => {
      const worsenedCount = ctx.riskChanges!.filter(c => c.direction === 'worsened').length;
      const hasCritical = ctx.riskChanges!.some(c =>
        c.direction === 'worsened' && (c.currentScore - c.previousScore) > 10
      );
      return {
        componentType: 'AlertCardWidget',
        size: 'md',
        props: {
          data: {
            alertType: worsenedCount > 0 ? 'risk_increase' : 'risk_decrease',
            severity: hasCritical ? 'critical' : worsenedCount > 0 ? 'warning' : 'info',
            title: `${ctx.riskChanges!.length} suppliers with risk changes`,
            description: `Risk scores have changed for these suppliers in your portfolio.`,
            affectedSuppliers: ctx.riskChanges!.slice(0, 5).map(c => ({
              name: c.supplierName,
              previousScore: c.previousScore,
              currentScore: c.currentScore,
              change: c.currentScore - c.previousScore,
            })),
            suggestedAction: worsenedCount > 0
              ? 'Review the affected suppliers and consider risk mitigation strategies.'
              : 'Risk improvements detected. Consider updating your risk assessment.',
            timestamp: new Date().toISOString(),
            actionRequired: worsenedCount > 0,
          },
        },
        expandsTo: 'SupplierTableArtifact',
      };
    },
  },
  {
    id: 'trend_changes_compact',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'trend_detection' &&
      renderCtx === 'chat_compact' &&
      (ctx.riskChanges?.length || 0) > 0,
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'TrendChangeIndicator',
      variant: 'card',
      size: 'sm',
      props: {
        previousScore: ctx.riskChanges![0].previousScore,
        currentScore: ctx.riskChanges![0].currentScore,
        changeDate: new Date().toISOString(),
      },
    }),
  },

  // ==========================================
  // COMPARISON
  // ==========================================
  {
    id: 'comparison_table_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'comparison' &&
      renderCtx === 'chat' &&
      (ctx.suppliers?.length || 0) >= 2,
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'ComparisonTableWidget',
      size: 'md',
      props: {
        data: transformSuppliersToComparisonData(ctx.suppliers!),
      },
      expandsTo: 'ComparisonArtifact',
    }),
  },
  {
    id: 'comparison_artifact',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'comparison' &&
      (renderCtx === 'panel' || renderCtx === 'panel_expanded'),
    priority: 100,
    getConfig: (ctx, renderCtx) => ({
      componentType: 'ComparisonArtifact',
      size: renderCtx === 'panel_expanded' ? 'full' : 'lg',
      props: {
        suppliers: ctx.suppliers || [],
        maxSuppliers: 4,
      },
    }),
  },

  // ==========================================
  // MARKET CONTEXT
  // ==========================================
  {
    id: 'market_context_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'market_context' &&
      renderCtx === 'chat',
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'MarketContextCard',
      size: 'md',
      props: {
        sector: 'Market',
        riskLevel: mapRiskLevelToMarketContext('medium'), // 'moderate' not 'medium'
        keyFactors: [],
        exposedSuppliers: ctx.suppliers?.length || 0,
        totalSpend: ctx.portfolio?.spendFormatted || '$0',
      },
    }),
  },
  {
    id: 'price_gauge_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'market_context' &&
      renderCtx === 'chat' &&
      ctx.widget?.type === 'price_gauge',
    priority: 110, // Higher priority when widget is price_gauge
    getConfig: (ctx) => ({
      componentType: 'PriceGaugeWidget',
      size: 'md',
      props: {
        data: ctx.widget!.data,
      },
    }),
  },

  // ==========================================
  // RESTRICTED QUERY (Handoff)
  // ==========================================
  {
    id: 'handoff_card_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'restricted_query' &&
      renderCtx === 'chat',
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'HandoffCard',
      variant: ctx.hasHandoff ? 'warning' : 'standard',
      size: 'md',
      props: {
        title: 'Additional Details Available',
        description: 'For detailed analysis and proprietary data, please visit the full dashboard.',
        linkText: 'Open in Dashboard',
        linkUrl: '/dashboard',
      },
    }),
  },

  // ==========================================
  // ACTION TRIGGER
  // ==========================================
  {
    id: 'action_confirmation_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'action_trigger' &&
      renderCtx === 'chat',
    priority: 100,
    getConfig: () => ({
      componentType: 'ActionConfirmationCard',
      variant: 'success',
      size: 'sm',
      props: {
        status: 'success',
        title: 'Action Completed',
        message: 'Your request has been processed.',
      },
    }),
  },

  // ==========================================
  // NO WIDGET NEEDED
  // ==========================================
  {
    id: 'no_widget',
    // Only suppress widgets when no widget data is provided
    matches: (ctx) =>
      !ctx.widget && (
        ctx.intent === 'explanation_why' ||
        ctx.intent === 'setup_config' ||
        ctx.intent === 'reporting_export' ||
        ctx.intent === 'general'
      ),
    priority: 10,
    getConfig: () => ({
      componentType: 'none',
      props: {},
    }),
  },
];

// ============================================
// MAIN SELECTION FUNCTION
// ============================================

export const selectComponent = (
  dataCtx: DataContext,
  renderCtx: RenderContext = 'chat'
): ComponentConfig | null => {
  // Find all matching rules
  const matchingRules = SELECTION_RULES
    .filter(rule => rule.matches(dataCtx, renderCtx))
    .sort((a, b) => b.priority - a.priority);

  if (matchingRules.length === 0) {
    return null;
  }

  // Return config from highest priority rule
  const selectedRule = matchingRules[0];
  return selectedRule.getConfig(dataCtx, renderCtx);
};

// ============================================
// HELPER: Get artifact component for expansion
// ============================================

export const getArtifactComponent = (
  dataCtx: DataContext
): ComponentConfig | null => {
  // First get chat config to find expandsTo
  const chatConfig = selectComponent(dataCtx, 'chat');

  if (!chatConfig?.expandsTo) {
    return null;
  }

  // Then get the panel config
  return selectComponent(dataCtx, 'panel');
};

// ============================================
// HELPER: Build data context from response
// ============================================

export const buildDataContext = (
  intent: IntentCategory,
  options: {
    portfolio?: Portfolio;
    suppliers?: Supplier[];
    supplier?: Supplier;
    riskChanges?: RiskChange[];
    widget?: WidgetData;
    subIntent?: string;
    resultCount?: number;
    hasHandoff?: boolean;
  } = {}
): DataContext => {
  return {
    intent,
    subIntent: options.subIntent,
    portfolio: options.portfolio,
    suppliers: options.suppliers,
    supplier: options.supplier || options.suppliers?.[0],
    riskChanges: options.riskChanges,
    widget: options.widget,
    resultCount: options.resultCount ?? options.suppliers?.length,
    hasHandoff: options.hasHandoff,
  };
};

// ============================================
// WIDGET TYPE TO COMPONENT MAPPING
// ============================================

export const WIDGET_COMPONENT_MAP: Record<WidgetType, string> = {
  // Portfolio & Overview
  risk_distribution: 'RiskDistributionWidget',
  portfolio_summary: 'PortfolioOverviewCard',
  metric_row: 'MetricRowWidget',
  spend_exposure: 'SpendExposureWidget',
  health_scorecard: 'HealthScorecardWidget',

  // Supplier Focused
  supplier_risk_card: 'SupplierRiskCardWidget',
  supplier_table: 'SupplierTableWidget',
  supplier_mini: 'SupplierMiniCard',
  comparison_table: 'ComparisonTableWidget',

  // Trends & Alerts
  trend_chart: 'TrendChartWidget',
  trend_indicator: 'TrendChangeIndicator',
  alert_card: 'AlertCardWidget',
  event_timeline: 'EventTimelineWidget',
  events_feed: 'EventsFeedWidget',

  // Market & Context
  price_gauge: 'PriceGaugeWidget',
  market_card: 'MarketContextCard',
  benchmark_card: 'BenchmarkCard',
  news_item: 'NewsItemCard',

  // Categories & Regions
  category_breakdown: 'CategoryBreakdownWidget',
  category_badge: 'CategoryBadge',
  region_map: 'RegionMapWidget',
  region_list: 'RegionListWidget',

  // Actions & Status
  action_card: 'ActionConfirmationCard',
  handoff_card: 'HandoffCard',
  status_badge: 'StatusBadge',
  score_breakdown: 'ScoreBreakdownWidget',

  // General Purpose
  stat_card: 'StatCard',
  info_card: 'InfoCard',
  quote_card: 'QuoteCard',
  recommendation_card: 'RecommendationCard',
  checklist_card: 'ChecklistCard',
  progress_card: 'ProgressCard',
  executive_summary: 'ExecutiveSummaryCard',
  data_list: 'DataListCard',

  // Text Only
  none: '',
};

// ============================================
// DEBUG: Get all matching rules
// ============================================

export const debugSelection = (
  dataCtx: DataContext,
  renderCtx: RenderContext = 'chat'
): { rule: string; priority: number; matches: boolean }[] => {
  return SELECTION_RULES.map(rule => ({
    rule: rule.id,
    priority: rule.priority,
    matches: rule.matches(dataCtx, renderCtx),
  }));
};
