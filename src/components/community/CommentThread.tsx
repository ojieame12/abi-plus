import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronDown, ChevronUp, ThumbsUp, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { UserProfile } from '../../types/community';

export interface Comment {
  id: string;
  author?: UserProfile;
  body: string;
  likes: number;
  userLiked?: boolean;
  createdAt: string;
}

interface CommentThreadProps {
  comments: Comment[];
  onAddComment?: (body: string) => void;
  onLikeComment?: (commentId: string) => void;
  isAuthenticated?: boolean;
  canComment?: boolean;
  maxVisibleComments?: number;
}

export function CommentThread({
  comments,
  onAddComment,
  onLikeComment,
  isAuthenticated = false,
  canComment = false,
  maxVisibleComments = 3,
}: CommentThreadProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleComments = isExpanded ? comments : comments.slice(0, maxVisibleComments);
  const hiddenCount = comments.length - maxVisibleComments;

  const handleSubmit = async () => {
    if (!newComment.trim() || !onAddComment || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (comments.length === 0 && !canComment) return null;

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      {/* Comments Header */}
      {comments.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700
                     transition-colors mb-3"
        >
          <MessageSquare size={14} />
          <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
          {hiddenCount > 0 && !isExpanded && (
            <>
              <ChevronDown size={14} />
              <span className="text-slate-400">Show {hiddenCount} more</span>
            </>
          )}
          {isExpanded && comments.length > maxVisibleComments && (
            <ChevronUp size={14} />
          )}
        </button>
      )}

      {/* Comments List */}
      <AnimatePresence mode="popLayout">
        {visibleComments.map((comment, index) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="mb-3 last:mb-0"
          >
            <div className="flex gap-2.5">
              {/* Avatar */}
              <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                {comment.author?.avatarUrl ? (
                  <img
                    src={comment.author.avatarUrl}
                    alt={comment.author.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-medium">
                    {(comment.author?.displayName || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Comment Content */}
              <div className="flex-1 min-w-0">
                <div className="bg-slate-50/80 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-slate-800">
                      {comment.author?.displayName || 'Anonymous'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: false })} ago
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {comment.body}
                  </p>
                </div>

                {/* Like button */}
                <div className="flex items-center gap-3 mt-1 ml-1">
                  <button
                    onClick={() => onLikeComment?.(comment.id)}
                    disabled={!isAuthenticated}
                    className={`
                      flex items-center gap-1 text-[11px] transition-colors
                      ${comment.userLiked
                        ? 'text-violet-600'
                        : 'text-slate-400 hover:text-slate-600'
                      }
                      ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : ''}
                    `}
                  >
                    <ThumbsUp size={12} fill={comment.userLiked ? 'currentColor' : 'none'} />
                    {comment.likes > 0 && <span>{comment.likes}</span>}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add Comment Input */}
      {isAuthenticated && canComment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 flex gap-2"
        >
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            maxLength={500}
            className="flex-1 h-8 px-3 text-sm bg-slate-50 border border-slate-200/60
                       rounded-lg placeholder:text-slate-400
                       focus:outline-none focus:ring-1 focus:ring-violet-200 focus:border-violet-300
                       transition-all"
          />
          <motion.button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            whileTap={{ scale: 0.95 }}
            className="px-3 h-8 bg-violet-500 text-white rounded-lg text-sm font-medium
                       hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center gap-1.5"
          >
            <Send size={14} />
          </motion.button>
        </motion.div>
      )}

      {/* Sign in prompt */}
      {!isAuthenticated && comments.length > 0 && (
        <p className="text-[11px] text-slate-400 mt-2">
          Sign in to like or add comments
        </p>
      )}
    </div>
  );
}
