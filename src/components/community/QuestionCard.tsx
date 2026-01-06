import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { TagPill } from './TagPill';
import { AuthorBadge } from './AuthorBadge';
import type { Question } from '../../types/community';

interface QuestionCardProps {
  question: Question;
  onClick?: () => void;
  delay?: number;
}

export function QuestionCard({ question, onClick, delay = 0 }: QuestionCardProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full text-left p-5 rounded-[1.25rem]
                 bg-white/80 border border-slate-100/60
                 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]
                 backdrop-blur-sm
                 hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)]
                 transition-shadow duration-200 group"
    >
      {/* Title - dominant */}
      <h3 className="text-[15px] font-medium text-slate-900 leading-snug line-clamp-2
                     group-hover:text-slate-700 transition-colors">
        {question.title}
      </h3>

      {/* Tags - subtle, inline */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {question.tags.slice(0, 3).map(tag => (
          <TagPill key={tag.id} tag={tag} size="sm" />
        ))}
      </div>

      {/* Meta row - author left, stats right */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/60">
        <AuthorBadge
          author={question.author}
          timestamp={question.createdAt}
          showAvatar={true}
          size="sm"
        />

        {/* Stats - right aligned */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className={`tabular-nums ${question.score > 0 ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
              {question.score}
            </span>
            <span className="text-slate-400 ml-1">votes</span>
          </div>
          <div className="text-right">
            <span className={`tabular-nums ${question.answerCount > 0 ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
              {question.answerCount}
            </span>
            <span className="text-slate-400 ml-1">answers</span>
          </div>
          {question.hasAcceptedAnswer && (
            <div className="flex items-center text-emerald-600" title="Solved">
              <Check size={14} />
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
