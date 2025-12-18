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

// Widget Components
import { RiskDistributionWidget } from './RiskDistributionWidget';
import { SupplierRiskCardWidget } from './SupplierRiskCardWidget';
import { SupplierTableWidget } from './SupplierTableWidget';
import { AlertCardWidget } from './AlertCardWidget';
import { PriceGaugeWidget } from './PriceGaugeWidget';
import { MetricRowWidget } from './MetricRowWidget';
import { ComparisonTableWidget } from './ComparisonTableWidget';

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
  // Widget components
  RiskDistributionWidget,
  SupplierRiskCardWidget,
  SupplierTableWidget,
  AlertCardWidget,
  PriceGaugeWidget,
  MetricRowWidget,
  ComparisonTableWidget,

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

  return (
    <div className={`widget-container ${className}`}>
      {title && (
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
          {title}
        </div>
      )}
      <Component {...config.props} />
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
        componentType: 'TrendChangeIndicator',
        variant: 'card',
        props: { ...widget.data },
      };

    case 'category_breakdown':
      return {
        componentType: 'RiskDistributionChart',
        props: { ...widget.data, compact: true },
      };

    case 'region_map':
      return null; // Not implemented

    default:
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
