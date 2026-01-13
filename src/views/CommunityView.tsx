import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import {
  QuestionCard,
  QuestionFilters,
  EmptyState,
  CommunityHero,
  TopCategoriesSidebar,
  TopMembersSidebar,
} from '../components/community';
import { useCommunityQuestions } from '../hooks/useCommunityQuestions';
import type { QuestionSortBy, ContentType } from '../types/community';

interface CommunityViewProps {
  onSelectQuestion: (id: string) => void;
  onAskQuestion?: () => void;
  canAsk?: boolean;
}

// Mock data for top members - in production, fetch from API
const mockTopMembers = [
  { id: '1', displayName: 'Kristin Watson', answerCount: 488, reputation: 2450, avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face' },
  { id: '2', displayName: 'Robert Fox', answerCount: 32, reputation: 890, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face' },
  { id: '3', displayName: 'Annette Black', answerCount: 42, reputation: 1230, avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face' },
  { id: '4', displayName: 'Dianne Russell', answerCount: 31, reputation: 560, avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face' },
  { id: '5', displayName: 'Esther Howard', answerCount: 35, reputation: 1780, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
];

// Mock categories for sidebar - in production, derive from tags with counts
const mockCategories = [
  { id: '1', name: 'Supplier Risk', slug: 'supplier-risk', count: 24 },
  { id: '2', name: 'Procurement', slug: 'procurement', count: 18 },
  { id: '3', name: 'Compliance', slug: 'compliance', count: 15 },
  { id: '4', name: 'Cost Savings', slug: 'cost-savings', count: 14 },
  { id: '5', name: 'Due Diligence', slug: 'due-diligence', count: 12 },
  { id: '6', name: 'Contracts', slug: 'contracts', count: 11 },
];

// Mock current user - in production, get from auth context
const mockCurrentUser = {
  id: 'current-user',
  displayName: 'Sarah Chen',
  username: 'sarahchen',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  reputation: 1850,
  questionsCount: 12,
  answersCount: 34,
  upvotesReceived: 156,
};

// Mock notifications - in production, fetch from API
const mockNotifications = [
  {
    id: '1',
    type: 'answer' as const,
    message: 'answered your question about supplier risk assessment',
    actorName: 'Robert Fox',
    actorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
    read: false,
  },
  {
    id: '2',
    type: 'upvote' as const,
    message: 'upvoted your answer on procurement best practices',
    actorName: 'Kristin Watson',
    actorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
  },
  {
    id: '3',
    type: 'mention' as const,
    message: 'mentioned you in a discussion about compliance',
    actorName: 'Annette Black',
    actorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    read: true,
  },
  {
    id: '4',
    type: 'new_question' as const,
    message: 'posted a new question in Cost Savings',
    actorName: 'Dianne Russell',
    actorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
  },
];

export function CommunityView({ onSelectQuestion, onAskQuestion, canAsk = false }: CommunityViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<QuestionSortBy>('newest');
  const [contentType, setContentType] = useState<ContentType>('posts');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
    filter: 'all',
    tag: selectedCategory,
    search: debouncedSearch,
    useMockData: true,
  });

  // Build categories from tags or use mock
  const tagsArray = Array.isArray(tags) ? tags : [];
  const categories = tagsArray.length > 0
    ? tagsArray.slice(0, 6).map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: tag.questionCount,
      }))
    : mockCategories;

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(selectedCategory === slug ? null : slug);
  };

  return (
    <div className="flex flex-col h-full w-full relative z-10 overflow-auto">
      <div className="p-4">
        <div className="relative">
          {/* Hero Section */}
          <CommunityHero
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAskQuestion={onAskQuestion}
            canAsk={canAsk}
            user={mockCurrentUser}
            notifications={mockNotifications}
            onNotificationClick={(id) => console.log('Notification clicked:', id)}
            onMarkAllRead={() => console.log('Mark all read')}
          />

          {/* Two Column Layout - overlaps hero */}
          <div className="relative -mt-16 z-10 px-4">
            <div className="flex gap-5 max-w-5xl mx-auto">
              {/* Main Content - Left Column */}
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.06)' }}
                >
                  {/* Filters & Tabs */}
                  <div className="px-5">
                    <QuestionFilters
                      sortBy={sortBy}
                      contentType={contentType}
                      onSortChange={setSortBy}
                      onContentTypeChange={setContentType}
                    />
                  </div>

                  {/* Tab Content with Transitions */}
                  <AnimatePresence mode="wait">
                    {contentType === 'posts' && (
                      <motion.div
                        key="posts"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <div className="p-4 space-y-3">
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
                                type={debouncedSearch || selectedCategory ? 'no-results' : 'no-questions'}
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

                          {/* Load More */}
                          {hasMore && !isLoading && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex justify-center pt-4"
                            >
                              <button
                                onClick={loadMore}
                                className="px-6 py-2.5 text-sm font-medium text-slate-600
                                           bg-slate-50 hover:bg-slate-100 border border-slate-200
                                           rounded-lg transition-colors"
                              >
                                Load More
                              </button>
                            </motion.div>
                          )}

                          {/* Loading more indicator */}
                          {isLoading && questions.length > 0 && (
                            <div className="flex justify-center py-4">
                              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                            </div>
                          )}
                        </div>

                        {/* Results count footer */}
                        {!isLoading && questions.length > 0 && (
                          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                            <p className="text-xs text-slate-500">
                              Showing {questions.length} of {totalCount} question{totalCount !== 1 ? 's' : ''}
                              {selectedCategory && ` in "${selectedCategory}"`}
                              {debouncedSearch && ` matching "${debouncedSearch}"`}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {contentType === 'discussion' && (
                      <motion.div
                        key="discussion"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="p-8"
                      >
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-light text-slate-700 mb-2">Discussions Coming Soon</h3>
                          <p className="text-sm text-slate-500 max-w-sm">
                            Join open-ended conversations with the community about market trends, strategies, and insights.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {contentType === 'announcement' && (
                      <motion.div
                        key="announcement"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="p-8"
                      >
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-light text-slate-700 mb-2">Announcements</h3>
                          <p className="text-sm text-slate-500 max-w-sm">
                            Stay updated with the latest news, updates, and important information from the ABI+ team.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Right Sidebar */}
              <div className="w-72 flex-shrink-0 space-y-4 hidden lg:block">
                <TopCategoriesSidebar
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryClick={handleCategoryClick}
                />
                <TopMembersSidebar
                  members={mockTopMembers}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
