// InflationSummaryCard - Monthly inflation overview widget
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Zap, ChevronRight } from 'lucide-react';
import type { InflationSummaryCardData } from '../../../types/inflation';

interface InflationSummaryCardProps extends InflationSummaryCardData {
  onViewDetails?: () => void;
  delay?: number;
  beroeSourceCount?: number;
  hideFooter?: boolean;
}

export const InflationSummaryCard = ({
  period,
  headline,
  overallChange,
  topIncreases,
  topDecreases,
  portfolioImpact,
  keyDrivers,
  onViewDetails,
  delay = 0,
  beroeSourceCount = 0,
  hideFooter = false,
}: InflationSummaryCardProps) => {
  const isUp = overallChange.direction === 'up';

  // When hideFooter is true, WidgetRenderer provides the container
  const containerClasses = hideFooter
    ? ''
    : `
        bg-white/80
        rounded-[1.25rem] border border-slate-100/60
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        ring-1 ring-black/[0.02]
        backdrop-blur-sm
        overflow-hidden
      `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={containerClasses}
    >
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              ${isUp ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}
            `}>
              {isUp ? <TrendingUp size={20} strokeWidth={1.5} /> : <TrendingDown size={20} strokeWidth={1.5} />}
            </div>
            <div>
              <p className="text-sm text-slate-500">Inflation Watch</p>
              <p className="text-lg font-medium text-slate-900">{period}</p>
            </div>
          </div>

          <div className={`
            flex items-center gap-1 px-2.5 py-1.5 rounded-lg
            ${isUp ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}
          `}>
            {isUp ? <TrendingUp size={14} strokeWidth={1.5} /> : <TrendingDown size={14} strokeWidth={1.5} />}
            <span className="text-sm font-medium">
              {isUp ? '+' : ''}{overallChange.percent}%
            </span>
          </div>
        </div>

        {/* Headline */}
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">{headline}</p>
      </div>

      {/* Portfolio Impact */}
      <div className="px-5 pb-4">
        <div className={`
          p-3 rounded-xl border
          ${portfolioImpact.direction === 'increase'
            ? 'bg-red-50/60 border-red-100/60'
            : 'bg-emerald-50/60 border-emerald-100/60'}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className={portfolioImpact.direction === 'increase' ? 'text-red-500' : 'text-emerald-500'} strokeWidth={1.5} />
              <span className={`text-sm font-medium ${portfolioImpact.direction === 'increase' ? 'text-red-700' : 'text-emerald-700'}`}>
                Portfolio Impact
              </span>
            </div>
            <div className="text-right">
              <span className={`text-lg font-medium ${portfolioImpact.direction === 'increase' ? 'text-red-700' : 'text-emerald-700'}`}>
                {portfolioImpact.amount}
              </span>
              <span className={`text-xs ml-1 ${portfolioImpact.direction === 'increase' ? 'text-red-600' : 'text-emerald-600'}`}>
                ({portfolioImpact.direction === 'increase' ? '+' : ''}{portfolioImpact.percent}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Movers */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Increases */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <TrendingUp size={12} className="text-red-500" />
              Top Increases
            </p>
            {topIncreases.slice(0, 2).map((item, i) => (
              <motion.div
                key={item.commodity}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1 + i * 0.05 }}
                className="p-2 bg-red-50/50 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 truncate max-w-[100px]">{item.commodity}</span>
                  <span className="text-xs font-medium text-red-600">+{item.change}%</span>
                </div>
                <p className="text-[10px] text-red-500 mt-0.5">{item.impact}</p>
              </motion.div>
            ))}
          </div>

          {/* Decreases */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <TrendingDown size={12} className="text-emerald-500" />
              Savings
            </p>
            {topDecreases.slice(0, 2).map((item, i) => (
              <motion.div
                key={item.commodity}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1 + i * 0.05 }}
                className="p-2 bg-emerald-50/50 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 truncate max-w-[100px]">{item.commodity}</span>
                  <span className="text-xs font-medium text-emerald-600">{item.change}%</span>
                </div>
                <p className="text-[10px] text-emerald-500 mt-0.5">{item.benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Drivers */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap size={12} className="text-amber-500" />
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Key Drivers</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {keyDrivers.map((driver, i) => (
            <span
              key={i}
              className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-md"
            >
              {driver}
            </span>
          ))}
        </div>
      </div>

      {/* Data Attribution Footer - hidden when WidgetRenderer handles it */}
      {!hideFooter && (beroeSourceCount > 0 || onViewDetails) && (
        <div className={`flex items-center px-5 py-3 border-t border-slate-100/60 bg-slate-50/30 ${beroeSourceCount > 0 ? 'justify-between' : 'justify-end'}`}>
          {beroeSourceCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                <span className="text-[8px] font-medium text-white">B</span>
              </div>
              <span>{beroeSourceCount} Beroe Data Sources</span>
            </div>
          )}
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
      )}
    </motion.div>
  );
};

export default InflationSummaryCard;
