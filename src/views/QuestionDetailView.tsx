import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Loader2, AlertCircle, Sparkles, Check } from 'lucide-react';
import {
  TagPill,
  AuthorBadge,
  AnswerCard,
  VoteButtons,
  AnswerForm,
} from '../components/community';
import { useQuestionDetail } from '../hooks/useQuestionDetail';
import { useVote } from '../hooks/useVote';
import { useCreateAnswer } from '../hooks/useCreateAnswer';
import { useAcceptAnswer } from '../hooks/useAcceptAnswer';
import type { Answer, VoteValue } from '../types/community';

interface QuestionDetailViewProps {
  questionId: string;
  onBack: () => void;
  // Auth context - will be wired up later
  isAuthenticated?: boolean;
  userId?: string | null;
  canUpvote?: boolean;
  canDownvote?: boolean;
  canAnswer?: boolean;
}

export function QuestionDetailView({
  questionId,
  onBack,
  isAuthenticated = false,
  userId = null,
  canUpvote = false,
  canDownvote = false,
  canAnswer = false,
}: QuestionDetailViewProps) {
  const { question, isLoading, error, notice, refetch } = useQuestionDetail(questionId, { useMockData: true });
  const { createAnswer, isLoading: isAnswerLoading, error: answerError } = useCreateAnswer();
  const { acceptAnswer, isLoading: isAcceptLoading } = useAcceptAnswer();

  // Local state for optimistic updates
  const [localAnswers, setLocalAnswers] = useState<Answer[]>([]);
  const [acceptedId, setAcceptedId] = useState<string | null>(null);

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
      // Could also refetch to get server state
    } catch {
      // Error handled by hook
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await acceptAnswer(questionId, answerId);
      setAcceptedId(answerId);
      refetch(); // Refresh to get updated state
    } catch {
      // Error handled by hook
    }
  };

  const isQuestionOwner = userId && question?.userId === userId;
  const effectiveAcceptedId = acceptedId || question?.acceptedAnswerId;
  const allAnswers = [...(question?.answers || []), ...localAnswers];

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        <p className="text-xs text-slate-400 mt-3">Loading...</p>
      </div>
    );
  }

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
          className="px-3.5 py-2 text-xs font-medium text-slate-600
                     bg-white hover:bg-slate-50 border border-slate-200/60
                     rounded-lg transition-colors"
        >
          Back to Community
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative z-10 overflow-auto">
      <div className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-[800px]">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700
                       mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Community
          </motion.button>

          {notice && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {notice}
            </div>
          )}

          {/* Question section with voting */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-4"
          >
            {/* Voting column */}
            {isAuthenticated && (
              <div className="flex-shrink-0 pt-1">
                <VoteButtons
                  score={questionVote.score}
                  userVote={questionVote.userVote}
                  onVote={questionVote.castVote}
                  canUpvote={canUpvote}
                  canDownvote={canDownvote}
                  isLoading={questionVote.isLoading}
                />
              </div>
            )}

            {/* Question content */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-medium text-slate-900 leading-snug mb-3">
                {question.title}
              </h1>

              <div className="flex items-center gap-4 mb-6">
                <AuthorBadge
                  author={question.author}
                  timestamp={question.createdAt}
                  showReputation
                  size="lg"
                />
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{question.viewCount} views</span>
                  {!isAuthenticated && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className={question.score > 0 ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                        {question.score} votes
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Question Body */}
              <div className="prose prose-slate max-w-none mb-6">
                {(question.body ?? '').split('\n\n').map((paragraph, i) => {
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
                  return (
                    <p key={i} className="text-[15px] text-slate-700 leading-relaxed my-4">
                      {paragraph}
                    </p>
                  );
                })}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {question.tags.map(tag => (
                  <TagPill key={tag.id} tag={tag} size="md" />
                ))}
              </div>

              {/* AI Context Summary */}
              {question.aiContextSummary && (
                <div className="p-4 bg-violet-50/60 rounded-[1.25rem] border border-violet-100 mb-6">
                  <div className="flex items-center gap-2 text-violet-700 mb-2">
                    <Sparkles size={16} />
                    <span className="text-xs font-medium uppercase tracking-wider">
                      AI Context
                    </span>
                  </div>
                  <p className="text-sm text-violet-800">{question.aiContextSummary}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Answers Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="border-t border-slate-100 pt-6 mt-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-medium text-slate-900 flex items-center gap-2">
                <MessageSquare size={16} className="text-slate-400" />
                {allAnswers.length} {allAnswers.length === 1 ? 'Answer' : 'Answers'}
              </h2>
            </div>

            {allAnswers.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No answers yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Be the first to help
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {allAnswers.map((answer, index) => (
                  <AnswerCardWithVoting
                    key={answer.id}
                    answer={answer}
                    delay={0.35 + index * 0.1}
                    isAuthenticated={isAuthenticated}
                    canUpvote={canUpvote}
                    canDownvote={canDownvote}
                    isQuestionOwner={isQuestionOwner || false}
                    isAccepted={answer.id === effectiveAcceptedId}
                    onAccept={() => handleAcceptAnswer(answer.id)}
                    isAcceptLoading={isAcceptLoading}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Post Answer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-5 bg-slate-50/40 rounded-[1.25rem] border border-slate-100/60"
          >
            <h3 className="text-xs font-medium text-slate-500 mb-3">Your Answer</h3>

            {isAuthenticated && canAnswer ? (
              <>
                {answerError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                    {answerError}
                  </div>
                )}
                <AnswerForm
                  onSubmit={handleSubmitAnswer}
                  isLoading={isAnswerLoading}
                />
              </>
            ) : (
              <div className="bg-slate-100/60 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-400">
                  {isAuthenticated
                    ? 'You need more reputation to answer questions'
                    : 'Sign in to post an answer'}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Answer card with integrated voting
interface AnswerCardWithVotingProps {
  answer: Answer;
  delay: number;
  isAuthenticated: boolean;
  canUpvote: boolean;
  canDownvote: boolean;
  isQuestionOwner: boolean;
  isAccepted: boolean;
  onAccept: () => void;
  isAcceptLoading: boolean;
}

function AnswerCardWithVoting({
  answer,
  delay,
  isAuthenticated,
  canUpvote,
  canDownvote,
  isQuestionOwner,
  isAccepted,
  onAccept,
  isAcceptLoading,
}: AnswerCardWithVotingProps) {
  const vote = useVote({
    targetType: 'answer',
    targetId: answer.id,
    initialScore: answer.score,
    initialUserVote: answer.userVote || null,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`
        flex gap-4 p-5 rounded-[1.25rem]
        bg-white/80 border border-slate-100/60
        shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]
        backdrop-blur-sm
        ${isAccepted ? 'border-l-2 border-l-emerald-500' : ''}
      `}
    >
      {/* Voting + Accept column */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        {isAuthenticated && (
          <VoteButtons
            score={vote.score}
            userVote={vote.userVote}
            onVote={vote.castVote}
            canUpvote={canUpvote}
            canDownvote={canDownvote}
            isLoading={vote.isLoading}
            size="sm"
          />
        )}

        {/* Accept button (question owner only, not already accepted) */}
        {isQuestionOwner && !isAccepted && (
          <button
            onClick={onAccept}
            disabled={isAcceptLoading}
            title="Accept this answer"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400
                       hover:text-emerald-500 hover:border-emerald-200 hover:bg-emerald-50
                       disabled:opacity-50 transition-colors"
          >
            <Check size={14} />
          </button>
        )}

        {/* Accepted indicator */}
        {isAccepted && (
          <div
            title="Accepted answer"
            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600"
          >
            <Check size={14} />
          </div>
        )}
      </div>

      {/* Answer content */}
      <div className="flex-1 min-w-0">
        <div className="prose prose-slate max-w-none">
          {answer.body.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-[15px] text-slate-700 leading-relaxed my-3 first:mt-0 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100/60">
          <AuthorBadge
            author={answer.author}
            timestamp={answer.createdAt}
            showReputation
            size="md"
          />
        </div>
      </div>
    </motion.div>
  );
}
