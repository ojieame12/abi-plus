// Streak Indicator - Subtle, non-animated flame icon
import { Flame } from 'lucide-react';

interface StreakIndicatorProps {
  days: number;
  className?: string;
  /** Show only if streak is active (> 0) */
  hideIfZero?: boolean;
}

export function StreakIndicator({ days, className = '', hideIfZero = true }: StreakIndicatorProps) {
  if (hideIfZero && days === 0) return null;

  // Flame intensity based on streak length
  const intensity = days >= 30 ? 'high' : days >= 7 ? 'medium' : 'low';

  const flameColors = {
    low: 'text-orange-400',
    medium: 'text-orange-500',
    high: 'text-orange-600',
  };

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Flame
        className={`w-3.5 h-3.5 ${flameColors[intensity]}`}
        strokeWidth={2.5}
      />
      <span className="text-xs font-medium text-slate-500 tabular-nums">
        {days}
      </span>
    </span>
  );
}

// Compact version for tight spaces
export function StreakBadge({ days }: { days: number }) {
  if (days === 0) return null;

  return (
    <div className="inline-flex items-center gap-1 px-1.5 py-0.5
                    bg-orange-50 rounded-md">
      <Flame className="w-3 h-3 text-orange-500" strokeWidth={2.5} />
      <span className="text-xs font-medium text-orange-700 tabular-nums">
        {days}
      </span>
    </div>
  );
}
