// SpendExposureWidget - Beautiful spend-at-risk breakdown
import { motion } from 'framer-motion';
import { DollarSign, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';

interface SpendLevel {
  level: 'high' | 'medium-high' | 'medium' | 'low' | 'unrated';
  amount: number;
  formatted: string;
  percent: number;
  supplierCount: number;
}

interface SpendExposureWidgetProps {
  totalSpendFormatted: string;
  breakdown: SpendLevel[];
  highestExposure?: {
    supplierName: string;
    amount: string;
    riskLevel: string;
  };
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percent: number;
    period: string;
  };
  onViewDetails?: () => void;
  delay?: number;
}

const levelStyles = {
  high: { bg: 'bg-red-500', label: 'High Risk', text: 'text-red-700' },
  'medium-high': { bg: 'bg-orange-500', label: 'Medium-High', text: 'text-orange-700' },
  medium: { bg: 'bg-amber-500', label: 'Medium', text: 'text-amber-700' },
  low: { bg: 'bg-emerald-500', label: 'Low Risk', text: 'text-emerald-700' },
  unrated: { bg: 'bg-slate-300', label: 'Unrated', text: 'text-slate-600' },
};

export const SpendExposureWidget = ({
  totalSpendFormatted,
  breakdown,
  highestExposure,
  trend,
  onViewDetails,
  delay = 0,
}: SpendExposureWidgetProps) => {
  // Sort by risk level importance
  const sortedBreakdown = [...breakdown].sort((a, b) => {
    const order = ['high', 'medium-high', 'medium', 'low', 'unrated'];
    return order.indexOf(a.level) - order.indexOf(b.level);
  });

  const atRiskPercent = breakdown
    .filter(b => b.level === 'high' || b.level === 'medium-high')
    .reduce((sum, b) => sum + b.percent, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="
        bg-white/80
        rounded-[1.25rem] border border-slate-100/60
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        ring-1 ring-black/[0.02]
        backdrop-blur-sm
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <DollarSign size={20} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Spend</p>
              <p className="text-2xl font-light text-slate-900">{totalSpendFormatted}</p>
            </div>
          </div>

          {trend && (
            <div className={`
              flex items-center gap-1 px-2 py-1 rounded-lg
              ${trend.direction === 'up' ? 'bg-red-50 text-red-600' :
                trend.direction === 'down' ? 'bg-emerald-50 text-emerald-600' :
                'bg-slate-50 text-slate-600'}
            `}>
              <TrendingUp
                size={14}
                strokeWidth={1.5}
                className={trend.direction === 'down' ? 'rotate-180' : ''}
              />
              <span className="text-xs font-medium">
                {trend.percent}% {trend.period}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* At-Risk Highlight */}
      <div className="px-4 pb-3">
        <div className="p-3 bg-red-50/60 rounded-xl border border-red-100/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" strokeWidth={1.5} />
              <span className="text-sm font-medium text-red-700">Spend at Risk</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-light text-red-700">
                {atRiskPercent.toFixed(0)}%
              </span>
              <span className="text-xs text-red-600 ml-1">
                of portfolio
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="px-4 pb-4">
        <div className="space-y-3">
          {sortedBreakdown.map((item, i) => {
            const style = levelStyles[item.level];
            return (
              <motion.div
                key={item.level}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1 + i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${style.bg}`} />
                    <span className="text-sm text-slate-600">{style.label}</span>
                    <span className="text-xs text-slate-400">
                      ({item.supplierCount})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-700">
                      {item.formatted}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">
                      {item.percent.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 0.5, delay: delay + 0.2 + i * 0.05 }}
                    className={`h-full rounded-full ${style.bg}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Highest exposure callout */}
      {highestExposure && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100/60">
            <p className="text-xs text-amber-600 mb-1">Highest Exposure</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-amber-800">
                {highestExposure.supplierName}
              </span>
              <span className="text-sm text-amber-700">
                {highestExposure.amount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action */}
      {onViewDetails && (
        <div className="px-4 py-3 border-t border-slate-100/60 bg-slate-50/30">
          <button
            onClick={onViewDetails}
            className="
              w-full flex items-center justify-center gap-1.5
              text-sm font-medium text-slate-600
              hover:text-slate-900 transition-colors
              group
            "
          >
            View spend breakdown
            <ChevronRight
              size={16}
              strokeWidth={1.5}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        </div>
      )}
    </motion.div>
  );
};
