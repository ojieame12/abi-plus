import { useState } from 'react';
import { Maximize2, Minimize2, Zap } from 'lucide-react';
import type { WidgetRegistryEntry } from '../../services/widgetRegistry';
import { PropTable } from './PropTable';
import { CodeBlock } from './CodeBlock';

// Import all widget components
import {
  RiskDistributionWidget,
  MetricRowWidget,
  SpendExposureWidget,
  HealthScorecardWidget,
  SupplierRiskCardWidget,
  SupplierTableWidget,
  SupplierMiniCard,
  ComparisonTableWidget,
  AlertCardWidget,
  TrendChartWidget,
  TrendChangeIndicator,
  EventTimelineWidget,
  EventsFeedWidget,
  PriceGaugeWidget,
  NewsItemCard,
  CategoryBreakdownWidget,
  RegionListWidget,
  CategoryBadge,
  StatusBadge,
  ScoreBreakdownWidget,
  StatCard,
  InfoCard,
  QuoteCard,
  RecommendationCard,
  ChecklistCard,
  ProgressCard,
  ExecutiveSummaryCard,
  DataListCard,
  FactorBreakdownCard,
  AlternativesPreviewCard,
  ConcentrationWarningCard,
  // Inflation Watch
  InflationSummaryCard,
  DriverBreakdownCard,
  SpendImpactCard,
  JustificationCard,
  ScenarioCard,
  ExecutiveBriefCard,
} from '../../components/widgets';

import {
  HandoffCard,
  ActionConfirmationCard,
} from '../../components/risk';

// Component registry - using any for props since each widget has different prop requirements
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  RiskDistributionWidget,
  MetricRowWidget,
  SpendExposureWidget,
  HealthScorecardWidget,
  SupplierRiskCardWidget,
  SupplierTableWidget,
  SupplierMiniCard,
  ComparisonTableWidget,
  AlertCardWidget,
  TrendChartWidget,
  TrendChangeIndicator,
  EventTimelineWidget,
  EventsFeedWidget,
  PriceGaugeWidget,
  NewsItemCard,
  CategoryBreakdownWidget,
  RegionListWidget,
  CategoryBadge,
  StatusBadge,
  ScoreBreakdownWidget,
  StatCard,
  InfoCard,
  QuoteCard,
  RecommendationCard,
  ChecklistCard,
  ProgressCard,
  ExecutiveSummaryCard,
  DataListCard,
  FactorBreakdownCard,
  AlternativesPreviewCard,
  ConcentrationWarningCard,
  HandoffCard,
  ActionConfirmationCard,
  // Inflation Watch
  InflationSummaryCard,
  DriverBreakdownCard,
  SpendImpactCard,
  JustificationCard,
  ScenarioCard,
  ExecutiveBriefCard,
};

interface WidgetCardProps {
  widget: WidgetRegistryEntry;
}

export const WidgetCard = ({ widget }: WidgetCardProps) => {
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>(widget.defaultSize);
  const [isExpanded, setIsExpanded] = useState(false);

  const Component = COMPONENT_MAP[widget.component];

  const renderWidget = () => {
    if (!Component) {
      return (
        <div className="flex items-center justify-center h-32 bg-slate-100 rounded-lg text-slate-500 text-sm">
          Component not found: {widget.component}
        </div>
      );
    }

    try {
      // Handle different prop structures
      const props = widget.demoData;
      return <Component {...props} />;
    } catch {
      return (
        <div className="flex items-center justify-center h-32 bg-rose-50 rounded-lg text-rose-500 text-sm">
          Error rendering widget
        </div>
      );
    }
  };

  return (
    <div
      id={widget.id}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 ${
        isExpanded ? 'col-span-full' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{widget.name}</h3>
          <div className="flex items-center gap-1">
            {widget.sizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                  selectedSize === size
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 py-3 border-b border-slate-100">
        <p className="text-sm text-slate-600">{widget.description}</p>
      </div>

      {/* Intent Mapping - Shows which intents trigger this widget */}
      {widget.intents && widget.intents.length > 0 && (
        <div className="px-5 py-3 border-b border-slate-100 bg-violet-50/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-violet-500" />
            <span className="text-xs font-medium text-violet-700 uppercase tracking-wide">
              Triggered By Intents
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {widget.intents.map(intent => (
              <span
                key={intent}
                className="px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 rounded"
              >
                {intent.replace(/_/g, ' ')}
              </span>
            ))}
            {widget.subIntents && widget.subIntents.length > 0 && (
              <>
                <span className="text-slate-300 mx-1">|</span>
                {widget.subIntents.map(sub => (
                  <span
                    key={sub}
                    className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded"
                  >
                    {sub.replace(/_/g, ' ')}
                  </span>
                ))}
              </>
            )}
          </div>
          {widget.requiredData && widget.requiredData.length > 0 && widget.requiredData[0] !== 'none' && (
            <div className="mt-2 text-xs text-slate-500">
              <span className="font-medium">Requires:</span>{' '}
              {widget.requiredData.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Demo Area */}
      <div className="p-5 bg-gradient-to-br from-slate-50 to-white min-h-[200px]">
        <div className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
          Live Demo
        </div>
        <div
          className={`${
            selectedSize === 'S' ? 'max-w-xs' : selectedSize === 'M' ? 'max-w-md' : 'max-w-full'
          }`}
        >
          {renderWidget()}
        </div>
      </div>

      {/* Props & Code */}
      <div className="px-5 py-4 space-y-4 border-t border-slate-100">
        <PropTable props={widget.props} defaultExpanded={false} />
        <CodeBlock code={widget.usageExample} defaultExpanded={false} />
      </div>
    </div>
  );
};
