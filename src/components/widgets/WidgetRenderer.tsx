// Widget Renderer - Routes to appropriate widget component based on type or data context
import type { WidgetData } from '../../types/widgets';
import type { IntentCategory } from '../../types/intents';
import type { Supplier, Portfolio, RiskChange } from '../../types/data';
import {
  selectComponent,
  buildDataContext,
  type RenderContext,
  type ComponentConfig,
} from '../../services/componentSelector';
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

// Risk Components (for alternates)
import { RiskDistributionChart } from '../risk/RiskDistributionChart';
import { SupplierRiskCard } from '../risk/SupplierRiskCard';
import { SupplierMiniTable } from '../risk/SupplierMiniTable';
import { TrendChangeIndicator } from '../risk/TrendChangeIndicator';
import { MarketContextCard } from '../risk/MarketContextCard';
import { HandoffCard } from '../risk/HandoffCard';
import { ActionConfirmationCard } from '../risk/ActionConfirmationCard';

// ============================================
// COMPONENT REGISTRY
// ============================================

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

  // Risk components
  RiskDistributionChart,
  SupplierRiskCard,
  SupplierMiniTable,
  TrendChangeIndicator,
  MarketContextCard,
  HandoffCard,
  ActionConfirmationCard,
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

// Context-based rendering (new interface)
interface ContextWidgetProps {
  intent: IntentCategory;
  renderContext?: RenderContext;
  portfolio?: Portfolio;
  suppliers?: Supplier[];
  supplier?: Supplier;
  riskChanges?: RiskChange[];
  widget?: WidgetData;
  title?: string;
  className?: string;
  onExpand?: (artifactComponent: string) => void;
  onOpenArtifact?: (type: string, payload: Record<string, unknown>) => void;
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
    // Context-based selection
    const dataCtx = buildDataContext(props.intent, {
      portfolio: props.portfolio,
      suppliers: props.suppliers,
      supplier: props.supplier,
      riskChanges: props.riskChanges,
      widget: props.widget,
    });

    config = selectComponent(dataCtx, props.renderContext || 'chat');

    // If no rule matched but we have widget data, try direct widget rendering
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
    const { onOpenArtifact } = props;

    // FactorBreakdownCard → factor_breakdown artifact
    if (config.componentType === 'FactorBreakdownCard') {
      artifactHandlers.onViewDetails = () => {
        onOpenArtifact('factor_breakdown', {
          supplierName: config.props.supplierName,
          overallScore: config.props.overallScore,
          level: config.props.level,
          factors: config.props.factors,
        });
      };
    }

    // NewsEventsCard → news_events artifact
    if (config.componentType === 'NewsEventsCard') {
      artifactHandlers.onViewAll = () => {
        onOpenArtifact('news_events', {
          title: config.props.title || 'News & Events',
          events: config.props.events,
        });
      };
    }

    // AlternativesPreviewCard → supplier_alternatives artifact
    if (config.componentType === 'AlternativesPreviewCard') {
      artifactHandlers.onViewAll = () => {
        onOpenArtifact('supplier_alternatives', {
          currentSupplier: {
            name: config.props.currentSupplier,
            score: config.props.currentScore,
          },
          alternatives: config.props.alternatives,
        });
      };
    }

    // ConcentrationWarningCard → spend_analysis artifact
    if (config.componentType === 'ConcentrationWarningCard') {
      artifactHandlers.onViewDetails = () => {
        onOpenArtifact('spend_analysis', {
          concentrationWarnings: [{
            type: config.props.type,
            entity: config.props.entity,
            concentration: config.props.concentration,
            threshold: config.props.threshold,
            spend: config.props.spend,
            severity: config.props.severity,
          }],
        });
      };
    }

    // SpendExposureWidget → spend_analysis artifact
    if (config.componentType === 'SpendExposureWidget') {
      artifactHandlers.onViewDetails = () => {
        onOpenArtifact('spend_analysis', {
          totalSpend: config.props.totalSpend,
          totalSpendFormatted: config.props.totalSpendFormatted,
          byRiskLevel: config.props.breakdown,
        });
      };
    }
  }

  return (
    <div className={`widget-container ${className}`}>
      {title && (
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
          {title}
        </div>
      )}
      <Component {...config.props} {...artifactHandlers} />
      {handleExpand && (
        <button
          onClick={handleExpand}
          className="mt-2 text-xs text-violet-600 hover:text-violet-700 font-medium"
        >
          View full details →
        </button>
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
        componentType: 'TrendChangeIndicator',
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

    case 'concentration_warning':
      return {
        componentType: 'ConcentrationWarningCard',
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
