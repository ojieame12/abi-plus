// HealthScorecardWidget - Beautiful portfolio health scorecard
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, ChevronRight, Shield } from 'lucide-react';

interface HealthMetric {
  label: string;
  value: string | number;
  target?: string | number;
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

interface HealthConcern {
  title: string;
  severity: 'high' | 'medium' | 'low';
  count?: number;
}

interface HealthScorecardWidgetProps {
  overallScore: number; // 0-100
  scoreLabel: string; // "Healthy", "Needs Attention", etc.
  metrics: HealthMetric[];
  concerns?: HealthConcern[];
  comparison?: {
    period: string;
    change: number;
    direction: 'better' | 'worse' | 'same';
  };
  onViewDetails?: () => void;
  delay?: number;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' };
  if (score >= 60) return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' };
  return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' };
};

const statusStyles = {
  good: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  warning: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
  critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
};

const severityStyles = {
  high: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  low: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export const HealthScorecardWidget = ({
  overallScore,
  scoreLabel,
  metrics,
  concerns,
  comparison,
  onViewDetails,
  delay = 0,
}: HealthScorecardWidgetProps) => {
  const scoreColor = getScoreColor(overallScore);

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
      {/* Header with score */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${scoreColor.light} ${scoreColor.text} flex items-center justify-center`}>
              <Shield size={20} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Portfolio Health</p>
              <p className={`text-sm font-medium ${scoreColor.text}`}>{scoreLabel}</p>
            </div>
          </div>

          {/* Score circle */}
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-slate-100"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                className={scoreColor.text}
                strokeDasharray={176}
                initial={{ strokeDashoffset: 176 }}
                animate={{ strokeDashoffset: 176 - (176 * overallScore) / 100 }}
                transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-light text-slate-900">{overallScore}</span>
            </div>
          </div>
        </div>

        {/* Comparison */}
        {comparison && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3 }}
            className={`
              mt-3 flex items-center gap-1.5 text-xs
              ${comparison.direction === 'better' ? 'text-emerald-600' :
                comparison.direction === 'worse' ? 'text-red-600' : 'text-slate-500'}
            `}
          >
            {comparison.direction === 'better' ? (
              <TrendingUp size={12} strokeWidth={1.5} />
            ) : comparison.direction === 'worse' ? (
              <TrendingDown size={12} strokeWidth={1.5} />
            ) : (
              <Minus size={12} strokeWidth={1.5} />
            )}
            <span>
              {comparison.direction === 'same' ? 'No change' :
                `${Math.abs(comparison.change)} points ${comparison.direction}`}
              {' '}vs {comparison.period}
            </span>
          </motion.div>
        )}
      </div>

      {/* Metrics */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((metric, i) => {
            const status = statusStyles[metric.status];
            const StatusIcon = status.icon;
            const TrendIcon = metric.trend === 'up' ? TrendingUp :
                             metric.trend === 'down' ? TrendingDown : Minus;

            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + 0.15 + i * 0.05 }}
                className={`
                  p-3 rounded-xl ${status.bg} border border-white/60
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">{metric.label}</span>
                  <StatusIcon size={12} className={status.color} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-light text-slate-900">{metric.value}</span>
                  {metric.target && (
                    <span className="text-xs text-slate-400">/ {metric.target}</span>
                  )}
                  {metric.trend && (
                    <TrendIcon size={12} className="text-slate-400 ml-auto" strokeWidth={1.5} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Concerns */}
      {concerns && concerns.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-slate-500 mb-2 font-medium">Top Concerns</p>
          <div className="space-y-1.5">
            {concerns.slice(0, 3).map((concern, i) => {
              const severity = severityStyles[concern.severity];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.3 + i * 0.05 }}
                  className={`
                    flex items-center gap-2 px-3 py-2
                    rounded-lg ${severity.bg}
                  `}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${severity.dot}`} />
                  <span className={`text-sm ${severity.text} flex-1`}>
                    {concern.title}
                  </span>
                  {concern.count && (
                    <span className={`text-xs ${severity.text} opacity-70`}>
                      {concern.count}
                    </span>
                  )}
                </motion.div>
              );
            })}
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
            View full health report
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
