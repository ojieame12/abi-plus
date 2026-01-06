// Scenario Planner Artifact
// Interactive what-if scenario planning with projections and impact analysis

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Download,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  Target,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import { ArtifactSection, ArtifactFooter } from '../primitives';
import type {
  InflationScenario,
  ScenarioAssumption,
  ScenarioResults,
} from '../../../types/inflation';

// ============================================
// TYPES
// ============================================

export interface ScenarioPlannerArtifactProps {
  scenarios?: InflationScenario[];
  baselineData?: {
    totalSpend: number;
    byCategory: Array<{ category: string; spend: number }>;
    bySupplier: Array<{ supplier: string; spend: number }>;
  };
  availableFactors?: Array<{
    factor: string;
    currentValue: number;
    unit: string;
    historicalRange: { min: number; max: number };
  }>;
  onExport?: () => void;
  onCreateScenario?: (assumptions: ScenarioAssumption[]) => void;
  onSelectScenario?: (scenario: InflationScenario) => void;
  onClose?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const CONFIDENCE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'High' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
  low: { bg: 'bg-red-100', text: 'text-red-700', label: 'Low' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCurrency = (amount: number): string => {
  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
};

// ============================================
// HELPER COMPONENTS
// ============================================

const ScenarioHeader = ({
  scenario,
  isSelected,
  onClick,
  index,
}: {
  scenario: InflationScenario;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) => {
  const results = scenario.results;
  const isIncrease = results.delta > 0;
  const confidenceStyle = CONFIDENCE_STYLES[scenario.assumptions[0]?.confidence || 'medium'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-violet-300 bg-violet-50/50 ring-1 ring-violet-200'
          : 'border-slate-100 hover:border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-slate-800">{scenario.name}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{scenario.description}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${confidenceStyle.bg} ${confidenceStyle.text}`}>
          {confidenceStyle.label}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Baseline:</span>
            <span className="font-medium text-slate-800">{formatCurrency(results.baselineSpend)}</span>
          </div>
        </div>
        <ArrowRight size={14} className="text-slate-300" />
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Projected:</span>
            <span className="font-medium text-slate-800">{formatCurrency(results.projectedSpend)}</span>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
          isIncrease ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {isIncrease ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span className="text-sm font-medium">
            {isIncrease ? '+' : ''}{results.deltaPercent.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const AssumptionRow = ({ assumption, index }: { assumption: ScenarioAssumption; index: number }) => {
  const changePercent = assumption.changePercent;
  const isIncrease = changePercent > 0;
  const confidenceStyle = CONFIDENCE_STYLES[assumption.confidence];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.04 }}
      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
          <Calculator size={14} className="text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{assumption.factor}</p>
          <p className="text-xs text-slate-500">
            {assumption.currentValue} → {assumption.projectedValue}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-1.5 py-0.5 rounded text-xs ${confidenceStyle.bg} ${confidenceStyle.text}`}>
          {confidenceStyle.label}
        </span>
        <span className={`text-sm font-medium ${isIncrease ? 'text-red-600' : 'text-emerald-600'}`}>
          {isIncrease ? '+' : ''}{changePercent.toFixed(1)}%
        </span>
      </div>
    </motion.div>
  );
};

const ImpactBreakdownRow = ({
  item,
  index,
  type,
}: {
  item: { category?: string; supplier?: string; supplierName?: string; baseline: number; projected: number; delta: number };
  index: number;
  type: 'category' | 'supplier';
}) => {
  const name = type === 'category' ? item.category : (item.supplierName || item.supplier);
  const isIncrease = item.delta > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.03 }}
      className="flex items-center justify-between p-3 rounded-xl border border-slate-100"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-700">{name}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-400">
          {formatCurrency(item.baseline)} → {formatCurrency(item.projected)}
        </span>
        <span className={`text-sm font-medium ${isIncrease ? 'text-red-600' : 'text-emerald-600'}`}>
          {isIncrease ? '+' : ''}{formatCurrency(item.delta)}
        </span>
      </div>
    </motion.div>
  );
};

const InsightCard = ({
  items,
  title,
  type,
  icon: Icon,
}: {
  items: string[];
  title: string;
  type: 'recommendation' | 'risk' | 'opportunity';
  icon: typeof CheckCircle2;
}) => {
  if (!items || items.length === 0) return null;

  const styles = {
    recommendation: { bg: 'bg-violet-50', border: 'border-violet-100', icon: 'text-violet-500' },
    risk: { bg: 'bg-red-50', border: 'border-red-100', icon: 'text-red-500' },
    opportunity: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-500' },
  };

  const style = styles[type];

  return (
    <div className={`p-4 rounded-xl border ${style.bg} ${style.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={style.icon} />
        <span className="text-sm font-medium text-slate-700">{title}</span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className={`w-1.5 h-1.5 rounded-full ${style.icon.replace('text-', 'bg-')} mt-1.5 shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ScenarioDetail = ({ scenario }: { scenario: InflationScenario }) => {
  const [activeTab, setActiveTab] = useState<'category' | 'supplier'>('category');
  const results = scenario.results;
  const isIncrease = results.delta > 0;

  const hasCategoryData = results.impactByCategory && results.impactByCategory.length > 0;
  const hasSupplierData = results.impactBySupplier && results.impactBySupplier.length > 0;

  return (
    <div className="space-y-5">
      {/* Impact Summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl border ${
          isIncrease
            ? 'bg-red-50/60 border-red-100/60'
            : 'bg-emerald-50/60 border-emerald-100/60'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isIncrease ? 'bg-red-100' : 'bg-emerald-100'
            }`}>
              <Target size={24} className={isIncrease ? 'text-red-600' : 'text-emerald-600'} strokeWidth={1.5} />
            </div>
            <div>
              <p className={`text-sm ${isIncrease ? 'text-red-600' : 'text-emerald-600'}`}>
                Projected Change
              </p>
              <p className={`text-3xl font-light ${isIncrease ? 'text-red-700' : 'text-emerald-700'}`}>
                {results.deltaFormatted || formatCurrency(results.delta)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">vs Baseline</p>
            <p className={`text-xl font-medium ${isIncrease ? 'text-red-600' : 'text-emerald-600'}`}>
              {isIncrease ? '+' : ''}{results.deltaPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Assumptions */}
      {scenario.assumptions.length > 0 && (
        <ArtifactSection
          title="Assumptions"
          badge={scenario.assumptions.length}
          icon={<Calculator size={14} className="text-slate-400" />}
          defaultOpen={true}
        >
          <div className="space-y-2">
            {scenario.assumptions.map((assumption, i) => (
              <AssumptionRow key={i} assumption={assumption} index={i} />
            ))}
          </div>
        </ArtifactSection>
      )}

      {/* Impact Breakdown */}
      {(hasCategoryData || hasSupplierData) && (
        <>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('category')}
              disabled={!hasCategoryData}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'category'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : hasCategoryData
                    ? 'text-slate-500 hover:text-slate-700'
                    : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <BarChart3 size={14} />
              By Category
            </button>
            <button
              onClick={() => setActiveTab('supplier')}
              disabled={!hasSupplierData}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'supplier'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : hasSupplierData
                    ? 'text-slate-500 hover:text-slate-700'
                    : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <BarChart3 size={14} />
              By Supplier
            </button>
          </div>

          <ArtifactSection
            title={activeTab === 'category' ? 'Impact by Category' : 'Impact by Supplier'}
            badge={activeTab === 'category' ? results.impactByCategory?.length : results.impactBySupplier?.length}
            collapsible={false}
          >
            <div className="space-y-2">
              {activeTab === 'category' && results.impactByCategory?.map((item, i) => (
                <ImpactBreakdownRow key={item.category} item={item} index={i} type="category" />
              ))}
              {activeTab === 'supplier' && results.impactBySupplier?.map((item, i) => (
                <ImpactBreakdownRow key={item.supplierId || item.supplierName} item={item} index={i} type="supplier" />
              ))}
            </div>
          </ArtifactSection>
        </>
      )}

      {/* Insights */}
      <div className="space-y-3">
        <InsightCard
          items={results.recommendations}
          title="Recommendations"
          type="recommendation"
          icon={Lightbulb}
        />
        <InsightCard
          items={results.risks}
          title="Risks"
          type="risk"
          icon={AlertTriangle}
        />
        <InsightCard
          items={results.opportunities}
          title="Opportunities"
          type="opportunity"
          icon={CheckCircle2}
        />
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const ScenarioPlannerArtifact = ({
  scenarios = [],
  baselineData,
  availableFactors = [],
  onExport,
  onCreateScenario,
  onSelectScenario,
  onClose,
}: ScenarioPlannerArtifactProps) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    scenarios.length > 0 ? scenarios[0].id : null
  );

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);

  const handleSelectScenario = (scenario: InflationScenario) => {
    setSelectedScenarioId(scenario.id);
    onSelectScenario?.(scenario);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Scenario Planner</p>
          <p className="text-lg font-medium text-slate-800">What-If Analysis</p>
        </motion.div>

        {/* Baseline Info */}
        {baselineData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-slate-50 rounded-xl border border-slate-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Baseline Spend</span>
            </div>
            <p className="text-2xl font-light text-slate-800">
              {formatCurrency(baselineData.totalSpend)}
            </p>
          </motion.div>
        )}

        {/* Scenarios List */}
        {scenarios.length > 0 ? (
          <ArtifactSection
            title="Scenarios"
            badge={scenarios.length}
            icon={<Calculator size={14} className="text-violet-500" />}
            defaultOpen={true}
          >
            <div className="space-y-2">
              {scenarios.map((scenario, i) => (
                <ScenarioHeader
                  key={scenario.id}
                  scenario={scenario}
                  isSelected={scenario.id === selectedScenarioId}
                  onClick={() => handleSelectScenario(scenario)}
                  index={i}
                />
              ))}
            </div>
          </ArtifactSection>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto mb-3 flex items-center justify-center">
              <Calculator size={24} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No scenarios created yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Create a scenario to model potential price changes
            </p>
          </motion.div>
        )}

        {/* Selected Scenario Detail */}
        {selectedScenario && (
          <div className="pt-2 border-t border-slate-100">
            <ScenarioDetail scenario={selectedScenario} />
          </div>
        )}

        {/* Available Factors (for creating scenarios) */}
        {availableFactors.length > 0 && (
          <ArtifactSection
            title="Available Factors"
            badge={availableFactors.length}
            defaultOpen={false}
          >
            <div className="space-y-2">
              {availableFactors.map((factor, i) => (
                <motion.div
                  key={factor.factor}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{factor.factor}</p>
                    <p className="text-xs text-slate-500">
                      Current: {factor.currentValue} {factor.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Historical Range</p>
                    <p className="text-xs text-slate-600">
                      {factor.historicalRange.min} - {factor.historicalRange.max}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ArtifactSection>
        )}
      </div>

      {/* Footer */}
      <ArtifactFooter
        primaryAction={{
          id: 'export',
          label: 'Export Scenarios',
          variant: 'primary',
          onClick: () => onExport?.(),
          icon: <Download size={16} />,
        }}
      />
    </div>
  );
};

export default ScenarioPlannerArtifact;
