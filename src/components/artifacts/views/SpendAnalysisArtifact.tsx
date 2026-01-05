// Spend Analysis Artifact
// Detailed spend exposure analysis with multiple views

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  AlertTriangle,
  Download,
  PieChart,
  BarChart3,
  MapPin,
  Package,
  TrendingUp,
} from 'lucide-react';
import { ArtifactSection, ArtifactFooter } from '../primitives';
import type { RiskLevel } from '../../../types/supplier';

// ============================================
// TYPES
// ============================================

export interface SpendByRiskLevel {
  level: RiskLevel;
  amount: number;
  formatted: string;
  percent: number;
  supplierCount: number;
}

export interface SpendByCategory {
  category: string;
  amount: number;
  formatted: string;
  percent: number;
  supplierCount: number;
  avgRiskScore: number;
  riskLevel: RiskLevel;
}

export interface SpendByRegion {
  region: string;
  amount: number;
  formatted: string;
  percent: number;
  supplierCount: number;
  avgRiskScore: number;
}

export interface ConcentrationWarning {
  type: 'supplier' | 'category' | 'region';
  entity: string;
  concentration: number;
  threshold: number;
  severity: 'high' | 'medium' | 'low';
}

export interface SpendAnalysisArtifactProps {
  totalSpend: number;
  totalSpendFormatted: string;
  byRiskLevel: SpendByRiskLevel[];
  byCategory: SpendByCategory[];
  byRegion: SpendByRegion[];
  concentrationWarnings?: ConcentrationWarning[];
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percent: number;
    period: string;
  };
  onExport?: () => void;
  onDrillDown?: (dimension: string, value: string) => void;
  onClose?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const RISK_COLORS: Record<RiskLevel, { bg: string; bar: string; text: string }> = {
  high: { bg: 'bg-red-50', bar: 'bg-red-500', text: 'text-red-700' },
  'medium-high': { bg: 'bg-orange-50', bar: 'bg-orange-500', text: 'text-orange-700' },
  medium: { bg: 'bg-amber-50', bar: 'bg-amber-500', text: 'text-amber-700' },
  low: { bg: 'bg-emerald-50', bar: 'bg-emerald-500', text: 'text-emerald-700' },
  unrated: { bg: 'bg-slate-50', bar: 'bg-slate-300', text: 'text-slate-600' },
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
  high: 'High Risk',
  'medium-high': 'Medium-High',
  medium: 'Medium',
  low: 'Low Risk',
  unrated: 'Unrated',
};

type TabType = 'risk' | 'category' | 'region';

// ============================================
// HELPER COMPONENTS
// ============================================

const StackedBar = ({ data }: { data: SpendByRiskLevel[] }) => {
  return (
    <div className="h-6 rounded-full overflow-hidden flex bg-slate-100">
      {data.map((item, index) => (
        <motion.div
          key={item.level}
          initial={{ width: 0 }}
          animate={{ width: `${item.percent}%` }}
          transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
          className={`${RISK_COLORS[item.level].bar} ${index === 0 ? '' : ''}`}
          title={`${LEVEL_LABELS[item.level]}: ${item.formatted} (${item.percent.toFixed(1)}%)`}
        />
      ))}
    </div>
  );
};

const RiskLevelRow = ({
  item,
  index,
  onClick,
}: {
  item: SpendByRiskLevel;
  index: number;
  onClick?: () => void;
}) => {
  const colors = RISK_COLORS[item.level];

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
          <span className={`w-3 h-3 rounded-full ${colors.bar}`} />
          <span className="text-sm font-medium text-slate-800">{LEVEL_LABELS[item.level]}</span>
          <span className="text-xs text-slate-400">({item.supplierCount} suppliers)</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-slate-800">{item.formatted}</span>
          <span className="text-xs text-slate-400 ml-2">{item.percent.toFixed(1)}%</span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${item.percent}%` }}
          transition={{ duration: 0.5, delay: 0.15 + index * 0.04 }}
          className={`h-full ${colors.bar} rounded-full`}
        />
      </div>
    </motion.div>
  );
};

const CategoryRow = ({
  item,
  index,
  onClick,
}: {
  item: SpendByCategory;
  index: number;
  onClick?: () => void;
}) => {
  const colors = RISK_COLORS[item.riskLevel];

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
          <Package size={14} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-800">{item.category}</span>
          <span className="text-xs text-slate-400">({item.supplierCount})</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${colors.bar}`} />
            <span className={`text-xs ${colors.text}`}>{Math.round(item.avgRiskScore)}</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-slate-800">{item.formatted}</span>
          </div>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${item.percent}%` }}
          transition={{ duration: 0.5, delay: 0.15 + index * 0.04 }}
          className="h-full bg-violet-500 rounded-full"
        />
      </div>
    </motion.div>
  );
};

const RegionRow = ({
  item,
  index,
  onClick,
}: {
  item: SpendByRegion;
  index: number;
  onClick?: () => void;
}) => {
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
          <MapPin size={14} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-800">{item.region}</span>
          <span className="text-xs text-slate-400">({item.supplierCount} suppliers)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Avg Risk: {Math.round(item.avgRiskScore)}</span>
          <div className="text-right">
            <span className="text-sm font-medium text-slate-800">{item.formatted}</span>
          </div>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${item.percent}%` }}
          transition={{ duration: 0.5, delay: 0.15 + index * 0.04 }}
          className="h-full bg-blue-500 rounded-full"
        />
      </div>
    </motion.div>
  );
};

const ConcentrationAlert = ({ warning }: { warning: ConcentrationWarning }) => {
  const severityStyles = {
    high: 'bg-red-50 border-red-200 text-red-700',
    medium: 'bg-amber-50 border-amber-200 text-amber-700',
    low: 'bg-slate-50 border-slate-200 text-slate-600',
  };

  const typeIcons = {
    supplier: DollarSign,
    category: Package,
    region: MapPin,
  };

  const Icon = typeIcons[warning.type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-start gap-3 p-3 rounded-xl border ${severityStyles[warning.severity]}`}
    >
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">
          {warning.concentration.toFixed(1)}% concentrated in {warning.entity}
        </p>
        <p className="text-xs opacity-80 mt-0.5">
          Exceeds {warning.threshold}% threshold for {warning.type} concentration
        </p>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const SpendAnalysisArtifact = ({
  totalSpend,
  totalSpendFormatted,
  byRiskLevel,
  byCategory,
  byRegion,
  concentrationWarnings = [],
  trend,
  onExport,
  onDrillDown,
  onClose,
}: SpendAnalysisArtifactProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('risk');

  // Calculate at-risk spend
  const atRiskSpend = useMemo(() => {
    const highRisk = byRiskLevel.filter(
      b => b.level === 'high' || b.level === 'medium-high'
    );
    const amount = highRisk.reduce((sum, b) => sum + b.amount, 0);
    const percent = highRisk.reduce((sum, b) => sum + b.percent, 0);
    return { amount, percent };
  }, [byRiskLevel]);

  const tabConfig = [
    { id: 'risk' as TabType, label: 'By Risk Level', icon: BarChart3 },
    { id: 'category' as TabType, label: 'By Category', icon: Package },
    { id: 'region' as TabType, label: 'By Region', icon: MapPin },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Header Stats */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 rounded-xl"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <DollarSign size={24} className="text-emerald-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-emerald-700">Total Portfolio Spend</p>
                <p className="text-3xl font-light text-emerald-900">{totalSpendFormatted}</p>
              </div>
            </div>

            {trend && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                trend.direction === 'up' ? 'bg-red-100 text-red-700' :
                trend.direction === 'down' ? 'bg-emerald-100 text-emerald-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                <TrendingUp
                  size={14}
                  className={trend.direction === 'down' ? 'rotate-180' : ''}
                />
                <span className="text-xs font-medium">
                  {trend.percent}% {trend.period}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* At-Risk Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-red-50/60 rounded-xl border border-red-100/60"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <span className="text-sm font-medium text-red-700">Spend at Risk</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-light text-red-700">
                {atRiskSpend.percent.toFixed(1)}%
              </span>
              <span className="text-xs text-red-600 ml-1">of portfolio</span>
            </div>
          </div>
          <StackedBar data={byRiskLevel} />
          <div className="flex items-center justify-between mt-3">
            {byRiskLevel.slice(0, 4).map(item => (
              <div key={item.level} className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${RISK_COLORS[item.level].bar}`} />
                <span className="text-slate-500">{item.percent.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Concentration Warnings */}
        {concentrationWarnings.length > 0 && (
          <ArtifactSection
            title="Concentration Warnings"
            badge={concentrationWarnings.length}
            badgeVariant="warning"
          >
            <div className="space-y-2">
              {concentrationWarnings.map((warning, i) => (
                <ConcentrationAlert key={i} warning={warning} />
              ))}
            </div>
          </ArtifactSection>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {tabConfig.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <ArtifactSection
          title={
            activeTab === 'risk' ? 'Spend by Risk Level' :
            activeTab === 'category' ? 'Spend by Category' :
            'Spend by Region'
          }
          badge={
            activeTab === 'risk' ? byRiskLevel.length :
            activeTab === 'category' ? byCategory.length :
            byRegion.length
          }
          collapsible={false}
        >
          <div className="space-y-2">
            {activeTab === 'risk' && byRiskLevel.map((item, i) => (
              <RiskLevelRow
                key={item.level}
                item={item}
                index={i}
                onClick={onDrillDown ? () => onDrillDown('risk', item.level) : undefined}
              />
            ))}
            {activeTab === 'category' && byCategory.map((item, i) => (
              <CategoryRow
                key={item.category}
                item={item}
                index={i}
                onClick={onDrillDown ? () => onDrillDown('category', item.category) : undefined}
              />
            ))}
            {activeTab === 'region' && byRegion.map((item, i) => (
              <RegionRow
                key={item.region}
                item={item}
                index={i}
                onClick={onDrillDown ? () => onDrillDown('region', item.region) : undefined}
              />
            ))}
          </div>
        </ArtifactSection>
      </div>

      {/* Footer */}
      <ArtifactFooter
        primaryAction={{
          id: 'export',
          label: 'Export Report',
          variant: 'primary',
          onClick: () => onExport?.(),
          icon: <Download size={16} />,
        }}
      />
    </div>
  );
};

export default SpendAnalysisArtifact;
