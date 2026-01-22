import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpDown,
  MessageSquare,
  Loader2,
  AlertCircle,
  Sparkles,
  Check,
  Bookmark,
  Share2,
  Flag,
  Link2,
  MoreHorizontal,
  Clock,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import {
  TagPill,
  AuthorBadge,
  VoteButtons,
  AnswerForm,
  ImageGallery,
  FileAttachments,
  CommentThread,
  AuthorSidebar,
  RelatedQuestions,
  AvatarWithBadge,
} from '../components/community';
import { WidgetRenderer } from '../components/widgets/WidgetRenderer';
import type { Comment } from '../components/community/CommentThread';
import { useQuestionDetail } from '../hooks/useQuestionDetail';
import { useVote } from '../hooks/useVote';
import { useCreateAnswer } from '../hooks/useCreateAnswer';
import { useAcceptAnswer } from '../hooks/useAcceptAnswer';
import type { Answer, EmbeddedWidget } from '../types/community';
import type { WidgetData, WidgetType } from '../types/widgets';

type AnswerSortBy = 'votes' | 'newest' | 'oldest';

// Helper function to format time ago
function formatTimeAgo(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `about ${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `about ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `about ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

interface QuestionDetailViewProps {
  questionId: string;
  onBack: () => void;
  onSelectQuestion?: (id: string) => void;
  isAuthenticated?: boolean;
  userId?: string | null;
  canUpvote?: boolean;
  canDownvote?: boolean;
  canAnswer?: boolean;
}

// Mock related questions - in production, fetch based on tags/similarity
const mockRelatedQuestions = [
  { id: 'r1', title: 'How to assess supplier credit risk in emerging markets?', answerCount: 12, viewCount: 2400, hasAcceptedAnswer: true },
  { id: 'r2', title: 'Best practices for vendor audit documentation', answerCount: 8, viewCount: 1800, hasAcceptedAnswer: true },
  { id: 'r3', title: 'ESG scoring frameworks comparison', answerCount: 5, viewCount: 980, hasAcceptedAnswer: false },
  { id: 'r4', title: 'Single-source supplier risk mitigation strategies', answerCount: 15, viewCount: 3200, hasAcceptedAnswer: true },
];

// Mock author stats - in production, fetch from API
const mockAuthorStats = {
  questionCount: 12,
  answerCount: 34,
  upvotesReceived: 156,
};

// Mock comments for answers - in production, these would come from the API
// Varied reputation: Newcomer (0-99), Bronze (100-499), Silver (500-999), Gold (1000-2499), Platinum (2500-4999), Diamond (5000+)
const mockComments: Record<string, Comment[]> = {
  // Comments for answer a_001 (Michael Torres's answer about emerging markets)
  'a_001': [
    { id: 'c1', author: { id: 'u1', displayName: 'Alex Turner', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', reputation: 5620 }, body: 'Great explanation! The triangulation approach makes a lot of sense.', likes: 5, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'c2', author: { id: 'u2', displayName: 'Sarah Chen', reputation: 5840 }, body: 'Would the local credit bureaus work for suppliers in Vietnam specifically?', likes: 2, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
    { id: 'c6', author: { id: 'u6', displayName: 'Rachel Kim', reputation: 445 }, body: 'The LinkedIn tip is underrated. We caught a mass exodus at a supplier this way.', likes: 8, createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  ],
  // Comments for answer a_002 (Emily Watson's answer about credit insurance)
  'a_002': [
    { id: 'c3', author: { id: 'u3', displayName: 'Mike Ross', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', reputation: 3450 }, body: 'Thanks for the detailed breakdown! Never thought of using insurers as an intel source.', likes: 3, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  ],
  // Comments for answer a_003 (David Park's answer about QBRs)
  'a_003': [
    { id: 'c4', author: { id: 'u4', displayName: 'Jennifer Liu', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', reputation: 1200 }, body: 'How do you frame the financial metrics request without making them defensive?', likes: 4, createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { id: 'c5', author: { id: 'u5', displayName: 'David Park', reputation: 780 }, body: '@Jennifer we position it as mutual transparency - we share our forecast data too.', likes: 6, createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  ],
  // Comments for answer a_004 (Emily Watson's answer about single-source risk)
  'a_004': [
    { id: 'c7', author: { id: 'u7', displayName: 'Tom Bradley', reputation: 6120 }, body: 'The "insurance value" calculation is brilliant. Do you have a template for that?', likes: 7, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  ],
  // Comments for answer a_005 (Michael Torres's answer about EcoVadis)
  'a_005': [
    { id: 'c8', author: { id: 'u8', displayName: 'Lisa Wang', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face', reputation: 2890 }, body: 'Have you compared EcoVadis with Sedex? We use both and wondering if we can consolidate.', likes: 3, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  ],
  // Comments for answer a_010 (Amanda Rodriguez's answer about price increases)
  'a_010': [
    { id: 'c9', author: { id: 'u9', displayName: 'Chris Anderson', reputation: 780 }, body: 'The published indices approach is key. We use them for copper and aluminum now.', likes: 5, createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
    { id: 'c10', author: { id: 'u10', displayName: 'Nina Patel', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', reputation: 7340 }, body: 'Did you actually have alternatives ready or was it a bluff? Asking for a friend...', likes: 12, createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  ],
  // Comments for answer a_015 (Emily Watson's answer about site visit red flags)
  'a_015': [
    { id: 'c11', author: { id: 'u11', displayName: 'Mark Stevens', reputation: 650 }, body: 'The bathroom tip is gold. Saved us from a bad supplier decision last year.', likes: 9, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { id: 'c12', author: { id: 'u12', displayName: 'Amanda Rodriguez', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face', reputation: 1890 }, body: 'Adding one more: check if their quality records match their shipping records. Discrepancies = data manipulation.', likes: 15, createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() },
  ],
};

// Mock images for the question body
const mockImages = [
  { id: 'img1', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', alt: 'Dashboard screenshot', caption: 'Risk assessment dashboard' },
  { id: 'img2', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', alt: 'Analytics view' },
];

// Mock attachments
const mockAttachments = [
  { id: 'f1', name: 'supplier_assessment_template.xlsx', url: '#', size: 245000, type: 'spreadsheet' },
  { id: 'f2', name: 'risk_scoring_guide.pdf', url: '#', size: 1200000, type: 'pdf' },
];

export function QuestionDetailView({
  questionId,
  onBack,
  onSelectQuestion,
  isAuthenticated = false,
  userId = null,
  canUpvote = false,
  canDownvote = false,
  canAnswer = false,
}: QuestionDetailViewProps) {
  const { question, isLoading, error, notice, refetch } = useQuestionDetail(questionId, { useMockData: true });
  const { createAnswer, isLoading: isAnswerLoading, error: answerError } = useCreateAnswer();
  const { acceptAnswer, isLoading: isAcceptLoading } = useAcceptAnswer();

  // Local state
  const [localAnswers, setLocalAnswers] = useState<Answer[]>([]);
  const [acceptedId, setAcceptedId] = useState<string | null>(null);
  const [answerSortBy, setAnswerSortBy] = useState<AnswerSortBy>('votes');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Question voting
  const questionVote = useVote({
    targetType: 'question',
    targetId: questionId,
    initialScore: question?.score || 0,
    initialUserVote: question?.userVote || null,
  });

  const handleSubmitAnswer = async (body: string) => {
    try {
      const newAnswer = await createAnswer(questionId, body);
      setLocalAnswers(prev => [...prev, newAnswer]);
    } catch {
      // Error handled by hook
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await acceptAnswer(questionId, answerId);
      setAcceptedId(answerId);
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareMenu(false);
  };

  const isQuestionOwner = userId && question?.userId === userId;
  const effectiveAcceptedId = acceptedId || question?.acceptedAnswerId;

  // Sort answers - allAnswers is computed inside useMemo to avoid dependency issues
  const sortedAnswers = useMemo(() => {
    const allAnswers = [...(question?.answers || []), ...localAnswers];
    const sorted = [...allAnswers];

    // Always put accepted answer first
    sorted.sort((a, b) => {
      if (a.id === effectiveAcceptedId) return -1;
      if (b.id === effectiveAcceptedId) return 1;

      switch (answerSortBy) {
        case 'votes':
          return b.score - a.score;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [question?.answers, localAnswers, answerSortBy, effectiveAcceptedId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        <p className="text-xs text-slate-400 mt-3">Loading question...</p>
      </div>
    );
  }

  // Error state
  if (error || !question) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center">
        <AlertCircle className="w-10 h-10 text-slate-300 mb-4" />
        <h3 className="text-[15px] font-medium text-slate-900 mb-2">
          Question not found
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          {error || 'This question may have been removed.'}
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-sm font-medium text-slate-600
                     bg-white hover:bg-slate-50 border border-slate-200
                     rounded-xl transition-colors"
        >
          Back to Community
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative z-10 overflow-auto bg-slate-50/30">
      <div className="flex-1 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header Row - Back, Title, Actions */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between gap-4 mb-6"
          >
            {/* Back Button */}
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700
                         transition-colors flex-shrink-0 mt-1"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Bookmark */}
              <motion.button
                onClick={() => setIsBookmarked(!isBookmarked)}
                whileTap={{ scale: 0.9 }}
                className={`
                  p-2 rounded-lg transition-colors
                  ${isBookmarked
                    ? 'bg-amber-50 text-amber-600'
                    : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                  }
                `}
              >
                <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
              </motion.button>

              {/* Share */}
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Share2 size={18} />
                </button>

                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg
                                 border border-slate-200 py-1 z-20"
                    >
                      <button
                        onClick={handleCopyLink}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700
                                   hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Link2 size={14} />
                        Copy link
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* More */}
              <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </motion.div>

          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
            >
              {notice}
            </motion.div>
          )}

          {/* Two Column Layout */}
          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Question Card - matching QuestionCard style */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#FAFBFD] rounded-2xl"
                style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.04)' }}
              >
                <div className="p-2">
                  {/* Main content block - white fill */}
                  <div className="bg-white rounded-xl px-5 py-4">
                    {/* Main layout: Avatar | Content | Votes */}
                    <div className="flex gap-4">
                      {/* Avatar with tier badge */}
                      <AvatarWithBadge
                        avatarUrl={question.author?.avatarUrl}
                        displayName={question.author?.displayName || 'Anonymous'}
                        reputation={question.author?.reputation ?? 0}
                        size="md"
                      />

                      {/* Content section */}
                      <div className="flex-1 min-w-0">
                        {/* Author name and time */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-slate-900">
                            {question.author?.displayName || 'Anonymous'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatTimeAgo(question.createdAt)}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">
                            {question.viewCount.toLocaleString()} views
                          </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-xl font-normal text-slate-900 leading-snug mb-3">
                          {question.title}
                        </h1>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {question.tags.map(tag => (
                            <TagPill key={tag.id} tag={tag} size="md" />
                          ))}
                        </div>
                      </div>

                      {/* Vote section - far right */}
                      <div className="flex flex-col items-center flex-shrink-0 bg-[#FAFBFD] rounded-xl p-1 gap-1">
                        {/* Upvote block */}
                        <button
                          onClick={() => questionVote.castVote(1)}
                          disabled={!canUpvote || questionVote.isLoading}
                          className={`bg-white rounded-lg px-3 py-2 flex flex-col items-center gap-1 transition-colors
                            ${questionVote.userVote === 1 ? 'bg-violet-50' : 'hover:bg-slate-50'}
                            ${!canUpvote ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <img src="/icons/ThumbsUp.svg" alt="Upvote" className="w-4 h-4" />
                          <span className="text-sm font-normal text-slate-700 tabular-nums">
                            {questionVote.score > 0 ? questionVote.score : 0}
                          </span>
                        </button>
                        {/* Downvote block */}
                        <button
                          onClick={() => questionVote.castVote(-1)}
                          disabled={!canDownvote || questionVote.isLoading}
                          className={`bg-white rounded-lg px-3 py-2 flex flex-col items-center gap-1 transition-colors
                            ${questionVote.userVote === -1 ? 'bg-slate-100' : 'hover:bg-slate-50'}
                            ${!canDownvote ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <img src="/icons/ThumbsDown.svg" alt="Downvote" className="w-4 h-4" />
                          <span className="text-xs text-slate-400 tabular-nums">
                            {questionVote.score < 0 ? Math.abs(questionVote.score) : 0}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Body Content - separate white block */}
                  <div className="bg-white rounded-xl mt-1.5 px-5 py-4">
                    <div className="prose prose-slate max-w-none">
                      {(question.body ?? '').split('\n\n').map((paragraph, i) => {
                        // Code block
                        if (paragraph.startsWith('```')) {
                          const code = paragraph.replace(/```\w*\n?/g, '').trim();
                          return (
                            <pre key={i} className="bg-slate-900 text-slate-100 p-4 rounded-xl text-sm overflow-x-auto my-4">
                              <code>{code}</code>
                            </pre>
                          );
                        }

                        // Blockquote
                        if (paragraph.startsWith('> ')) {
                          return (
                            <blockquote key={i} className="border-l-3 border-violet-300 pl-4 py-1 my-4 text-slate-600 italic">
                              {paragraph.replace('> ', '')}
                            </blockquote>
                          );
                        }

                        // List
                        if (paragraph.startsWith('- ')) {
                          const items = paragraph.split('\n').filter(line => line.startsWith('- '));
                          return (
                            <ul key={i} className="list-disc list-inside space-y-1.5 text-[15px] text-slate-700 my-4">
                              {items.map((item, j) => (
                                <li key={j}>{item.replace('- ', '')}</li>
                              ))}
                            </ul>
                          );
                        }

                        // Regular paragraph
                        return (
                          <p key={i} className="text-[15px] text-slate-700 leading-relaxed my-4 first:mt-0">
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>

                    {/* Image Gallery - from question data or mock */}
                    {question.images && question.images.length > 0 ? (
                      <ImageGallery images={question.images} />
                    ) : (
                      <ImageGallery images={mockImages} />
                    )}

                    {/* File Attachments - from question data or mock */}
                    {question.attachments && question.attachments.length > 0 ? (
                      <FileAttachments attachments={question.attachments} />
                    ) : (
                      <FileAttachments attachments={mockAttachments} />
                    )}

                    {/* Embedded Widgets */}
                    {question.embeddedWidgets && question.embeddedWidgets.length > 0 && (
                      <div className="mt-6 space-y-4">
                        {question.embeddedWidgets.map((widget: EmbeddedWidget) => (
                          <div key={widget.id} className="space-y-2">
                            <WidgetRenderer
                              widget={{
                                type: widget.type as WidgetType,
                                data: widget.data,
                              } as WidgetData}
                            />
                            {widget.caption && (
                              <p className="text-xs text-slate-500 text-center italic">
                                {widget.caption}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Context Summary */}
                    {question.aiContextSummary && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                        <div className="flex items-center gap-2 text-violet-700 mb-2">
                          <Sparkles size={16} />
                          <span className="text-xs font-medium uppercase tracking-wider">
                            From AI Conversation
                          </span>
                        </div>
                        <p className="text-sm text-violet-800 leading-relaxed">
                          {question.aiContextSummary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer actions - white fill */}
                  <div className="bg-white rounded-xl mt-1.5 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MessageSquare size={14} />
                      <span>{question.answerCount} Comments</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIsBookmarked(!isBookmarked)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors
                          ${isBookmarked ? 'text-amber-600 bg-amber-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                      >
                        <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
                        <span>Save</span>
                      </button>

                      <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500
                                 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                      >
                        <Share2 size={14} />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Answers Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6"
              >
                {/* Answers Header with Sort */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <MessageSquare size={20} className="text-slate-400" />
                    {sortedAnswers.length} {sortedAnswers.length === 1 ? 'Answer' : 'Answers'}
                  </h2>

                  {sortedAnswers.length > 1 && (
                    <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200">
                      <button
                        onClick={() => setAnswerSortBy('votes')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors
                          ${answerSortBy === 'votes'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        <TrendingUp size={12} />
                        Votes
                      </button>
                      <button
                        onClick={() => setAnswerSortBy('newest')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors
                          ${answerSortBy === 'newest'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        <Clock size={12} />
                        Newest
                      </button>
                      <button
                        onClick={() => setAnswerSortBy('oldest')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors
                          ${answerSortBy === 'oldest'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        <ArrowUpDown size={12} />
                        Oldest
                      </button>
                    </div>
                  )}
                </div>

                {/* Answers List */}
                {sortedAnswers.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center"
                       style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.06)' }}>
                    <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No answers yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Be the first to help
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedAnswers.map((answer, index) => (
                      <AnswerCardEnhanced
                        key={answer.id}
                        answer={answer}
                        delay={0.35 + index * 0.08}
                        isAuthenticated={isAuthenticated}
                        canUpvote={canUpvote}
                        canDownvote={canDownvote}
                        canComment={isAuthenticated}
                        isQuestionOwner={isQuestionOwner || false}
                        isAccepted={answer.id === effectiveAcceptedId}
                        onAccept={() => handleAcceptAnswer(answer.id)}
                        isAcceptLoading={isAcceptLoading}
                        comments={mockComments[answer.id] || []}
                      />
                    ))}
                  </div>
                )}

                {/* Post Answer Form */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 bg-white rounded-2xl p-6"
                  style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.06)' }}
                >
                  <h3 className="text-sm font-medium text-slate-700 mb-4">Your Answer</h3>

                  {isAuthenticated && canAnswer ? (
                    <>
                      {answerError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                          {answerError}
                        </div>
                      )}
                      <AnswerForm
                        onSubmit={handleSubmitAnswer}
                        isLoading={isAnswerLoading}
                      />
                    </>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-6 text-center">
                      <p className="text-sm text-slate-500">
                        {isAuthenticated
                          ? 'You need more reputation to answer questions'
                          : 'Sign in to post an answer'}
                      </p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="w-72 flex-shrink-0 space-y-4 hidden lg:block">
              <AuthorSidebar
                author={question.author}
                stats={mockAuthorStats}
                label="Asked by"
              />

              <RelatedQuestions
                questions={mockRelatedQuestions}
                onSelectQuestion={(id) => onSelectQuestion?.(id)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Answer Card with integrated voting and comments
interface AnswerCardEnhancedProps {
  answer: Answer;
  delay: number;
  isAuthenticated: boolean;
  canUpvote: boolean;
  canDownvote: boolean;
  canComment: boolean;
  isQuestionOwner: boolean;
  isAccepted: boolean;
  onAccept: () => void;
  isAcceptLoading: boolean;
  comments: Comment[];
}

function AnswerCardEnhanced({
  answer,
  delay,
  isAuthenticated,
  canUpvote,
  canDownvote,
  canComment,
  isQuestionOwner,
  isAccepted,
  onAccept,
  isAcceptLoading,
  comments,
}: AnswerCardEnhancedProps) {
  const vote = useVote({
    targetType: 'answer',
    targetId: answer.id,
    initialScore: answer.score,
    initialUserVote: answer.userVote || null,
  });

  const handleAddComment = async (body: string) => {
    // In production, call API to create comment
    console.log('Add comment:', body);
  };

  const handleLikeComment = async (commentId: string) => {
    // In production, call API to like comment
    console.log('Like comment:', commentId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`
        bg-white rounded-2xl overflow-hidden
        ${isAccepted ? 'ring-2 ring-emerald-200' : ''}
      `}
      style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.06)' }}
    >
      {/* Accepted Banner */}
      {isAccepted && (
        <div className="px-6 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100
                        flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">Accepted Answer</span>
        </div>
      )}

      <div className="p-6">
        <div className="flex gap-5">
          {/* Voting & Accept Column */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            <VoteButtons
              score={vote.score}
              userVote={vote.userVote}
              onVote={vote.castVote}
              canUpvote={canUpvote}
              canDownvote={canDownvote}
              isLoading={vote.isLoading}
              size="md"
            />

            {/* Accept button */}
            {isQuestionOwner && !isAccepted && (
              <motion.button
                onClick={onAccept}
                disabled={isAcceptLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Accept this answer"
                className="p-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400
                           hover:text-emerald-500 hover:border-emerald-300 hover:bg-emerald-50
                           disabled:opacity-50 transition-all"
              >
                <Check size={18} />
              </motion.button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Answer Body */}
            <div className="prose prose-slate max-w-none">
              {answer.body.split('\n\n').map((paragraph, i) => {
                // Code block
                if (paragraph.startsWith('```')) {
                  const code = paragraph.replace(/```\w*\n?/g, '').trim();
                  return (
                    <pre key={i} className="bg-slate-900 text-slate-100 p-4 rounded-xl text-sm overflow-x-auto my-4">
                      <code>{code}</code>
                    </pre>
                  );
                }

                // List
                if (paragraph.startsWith('- ')) {
                  const items = paragraph.split('\n').filter(line => line.startsWith('- '));
                  return (
                    <ul key={i} className="list-disc list-inside space-y-1 text-[15px] text-slate-700 my-3">
                      {items.map((item, j) => (
                        <li key={j}>{item.replace('- ', '')}</li>
                      ))}
                    </ul>
                  );
                }

                // Bold headers
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return (
                    <h4 key={i} className="text-[15px] font-medium text-slate-900 mt-4 mb-2">
                      {paragraph.replace(/\*\*/g, '')}
                    </h4>
                  );
                }

                // Regular paragraph
                return (
                  <p key={i} className="text-[15px] text-slate-700 leading-relaxed my-3 first:mt-0">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Author & Actions Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <AuthorBadge
                author={answer.author}
                timestamp={answer.createdAt}
                showReputation
                size="md"
              />

              <div className="flex items-center gap-2">
                <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Share2 size={14} />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Flag size={14} />
                </button>
              </div>
            </div>

            {/* Comments Thread */}
            <CommentThread
              comments={comments}
              onAddComment={handleAddComment}
              onLikeComment={handleLikeComment}
              isAuthenticated={isAuthenticated}
              canComment={canComment}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
