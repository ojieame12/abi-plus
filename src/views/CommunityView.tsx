import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquarePlus, Loader2 } from 'lucide-react';
import {
  QuestionCard,
  QuestionFilters,
  TagPill,
  EmptyState,
} from '../components/community';
import { useCommunityQuestions } from '../hooks/useCommunityQuestions';
import type { QuestionSortBy, QuestionFilter } from '../types/community';

interface CommunityViewProps {
  onSelectQuestion: (id: string) => void;
  onAskQuestion?: () => void;
  canAsk?: boolean;
}

export function CommunityView({ onSelectQuestion, onAskQuestion, canAsk = false }: CommunityViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<QuestionSortBy>('newest');
  const [filter, setFilter] = useState<QuestionFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Proper debounce with cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    questions,
    tags,
    isLoading,
    totalCount,
    hasMore,
    loadMore,
  } = useCommunityQuestions({
    sortBy,
    filter,
    tag: selectedTag,
    search: debouncedSearch,
  });

  const handleTagClick = (slug: string) => {
    setSelectedTag(selectedTag === slug ? null : slug);
  };

  return (
    <div className="flex flex-col h-full w-full relative z-10 overflow-auto">
      <div className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-[800px]">
          {/* Header - refined */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h1 className="text-2xl font-medium text-slate-900">Community</h1>
              <p className="text-sm text-slate-500 mt-1">
                Questions and answers from procurement peers
              </p>
            </div>

            {/* Ask Question button */}
            <button
              onClick={onAskQuestion}
              disabled={!canAsk || !onAskQuestion}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium
                         border transition-colors ${
                           canAsk && onAskQuestion
                             ? 'bg-violet-600 text-white border-violet-600 hover:bg-violet-700'
                             : 'bg-slate-100 text-slate-400 border-slate-200/60 cursor-not-allowed'
                         }`}
              title={canAsk ? 'Ask a question' : 'Sign in to ask questions'}
            >
              <MessageSquarePlus size={14} />
              Ask Question
            </button>
          </motion.div>

          {/* Search - refined */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative mb-4"
          >
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-white/80
                         border border-slate-200/60
                         text-sm text-slate-900 placeholder:text-slate-400
                         focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300
                         transition-all"
            />
          </motion.div>

          {/* Filters & Sort */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <QuestionFilters
              sortBy={sortBy}
              filter={filter}
              onSortChange={setSortBy}
              onFilterChange={setFilter}
            />
          </motion.div>

          {/* Popular Tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            {tags.map(tag => (
              <TagPill
                key={tag.id}
                tag={tag}
                size="sm"
                selected={selectedTag === tag.slug}
                onClick={() => handleTagClick(tag.slug)}
              />
            ))}
          </motion.div>

          {/* Results count */}
          {!isLoading && questions.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-slate-400 mb-4"
            >
              {totalCount} question{totalCount !== 1 ? 's' : ''}
              {selectedTag && ` tagged "${selectedTag}"`}
              {debouncedSearch && ` matching "${debouncedSearch}"`}
            </motion.p>
          )}

          {/* Questions List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {isLoading && questions.length === 0 ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-16"
                >
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </motion.div>
              ) : questions.length === 0 ? (
                <EmptyState
                  key="empty"
                  type={debouncedSearch || selectedTag ? 'no-results' : 'no-questions'}
                  searchQuery={debouncedSearch}
                />
              ) : (
                questions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onClick={() => onSelectQuestion(question.id)}
                    delay={index * 0.05}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Load More - subtle */}
          {hasMore && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center mt-6"
            >
              <button
                onClick={loadMore}
                className="px-4 py-2 text-xs font-medium text-slate-600
                           bg-white/80 hover:bg-slate-50 border border-slate-200/60
                           rounded-lg transition-colors"
              >
                Load More
              </button>
            </motion.div>
          )}

          {/* Loading more indicator */}
          {isLoading && questions.length > 0 && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
