// TrendBadge - Simple percentage trend indicator
// Matches TrendIndicatorData shape

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendBadgeProps {
  direction: 'up' | 'down' | 'stable';
  value: number;
  percent: number;
  label: string;
  period: string; // "24h", "7d", "30d"
  variant?: 'inline' | 'card';
  delay?: number;
}

const directionConfig = {
  up: {
    icon: TrendingUp,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200/60',
  },
  down: {
    icon: TrendingDown,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200/60',
  },
  stable: {
    icon: Minus,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200/60',
  },
};

export const TrendBadge = ({
  direction,
  value,
  percent,
  label,
  period,
  variant = 'inline',
  delay = 0,
}: TrendBadgeProps) => {
  const config = directionConfig[direction];
  const Icon = config.icon;
  const sign = direction === 'up' ? '+' : direction === 'down' ? '-' : '';

  if (variant === 'inline') {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay }}
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
          ${config.bg} ${config.color}
          text-sm font-medium
        `}
      >
        <Icon size={14} strokeWidth={1.5} />
        <span>{sign}{percent}%</span>
        <span className="text-xs opacity-70">{period}</span>
      </motion.span>
    );
  }

  // Card variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        p-4 rounded-[1.25rem] border ${config.border} ${config.bg}
        shadow-[0_4px_20px_rgb(0,0,0,0.02)]
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-light ${config.color}`}>
              {sign}{percent}%
            </span>
            {value !== percent && (
              <span className="text-sm text-slate-500">
                ({sign}{value})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {period}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
          <Icon size={20} strokeWidth={1.5} className={config.color} />
        </div>
      </div>
    </motion.div>
  );
};

export default TrendBadge;
