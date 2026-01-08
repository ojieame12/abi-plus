// DriverBreakdownCard - Root cause analysis for price changes
import { motion } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, ExternalLink, ChevronRight } from 'lucide-react';
import type { DriverBreakdownCardData } from '../../../types/inflation';

interface DriverBreakdownCardProps extends DriverBreakdownCardData {
  onViewDetails?: () => void;
  delay?: number;
  beroeSourceCount?: number; // Number of internal Beroe data sources
  hideFooter?: boolean;
}

const categoryIcons: Record<string, string> = {
  supply: 'Supply',
  demand: 'Demand',
  geopolitical: 'Geopolitical',
  environmental: 'Environmental',
  currency: 'Currency',
  logistics: 'Logistics',
  regulatory: 'Regulatory',
  market_speculation: 'Market',
};

const categoryColors: Record<string, { bg: string; text: string; bar: string }> = {
  supply: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
  demand: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
  geopolitical: { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-500' },
  environmental: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  currency: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
  logistics: { bg: 'bg-cyan-50', text: 'text-cyan-700', bar: 'bg-cyan-500' },
  regulatory: { bg: 'bg-slate-50', text: 'text-slate-700', bar: 'bg-slate-500' },
  market_speculation: { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
};

export const DriverBreakdownCard = ({
  commodity,
  priceChange,
  period,
  drivers,
  marketContext,
  sources,
  onViewDetails,
  delay = 0,
  beroeSourceCount = 3,
  hideFooter = false,
}: DriverBreakdownCardProps) => {
  const isUp = priceChange.direction === 'up';

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
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <Search size={20} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Price Drivers</p>
              <p className="text-lg font-medium text-slate-900">{commodity}</p>
            </div>
          </div>

          <div className={`
            flex items-center gap-1 px-2.5 py-1.5 rounded-lg
            ${isUp ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}
          `}>
            {isUp ? <TrendingUp size={14} strokeWidth={1.5} /> : <TrendingDown size={14} strokeWidth={1.5} />}
            <span className="text-sm font-semibold">
              {isUp ? '+' : ''}{priceChange.percent}%
            </span>
          </div>
        </div>

        <p className="mt-1 text-xs text-slate-400">{period}</p>
      </div>

      {/* Market Context */}
      {marketContext && (
        <div className="px-5 pb-4">
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100/60">
            <p className="text-sm text-slate-600 leading-relaxed">{marketContext}</p>
          </div>
        </div>
      )}

      {/* Driver Breakdown */}
      <div className="px-5 pb-5">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
          Contributing Factors
        </p>
        <div className="space-y-3">
          {drivers.map((driver, i) => {
            const colors = categoryColors[driver.category] || categoryColors.supply;
            return (
              <motion.div
                key={driver.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1 + i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${colors.bg} ${colors.text}`}>
                      {categoryIcons[driver.category] || driver.category}
                    </span>
                    <span className="text-sm text-slate-700">{driver.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {driver.direction === 'up' ? (
                      <TrendingUp size={12} className="text-red-500" />
                    ) : (
                      <TrendingDown size={12} className="text-emerald-500" />
                    )}
                    <span className="text-sm font-semibold text-slate-700">
                      {driver.contribution}%
                    </span>
                  </div>
                </div>

                {/* Contribution bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${driver.contribution}%` }}
                    transition={{ duration: 0.5, delay: delay + 0.2 + i * 0.05 }}
                    className={`h-full rounded-full ${colors.bar}`}
                  />
                </div>

                {/* Description */}
                <p className="mt-1 text-xs text-slate-500">{driver.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Web Sources */}
      {sources && sources.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Sources</p>
          <div className="flex flex-wrap gap-2">
            {sources.slice(0, 3).map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
              >
                {source.source}
                <ExternalLink size={10} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Data Attribution Footer - hidden when WidgetRenderer handles it */}
      {!hideFooter && (
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
      )}
    </motion.div>
  );
};

export default DriverBreakdownCard;
