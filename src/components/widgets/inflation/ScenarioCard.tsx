// ScenarioCard - What-if scenario result widget
import { motion } from 'framer-motion';
import { GitBranch, TrendingUp, TrendingDown, ArrowRight, ChevronRight, AlertCircle, CheckCircle, Minus } from 'lucide-react';
import type { ScenarioCardData } from '../../../types/inflation';

interface ScenarioCardProps extends ScenarioCardData {
  onViewDetails?: () => void;
  onRunScenario?: () => void;
  delay?: number;
  beroeSourceCount?: number;
  hideFooter?: boolean;
}

const confidenceStyles: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'High Confidence' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium Confidence' },
  low: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Low Confidence' },
};

export const ScenarioCard = ({
  scenarioName,
  description,
  assumption,
  currentState,
  projectedState,
  delta,
  confidence,
  topImpacts,
  onViewDetails,
  onRunScenario,
  delay = 0,
  beroeSourceCount = 3,
  hideFooter = false,
}: ScenarioCardProps) => {
  const isIncrease = delta.direction === 'up';
  const confStyle = confidenceStyles[confidence];

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
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <GitBranch size={20} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Scenario Analysis</p>
              <p className="text-lg font-medium text-slate-900">{scenarioName}</p>
            </div>
          </div>

          <span className={`px-2 py-1 text-xs font-medium rounded-lg ${confStyle.bg} ${confStyle.text}`}>
            {confStyle.label}
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>

      {/* Assumption Banner */}
      <div className="px-5 pb-4">
        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100/60">
          <p className="text-xs text-indigo-600 mb-1">Assumption</p>
          <p className="text-sm font-medium text-indigo-800">{assumption}</p>
        </div>
      </div>

      {/* Current vs Projected */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2">
          {/* Current State */}
          <div className="flex-1 p-3 bg-slate-50 rounded-xl text-center">
            <p className="text-xs text-slate-500 mb-1">{currentState.label}</p>
            <p className="text-xl font-semibold text-slate-700">{currentState.value}</p>
          </div>

          {/* Arrow */}
          <div className="shrink-0">
            <ArrowRight size={20} className="text-slate-400" strokeWidth={1.5} />
          </div>

          {/* Projected State */}
          <div className={`
            flex-1 p-3 rounded-xl text-center
            ${isIncrease ? 'bg-red-50' : 'bg-emerald-50'}
          `}>
            <p className={`text-xs mb-1 ${isIncrease ? 'text-red-500' : 'text-emerald-500'}`}>
              {projectedState.label}
            </p>
            <p className={`text-xl font-semibold ${isIncrease ? 'text-red-700' : 'text-emerald-700'}`}>
              {projectedState.value}
            </p>
          </div>
        </div>
      </div>

      {/* Delta */}
      <div className="px-5 pb-4">
        <div className={`
          p-3 rounded-xl flex items-center justify-between
          ${isIncrease ? 'bg-red-50/60 border border-red-100/60' : 'bg-emerald-50/60 border border-emerald-100/60'}
        `}>
          <div className="flex items-center gap-2">
            {isIncrease ? (
              <TrendingUp size={16} className="text-red-500" strokeWidth={1.5} />
            ) : (
              <TrendingDown size={16} className="text-emerald-500" strokeWidth={1.5} />
            )}
            <span className={`text-sm font-medium ${isIncrease ? 'text-red-700' : 'text-emerald-700'}`}>
              Projected {isIncrease ? 'Increase' : 'Savings'}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-lg font-semibold ${isIncrease ? 'text-red-700' : 'text-emerald-700'}`}>
              {delta.amount}
            </span>
            <span className={`text-xs ml-1 ${isIncrease ? 'text-red-600' : 'text-emerald-600'}`}>
              ({isIncrease ? '+' : ''}{delta.percent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Top Impacts */}
      <div className="px-5 pb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Top Impacts
        </p>
        <div className="space-y-1.5">
          {topImpacts.map((impact, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 + i * 0.05 }}
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isIncrease ? 'bg-red-400' : 'bg-emerald-400'}`} />
              {impact}
            </motion.div>
          ))}
        </div>
      </div>

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

export default ScenarioCard;
