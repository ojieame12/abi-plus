import { motion } from 'framer-motion';
import { Trophy, Flame, Crown, Medal, Award, Loader2, User } from 'lucide-react';
import { useLeaderboard, type LeaderboardEntry } from '../hooks/useLeaderboard';
import type { LeaderboardPeriod } from '../services/leaderboardService';
import { AnimatedNumber } from '../components/ui';

interface LeaderboardViewProps {
  onSelectUser?: (userId: string) => void;
  currentUserId?: string;
}

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  'week': 'This Week',
  'month': 'This Month',
  'all-time': 'All Time',
};

export function LeaderboardView({ onSelectUser, currentUserId }: LeaderboardViewProps) {
  const {
    entries,
    currentUserRank,
    isLoading,
    period,
    setPeriod,
  } = useLeaderboard('reputation', 10);

  return (
    <div className="flex flex-col h-full w-full relative z-10 overflow-auto">
      <div className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-[600px]">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h1 className="text-2xl font-medium text-slate-900">Leaderboard</h1>
            </div>
            <p className="text-sm text-slate-500">
              Top contributors in the community
            </p>
          </motion.div>

          {/* Period Selector */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-1 p-1 bg-slate-100/60 rounded-lg mb-6 w-fit"
          >
            {(['week', 'month', 'all-time'] as LeaderboardPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all
                           ${period === p
                             ? 'bg-white text-slate-900 shadow-sm'
                             : 'text-slate-500 hover:text-slate-700'
                           }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </motion.div>

          {/* Leaderboard */}
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-16"
            >
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </motion.div>
          ) : entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No rankings yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Be the first to earn reputation!
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {/* Top 3 - Special styling */}
              {entries.slice(0, 3).map((entry, index) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  index={index}
                  isTopThree
                  isCurrentUser={entry.userId === currentUserId}
                  onClick={() => onSelectUser?.(entry.userId)}
                />
              ))}

              {/* Divider if more than 3 */}
              {entries.length > 3 && (
                <div className="h-px bg-slate-100 my-3" />
              )}

              {/* Rest of the list */}
              {entries.slice(3).map((entry, index) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  index={index + 3}
                  isCurrentUser={entry.userId === currentUserId}
                  onClick={() => onSelectUser?.(entry.userId)}
                />
              ))}
            </div>
          )}

          {/* Current User Rank (if not in top) */}
          {currentUserRank && !entries.some(e => e.userId === currentUserId) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 pt-4 border-t border-slate-100"
            >
              <p className="text-xs text-slate-400 mb-2">Your ranking</p>
              <LeaderboardRow
                entry={currentUserRank}
                index={currentUserRank.rank - 1}
                isCurrentUser
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// Individual leaderboard row
interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  index: number;
  isTopThree?: boolean;
  isCurrentUser?: boolean;
  onClick?: () => void;
}

function LeaderboardRow({
  entry,
  index,
  isTopThree,
  isCurrentUser,
  onClick,
}: LeaderboardRowProps) {
  const rank = entry.rank;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-xl transition-colors
        ${isCurrentUser
          ? 'bg-violet-50 border border-violet-100'
          : 'bg-white/80 hover:bg-slate-50 border border-slate-100/60'
        }
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center">
        {rank === 1 ? (
          <Crown className="w-5 h-5 text-amber-500" />
        ) : rank === 2 ? (
          <Medal className="w-5 h-5 text-slate-400" />
        ) : rank === 3 ? (
          <Award className="w-5 h-5 text-amber-700" />
        ) : (
          <span className="text-sm font-medium text-slate-400 tabular-nums">
            {rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div className={`
        w-10 h-10 rounded-full overflow-hidden flex-shrink-0
        ${isTopThree ? 'ring-2 ring-offset-2' : ''}
        ${rank === 1 ? 'ring-amber-400' : rank === 2 ? 'ring-slate-300' : rank === 3 ? 'ring-amber-600' : ''}
      `}>
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.displayName || 'User'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-400" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={`
          text-sm font-medium truncate
          ${isCurrentUser ? 'text-violet-900' : 'text-slate-900'}
        `}>
          {entry.displayName || 'Anonymous'}
          {isCurrentUser && (
            <span className="text-xs text-violet-500 ml-1">(you)</span>
          )}
        </p>
        {/* Streak indicator */}
        {entry.currentStreak > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="text-xs text-slate-400">
              {entry.currentStreak} day streak
            </span>
          </div>
        )}
      </div>

      {/* Reputation */}
      <div className="text-right">
        <AnimatedNumber
          value={entry.periodReputation ?? entry.reputation}
          format
          className={`
            text-sm font-semibold tabular-nums
            ${isTopThree ? 'text-slate-900' : 'text-slate-700'}
          `}
        />
        <p className="text-xs text-slate-400">
          {entry.periodReputation !== undefined ? 'this period' : 'total'}
        </p>
      </div>
    </motion.div>
  );
}
