import { ChevronUp, ChevronDown } from 'lucide-react';
import type { VoteValue } from '../../types/community';

interface VoteButtonsProps {
  score: number;
  userVote: VoteValue | null;
  onVote: (value: VoteValue) => void;
  canUpvote: boolean;
  canDownvote: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md';
  orientation?: 'vertical' | 'horizontal';
}

export function VoteButtons({
  score,
  userVote,
  onVote,
  canUpvote,
  canDownvote,
  isLoading = false,
  size = 'md',
  orientation = 'vertical',
}: VoteButtonsProps) {
  const iconSize = size === 'sm' ? 14 : 18;

  const handleUpvote = () => {
    if (!isLoading && canUpvote) {
      onVote(userVote === 1 ? 1 : 1); // Toggle or set to 1
    }
  };

  const handleDownvote = () => {
    if (!isLoading && canDownvote) {
      onVote(userVote === -1 ? -1 : -1); // Toggle or set to -1
    }
  };

  const containerClass = orientation === 'vertical'
    ? 'flex flex-col items-center gap-0.5'
    : 'flex items-center gap-1';

  const scoreClass = `
    tabular-nums font-medium text-center
    ${size === 'sm' ? 'text-xs min-w-[20px]' : 'text-sm min-w-[24px]'}
    ${score > 0 ? 'text-slate-900' : score < 0 ? 'text-slate-400' : 'text-slate-500'}
  `;

  return (
    <div className={containerClass}>
      {/* Upvote */}
      <button
        type="button"
        onClick={handleUpvote}
        disabled={isLoading || !canUpvote}
        title={canUpvote ? 'Upvote' : 'Need 50 reputation to upvote'}
        className={`
          p-1 rounded transition-colors
          ${userVote === 1
            ? 'text-violet-600 bg-violet-50'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }
          ${!canUpvote ? 'opacity-50 cursor-not-allowed' : ''}
          ${isLoading ? 'opacity-50' : ''}
        `}
      >
        <ChevronUp size={iconSize} />
      </button>

      {/* Score */}
      <span className={scoreClass}>{score}</span>

      {/* Downvote */}
      <button
        type="button"
        onClick={handleDownvote}
        disabled={isLoading || !canDownvote}
        title={canDownvote ? 'Downvote' : 'Need 250 reputation to downvote'}
        className={`
          p-1 rounded transition-colors
          ${userVote === -1
            ? 'text-red-500 bg-red-50'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }
          ${!canDownvote ? 'opacity-50 cursor-not-allowed' : ''}
          ${isLoading ? 'opacity-50' : ''}
        `}
      >
        <ChevronDown size={iconSize} />
      </button>
    </div>
  );
}
