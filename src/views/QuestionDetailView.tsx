import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import {
  TagPill,
  AuthorBadge,
  AnswerCard,
} from '../components/community';
import { useQuestionDetail } from '../hooks/useQuestionDetail';

interface QuestionDetailViewProps {
  questionId: string;
  onBack: () => void;
}

export function QuestionDetailView({ questionId, onBack }: QuestionDetailViewProps) {
  const { question, isLoading, error } = useQuestionDetail(questionId);

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

          {/* Question Header - refined */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h1 className="text-xl font-medium text-slate-900 leading-snug mb-3">
              {question.title}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <AuthorBadge
                author={question.author}
                timestamp={question.createdAt}
                showReputation
              />
              <span className="text-slate-300">·</span>
              <span>{question.viewCount} views</span>
              <span className="text-slate-300">·</span>
              <span className={question.score > 0 ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                {question.score} votes
              </span>
            </div>
          </motion.div>

          {/* Question Body - refined typography */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <div className="prose prose-slate max-w-none">
              {question.body.split('\n\n').map((paragraph, i) => {
                // Handle lists
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
                  <p key={i} className="text-[15px] text-slate-700 leading-relaxed my-4">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </motion.div>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            {question.tags.map(tag => (
              <TagPill key={tag.id} tag={tag} size="md" />
            ))}
          </motion.div>

          {/* AI Context Summary (if present) */}
          {question.aiContextSummary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-4 bg-violet-50/60 rounded-[1.25rem] border border-violet-100 mb-8"
            >
              <div className="flex items-center gap-2 text-violet-700 mb-2">
                <Sparkles size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">
                  AI Context
                </span>
              </div>
              <p className="text-sm text-violet-800">{question.aiContextSummary}</p>
            </motion.div>
          )}

          {/* Answers Section - refined */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="border-t border-slate-100 pt-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-medium text-slate-900 flex items-center gap-2">
                <MessageSquare size={16} className="text-slate-400" />
                {question.answerCount} {question.answerCount === 1 ? 'Answer' : 'Answers'}
              </h2>
            </div>

            {question.answers.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No answers yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Be the first to help
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {question.answers.map((answer, index) => (
                  <AnswerCard
                    key={answer.id}
                    answer={answer}
                    delay={0.35 + index * 0.1}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Post Answer - disabled for MVP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-5 bg-slate-50/40 rounded-[1.25rem] border border-slate-100/60"
          >
            <h3 className="text-xs font-medium text-slate-500 mb-3">Your Answer</h3>
            <div className="bg-slate-100/60 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-400">
                Answer posting coming soon
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
