import { motion } from 'framer-motion';
import { MessageSquare, HelpCircle, ThumbsUp, ExternalLink } from 'lucide-react';
import type { UserProfile } from '../../types/community';

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

// Generate avatar color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-pink-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function AuthorSidebar({
  author,
  stats,
  label = 'Asked by',
  onViewProfile,
}: AuthorSidebarProps) {
  const displayName = author?.displayName || 'Anonymous';
  const initials = displayName
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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

          {/* Avatar - centered with badge */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              {author?.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-[#FAFAFA]"
                />
              ) : (
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center
                             text-white text-xl font-light ring-4 ring-[#FAFAFA] ${getAvatarColor(displayName)}`}
                >
                  {initials}
                </div>
              )}
              {/* Badge overlay */}
              {(author?.reputation ?? 0) > 100 && (
                <img
                  src={`/badges/badge-${((author?.reputation ?? 0) % 5) + 1}.png`}
                  alt="Badge"
                  className="absolute -bottom-1 -right-1 w-8 h-8 object-contain"
                />
              )}
            </div>
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

          {/* Reputation - centered pill */}
          {author?.reputation !== undefined && (
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 rounded-full">
                <span className="text-sm font-semibold text-violet-700">
                  {author.reputation.toLocaleString()}
                </span>
                <span className="text-xs text-violet-500">rep</span>
              </div>
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
