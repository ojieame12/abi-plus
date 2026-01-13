import { motion } from 'framer-motion';
import { MessageSquare, Eye, CheckCircle } from 'lucide-react';

interface RelatedQuestion {
  id: string;
  title: string;
  answerCount: number;
  viewCount: number;
  hasAcceptedAnswer: boolean;
}

interface RelatedQuestionsProps {
  questions: RelatedQuestion[];
  onSelectQuestion: (id: string) => void;
}

export function RelatedQuestions({ questions, onSelectQuestion }: RelatedQuestionsProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.06)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-[#FAFBFD]">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Related Questions
        </h3>
      </div>

      {/* Questions List */}
      <div className="p-2">
        {questions.map((question, index) => (
          <motion.button
            key={question.id}
            onClick={() => onSelectQuestion(question.id)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + index * 0.05 }}
            className="w-full text-left p-3 rounded-xl hover:bg-slate-50
                       transition-colors group"
          >
            {/* Title */}
            <h4 className="text-sm text-slate-700 group-hover:text-slate-900
                          line-clamp-2 leading-snug mb-2 transition-colors">
              {question.title}
            </h4>

            {/* Meta */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <MessageSquare size={11} />
                {question.answerCount}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {question.viewCount >= 1000
                  ? `${(question.viewCount / 1000).toFixed(1)}k`
                  : question.viewCount}
              </span>
              {question.hasAcceptedAnswer && (
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle size={11} />
                  Solved
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
