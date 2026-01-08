// CommunityEmbedArtifact - Layer 4: Community Q&A and Discussions
// Shows related community threads and allows starting new discussions

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Clock,
  ChevronRight,
  Plus,
  TrendingUp,
  Search,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import type { CommunityAction } from '../../types/aiResponse';
import type { Question } from '../../types/community';
import { useCommunityQuestions } from '../../hooks/useCommunityQuestions';

interface CommunityEmbedArtifactProps {
  community: CommunityAction;
  queryContext?: {
    queryId?: string;
    queryText?: string;
    topic?: string;
  };
  onViewThread?: (threadId: string) => void;
  onStartDiscussion?: (title: string, body: string) => void;
}

// Thread display format (internal to this component)
interface ThreadDisplay {
  id: string;
  title: string;
  excerpt: string;
  replyCount: number;
  upvotes: number;
  category: string;
  author: { name: string; company: string; badge: string | null };
  timeAgo: string;
  isHot: boolean;
}

// Fallback mock threads for when API has no results
const MOCK_THREADS: ThreadDisplay[] = [
  {
    id: 'thread_001',
    title: 'Steel price increases - how are you handling supplier negotiations?',
    excerpt: 'With steel prices up 8.5% this quarter, I\'m curious how others are approaching renegotiations...',
    replyCount: 23,
    upvotes: 47,
    category: 'Metals',
    author: { name: 'Jennifer K.', company: 'Global Mfg', badge: 'top_contributor' },
    timeAgo: '2 days ago',
    isHot: true,
  },
  {
    id: 'thread_002',
    title: 'Alternative packaging suppliers in APAC region',
    excerpt: 'Looking to diversify our packaging supply base in Asia Pacific. Any recommendations for...',
    replyCount: 15,
    upvotes: 32,
    category: 'Packaging',
    author: { name: 'Michael T.', company: 'Consumer Goods Co', badge: null },
    timeAgo: '5 days ago',
    isHot: false,
  },
  {
    id: 'thread_003',
    title: 'Managing lithium supply constraints for EV components',
    excerpt: 'The lithium market is incredibly tight. We\'ve been exploring alternatives and hedging strategies...',
    replyCount: 31,
    upvotes: 89,
    category: 'Chemicals',
    author: { name: 'Sarah L.', company: 'AutoTech', badge: 'expert' },
    timeAgo: '1 week ago',
    isHot: true,
  },
  {
    id: 'thread_004',
    title: 'Best practices for supplier risk monitoring',
    excerpt: 'What KPIs and monitoring frequency are you using? We currently review quarterly but considering...',
    replyCount: 42,
    upvotes: 156,
    category: 'Risk Management',
    author: { name: 'David R.', company: 'Industrial Corp', badge: 'top_contributor' },
    timeAgo: '2 weeks ago',
    isHot: false,
  },
];

// Format date to "X ago" format
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

// Determine badge from reputation
function getBadgeFromReputation(reputation: number): string | null {
  if (reputation >= 1000) return 'expert';
  if (reputation >= 500) return 'top_contributor';
  return null;
}

// Transform Question to ThreadDisplay format
function questionToThread(question: Question): ThreadDisplay {
  const author = question.author;
  return {
    id: question.id,
    title: question.title,
    excerpt: question.body.slice(0, 150) + (question.body.length > 150 ? '...' : ''),
    replyCount: question.answerCount,
    upvotes: question.score,
    category: question.tags[0]?.name || 'General',
    author: {
      name: author?.displayName || 'Community Member',
      company: author?.company || '',
      badge: author ? getBadgeFromReputation(author.reputation) : null,
    },
    timeAgo: formatTimeAgo(question.createdAt),
    isHot: question.score > 20 || question.answerCount > 10,
  };
}

const getBadgeStyle = (badge: string | null) => {
  switch (badge) {
    case 'top_contributor':
      return 'bg-amber-100 text-amber-700';
    case 'expert':
      return 'bg-purple-100 text-purple-700';
    default:
      return '';
  }
};

const getBadgeLabel = (badge: string | null) => {
  switch (badge) {
    case 'top_contributor':
      return 'Top Contributor';
    case 'expert':
      return 'Expert';
    default:
      return '';
  }
};

export const CommunityEmbedArtifact = ({
  community,
  queryContext,
  onViewThread,
  onStartDiscussion,
}: CommunityEmbedArtifactProps) => {
  const [activeTab, setActiveTab] = useState<'related' | 'new'>('related');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real community questions, using topic or queryText for context-aware search
  const searchTerm = queryContext?.topic || queryContext?.queryText || '';
  // Derive category tag from query context if available (e.g., "IT Software" -> "it-software")
  const categoryTag = (queryContext as { category?: string })?.category
    ?.toLowerCase()
    .replace(/\s+/g, '-') || undefined;

  const { questions, isLoading, totalCount, notice } = useCommunityQuestions({
    search: searchTerm,
    tag: categoryTag,
    pageSize: 5,
    sortBy: 'votes', // Show most relevant/popular first
  });

  // Transform real questions to thread display format
  const realThreads = useMemo(() =>
    questions.map(questionToThread),
    [questions]
  );

  // Track if we're showing fallback mock data (API failed) vs no results (API succeeded)
  // notice is set when API failed or using mock mode explicitly
  const isUsingFallback = notice !== null;
  // Only show mock threads when API failed, not when API succeeded with 0 results
  const shouldShowMockThreads = isUsingFallback && realThreads.length === 0;
  // API succeeded but no matching discussions
  const hasNoResults = !isUsingFallback && realThreads.length === 0 && !isLoading;

  // Pre-populate new discussion with context
  const handleStartNew = () => {
    setActiveTab('new');
    if (queryContext?.queryText && !newTitle) {
      setNewTitle(`Question: ${queryContext.queryText}`);
    }
  };

  const handleSubmitDiscussion = () => {
    if (newTitle.trim() && newBody.trim()) {
      onStartDiscussion?.(newTitle, newBody);
    }
  };

  // Use real threads if available, fall back to mock data only when API failed
  const baseThreads = realThreads.length > 0 ? realThreads : (shouldShowMockThreads ? MOCK_THREADS : []);

  // Filter threads based on local search query
  const filteredThreads = searchQuery
    ? baseThreads.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : baseThreads;

  // Highlight the top thread if provided
  const topThread = community.topThread;
  const displayThreads = topThread
    ? [
        filteredThreads.find(t => t.id === topThread.id) || {
          id: topThread.id,
          title: topThread.title,
          excerpt: 'Click to view this discussion...',
          replyCount: topThread.replyCount,
          upvotes: 0,
          category: topThread.category,
          author: { name: 'Community Member', company: '', badge: null },
          timeAgo: 'Recent',
          isHot: false,
        },
        ...filteredThreads.filter(t => t.id !== topThread.id),
      ]
    : filteredThreads;

  // Use real total count when available, otherwise show mock count
  const relatedCount = totalCount > 0 ? totalCount : community.relatedThreadCount;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-600" />
          <h3 className="font-medium text-slate-900">Beroe Community</h3>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
            {isLoading ? '...' : relatedCount} related
          </span>
        </div>
        <button
          onClick={handleStartNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Discussion
        </button>
      </div>

      {/* Notice for fallback/mock data or no results */}
      {notice && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{notice}</span>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => setActiveTab('related')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'related'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Related Discussions
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'new'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plus className="w-4 h-4" />
          Start Discussion
        </button>
      </div>

      {activeTab === 'related' ? (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Thread List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                <span className="ml-2 text-sm text-slate-500">Loading discussions...</span>
              </div>
            ) : displayThreads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500 mb-3">
                  {hasNoResults
                    ? 'No discussions found for this topic yet.'
                    : searchQuery
                      ? 'No discussions match your search.'
                      : 'No discussions found.'}
                </p>
                <button
                  onClick={handleStartNew}
                  className="text-sm text-slate-700 hover:text-slate-900 font-medium underline underline-offset-2"
                >
                  Be the first to start a discussion
                </button>
              </div>
            ) : displayThreads.map((thread, index) => (
              <motion.button
                key={thread.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onViewThread?.(thread.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-sm ${
                  index === 0 && topThread
                    ? 'border-slate-300 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {thread.isHot && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-semibold rounded uppercase">
                          Hot
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">
                        {thread.category}
                      </span>
                    </div>
                    <h4 className="font-medium text-slate-900 line-clamp-2">{thread.title}</h4>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{thread.excerpt}</p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {thread.replyCount} replies
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {thread.upvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {thread.timeAgo}
                      </span>
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                        {thread.author.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm text-slate-600">
                        {thread.author.name}
                        {thread.author.company && (
                          <span className="text-slate-400"> at {thread.author.company}</span>
                        )}
                      </span>
                      {thread.author.badge && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getBadgeStyle(thread.author.badge)}`}>
                          {getBadgeLabel(thread.author.badge)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>

          {/* View all link */}
          <button className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-600 hover:text-slate-900 transition-colors">
            <ExternalLink className="w-4 h-4" />
            View all community discussions
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Query context helper */}
          {queryContext?.queryText && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-xs text-blue-600 mb-1">Starting discussion about:</p>
              <p className="text-sm text-blue-900">{queryContext.queryText}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Discussion Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What's your question or topic?"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Details
            </label>
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Share more context, background, or specific questions you have..."
              className="w-full h-32 px-4 py-3 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-400 resize-none"
            />
          </div>

          {/* Guidelines */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <p className="text-xs font-medium text-slate-600 mb-2">Community Guidelines</p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>- Be specific about your industry and context</li>
              <li>- Share relevant data points when possible</li>
              <li>- Respect confidentiality of proprietary information</li>
              <li>- Tag appropriate categories for visibility</li>
            </ul>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmitDiscussion}
            disabled={!newTitle.trim() || !newBody.trim()}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              newTitle.trim() && newBody.trim()
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Post Discussion
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunityEmbedArtifact;
