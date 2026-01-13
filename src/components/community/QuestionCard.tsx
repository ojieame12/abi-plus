import { motion } from 'framer-motion';
import {
  MessageSquare,
  Bookmark,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { TagPill } from './TagPill';
import { AvatarWithBadge } from './ReputationBadge';
import type { Question } from '../../types/community';

interface QuestionCardProps {
  question: Question;
  onClick?: () => void;
  onAnswer?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  delay?: number;
}

function formatTimeAgo(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `Asked ${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `Asked ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `Asked ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return `Asked ${date.toLocaleDateString()}`;
  }
}

export function QuestionCard({
  question,
  onClick,
  onAnswer,
  onSave,
  onShare,
  delay = 0,
}: QuestionCardProps) {
  const author = question.author ?? {
    id: 'unknown',
    displayName: 'Anonymous',
    reputation: 0,
  };
  const upvotes = question.score > 0 ? question.score : 0;
  const downvotes = Math.abs(Math.min(question.score, 0));

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-[#FAFBFD] rounded-2xl cursor-pointer transition-shadow duration-200"
      style={{
        boxShadow: '0 4px 40px rgba(0, 0, 0, 0.04)',
      }}
      whileHover={{
        boxShadow: '0 8px 50px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="p-2">
        {/* Main content block - white fill */}
        <div className="bg-white rounded-xl px-5 py-4">
          {/* Main layout: Avatar | Content | Votes */}
          <div className="flex gap-4">
          {/* Avatar with tier badge */}
          <AvatarWithBadge
            avatarUrl={author.avatarUrl}
            displayName={author.displayName}
            reputation={author.reputation ?? 0}
            size="md"
          />

          {/* Content section - stacked vertically */}
          <div className="flex-1 min-w-0">
            {/* Author name and time */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-slate-900">
                {author.displayName}
              </span>
              <span className="text-xs text-slate-400">
                {formatTimeAgo(question.createdAt)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-normal text-slate-900 leading-snug line-clamp-2
                           hover:text-violet-700 transition-colors mb-3">
              {question.title}
            </h3>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {(question.tags ?? []).slice(0, 4).map(tag => (
                <TagPill key={tag.id} tag={tag} size="md" />
              ))}
            </div>
          </div>

          {/* Vote section - far right */}
          <div className="flex flex-col items-center flex-shrink-0 bg-[#FAFBFD] rounded-xl p-1 gap-1">
            {/* Upvote block */}
            <button
              onClick={e => {
                e.stopPropagation();
              }}
              className="bg-white rounded-lg px-3 py-2 flex flex-col items-center gap-1 hover:bg-slate-50 transition-colors"
            >
              <img src="/icons/ThumbsUp.svg" alt="Upvote" className="w-4 h-4" />
              <span className="text-sm font-normal text-slate-700 tabular-nums">
                {upvotes}
              </span>
            </button>
            {/* Downvote block */}
            <button
              onClick={e => {
                e.stopPropagation();
              }}
              className="bg-white rounded-lg px-3 py-2 flex flex-col items-center gap-1 hover:bg-slate-50 transition-colors"
            >
              <img src="/icons/ThumbsDown.svg" alt="Downvote" className="w-4 h-4" />
              <span className="text-xs text-slate-400 tabular-nums">{downvotes}</span>
            </button>
          </div>
          </div>
        </div>

        {/* Footer actions - white fill */}
        <div className="bg-white rounded-xl mt-1.5 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MessageSquare size={14} />
            <span>{question.answerCount} Comments</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={e => {
                e.stopPropagation();
                onSave?.();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500
                         hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
            >
              <Bookmark size={14} />
              <span>Save</span>
            </button>

            <button
              onClick={e => {
                e.stopPropagation();
                onShare?.();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500
                         hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>

            <button
              onClick={e => {
                e.stopPropagation();
                onAnswer?.() || onClick?.();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs
                         bg-slate-900 text-white rounded-md
                         hover:bg-slate-800 transition-colors"
            >
              <MessageCircle size={12} />
              <span>Answer</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
