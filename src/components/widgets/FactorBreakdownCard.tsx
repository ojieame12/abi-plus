// Factor Breakdown Card Widget
// Shows contributing risk factors inline when explaining why a score changed

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Lock, ChevronRight } from 'lucide-react';
import type { RiskLevel } from '../../types/supplier';

// ============================================
// TYPES
// ============================================

export interface FactorData {
  id: string;
  name: string;
  score: number | null;
  weight: number;
  tier: 'tier1' | 'tier2' | 'tier3';
  trend?: 'up' | 'down' | 'stable';
}

export interface FactorBreakdownCardProps {
  supplierName: string;
  overallScore: number;
  level: RiskLevel;
  factors: FactorData[];
  onViewDetails?: () => void;
  delay?: number;
}

// ============================================
// CONSTANTS
// ============================================

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; bar: string }> = {
  high: { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-500' },
  'medium-high': { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  unrated: { bg: 'bg-slate-50', text: 'text-slate-500', bar: 'bg-slate-400' },
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
  high: 'High Risk',
  'medium-high': 'Medium-High',
  medium: 'Medium',
  low: 'Low Risk',
  unrated: 'Unrated',
};

// ============================================
// HELPER COMPONENTS
// ============================================

const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp size={12} className="text-red-500" />;
  if (trend === 'down') return <TrendingDown size={12} className="text-emerald-500" />;
  return <Minus size={12} className="text-slate-400" />;
};

const FactorBar = ({
  factor,
  index,
  delay = 0
}: {
  factor: FactorData;
  index: number;
  delay?: number;
}) => {
  const isRestricted = factor.tier === 'tier3';
  const hasScore = factor.score !== null && !isRestricted;
  const barWidth = hasScore ? Math.min(100, Math.max(0, factor.score || 0)) : 0;

  // Determine bar color based on score
  const getBarColor = (score: number | null) => {
    if (score === null) return 'bg-slate-200';
    if (score >= 75) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: delay + 0.1 + index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="space-y-1"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700">{factor.name}</span>
          {factor.tier === 'tier2' && (
            <span className="text-[10px] px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded font-medium">
              Conditional
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isRestricted ? (
            <div className="flex items-center gap-1 text-slate-400">
              <Lock size={12} />
              <span className="text-xs">Restricted</span>
            </div>
          ) : hasScore ? (
            <>
              <TrendIcon trend={factor.trend} />
              <span className="text-sm font-medium text-slate-900 w-8 text-right">
                {factor.score}
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-400">N/A</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        {isRestricted ? (
          <div className="h-full w-full bg-slate-200 flex items-center justify-center">
            <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.05)_4px,rgba(0,0,0,0.05)_8px)]" />
          </div>
        ) : (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{
              duration: 0.5,
              delay: delay + 0.2 + index * 0.05,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className={`h-full ${getBarColor(factor.score)} rounded-full`}
          />
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const FactorBreakdownCard = ({
  supplierName,
  overallScore,
  level,
  factors,
  onViewDetails,
  delay = 0,
}: FactorBreakdownCardProps) => {
  const colors = RISK_COLORS[level];

  // Sort factors: tier1 first, then tier2, then tier3
  const sortedFactors = [...factors].sort((a, b) => {
    const tierOrder = { tier1: 0, tier2: 1, tier3: 2 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  // Count by tier
  const tier1Factors = factors.filter(f => f.tier === 'tier1');
  const tier2Factors = factors.filter(f => f.tier === 'tier2');
  const tier3Factors = factors.filter(f => f.tier === 'tier3');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs font-normal text-slate-400 uppercase tracking-wider mb-1">
            Risk Factor Breakdown
          </div>
          <div className="text-base font-medium text-slate-900">{supplierName}</div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.bg}`}>
          <span className={`text-lg font-medium ${colors.text}`}>{overallScore}</span>
          <span className={`text-xs ${colors.text}`}>{LEVEL_LABELS[level]}</span>
        </div>
      </div>

      {/* Factors List */}
      <div className="space-y-3">
        {sortedFactors.map((factor, index) => (
          <FactorBar
            key={factor.id}
            factor={factor}
            index={index}
            delay={delay}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{tier1Factors.length} Public</span>
          {tier2Factors.length > 0 && (
            <span className="text-violet-600">{tier2Factors.length} Conditional</span>
          )}
          {tier3Factors.length > 0 && (
            <span className="text-slate-400">{tier3Factors.length} Restricted</span>
          )}
        </div>
      </div>

      {/* Footer Action */}
      {onViewDetails && (
        <motion.button
          whileHover={{ x: 4 }}
          onClick={onViewDetails}
          className="w-full mt-3 pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
        >
          View Full Breakdown
          <ChevronRight size={16} />
        </motion.button>
      )}
    </motion.div>
  );
};

export default FactorBreakdownCard;
