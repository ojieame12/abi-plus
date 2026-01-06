// SpendImpactCard - Portfolio spend impact from inflation
import { motion } from 'framer-motion';
import { DollarSign, AlertTriangle, TrendingUp, TrendingDown, ChevronRight, Lightbulb } from 'lucide-react';
import type { SpendImpactCardData } from '../../../types/inflation';

interface SpendImpactCardProps extends SpendImpactCardData {
  onViewDetails?: () => void;
  delay?: number;
  beroeSourceCount?: number;
}

export const SpendImpactCard = ({
  totalImpact,
  totalImpactDirection,
  impactPercent,
  timeframe,
  breakdown,
  mostAffected,
  recommendation,
  onViewDetails,
  delay = 0,
  beroeSourceCount = 3,
}: SpendImpactCardProps) => {
  const isIncrease = totalImpactDirection === 'increase';

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
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              ${isIncrease ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}
            `}>
              <DollarSign size={20} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Inflation Impact</p>
              <p className="text-2xl font-light text-slate-900">{totalImpact}</p>
            </div>
          </div>

          <div className={`
            flex items-center gap-1 px-2.5 py-1.5 rounded-lg
            ${isIncrease ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}
          `}>
            {isIncrease ? <TrendingUp size={14} strokeWidth={1.5} /> : <TrendingDown size={14} strokeWidth={1.5} />}
            <span className="text-sm font-semibold">
              {isIncrease ? '+' : ''}{impactPercent}%
            </span>
          </div>
        </div>

        <p className="mt-1 text-xs text-slate-400">{timeframe}</p>
      </div>

      {/* Most Affected Highlight */}
      <div className="px-5 pb-4">
        <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100/60">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-amber-500" strokeWidth={1.5} />
            <span className="text-xs font-medium text-amber-600">Most Affected</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-600 capitalize">{mostAffected.type}</span>
              <p className="text-sm font-medium text-amber-800">{mostAffected.name}</p>
            </div>
            <span className="text-sm font-semibold text-amber-700">{mostAffected.impact}</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="px-5 pb-5">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
          Impact by Category
        </p>
        <div className="space-y-2.5">
          {breakdown.slice(0, 4).map((item, i) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 + i * 0.05 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className={`
                  w-2 h-2 rounded-full
                  ${item.direction === 'up' ? 'bg-red-500' : 'bg-emerald-500'}
                `} />
                <span className="text-sm text-slate-600">{item.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{item.amount}</span>
                <span className={`
                  text-xs font-medium px-1.5 py-0.5 rounded
                  ${item.direction === 'up'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-emerald-50 text-emerald-600'}
                `}>
                  {item.direction === 'up' ? '+' : ''}{item.percent}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="px-5 pb-5">
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100/60">
            <div className="flex items-start gap-2">
              <Lightbulb size={14} className="text-blue-500 mt-0.5 shrink-0" strokeWidth={1.5} />
              <p className="text-sm text-blue-700">{recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Attribution Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100/60 bg-slate-50/30">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">B</span>
          </div>
          <span>{beroeSourceCount} Beroe Data Sources</span>
        </div>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors group"
          >
            <span>View Details</span>
            <ChevronRight
              size={16}
              strokeWidth={1.5}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default SpendImpactCard;
