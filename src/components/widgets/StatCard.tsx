// StatCard - Beautiful single stat display with optional trend
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  change?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    period?: string;
  };
  icon?: LucideIcon;
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
}

const colorStyles = {
  default: {
    bg: 'bg-slate-50/60',
    icon: 'bg-slate-100 text-slate-500',
    value: 'text-slate-900',
  },
  success: {
    bg: 'bg-emerald-50/60',
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-700',
  },
  warning: {
    bg: 'bg-amber-50/60',
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-700',
  },
  danger: {
    bg: 'bg-red-50/60',
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-700',
  },
  info: {
    bg: 'bg-blue-50/60',
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-700',
  },
};

const sizeStyles = {
  sm: { value: 'text-2xl', label: 'text-xs', padding: 'p-3' },
  md: { value: 'text-3xl', label: 'text-sm', padding: 'p-4' },
  lg: { value: 'text-4xl', label: 'text-sm', padding: 'p-5' },
};

export const StatCard = ({
  label,
  value,
  subLabel,
  change,
  icon: Icon,
  color = 'default',
  size = 'md',
  delay = 0,
}: StatCardProps) => {
  const colors = colorStyles[color];
  const sizes = sizeStyles[size];

  const TrendIcon = change?.direction === 'up' ? TrendingUp :
                    change?.direction === 'down' ? TrendingDown : Minus;

  const trendColor = change?.direction === 'up' ? 'text-emerald-500' :
                     change?.direction === 'down' ? 'text-red-500' : 'text-slate-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        ${colors.bg} ${sizes.padding}
        rounded-[1.25rem] border border-white/60
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        ring-1 ring-black/[0.02]
        backdrop-blur-sm
      `}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={`${sizes.label} text-slate-500 font-normal`}>{label}</p>
          <p className={`${sizes.value} font-light ${colors.value} tracking-tight`}>
            {value}
          </p>
          {subLabel && (
            <p className="text-xs text-slate-400">{subLabel}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <div className={`w-9 h-9 rounded-xl ${colors.icon} flex items-center justify-center`}>
              <Icon size={18} strokeWidth={1.5} />
            </div>
          )}
          {change && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon size={14} strokeWidth={1.5} />
              <span className="text-xs font-medium">
                {change.value > 0 ? '+' : ''}{change.value}%
              </span>
              {change.period && (
                <span className="text-xs text-slate-400 ml-1">{change.period}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Compact inline variant
export const StatBadge = ({
  label,
  value,
  color = 'default',
}: Pick<StatCardProps, 'label' | 'value' | 'color'>) => {
  const colors = colorStyles[color];

  return (
    <span className={`
      inline-flex items-center gap-2 px-3 py-1.5
      ${colors.bg} rounded-full
      border border-white/60
      text-sm
    `}>
      <span className="text-slate-500">{label}:</span>
      <span className={`font-medium ${colors.value}`}>{value}</span>
    </span>
  );
};
