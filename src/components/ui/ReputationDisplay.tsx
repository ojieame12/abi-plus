// Reputation Display - Clean typography with milestone progress
import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

interface ReputationDisplayProps {
  reputation: number;
  showProgress?: boolean;
  className?: string;
}

// Reputation milestones and their unlocks
const MILESTONES = [
  { threshold: 50, label: 'Upvote' },
  { threshold: 100, label: 'Comment' },
  { threshold: 250, label: 'Downvote' },
  { threshold: 1000, label: 'Moderate' },
] as const;

export function ReputationDisplay({
  reputation,
  showProgress = false,
  className = ''
}: ReputationDisplayProps) {
  return (
    <div className={className}>
      {/* Main reputation count */}
      <div className="flex items-baseline gap-1.5">
        <AnimatedNumber
          value={reputation}
          format
          className="text-lg font-medium text-slate-900"
        />
        <span className="text-sm text-slate-500">reputation</span>
      </div>

      {/* Optional milestone progress */}
      {showProgress && (
        <MilestoneProgress reputation={reputation} />
      )}
    </div>
  );
}

// Milestone progress dots
function MilestoneProgress({ reputation }: { reputation: number }) {
  // Find next milestone
  const nextMilestone = MILESTONES.find(m => m.threshold > reputation);
  const prevMilestone = [...MILESTONES].reverse().find(m => m.threshold <= reputation);

  if (!nextMilestone) {
    // All milestones achieved
    return (
      <p className="text-xs text-slate-400 mt-1">
        All privileges unlocked
      </p>
    );
  }

  const startValue = prevMilestone?.threshold || 0;
  const progress = ((reputation - startValue) / (nextMilestone.threshold - startValue)) * 100;

  return (
    <div className="mt-3">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-violet-500 rounded-full"
          />
        </div>
        <span className="text-xs text-slate-400 tabular-nums w-12 text-right">
          {reputation}/{nextMilestone.threshold}
        </span>
      </div>

      {/* Next unlock label */}
      <p className="text-xs text-slate-500 mt-1.5">
        <span className="text-slate-400">Next:</span>{' '}
        {nextMilestone.label} at {nextMilestone.threshold}
      </p>

      {/* Milestone dots */}
      <div className="flex items-center gap-1 mt-2">
        {MILESTONES.map((milestone) => (
          <MilestoneDot
            key={milestone.threshold}
            achieved={reputation >= milestone.threshold}
            label={milestone.label}
            threshold={milestone.threshold}
          />
        ))}
      </div>
    </div>
  );
}

// Individual milestone dot with tooltip
function MilestoneDot({
  achieved,
  label,
  threshold
}: {
  achieved: boolean;
  label: string;
  threshold: number;
}) {
  return (
    <div className="group relative">
      <div
        className={`
          w-2 h-2 rounded-full transition-colors duration-200
          ${achieved
            ? 'bg-violet-500'
            : 'bg-slate-200'
          }
        `}
      />
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                      opacity-0 group-hover:opacity-100 pointer-events-none
                      transition-opacity duration-150">
        <div className="px-2 py-1 bg-slate-900 text-white text-xs rounded-md
                        whitespace-nowrap shadow-lg">
          {label} ({threshold})
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1
                        border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
}

// Compact version for cards/lists
export function ReputationBadge({ reputation }: { reputation: number }) {
  const formatted = reputation >= 1000
    ? `${(reputation / 1000).toFixed(1)}k`
    : reputation.toString();

  return (
    <span className="text-xs font-medium text-slate-500 tabular-nums">
      {formatted} rep
    </span>
  );
}
