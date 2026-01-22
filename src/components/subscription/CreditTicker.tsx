// CreditTicker - Compact credit balance display for header
// Shows remaining credits with status indicator

import { motion } from 'framer-motion';
import { Coins, TrendingDown, TrendingUp, ChevronRight } from 'lucide-react';
import {
  type CompanySubscription,
  getCreditStatus,
  formatCredits,
  type CreditStatus,
} from '../../types/subscription';
import { AnimatedNumber } from '../ui/AnimatedNumber';

const STATUS_STYLES: Record<CreditStatus, {
  bg: string;
  text: string;
  icon: string;
  ring: string;
  dot: string;
}> = {
  healthy: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: 'text-emerald-500',
    ring: 'ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: 'text-amber-500',
    ring: 'ring-amber-200',
    dot: 'bg-amber-500',
  },
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'text-red-500',
    ring: 'ring-red-200',
    dot: 'bg-red-500',
  },
};

interface CreditTickerProps {
  subscription: CompanySubscription;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'expanded';
  showTrend?: boolean;
  className?: string;
}

export function CreditTicker({
  subscription,
  onClick,
  variant = 'default',
  showTrend = false,
  className = '',
}: CreditTickerProps) {
  const status = getCreditStatus(subscription.remainingCredits, subscription.totalCredits);
  const styles = STATUS_STYLES[status];
  const percentage = Math.round((subscription.remainingCredits / subscription.totalCredits) * 100);

  // Compact variant - just the number with status dot
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-white border border-slate-200 hover:border-slate-300
          transition-all duration-150
          ${className}
        `}
      >
        <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
        <span className="text-sm font-medium text-secondary tabular-nums">
          {formatCredits(subscription.remainingCredits)}
        </span>
      </button>
    );
  }

  // Expanded variant - full info with progress bar
  if (variant === 'expanded') {
    return (
      <button
        onClick={onClick}
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-xl
          ${styles.bg} border border-transparent
          hover:ring-2 ${styles.ring}
          transition-all duration-150
          ${className}
        `}
      >
        <div className={`p-2 rounded-lg bg-white/80`}>
          <Coins className={`w-5 h-5 ${styles.icon}`} />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-medium ${styles.text} tabular-nums`}>
              <AnimatedNumber value={subscription.remainingCredits} format />
            </span>
            <span className="text-xs text-slate-500">
              / {formatCredits(subscription.totalCredits)}
            </span>
          </div>
          <div className="mt-1 w-32 h-1.5 bg-white/60 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full ${styles.dot} rounded-full`}
            />
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </button>
    );
  }

  // Default variant - pill with icon and number
  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center gap-2 px-3.5 py-1.5 rounded-full
        ${styles.bg} border border-transparent
        hover:ring-2 ${styles.ring}
        transition-all duration-150
        ${className}
      `}
    >
      <Coins className={`w-4 h-4 ${styles.icon}`} />
      <span className={`text-sm font-medium ${styles.text} tabular-nums`}>
        {formatCredits(subscription.remainingCredits)}
      </span>
      {showTrend && (
        <span className="text-xs text-slate-500 flex items-center gap-0.5">
          {percentage > 50 ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-amber-500" />
          )}
          {percentage}%
        </span>
      )}
      <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 -mr-1 transition-opacity" />
    </button>
  );
}

// Minimal inline variant for use in text
interface InlineCreditDisplayProps {
  amount: number;
  className?: string;
}

export function InlineCreditDisplay({ amount, className = '' }: InlineCreditDisplayProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full
        bg-slate-100 text-slate-600 text-sm font-medium
        ${className}
      `}
    >
      <Coins className="w-3.5 h-3.5" />
      <span className="tabular-nums">{formatCredits(amount)}</span>
    </span>
  );
}

// Credit cost display (for showing prices)
interface CreditCostProps {
  cost: number;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function CreditCost({ cost, label, size = 'md', className = '' }: CreditCostProps) {
  const sizeClasses = size === 'sm'
    ? 'text-xs gap-1 px-2 py-0.5'
    : 'text-sm gap-1.5 px-2.5 py-1';

  return (
    <span
      className={`
        inline-flex items-center rounded-full
        bg-violet-50 text-violet-700 font-medium
        ${sizeClasses}
        ${className}
      `}
    >
      <Coins className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span className="tabular-nums">{formatCredits(cost)}</span>
      {label && <span className="text-violet-500">{label}</span>}
    </span>
  );
}
