import { motion } from 'framer-motion';
import { MessageSquare, Search } from 'lucide-react';

interface EmptyStateProps {
  type?: 'no-questions' | 'no-results';
  searchQuery?: string;
}

export function EmptyState({ type = 'no-questions', searchQuery }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16"
    >
      {/* Decorative gradient blob */}
      <div className="relative w-32 h-32 mb-6">
        <div
          className="absolute inset-0 bg-gradient-to-br from-violet-200 to-violet-400
                     rounded-3xl rotate-6 opacity-20"
        />
        <div
          className="absolute inset-0 bg-gradient-to-tr from-violet-100 to-violet-300
                     rounded-3xl -rotate-6 opacity-30"
        />
        <div className="relative w-full h-full flex items-center justify-center">
          {type === 'no-results' ? (
            <Search className="w-12 h-12 text-violet-400" />
          ) : (
            <MessageSquare className="w-12 h-12 text-violet-400" />
          )}
        </div>
      </div>

      {type === 'no-results' ? (
        <>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No results found
          </h3>
          <p className="text-sm text-slate-500 text-center max-w-sm mb-6">
            {searchQuery
              ? `No questions match "${searchQuery}". Try a different search term.`
              : 'No questions match your current filters.'}
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No questions yet
          </h3>
          <p className="text-sm text-slate-500 text-center max-w-sm mb-6">
            Be the first to ask the community. Your peers are ready to help with procurement challenges.
          </p>
        </>
      )}

      {/* Disabled button for MVP */}
      <button
        disabled
        className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-400
                   text-sm font-medium cursor-not-allowed
                   flex items-center gap-2"
        title="Coming soon"
      >
        <MessageSquare size={16} />
        Ask a Question
      </button>
      <p className="text-xs text-slate-400 mt-2">Coming soon</p>
    </motion.div>
  );
}
