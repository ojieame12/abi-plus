import { motion } from 'framer-motion';
import { MessageSquare, HelpCircle, ThumbsUp, ExternalLink } from 'lucide-react';
import type { UserProfile } from '../../types/community';
import { AvatarWithBadge, ReputationBadge } from './ReputationBadge';

interface AuthorStats {
  questionCount: number;
  answerCount: number;
  upvotesReceived: number;
}

interface AuthorSidebarProps {
  author?: UserProfile;
  stats?: AuthorStats;
  label?: string;
  onViewProfile?: () => void;
}

export function AuthorSidebar({
  author,
  stats,
  label = 'Asked by',
  onViewProfile,
}: AuthorSidebarProps) {
  const displayName = author?.displayName || 'Anonymous';
  const reputation = author?.reputation ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#FAFBFD] rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.04)' }}
    >
      <div className="p-2">
        {/* Main content block */}
        <div className="bg-white rounded-xl p-5">
          {/* Label */}
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider text-center mb-4">
            {label}
          </p>

          {/* Avatar - centered with tier badge */}
          <div className="flex justify-center mb-4">
            <AvatarWithBadge
              avatarUrl={author?.avatarUrl}
              displayName={displayName}
              reputation={reputation}
              size="lg"
            />
          </div>

          {/* Name & Info - centered */}
          <div className="text-center mb-4">
            <h4 className="text-base font-medium text-slate-900 mb-0.5">
              {displayName}
            </h4>
            {author?.title && (
              <p className="text-sm text-slate-500">{author.title}</p>
            )}
            {author?.company && (
              <p className="text-xs text-slate-400">{author.company}</p>
            )}
          </div>

          {/* Reputation Badge - centered */}
          {reputation > 0 && (
            <div className="flex justify-center mb-4">
              <ReputationBadge
                reputation={reputation}
                size="md"
                showTierName={true}
                showProgress={false}
              />
            </div>
          )}

          {/* Stats - horizontal row */}
          {stats && (
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                  <HelpCircle size={12} />
                </div>
                <span className="text-sm font-semibold text-slate-900">{stats.questionCount}</span>
                <span className="text-[10px] text-slate-400">questions</span>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                  <MessageSquare size={12} />
                </div>
                <span className="text-sm font-semibold text-slate-900">{stats.answerCount}</span>
                <span className="text-[10px] text-slate-400">answers</span>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                  <ThumbsUp size={12} />
                </div>
                <span className="text-sm font-semibold text-slate-900">{stats.upvotesReceived}</span>
                <span className="text-[10px] text-slate-400">upvotes</span>
              </div>
            </div>
          )}
        </div>

        {/* View Profile Button - separate block */}
        {onViewProfile && (
          <button
            onClick={onViewProfile}
            className="w-full mt-1.5 px-4 py-3 text-sm font-medium text-slate-600
                       bg-white hover:bg-slate-50 rounded-xl
                       transition-colors flex items-center justify-center gap-2"
          >
            View Profile
            <ExternalLink size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
