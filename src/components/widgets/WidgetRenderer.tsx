/* eslint-disable react-refresh/only-export-components -- Exports multiple widget components and utilities */
// Widget Renderer - Routes to appropriate widget component based on type or data context
import type { WidgetData } from '../../types/widgets';
import type { IntentCategory } from '../../types/intents';
import type { Supplier, Portfolio, RiskChange } from '../../types/data';
import type { RiskPortfolio } from '../../types/supplier';
import type { ResponseInsight } from '../../types/aiResponse';
import { InsightBanner } from '../chat/InsightBanner';
import { WidgetFooter } from './WidgetFooter';
import {
  selectComponent,
  buildDataContext,
  type RenderContext,
  type ComponentConfig,
} from '../../services/componentSelector';
import { getWidgetByType } from '../../services/widgetRegistry';
import { extractEventsArray } from '../../services/widgetTransformers';

// Widget Components
import { RiskDistributionWidget } from './RiskDistributionWidget';
import { SupplierRiskCardWidget } from './SupplierRiskCardWidget';
import { SupplierTableWidget } from './SupplierTableWidget';
import { AlertCardWidget } from './AlertCardWidget';
import { PriceGaugeWidget } from './PriceGaugeWidget';
import { MetricRowWidget } from './MetricRowWidget';
import { ComparisonTableWidget } from './ComparisonTableWidget';
import { TrendChartWidget } from './TrendChartWidget';
import { ScoreBreakdownWidget } from './ScoreBreakdownWidget';
import { EventTimelineWidget } from './EventTimelineWidget';
import { NewsItemCard } from './NewsItemCard';
import { SupplierMiniCard } from './SupplierMiniCard';
import { CategoryBreakdownWidget } from './CategoryBreakdownWidget';
import { RegionListWidget } from './RegionListWidget';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';

// New Widgets
import { SpendExposureWidget } from './SpendExposureWidget';
import { HealthScorecardWidget } from './HealthScorecardWidget';
import { EventsFeedWidget } from './EventsFeedWidget';
import { StatCard } from './StatCard';
import { InfoCard } from './InfoCard';
import { QuoteCard } from './QuoteCard';
import { RecommendationCard } from './RecommendationCard';
import { ChecklistCard } from './ChecklistCard';
import { ProgressCard } from './ProgressCard';
import { ExecutiveSummaryCard } from './ExecutiveSummaryCard';
import { DataListCard } from './DataListCard';

// Risk Analysis Widgets
import { FactorBreakdownCard } from './FactorBreakdownCard';
import { NewsEventsCard } from './NewsEventsCard';
import { AlternativesPreviewCard } from './AlternativesPreviewCard';
import { ConcentrationWarningCard } from './ConcentrationWarningCard';

// Inflation Watch Widgets
import {
  InflationSummaryCard,
  DriverBreakdownCard,
  SpendImpactCard,
  JustificationCard,
  ScenarioCard,
  ExecutiveBriefCard,
} from './inflation';

// Risk Components (for alternates)
import { RiskDistributionChart } from '../risk/RiskDistributionChart';
import { SupplierRiskCard } from '../risk/SupplierRiskCard';
import { SupplierMiniTable } from '../risk/SupplierMiniTable';
import { TrendChangeIndicator } from '../risk/TrendChangeIndicator';
import { MarketContextCard } from '../risk/MarketContextCard';
import { HandoffCard } from '../risk/HandoffCard';
import { ActionConfirmationCard } from '../risk/ActionConfirmationCard';

// Utility Components
import { TrendBadge } from './TrendBadge';

// ============================================
// COMPONENT REGISTRY
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  // Widget components - Portfolio
  RiskDistributionWidget,
  MetricRowWidget,
  SpendExposureWidget,
  HealthScorecardWidget,

  // Widget components - Supplier
  SupplierRiskCardWidget,
  SupplierTableWidget,
  SupplierMiniCard,
  ComparisonTableWidget,

  // Widget components - Trends
  AlertCardWidget,
  TrendChartWidget,
  EventTimelineWidget,
  EventsFeedWidget,

  // Widget components - Market/Categories
  PriceGaugeWidget,
  CommodityGaugeCard: PriceGaugeWidget, // Alias for commodity_gauge widget type
  NewsItemCard,
  CategoryBreakdownWidget,
  RegionListWidget,
  CategoryBadge,
  StatusBadge,
  ScoreBreakdownWidget,

  // Widget components - General Purpose
  StatCard,
  InfoCard,
  QuoteCard,
  RecommendationCard,
  ChecklistCard,
  ProgressCard,
  ExecutiveSummaryCard,
  DataListCard,

  // Widget components - Risk Analysis
  FactorBreakdownCard,
  NewsEventsCard,
  AlternativesPreviewCard,
  ConcentrationWarningCard,

  // Widget components - Inflation Watch
  InflationSummaryCard,
  DriverBreakdownCard,
  SpendImpactCard,
  JustificationCard,
  ScenarioCard,
  ExecutiveBriefCard,

  // Risk components
  RiskDistributionChart,
  SupplierRiskCard,
  SupplierMiniTable,
  TrendChangeIndicator,
  MarketContextCard,
  HandoffCard,
  ActionConfirmationCard,

  // Utility components
  TrendBadge,
};

// ============================================
// PROPS INTERFACES
// ============================================

// Direct widget data rendering (original interface)
interface DirectWidgetProps {
  widget: WidgetData;
  title?: string;
  className?: string;
}

// AI-generated artifact content
interface ArtifactContent {
  title: string;
  overview: string;
  keyPoints: string[];
  recommendations?: string[];
}

// Context-based rendering (new interface)
interface ContextWidgetProps {
  intent: IntentCategory;
  subIntent?: string;  // Sub-intent for granular widget selection
  renderContext?: RenderContext;
  portfolio?: Portfolio | RiskPortfolio; // Accept both types
  suppliers?: Supplier[];
  supplier?: Supplier;
  riskChanges?: RiskChange[];
  widget?: WidgetData;
  artifactContent?: ArtifactContent; // AI-generated content for artifact panel
  title?: string;
  className?: string;
  onExpand?: (artifactComponent: string) => void;
  onOpenArtifact?: (type: string, payload: Record<string, unknown>) => void;
  // Insight support - unified insight banner inside widget
  insight?: ResponseInsight;
  onInsightClick?: (insightData: Record<string, unknown>) => void;
  // Sources support - unified footer shows all sources
  sources?: import('../../types/aiResponse').ResponseSources;
}

type WidgetRendererProps = DirectWidgetProps | ContextWidgetProps;

// Type guard
const isContextProps = (props: WidgetRendererProps): props is ContextWidgetProps => {
  return 'intent' in props;
};

// ============================================
// MAIN RENDERER
// ============================================

export const WidgetRenderer = (props: WidgetRendererProps) => {
  const { title, className = '' } = props;

  // Determine which rendering path to use
  let config: ComponentConfig | null = null;

  if (isContextProps(props)) {
    // PRIORITY 1: If widget.type is explicitly set, honor it over selection rules
    // This ensures registry-routed widgets (sub-intent specific) aren't overridden
    if (props.widget?.type && props.widget.type !== 'none') {
      config = getConfigFromWidget(props.widget as WidgetData);
    }

    // PRIORITY 2: Fall back to context-based selection if no explicit widget type
    if (!config) {
      const dataCtx = buildDataContext(props.intent, {
        // RiskPortfolio is a superset of Portfolio, safe to cast
        portfolio: props.portfolio as Portfolio | undefined,
        suppliers: props.suppliers,
        supplier: props.supplier,
        riskChanges: props.riskChanges,
        widget: props.widget,
        subIntent: props.subIntent,
      });

      config = selectComponent(dataCtx, props.renderContext || 'chat');
    }

    // PRIORITY 3: Try widget data if selectComponent returned nothing
    if (!config && props.widget) {
      config = getConfigFromWidget(props.widget as WidgetData);
    }
  } else {
    // Direct widget rendering (legacy path)
    config = getConfigFromWidget(props.widget);
  }

  // No component needed
  if (!config || config.componentType === 'none') {
    return null;
  }

  // Ensure expandsTo is populated when widget.type is present (registry-backed)
  if (isContextProps(props) && !config.expandsTo && props.widget?.type) {
    const registryEntry = getWidgetByType(props.widget.type);
    const expandsTo = registryEntry?.expandsTo || registryEntry?.artifactType;
    if (expandsTo) {
      config = { ...config, expandsTo };
    }
  }

  // Get the component
  const Component = COMPONENT_MAP[config.componentType];

  if (!Component) {
    return <PlaceholderWidget type={config.componentType} />;
  }

  // Handle expand callback
  const handleExpand = isContextProps(props) && props.onExpand && config.expandsTo
    ? () => props.onExpand!(config!.expandsTo!)
    : undefined;

  // Build artifact open handlers for specific widget types
  const artifactHandlers: Record<string, () => void> = {};

  if (isContextProps(props) && props.onOpenArtifact) {
    const { onOpenArtifact, supplier, portfolio, artifactContent } = props;

    // FactorBreakdownCard → factor_breakdown artifact
    if (config.componentType === 'FactorBreakdownCard') {
      artifactHandlers.onViewDetails = () => {
        // Map scoreHistory numbers to {date, score} objects if available
        const scoreHistory = supplier?.srs?.scoreHistory?.map((score, i, arr) => ({
          date: new Date(Date.now() - (arr.length - 1 - i) * 30 * 24 * 60 * 60 * 1000).toISOString(),
          score,
        }));

        onOpenArtifact('factor_breakdown', {
          supplierName: config.props.supplierName,
          supplierId: supplier?.id,
          overallScore: config.props.overallScore,
          previousScore: supplier?.srs?.previousScore,
          level: config.props.level,
          trend: supplier?.srs?.trend || 'stable',
          lastUpdated: supplier?.srs?.lastUpdated || new Date().toISOString(),
          factors: config.props.factors,
          scoreHistory,
          // AI-generated content
          aiContent: artifactContent,
        });
      };
    }

    // NewsEventsCard → news_events artifact
    if (config.componentType === 'NewsEventsCard') {
      artifactHandlers.onViewAll = () => {
        onOpenArtifact('news_events', {
          title: config.props.title || 'News & Events',
          context: supplier ? { type: 'supplier', name: supplier.name, id: supplier.id } : undefined,
          events: config.props.events,
          aiContent: artifactContent,
        });
      };
    }

    // AlternativesPreviewCard → supplier_alternatives artifact
    if (config.componentType === 'AlternativesPreviewCard') {
      artifactHandlers.onViewAll = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const altProps = config.props as any;
        onOpenArtifact('supplier_alternatives', {
          currentSupplier: {
            id: supplier?.id || 'unknown',
            name: altProps.currentSupplier,
            score: altProps.currentScore,
            category: supplier?.category || altProps.alternatives?.[0]?.category || 'General',
          },
          alternatives: altProps.alternatives,
          aiContent: artifactContent,
        });
      };
    }

    // ConcentrationWarningCard → spend_analysis artifact
    if (config.componentType === 'ConcentrationWarningCard') {
      artifactHandlers.onViewDetails = () => {
        // Enrich with portfolio data when available
        // Handle both Portfolio (spendFormatted) and RiskPortfolio (totalSpendFormatted)
        const portfolioTotalSpend = portfolio?.totalSpend || 0;
        const totalSpendFormatted =
          ('totalSpendFormatted' in (portfolio || {}))
            ? (portfolio as RiskPortfolio).totalSpendFormatted
            : ('spendFormatted' in (portfolio || {}))
              ? (portfolio as Portfolio).spendFormatted
              : formatCurrency(portfolioTotalSpend);
        const dist = portfolio?.distribution;

        // Distribution values are supplier counts, calculate percentages
        const buildRiskLevelData = () => {
          if (!dist) return [];
          const total = dist.high + dist.mediumHigh + dist.medium + dist.low + (dist.unrated || 0);
          if (total === 0) return [];

          const makeEntry = (level: string, count: number) => {
            const percent = (count / total) * 100;
            const amount = (percent / 100) * portfolioTotalSpend;
            return {
              level,
              amount,
              formatted: formatCurrency(amount),
              percent,
              supplierCount: count,
            };
          };

          return [
            makeEntry('high', dist.high),
            makeEntry('medium-high', dist.mediumHigh),
            makeEntry('medium', dist.medium),
            makeEntry('low', dist.low),
          ].filter(e => e.supplierCount > 0);
        };

        onOpenArtifact('spend_analysis', {
          totalSpend: portfolioTotalSpend,
          totalSpendFormatted,
          byRiskLevel: buildRiskLevelData(),
          concentrationWarnings: [{
            type: config.props.type,
            entity: config.props.entity,
            concentration: config.props.concentration,
            threshold: config.props.threshold,
            spend: config.props.spend,
            severity: config.props.severity,
          }],
          aiContent: artifactContent,
        });
      };
    }

    // SpendExposureWidget → spend_analysis artifact
    if (config.componentType === 'SpendExposureWidget') {
      artifactHandlers.onViewDetails = () => {
        // Handle both Portfolio (spendFormatted) and RiskPortfolio (totalSpendFormatted)
        const fallbackSpendFormatted =
          ('totalSpendFormatted' in (portfolio || {}))
            ? (portfolio as RiskPortfolio).totalSpendFormatted
            : ('spendFormatted' in (portfolio || {}))
              ? (portfolio as Portfolio).spendFormatted
              : '$0';

        onOpenArtifact('spend_analysis', {
          totalSpend: config.props.totalSpend || portfolio?.totalSpend || 0,
          totalSpendFormatted: config.props.totalSpendFormatted || fallbackSpendFormatted,
          byRiskLevel: config.props.breakdown || [],
          // Note: category/region breakdowns not available in Portfolio type
          byCategory: [],
          byRegion: [],
          aiContent: artifactContent,
        });
      };
    }

    // SupplierTableWidget → supplier_table artifact (view all) and supplier_detail (row click)
    if (config.componentType === 'SupplierTableWidget') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tableData = (config.props as any).data || {};
      artifactHandlers.onViewAll = () => {
        onOpenArtifact('supplier_table', {
          suppliers: props.suppliers || tableData.suppliers || [],
          totalCount: tableData.totalCount || props.suppliers?.length || 0,
          filter: tableData.filters,
          aiContent: artifactContent,
        });
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (artifactHandlers as any).onRowClick = (supplierRow: Record<string, unknown>) => {
        // Find full supplier data if available, otherwise use row data
        const fullSupplier = props.suppliers?.find(s => s.id === supplierRow.id) || supplierRow;
        onOpenArtifact('supplier_detail', {
          supplier: fullSupplier,
          aiContent: artifactContent,
        });
      };
    }

    // SupplierMiniTable → supplier_table artifact (view all) and supplier_detail (row click)
    if (config.componentType === 'SupplierMiniTable') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const miniProps = config.props as any;
      artifactHandlers.onViewAll = () => {
        onOpenArtifact('supplier_table', {
          suppliers: props.suppliers || miniProps.suppliers || [],
          totalCount: miniProps.totalCount || props.suppliers?.length || 0,
          aiContent: artifactContent,
        });
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (artifactHandlers as any).onRowClick = (supplierRow: Record<string, unknown>) => {
        // Find full supplier data if available, otherwise use row data
        const fullSupplier = props.suppliers?.find(s => s.id === supplierRow.id) || supplierRow;
        onOpenArtifact('supplier_detail', {
          supplier: fullSupplier,
          aiContent: artifactContent,
        });
      };
    }
  }

  // Pass onViewDetails for widgets that render an internal details CTA
  const VIEW_DETAILS_COMPONENTS = new Set([
    // Inflation widgets
    'InflationSummaryCard',
    'DriverBreakdownCard',
    'SpendImpactCard',
    'JustificationCard',
    'ScenarioCard',
    'ExecutiveBriefCard',
    // Portfolio/Risk widgets
    'HealthScorecardWidget',
    'ConcentrationWarningCard',
    'SpendExposureWidget',
    'FactorBreakdownCard',
    'RiskDistributionWidget',
    'RiskDistributionChart',
    // Supplier widgets
    'SupplierRiskCardWidget',
    'SupplierRiskCard',
    // Market/Price widgets
    'PriceGaugeWidget',
    'CommodityGaugeCard',
    'TrendChartWidget',
    // Alert/Event widgets
    'AlertCardWidget',
    'EventTimelineWidget',
    'EventsFeedWidget',
  ]);

  if (handleExpand && !artifactHandlers.onViewDetails && VIEW_DETAILS_COMPONENTS.has(config.componentType)) {
    artifactHandlers.onViewDetails = handleExpand;
  }

  // Helper for currency formatting
  function formatCurrency(value: number): string {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }

  // Don't show external expand button if widget has its own internal handler
  const hasInternalExpandHandler = Object.keys(artifactHandlers).length > 0;

  // Extract insight props if context-based
  const insight = isContextProps(props) ? props.insight : undefined;
  const onInsightClick = isContextProps(props) ? props.onInsightClick : undefined;

  // Build rich insight data for artifact panel
  const handleInsightClick = () => {
    if (!onInsightClick || !insight) return;

    const insightData: Record<string, unknown> = {
      headline: insight.headline,
      summary: insight.summary || insight.explanation,
      sentiment: insight.sentiment,
      type: insight.type || 'info',
      factors: insight.factors,
      actions: insight.actions,
      sources: insight.sources,
      metric: insight.metric,
    };

    // Include entity from insight or supplier context
    if (insight.entity) {
      insightData.entity = insight.entity;
    } else if (isContextProps(props) && props.supplier) {
      insightData.entity = {
        name: props.supplier.name,
        type: 'supplier',
      };
    }

    onInsightClick(insightData);
  };

  // When we have insight, we want unified footer rendering:
  // Widget content → Insight → Footer (all inside widget container)
  const shouldUseUnifiedFooter = !!insight;

  // Get view details handler - either from artifact handlers or expand handler
  const viewDetailsHandler = artifactHandlers.onViewDetails || handleExpand;

  // Extract sources for unified footer
  const sources = isContextProps(props) ? props.sources : undefined;

  // Handler for clicking internal sources (opens report viewer)
  const handleSourceClick = isContextProps(props) && props.onOpenArtifact
    ? (source: import('../../types/aiResponse').InternalSource) => {
        props.onOpenArtifact!('report_viewer', {
          report: {
            id: source.reportId || `report-${source.name.toLowerCase().replace(/\s+/g, '-')}`,
            title: source.name,
            category: source.category || (source.type === 'beroe' ? 'Beroe Intelligence' : 'Data Source'),
            publishedDate: source.lastUpdated || new Date().toISOString(),
            summary: source.summary,
            url: source.url,
          },
          queryContext: {
            highlightTerms: [],
          },
        });
      }
    : undefined;

  // Unified container styling when insight is present
  const unifiedContainerClasses = `
    bg-white/80
    rounded-[1.25rem] border border-slate-100/60
    shadow-[0_8px_30px_rgb(0,0,0,0.04)]
    ring-1 ring-black/[0.02]
    backdrop-blur-sm
    overflow-hidden
  `;

  return (
    <div className={`widget-container ${className}`}>
      {title && (
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
          {title}
        </div>
      )}

      {/* When using unified footer, wrap everything in a single card container */}
      {shouldUseUnifiedFooter ? (
        <div className={unifiedContainerClasses}>
          {/* Widget content - no container styling since we provide it */}
          <Component
            {...config.props}
            {...artifactHandlers}
            hideFooter={true}
          />

          {/* Insight Banner - inside the unified card */}
          {insight && (
            <div className="px-5 pt-3 pb-1">
              <InsightBanner
                insight={insight}
                onClick={onInsightClick ? handleInsightClick : undefined}
              />
            </div>
          )}

          {/* Unified footer - inside the card, only if there's content to show */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(sources?.totalWebCount || sources?.totalInternalCount || (config.props as any)?.beroeSourceCount || viewDetailsHandler !== undefined || sources?.confidence) && (
            <WidgetFooter
              sources={sources}
              confidence={sources?.confidence}
              beroeSourceCount={(config.props as Record<string, unknown>)?.beroeSourceCount as number | undefined}
              hasBeroeSourceCount={(config.props as Record<string, unknown>)?.beroeSourceCount !== undefined}
              onViewDetails={viewDetailsHandler}
              onSourceClick={handleSourceClick}
            />
          )}
        </div>
      ) : (
        <>
          {/* Widget component renders its own container */}
          <Component
            {...config.props}
            {...artifactHandlers}
            hideFooter={false}
          />

          {/* Fallback expand button for widgets without unified footer */}
          {handleExpand && !hasInternalExpandHandler && (
            <button
              onClick={handleExpand}
              className="mt-2 text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              View full details →
            </button>
          )}
        </>
      )}
    </div>
  );
};

// ============================================
// LEGACY: Direct widget data to config
// ============================================

const getConfigFromWidget = (widget: WidgetData): ComponentConfig | null => {
  if (widget.type === 'none' || !widget.data) {
    return null;
  }

  switch (widget.type) {
    case 'risk_distribution':
      return {
        componentType: 'RiskDistributionWidget',
        props: { data: widget.data },
      };

    case 'supplier_risk_card':
      return {
        componentType: 'SupplierRiskCardWidget',
        props: { data: widget.data },
      };

    case 'supplier_table':
      return {
        componentType: 'SupplierTableWidget',
        props: { data: widget.data },
      };

    case 'comparison_table':
      return {
        componentType: 'ComparisonTableWidget',
        props: { data: widget.data },
      };

    case 'alert_card':
      return {
        componentType: 'AlertCardWidget',
        props: { data: widget.data },
      };

    case 'price_gauge':
      return {
        componentType: 'PriceGaugeWidget',
        props: { data: widget.data },
      };

    case 'metric_row':
      return {
        componentType: 'MetricRowWidget',
        props: { data: widget.data },
      };

    case 'trend_chart':
      return {
        componentType: 'TrendChartWidget',
        props: { data: widget.data },
      };

    case 'category_breakdown':
      return {
        componentType: 'CategoryBreakdownWidget',
        props: { data: widget.data },
      };

    case 'region_list':
      return {
        componentType: 'RegionListWidget',
        props: { data: widget.data },
      };

    case 'region_map':
      return null; // Not implemented

    // New portfolio widgets
    case 'spend_exposure':
      return {
        componentType: 'SpendExposureWidget',
        props: { ...widget.data },
      };

    case 'health_scorecard':
      return {
        componentType: 'HealthScorecardWidget',
        props: { ...widget.data },
      };

    // New trend/event widgets
    case 'events_feed':
      return {
        componentType: 'EventsFeedWidget',
        props: { events: extractEventsArray(widget.data) },
      };

    case 'event_timeline':
      return {
        componentType: 'EventTimelineWidget',
        props: { data: widget.data },
      };

    case 'trend_indicator':
      return {
        componentType: 'TrendBadge',
        props: { ...widget.data },
      };

    // New general purpose widgets
    case 'stat_card':
      return {
        componentType: 'StatCard',
        props: { ...widget.data },
      };

    case 'info_card':
      return {
        componentType: 'InfoCard',
        props: { ...widget.data },
      };

    case 'quote_card':
      return {
        componentType: 'QuoteCard',
        props: { ...widget.data },
      };

    case 'recommendation_card':
      return {
        componentType: 'RecommendationCard',
        props: { ...widget.data },
      };

    case 'checklist_card':
      return {
        componentType: 'ChecklistCard',
        props: { ...widget.data },
      };

    case 'progress_card':
      return {
        componentType: 'ProgressCard',
        props: { ...widget.data },
      };

    case 'executive_summary':
      return {
        componentType: 'ExecutiveSummaryCard',
        props: { ...widget.data },
      };

    case 'data_list':
      return {
        componentType: 'DataListCard',
        props: { ...widget.data },
      };

    // Market/News widgets
    case 'news_item':
      return {
        componentType: 'NewsItemCard',
        props: { data: widget.data },
      };

    case 'supplier_mini':
      return {
        componentType: 'SupplierMiniCard',
        props: { data: widget.data },
      };

    case 'score_breakdown':
      return {
        componentType: 'ScoreBreakdownWidget',
        props: { data: widget.data },
      };

    case 'handoff_card':
      return {
        componentType: 'HandoffCard',
        props: { ...widget.data },
      };

    case 'action_card':
      return {
        componentType: 'ActionConfirmationCard',
        props: { ...widget.data },
      };

    // New Risk Analysis Widgets
    case 'factor_breakdown':
      return {
        componentType: 'FactorBreakdownCard',
        props: { ...widget.data },
      };

    case 'news_events':
      return {
        componentType: 'NewsEventsCard',
        props: { ...widget.data },
      };

    case 'alternatives_preview':
      return {
        componentType: 'AlternativesPreviewCard',
        props: { ...widget.data },
      };

    case 'concentration_warning': {
      // Transform registry data shape to component props
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cwData = widget.data as any;
      return {
        componentType: 'ConcentrationWarningCard',
        props: {
          type: cwData.type || 'category',
          entity: cwData.name || cwData.entity || 'Unknown',
          concentration: cwData.percentage || cwData.concentration || 0,
          threshold: cwData.threshold || 30,
          spend: cwData.affectedSpend || cwData.spend || '$0',
          severity: cwData.severity || (cwData.percentage > 40 ? 'high' : cwData.percentage > 25 ? 'medium' : 'low'),
        },
      };
    }

    // Market & Context widgets
    // market_card data shape doesn't match MarketContextCard - use NewsItemCard instead
    case 'market_card':
      return {
        componentType: 'NewsItemCard',
        props: {
          data: {
            title: widget.data.title,
            source: widget.data.source,
            timestamp: widget.data.timestamp,
            snippet: widget.data.summary,
            category: widget.data.category,
            sentiment: widget.data.sentiment,
          },
        },
      };

    // Badge widgets - these expect { data: ... } wrapper
    case 'category_badge':
      return {
        componentType: 'CategoryBadge',
        props: { data: widget.data },
      };

    case 'status_badge':
      return {
        componentType: 'StatusBadge',
        props: { data: widget.data },
      };

    // Portfolio summary - maps to MetricRowWidget for now
    case 'portfolio_summary':
      return {
        componentType: 'MetricRowWidget',
        props: {
          data: {
            metrics: [
              { label: 'Suppliers', value: String(widget.data.totalSuppliers) },
              { label: 'Spend', value: widget.data.spendFormatted },
              { label: 'Avg Risk', value: String(widget.data.avgRiskScore) },
              { label: 'High Risk', value: String(widget.data.highRiskCount) },
            ],
          },
        },
      };

    // Benchmark - not yet implemented
    case 'benchmark_card':
      return null;

    // Inflation Watch Widgets
    case 'inflation_summary_card':
      return {
        componentType: 'InflationSummaryCard',
        props: { ...widget.data },
      };

    case 'driver_breakdown_card':
      return {
        componentType: 'DriverBreakdownCard',
        props: { ...widget.data },
      };

    case 'spend_impact_card':
      return {
        componentType: 'SpendImpactCard',
        props: { ...widget.data },
      };

    case 'justification_card':
      return {
        componentType: 'JustificationCard',
        props: { ...widget.data },
      };

    case 'scenario_card':
      return {
        componentType: 'ScenarioCard',
        props: { ...widget.data },
      };

    case 'executive_brief_card':
      return {
        componentType: 'ExecutiveBriefCard',
        props: { ...widget.data },
      };

    case 'commodity_gauge':
      return {
        componentType: 'CommodityGaugeCard',
        props: { ...widget.data },
      };

    case 'price_movement_table':
      return {
        componentType: 'PriceMovementTable',
        props: { ...widget.data },
      };

    case 'top_movers_list':
      return {
        componentType: 'TopMoversCard',
        props: { ...widget.data },
      };

    case 'factor_contribution_chart':
      return {
        componentType: 'FactorContributionChart',
        props: { ...widget.data },
      };

    case 'exposure_heatmap':
      return {
        componentType: 'ExposureHeatmap',
        props: { ...widget.data },
      };

    case 'budget_variance_card':
      return {
        componentType: 'BudgetVarianceCard',
        props: { ...widget.data },
      };

    case 'market_fairness_gauge':
      return {
        componentType: 'MarketFairnessGauge',
        props: { ...widget.data },
      };

    case 'negotiation_ammo_card':
      return {
        componentType: 'NegotiationAmmoCard',
        props: { ...widget.data },
      };

    case 'forecast_chart':
      return {
        componentType: 'ForecastChart',
        props: { ...widget.data },
      };

    case 'sensitivity_table':
      return {
        componentType: 'SensitivityTable',
        props: { ...widget.data },
      };

    case 'talking_points_card':
      return {
        componentType: 'TalkingPointsCard',
        props: { ...widget.data },
      };

    default:
      // Log unknown widget types for debugging
      console.warn('[WidgetRenderer] Unknown widget type:', widget.type);
      return null;
  }
};

// ============================================
// PLACEHOLDER
// ============================================

const PlaceholderWidget = ({ type }: { type: string }) => (
  <div className="p-4 bg-slate-50/60 border border-slate-200/40 rounded-[1.25rem] text-center">
    <div className="text-sm text-slate-500 font-normal">
      Widget: <code className="bg-slate-100/60 px-1.5 py-0.5 rounded-lg text-xs">{type}</code>
    </div>
    <div className="text-xs text-slate-400 mt-1 font-normal">Coming soon</div>
  </div>
);

// ============================================
// EXPORTS
// ============================================

export default WidgetRenderer;

// Re-export for convenience
export { selectComponent, buildDataContext } from '../../services/componentSelector';
export type { RenderContext, ComponentConfig } from '../../services/componentSelector';
