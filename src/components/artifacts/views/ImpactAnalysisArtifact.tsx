// Impact Analysis Artifact
// Portfolio impact analysis with exposure breakdown, risk correlation, and mitigation options

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  AlertTriangle,
  Download,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Lightbulb,
  Clock,
  Layers,
  Users,
  MapPin,
} from 'lucide-react';
import { ArtifactSection, ArtifactFooter } from '../primitives';
import type { InflationExposure, CategoryExposure, SupplierExposure } from '../../../types/inflation';

// Re-export types for external use

// ============================================
// TYPES
// ============================================

export interface ConcentrationRisk {
  type: 'commodity' | 'supplier' | 'region';
  name: string;
  concentration: number;
}

export interface MitigationOption {
  action: string;
  potentialSavings: string;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
}

export interface BudgetImpact {
  originalBudget: number;
  projectedSpend: number;
  variance: number;
  variancePercent: number;
}

export interface ImpactAnalysisArtifactProps {
  period?: string;
  exposure?: InflationExposure;
  riskCorrelation?: {
    highRiskHighExposure: number;
    concentrationRisk: ConcentrationRisk[];
  };
  budgetImpact?: BudgetImpact;
  mitigationOptions?: MitigationOption[];
  onExport?: () => void;
  onDrillDown?: (dimension: string, value: string) => void;
  onClose?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const EFFORT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Low' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
  high: { bg: 'bg-red-100', text: 'text-red-700', label: 'High' },
};

const CONCENTRATION_ICONS: Record<string, typeof Layers> = {
  commodity: Layers,
  supplier: Users,
  region: MapPin,
};

type TabType = 'category' | 'supplier';

// ============================================
// HELPER COMPONENTS
// ============================================

const ImpactHeader = ({
  totalImpact,
  impactPercent,
  direction,
}: {
  totalImpact: string;
  impactPercent: number;
  direction: 'increase' | 'decrease';
}) => {
  const isIncrease = direction === 'increase';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${
        isIncrease
          ? 'bg-red-50/60 border-red-100/60'
          : 'bg-emerald-50/60 border-emerald-100/60'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isIncrease ? 'bg-red-100' : 'bg-emerald-100'
          }`}>
            <DollarSign
              size={24}
              className={isIncrease ? 'text-red-600' : 'text-emerald-600'}
              strokeWidth={1.5}
            />
          </div>
          <div>
            <p className={`text-sm ${isIncrease ? 'text-red-600' : 'text-emerald-600'}`}>
              Projected Impact
            </p>
            <p className={`text-3xl font-light ${isIncrease ? 'text-red-700' : 'text-emerald-700'}`}>
              {totalImpact}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
          isIncrease ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {isIncrease ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span className="text-sm font-medium">
            {isIncrease ? '+' : ''}{impactPercent.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const BudgetVarianceCard = ({ budget }: { budget: BudgetImpact }) => {
  const isOverBudget = budget.variance > 0;

  const formatCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="p-4 bg-slate-50 rounded-xl border border-slate-100"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target size={16} className="text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Budget Variance</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Original</p>
          <p className="text-lg font-medium text-slate-800">
            {formatCurrency(budget.originalBudget)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Projected</p>
          <p className="text-lg font-medium text-slate-800">
            {formatCurrency(budget.projectedSpend)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Variance</p>
          <p className={`text-lg font-medium ${
            isOverBudget ? 'text-red-600' : 'text-emerald-600'
          }`}>
            {isOverBudget ? '+' : ''}{formatCurrency(budget.variance)}
          </p>
        </div>
      </div>

      {/* Progress bar showing budget usage */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Budget Utilization</span>
          <span className={isOverBudget ? 'text-red-600' : 'text-slate-700'}>
            {((budget.projectedSpend / budget.originalBudget) * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((budget.projectedSpend / budget.originalBudget) * 100, 100)}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`h-full rounded-full ${
              isOverBudget ? 'bg-red-500' : 'bg-emerald-500'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};

const ConcentrationRiskCard = ({ risks }: { risks: ConcentrationRisk[] }) => {
  if (!risks || risks.length === 0) return null;

  return (
    <ArtifactSection
      title="Concentration Risk"
      badge={risks.length}
      badgeVariant="warning"
      icon={<AlertTriangle size={14} className="text-amber-500" />}
    >
      <div className="space-y-2">
        {risks.map((risk, i) => {
          const Icon = CONCENTRATION_ICONS[risk.type] || Layers;
          const severity = risk.concentration > 40 ? 'high' : risk.concentration > 25 ? 'medium' : 'low';
          const severityStyles = {
            high: 'border-red-200 bg-red-50/50',
            medium: 'border-amber-200 bg-amber-50/50',
            low: 'border-slate-200 bg-slate-50/50',
          };

          return (
            <motion.div
              key={`${risk.type}-${risk.name}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              className={`flex items-center justify-between p-3 rounded-xl border ${severityStyles[severity]}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Icon size={16} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{risk.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{risk.type}</p>
                </div>
              </div>
              <div className={`px-2.5 py-1 rounded-lg text-sm font-medium ${
                severity === 'high' ? 'bg-red-100 text-red-700' :
                severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {risk.concentration.toFixed(1)}%
              </div>
            </motion.div>
          );
        })}
      </div>
    </ArtifactSection>
  );
};

const ExposureRow = ({
  item,
  index,
  onClick,
  type,
}: {
  item: CategoryExposure | SupplierExposure;
  index: number;
  onClick?: () => void;
  type: 'category' | 'supplier';
}) => {
  const isCategory = type === 'category';
  const catItem = item as CategoryExposure;
  const supItem = item as SupplierExposure;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.04 }}
      onClick={onClick}
      className={`p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">
            {isCategory ? catItem.category : supItem.supplierName}
          </span>
          {isCategory && (
            <span className="text-xs text-slate-400">
              ({catItem.commodities?.length || 0} commodities)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isCategory && catItem.avgPriceChange !== undefined && (
            <span className={`text-xs font-medium ${
              catItem.avgPriceChange > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}>
              {catItem.avgPriceChange > 0 ? '+' : ''}{catItem.avgPriceChange.toFixed(1)}%
            </span>
          )}
          {!isCategory && supItem.priceImpactFormatted && (
            <span className="text-xs text-slate-500">{supItem.priceImpactFormatted}</span>
          )}
          <span className="text-sm font-medium text-slate-800">
            {isCategory ? catItem.exposureFormatted : supItem.exposureFormatted}
          </span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${isCategory ? catItem.percentOfTotal : (supItem.exposure / 1000000) * 10}%` }}
          transition={{ duration: 0.5, delay: 0.15 + index * 0.04 }}
          className="h-full bg-violet-500 rounded-full"
        />
      </div>
    </motion.div>
  );
};

const MitigationCard = ({ option, index }: { option: MitigationOption; index: number }) => {
  const effortStyle = EFFORT_STYLES[option.effort] || EFFORT_STYLES.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
          <Lightbulb size={16} className="text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 mb-1">{option.action}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <DollarSign size={12} className="text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">{option.potentialSavings}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield size={12} className="text-slate-400" />
              <span className={`text-xs px-1.5 py-0.5 rounded ${effortStyle.bg} ${effortStyle.text}`}>
                {effortStyle.label} Effort
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-slate-400" />
              <span className="text-xs text-slate-500">{option.timeframe}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const ImpactAnalysisArtifact = ({
  period = 'Current Quarter',
  exposure,
  riskCorrelation,
  budgetImpact,
  mitigationOptions = [],
  onExport,
  onDrillDown,
}: ImpactAnalysisArtifactProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('category');

  // Calculate total impact
  const totalImpact = exposure?.impactAmountFormatted || '$0';
  const impactPercent = exposure?.impactPercent || 0;
  const direction = impactPercent >= 0 ? 'increase' : 'decrease';

  const categoryExposures = exposure?.byCategory || [];
  const supplierExposures = exposure?.bySupplier || [];

  const hasCategoryData = categoryExposures.length > 0;
  const hasSupplierData = supplierExposures.length > 0;
  const hasExposureData = hasCategoryData || hasSupplierData;

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Period Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Impact Analysis</p>
          <p className="text-lg font-medium text-slate-800">{period}</p>
        </motion.div>

        {/* Impact Header */}
        <ImpactHeader
          totalImpact={totalImpact}
          impactPercent={Math.abs(impactPercent)}
          direction={direction}
        />

        {/* Budget Variance */}
        {budgetImpact && <BudgetVarianceCard budget={budgetImpact} />}

        {/* Risk Correlation */}
        {riskCorrelation && riskCorrelation.highRiskHighExposure > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-3 bg-red-50/60 rounded-xl border border-red-100/60"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <span className="text-sm text-red-700">
                <span className="font-medium">{riskCorrelation.highRiskHighExposure.toFixed(1)}%</span> of exposure is with high-risk suppliers
              </span>
            </div>
          </motion.div>
        )}

        {/* Concentration Risks */}
        {riskCorrelation?.concentrationRisk && (
          <ConcentrationRiskCard risks={riskCorrelation.concentrationRisk} />
        )}

        {/* Exposure Breakdown Tabs */}
        {hasExposureData && (
          <>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveTab('category')}
                disabled={!hasCategoryData}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'category'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : hasCategoryData
                      ? 'text-slate-500 hover:text-slate-700'
                      : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                By Category
              </button>
              <button
                onClick={() => setActiveTab('supplier')}
                disabled={!hasSupplierData}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'supplier'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : hasSupplierData
                      ? 'text-slate-500 hover:text-slate-700'
                      : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                By Supplier
              </button>
            </div>

            <ArtifactSection
              title={activeTab === 'category' ? 'Exposure by Category' : 'Exposure by Supplier'}
              badge={activeTab === 'category' ? categoryExposures.length : supplierExposures.length}
              collapsible={false}
            >
              <div className="space-y-2">
                {activeTab === 'category' && categoryExposures.map((item, i) => (
                  <ExposureRow
                    key={item.category}
                    item={item}
                    index={i}
                    type="category"
                    onClick={onDrillDown ? () => onDrillDown('category', item.category) : undefined}
                  />
                ))}
                {activeTab === 'supplier' && supplierExposures.map((item, i) => (
                  <ExposureRow
                    key={item.supplierId}
                    item={item}
                    index={i}
                    type="supplier"
                    onClick={onDrillDown ? () => onDrillDown('supplier', item.supplierId) : undefined}
                  />
                ))}
              </div>
            </ArtifactSection>
          </>
        )}

        {/* Mitigation Options */}
        {mitigationOptions.length > 0 && (
          <ArtifactSection
            title="Mitigation Options"
            badge={mitigationOptions.length}
            icon={<Lightbulb size={14} className="text-violet-500" />}
            defaultOpen={true}
          >
            <div className="space-y-2">
              {mitigationOptions.map((option, i) => (
                <MitigationCard key={i} option={option} index={i} />
              ))}
            </div>
          </ArtifactSection>
        )}
      </div>

      {/* Footer */}
      <ArtifactFooter
        primaryAction={{
          id: 'export',
          label: 'Export Analysis',
          variant: 'primary',
          onClick: () => onExport?.(),
          icon: <Download size={16} />,
        }}
      />
    </div>
  );
};

export default ImpactAnalysisArtifact;
