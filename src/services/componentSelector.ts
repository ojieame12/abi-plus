// Unified Component Selection Service
// Routes intents and data to the correct component configuration

import type { IntentCategory, SubIntent } from '../types/intents';
import type { WidgetType, WidgetData } from '../types/widgets';
import type { Supplier, Portfolio, RiskChange } from '../types/data';
import {
  transformSupplierToRiskCardData,
  transformSuppliersToComparisonData,
  mapRiskLevelToMarketContext,
} from './widgetTransformers';
import {
  getWidgetForIntent,
  getWidgetByType,
  type RequiredData,
  type RenderContext as RegistryRenderContext,
} from './widgetRegistry';

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
  events?: unknown[]; // News/events data

  // Inflation data
  inflationSummary?: unknown;
  commodityData?: unknown;
  commodityDrivers?: unknown;
  portfolioExposure?: unknown;
  justificationData?: unknown;
  scenarioData?: unknown;

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
  // WIDGET TYPE OVERRIDES (Honor router decisions)
  // These rules check widget.type and have highest priority
  // ==========================================
  {
    id: 'spend_exposure_by_widget_type',
    matches: (ctx, renderCtx) =>
      ctx.widget?.type === 'spend_exposure' &&
      (renderCtx === 'chat' || renderCtx === 'panel'),
    priority: 200, // Higher than all intent-based rules
    getConfig: (ctx, renderCtx) => ({
      componentType: 'SpendExposureWidget',
      size: renderCtx === 'panel' ? 'lg' : 'md',
      props: {
        data: ctx.widget?.data || {},
      },
      expandsTo: 'PortfolioDashboardArtifact',
    }),
  },

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
          totalSpendFormatted: ctx.portfolio!.spendFormatted || (ctx.portfolio as any).totalSpendFormatted || `$${ctx.portfolio!.totalSpend}`,
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
            affectedSuppliers: ctx.riskChanges!.slice(0, 5).map(c => {
              const diff = c.currentScore - c.previousScore;
              return {
                name: c.supplierName,
                previousScore: c.previousScore,
                currentScore: c.currentScore,
                change: `${diff > 0 ? '+' : ''}${diff}`,
              };
            }),
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
        totalSpend: ctx.portfolio?.spendFormatted || (ctx.portfolio as any)?.totalSpendFormatted || '$0',
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
      expandsTo: 'commodity_dashboard',
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
  // ACTION TRIGGER - Supplier table for alternatives
  // ==========================================
  // Alternatives preview widget - higher priority when widget type is set
  {
    id: 'action_alternatives_preview_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'action_trigger' &&
      renderCtx === 'chat' &&
      ctx.widget?.type === 'alternatives_preview' &&
      ctx.widget?.data, // Widget data has the correct values from buildWidgetData
    priority: 115, // Higher than supplier table fallback
    getConfig: (ctx) => {
      // Use widget.data which has correct currentSupplier/currentScore/alternatives
      const widgetData = ctx.widget!.data as {
        currentSupplier: string;
        currentScore: number;
        alternatives: Array<{
          id: string;
          name: string;
          score: number;
          level: string;
          category: string;
          matchScore: number;
        }>;
      };

      return {
        componentType: 'AlternativesPreviewCard',
        size: 'md',
        props: {
          currentSupplier: widgetData.currentSupplier,
          currentScore: widgetData.currentScore,
          alternatives: widgetData.alternatives,
        },
        expandsTo: 'AlternativesArtifact',
      };
    },
  },
  {
    id: 'action_alternatives_table_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'action_trigger' &&
      renderCtx === 'chat' &&
      (ctx.suppliers?.length || 0) > 0,
    priority: 110, // Lower priority - fallback when no specific widget
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
  // Action confirmation only when action is actually completed (widget explicitly set)
  {
    id: 'action_confirmation_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'action_trigger' &&
      renderCtx === 'chat' &&
      ctx.widget?.type === 'action_card',
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
  // EXPLANATION - Show supplier table when we have data
  // ==========================================
  {
    id: 'explanation_supplier_table_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'explanation_why' &&
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

  // ==========================================
  // INFLATION WATCH
  // ==========================================
  {
    id: 'inflation_summary_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'inflation_summary' &&
      renderCtx === 'chat' &&
      (!!ctx.inflationSummary || ctx.widget?.type === 'inflation_summary_card'),
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'InflationSummaryCard',
      size: 'md',
      props: ctx.widget?.data || ctx.inflationSummary || {},
      expandsTo: 'InflationDashboardArtifact',
    }),
  },
  {
    id: 'inflation_drivers_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'inflation_drivers' &&
      renderCtx === 'chat' &&
      (!!ctx.commodityDrivers || ctx.widget?.type === 'driver_breakdown_card'),
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'DriverBreakdownCard',
      size: 'md',
      props: ctx.widget?.data || ctx.commodityDrivers || {},
      expandsTo: 'DriverAnalysisArtifact',
    }),
  },
  {
    id: 'inflation_impact_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'inflation_impact' &&
      renderCtx === 'chat' &&
      (!!ctx.portfolioExposure || ctx.widget?.type === 'spend_impact_card'),
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'SpendImpactCard',
      size: 'md',
      props: ctx.widget?.data || ctx.portfolioExposure || {},
      expandsTo: 'ImpactAnalysisArtifact',
    }),
  },
  {
    id: 'inflation_justification_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'inflation_justification' &&
      renderCtx === 'chat' &&
      (!!ctx.justificationData || ctx.widget?.type === 'justification_card'),
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'JustificationCard',
      size: 'md',
      props: ctx.widget?.data || ctx.justificationData || {},
      expandsTo: 'JustificationReportArtifact',
    }),
  },
  {
    id: 'inflation_scenarios_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'inflation_scenarios' &&
      renderCtx === 'chat' &&
      (!!ctx.scenarioData || ctx.widget?.type === 'scenario_card'),
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'ScenarioCard',
      size: 'md',
      props: ctx.widget?.data || ctx.scenarioData || {},
      expandsTo: 'ScenarioPlannerArtifact',
    }),
  },
  {
    id: 'inflation_communication_chat',
    matches: (ctx, renderCtx) =>
      ctx.intent === 'inflation_communication' &&
      renderCtx === 'chat' &&
      (!!ctx.inflationSummary || ctx.widget?.type === 'executive_brief_card'),
    priority: 100,
    getConfig: (ctx) => ({
      componentType: 'ExecutiveBriefCard',
      size: 'md',
      props: ctx.widget?.data || ctx.inflationSummary || {},
      expandsTo: 'ExecutivePresentationArtifact',
    }),
  },
  {
    id: 'commodity_gauge_chat',
    matches: (ctx, renderCtx) =>
      (ctx.intent === 'inflation_summary' || ctx.intent === 'inflation_drivers') &&
      renderCtx === 'chat' &&
      ctx.widget?.type === 'commodity_gauge',
    priority: 110, // Higher priority when widget type is commodity_gauge
    getConfig: (ctx) => ({
      componentType: 'CommodityGaugeCard',
      size: 'md',
      props: ctx.widget?.data || {},
      expandsTo: 'commodity_dashboard',
    }),
  },

  // ==========================================
  // NO WIDGET NEEDED
  // ==========================================
  {
    id: 'no_widget',
    // Only suppress widgets when no widget data is provided
    matches: (ctx) =>
      !ctx.widget && !ctx.suppliers?.length && (
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
    commodityData?: unknown;
    commodityDrivers?: unknown;
  } = {}
): DataContext => {
  // Extract inflation data from widget if present
  const widget = options.widget;
  let inflationSummary: unknown;
  let commodityDrivers: unknown = options.commodityDrivers;
  let portfolioExposure: unknown;
  let justificationData: unknown;
  let scenarioData: unknown;
  let commodityData: unknown = options.commodityData;

  if (widget?.data) {
    switch (widget.type) {
      case 'inflation_summary_card':
        inflationSummary = widget.data;
        break;
      case 'driver_breakdown_card':
        commodityDrivers = widget.data;
        break;
      case 'spend_impact_card':
        portfolioExposure = widget.data;
        break;
      case 'justification_card':
        justificationData = widget.data;
        break;
      case 'scenario_card':
        scenarioData = widget.data;
        break;
      case 'price_gauge':
      case 'commodity_gauge':
        commodityData = widget.data;
        break;
    }
  }

  return {
    intent,
    subIntent: options.subIntent,
    portfolio: options.portfolio,
    suppliers: options.suppliers,
    supplier: options.supplier || options.suppliers?.[0],
    riskChanges: options.riskChanges,
    widget: options.widget,
    // Inflation data extracted from widget
    inflationSummary,
    commodityData,
    commodityDrivers,
    portfolioExposure,
    justificationData,
    scenarioData,
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
  trend_indicator: 'TrendBadge',
  alert_card: 'AlertCardWidget',
  event_timeline: 'EventTimelineWidget',
  events_feed: 'EventsFeedWidget',

  // Market & Context
  price_gauge: 'PriceGaugeWidget',
  market_card: 'NewsItemCard',
  benchmark_card: 'BenchmarkCard', // Not implemented - renders nothing
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

  // Risk Analysis
  factor_breakdown: 'FactorBreakdownCard',
  news_events: 'NewsEventsCard',
  alternatives_preview: 'AlternativesPreviewCard',
  concentration_warning: 'ConcentrationWarningCard',

  // Inflation Watch
  inflation_summary_card: 'InflationSummaryCard',
  price_movement_table: 'PriceMovementTable',
  commodity_gauge: 'CommodityGaugeCard',
  top_movers_list: 'TopMoversCard',
  driver_breakdown_card: 'DriverBreakdownCard',
  factor_contribution_chart: 'FactorContributionChart',
  market_context_card: 'MarketContextCard',
  spend_impact_card: 'SpendImpactCard',
  exposure_heatmap: 'ExposureHeatmap',
  budget_variance_card: 'BudgetVarianceCard',
  justification_card: 'JustificationCard',
  market_fairness_gauge: 'MarketFairnessGauge',
  negotiation_ammo_card: 'NegotiationAmmoCard',
  scenario_card: 'ScenarioCard',
  forecast_chart: 'ForecastChart',
  sensitivity_table: 'SensitivityTable',
  executive_brief_card: 'ExecutiveBriefCard',
  talking_points_card: 'TalkingPointsCard',

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

// ============================================
// REGISTRY-BASED SELECTION (NEW)
// Uses unified widgetRegistry.ts as source of truth
// ============================================

/**
 * Convert DataContext to RequiredData array for registry lookup
 */
function getAvailableData(ctx: DataContext): RequiredData[] {
  const available: RequiredData[] = [];

  if (ctx.portfolio) available.push('portfolio');
  if (ctx.suppliers && ctx.suppliers.length > 0) available.push('suppliers');
  if (ctx.supplier) available.push('supplier');
  if (ctx.riskChanges && ctx.riskChanges.length > 0) available.push('riskChanges');
  if (ctx.events && ctx.events.length > 0) available.push('events');
  if (ctx.inflationSummary) available.push('inflationSummary');
  if (ctx.commodityData) available.push('commodityData');
  if (ctx.commodityDrivers) available.push('commodityDrivers');
  if (ctx.portfolioExposure) available.push('portfolioExposure');
  if (ctx.justificationData) available.push('justificationData');
  if (ctx.scenarioData) available.push('scenarioData');

  return available;
}

/**
 * Convert local RenderContext to registry RenderContext
 */
function toRegistryContext(ctx: RenderContext): RegistryRenderContext {
  return ctx as RegistryRenderContext;
}

/**
 * Select widget using the unified registry
 * Returns the widget component name and metadata
 */
export function selectWidgetFromRegistry(
  intent: IntentCategory,
  subIntent?: SubIntent,
  dataCtx: DataContext = { intent },
  renderCtx: RenderContext = 'chat'
): { component: string; expandsTo?: string; priority: number } | null {
  const availableData = getAvailableData(dataCtx);
  const registryCtx = toRegistryContext(renderCtx);

  const widget = getWidgetForIntent(intent, subIntent, availableData, registryCtx);

  if (!widget) return null;

  return {
    component: widget.component,
    expandsTo: widget.expandsTo,
    priority: widget.priority,
  };
}

/**
 * Get widget metadata from registry by type
 */
export function getWidgetMetadata(type: WidgetType) {
  return getWidgetByType(type);
}
