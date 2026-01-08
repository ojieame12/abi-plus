import { useState, useCallback } from 'react';
import { Loader2, AlertTriangle, Lightbulb, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TagSelector } from './TagSelector';
import { SimilarThreadsModule } from './SimilarThreadsModule';
import { useQuestionGuardrails } from '../../hooks/useQuestionGuardrails';
import type { Tag, CreateQuestionInput } from '../../types/community';

interface AskQuestionFormProps {
  availableTags: Tag[];
  onSubmit: (input: CreateQuestionInput) => Promise<void>;
  isLoading?: boolean;
  isTagsLoading?: boolean;
  // New props for guardrails integration
  onViewThread?: (threadId: string) => void;
  onAskAnalyst?: () => void;
  showAnalystPrompt?: boolean;
  contextMessage?: string;
}

export function AskQuestionForm({
  availableTags,
  onSubmit,
  isLoading = false,
  isTagsLoading = false,
  onViewThread,
  onAskAnalyst,
  showAnalystPrompt = true,
  contextMessage,
}: AskQuestionFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

  // Guardrails - profanity check and similar threads
  const {
    isProfanityFlagged,
    profanityMessage,
    similarThreads,
    isCheckingSimilar,
    dismissSimilarThreads,
  } = useQuestionGuardrails(title, body);

  const validate = (): boolean => {
    const newErrors: { title?: string; body?: string } = {};

    if (title.trim().length < 15) {
      newErrors.title = 'Title must be at least 15 characters';
    }

    if (body.trim().length < 30) {
      newErrors.body = 'Body must be at least 30 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (isProfanityFlagged) return; // Block submission if profanity detected

    await onSubmit({
      title: title.trim(),
      body: body.trim(),
      tagIds,
    });
  };

  const handleViewThread = useCallback((threadId: string) => {
    if (onViewThread) {
      onViewThread(threadId);
    }
  }, [onViewThread]);

  const titleCharCount = title.trim().length;
  const bodyCharCount = body.trim().length;
  const isValid = titleCharCount >= 15 && bodyCharCount >= 30 && !isProfanityFlagged;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Context Message */}
      {contextMessage && (
        <div className="p-3 bg-violet-50 border border-violet-100 rounded-lg">
          <p className="text-xs text-violet-600 font-medium mb-1">Related to:</p>
          <p className="text-sm text-violet-800 line-clamp-2">{contextMessage}</p>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What's your question? Be specific."
          disabled={isLoading}
          className={`
            w-full h-11 px-4 rounded-lg bg-white/80
            border ${errors.title ? 'border-red-300' : 'border-slate-200/60'}
            text-sm text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all
          `}
        />
        <div className="flex justify-between text-xs">
          <span className={errors.title ? 'text-red-500' : 'text-slate-400'}>
            {errors.title || 'Be specific and concise'}
          </span>
          <span className={`tabular-nums ${titleCharCount >= 15 ? 'text-slate-500' : 'text-slate-400'}`}>
            {titleCharCount}/15 min
          </span>
        </div>
      </div>

      {/* Similar Threads Module - shows after typing in title */}
      <AnimatePresence>
        {(similarThreads.length > 0 || isCheckingSimilar) && (
          <SimilarThreadsModule
            threads={similarThreads}
            isLoading={isCheckingSimilar}
            onViewThread={handleViewThread}
            onDismiss={dismissSimilarThreads}
          />
        )}
      </AnimatePresence>

      {/* Body */}
      <div className="space-y-2">
        <label htmlFor="body" className="block text-sm font-medium text-slate-700">
          Details
        </label>
        <textarea
          id="body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Include all the details someone would need to answer your question..."
          disabled={isLoading}
          rows={8}
          className={`
            w-full px-4 py-3 rounded-lg bg-white/80
            border ${errors.body ? 'border-red-300' : 'border-slate-200/60'}
            text-sm text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-1 focus:ring-slate-200 focus:border-slate-300
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none transition-all
          `}
        />
        <div className="flex justify-between text-xs">
          <span className={errors.body ? 'text-red-500' : 'text-slate-400'}>
            {errors.body || 'Markdown supported'}
          </span>
          <span className={`tabular-nums ${bodyCharCount >= 30 ? 'text-slate-500' : 'text-slate-400'}`}>
            {bodyCharCount}/30 min
          </span>
        </div>
      </div>

      {/* Profanity Warning */}
      <AnimatePresence>
        {isProfanityFlagged && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">
                  We can't post this
                </p>
                <p className="text-sm text-red-600 mt-0.5">
                  {profanityMessage || 'Please remove inappropriate language and try again.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tags */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Tags
        </label>
        <TagSelector
          availableTags={availableTags}
          selectedTagIds={tagIds}
          onChange={setTagIds}
          maxTags={5}
          isLoading={isTagsLoading}
        />
        <p className="text-xs text-slate-400">
          Add up to 5 tags to help others find your question
        </p>
      </div>

      {/* Analyst Prompt */}
      {showAnalystPrompt && onAskAnalyst && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-teal-50 border border-teal-200 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-teal-100 rounded-lg">
                <Lightbulb className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-teal-800">
                  Need a quick answer?
                </p>
                <p className="text-xs text-teal-600">
                  Connect directly with a Beroe analyst
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onAskAnalyst}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700
                       text-white text-sm font-medium rounded-lg transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              Ask an Analyst
            </button>
          </div>
        </motion.div>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading || !isValid}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-lg
            text-sm font-medium transition-all
            ${isValid
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }
            ${isLoading ? 'opacity-70' : ''}
          `}
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          Post Question
        </button>
      </div>
    </form>
  );
}
