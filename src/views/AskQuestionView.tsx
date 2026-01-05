import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { AskQuestionForm } from '../components/community';
import { useCreateQuestion } from '../hooks/useCreateQuestion';
import { useTags } from '../hooks/useTags';
import type { CreateQuestionInput } from '../types/community';

interface AskQuestionViewProps {
  onBack: () => void;
  onSuccess: (questionId: string) => void;
}

export function AskQuestionView({ onBack, onSuccess }: AskQuestionViewProps) {
  const { tags, isLoading: isTagsLoading } = useTags();
  const { createQuestion, isLoading, error } = useCreateQuestion();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (input: CreateQuestionInput) => {
    setSubmitError(null);

    try {
      const question = await createQuestion(input);
      onSuccess(question.id);
    } catch (err) {
      setSubmitError(error || 'Failed to post question. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative z-10 overflow-auto">
      <div className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-[700px]">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700
                         transition-colors mb-4"
            >
              <ArrowLeft size={16} />
              Back to Community
            </button>

            <h1 className="text-2xl font-medium text-slate-900">Ask a Question</h1>
            <p className="text-sm text-slate-500 mt-1">
              Get help from the procurement community
            </p>
          </motion.div>

          {/* Error alert */}
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200
                         flex items-start gap-3"
            >
              <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Failed to post question
                </p>
                <p className="text-sm text-red-600 mt-0.5">{submitError}</p>
              </div>
            </motion.div>
          )}

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-[1.25rem] bg-white/80 border border-slate-100/60
                       shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]
                       backdrop-blur-sm"
          >
            <AskQuestionForm
              availableTags={tags}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              isTagsLoading={isTagsLoading}
            />
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-4 rounded-lg bg-slate-50/50 border border-slate-100"
          >
            <h3 className="text-sm font-medium text-slate-700 mb-2">
              Tips for a good question:
            </h3>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
              <li>Search to see if your question has been asked before</li>
              <li>Be specific about your situation and what you've tried</li>
              <li>Include relevant context (industry, contract type, etc.)</li>
              <li>Use appropriate tags to help others find your question</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
