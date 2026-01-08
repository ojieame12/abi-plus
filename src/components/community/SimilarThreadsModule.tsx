// SimilarThreadsModule - Shows similar discussions before posting
// Soft gate to reduce duplicate questions

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, ChevronRight, Loader2 } from 'lucide-react';
import type { SimilarThread } from '../../services/threadSimilarity';

interface SimilarThreadsModuleProps {
  threads: SimilarThread[];
  isLoading: boolean;
  onViewThread: (threadId: string) => void;
  onDismiss: () => void;
  className?: string;
}

export const SimilarThreadsModule = ({
  threads,
  isLoading,
  onViewThread,
  onDismiss,
  className = '',
}: SimilarThreadsModuleProps) => {
  // Don't render if no threads and not loading
  if (!isLoading && threads.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              Similar Discussions
            </span>
            {isLoading && (
              <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
            )}
          </div>
          {threads.length > 0 && (
            <button
              onClick={onDismiss}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
        {threads.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            These threads might help answer your question:
          </p>
        )}
      </div>

      {/* Thread List */}
      <AnimatePresence>
        {threads.length > 0 && (
          <div className="divide-y divide-slate-100">
            {threads.map((thread, index) => (
              <motion.button
                key={thread.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onViewThread(thread.id)}
                className="w-full px-4 py-3 text-left hover:bg-white/60 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 line-clamp-1 group-hover:text-violet-700 transition-colors">
                      {thread.title}
                    </p>
                    {thread.snippet && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {thread.snippet}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {thread.lastActivity}
                      </span>
                      {thread.category && (
                        <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                          {thread.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0 mt-0.5" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      {threads.length > 0 && (
        <div className="px-4 py-2 bg-white/30 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            None of these help? You can still post your question below.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && threads.length === 0 && (
        <div className="px-4 py-6 text-center">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Finding similar discussions...</p>
        </div>
      )}
    </motion.div>
  );
};

export default SimilarThreadsModule;
