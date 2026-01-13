import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { VoteValue } from '../../types/community';

interface VoteButtonsProps {
  score: number;
  userVote: VoteValue | null;
  onVote: (value: VoteValue) => void;
  canUpvote: boolean;
  canDownvote: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
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
  const sizeConfig = {
    sm: { icon: 14, button: 'p-1', score: 'text-xs min-w-[20px]', gap: 'gap-0' },
    md: { icon: 18, button: 'p-1.5', score: 'text-sm min-w-[28px]', gap: 'gap-0.5' },
    lg: { icon: 22, button: 'p-2', score: 'text-lg min-w-[36px]', gap: 'gap-1' },
  };

  const config = sizeConfig[size];

  const handleUpvote = () => {
    if (!isLoading && canUpvote) {
      onVote(1);
    }
  };

  const handleDownvote = () => {
    if (!isLoading && canDownvote) {
      onVote(-1);
    }
  };

  const containerClass = orientation === 'vertical'
    ? `flex flex-col items-center ${config.gap}`
    : `flex items-center ${config.gap}`;

  return (
    <div className={containerClass}>
      {/* Upvote Button */}
      <motion.button
        type="button"
        onClick={handleUpvote}
        disabled={isLoading || !canUpvote}
        title={canUpvote ? 'Upvote' : 'Need 50 reputation to upvote'}
        whileTap={{ scale: canUpvote ? 0.9 : 1 }}
        className={`
          ${config.button} rounded-lg transition-all duration-200
          ${userVote === 1
            ? 'text-white bg-violet-500 shadow-md shadow-violet-200'
            : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50'
          }
          ${!canUpvote ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          ${isLoading ? 'opacity-50' : ''}
        `}
      >
        <motion.div
          animate={userVote === 1 ? { y: [0, -2, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <ChevronUp size={config.icon} strokeWidth={userVote === 1 ? 2.5 : 2} />
        </motion.div>
      </motion.button>

      {/* Animated Score */}
      <div className={`${config.score} tabular-nums font-semibold text-center relative`}>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={score}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`
              block
              ${userVote === 1 ? 'text-violet-600' : userVote === -1 ? 'text-slate-400' : 'text-slate-700'}
            `}
          >
            {score}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Downvote Button */}
      <motion.button
        type="button"
        onClick={handleDownvote}
        disabled={isLoading || !canDownvote}
        title={canDownvote ? 'Downvote' : 'Need 250 reputation to downvote'}
        whileTap={{ scale: canDownvote ? 0.9 : 1 }}
        className={`
          ${config.button} rounded-lg transition-all duration-200
          ${userVote === -1
            ? 'text-white bg-slate-500 shadow-md shadow-slate-200'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }
          ${!canDownvote ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          ${isLoading ? 'opacity-50' : ''}
        `}
      >
        <motion.div
          animate={userVote === -1 ? { y: [0, 2, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={config.icon} strokeWidth={userVote === -1 ? 2.5 : 2} />
        </motion.div>
      </motion.button>
    </div>
  );
}
