import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { AuthorBadge } from './AuthorBadge';
import type { Answer } from '../../types/community';

interface AnswerCardProps {
  answer: Answer;
  delay?: number;
}

export function AnswerCard({ answer, delay = 0 }: AnswerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        p-5 rounded-[1.25rem]
        bg-white/80 border border-slate-100/60
        shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]
        backdrop-blur-sm
        ${answer.isAccepted ? 'border-l-2 border-l-emerald-500' : ''}
      `}
    >
      {/* Header with accepted badge and score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {answer.isAccepted && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium
                           bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
              <Check size={10} />
              Accepted
            </span>
          )}
          <AuthorBadge
            author={answer.author}
            timestamp={answer.createdAt}
            showReputation
          />
        </div>
        <span className={`text-sm tabular-nums ${answer.score > 0 ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
          {answer.score} votes
        </span>
      </div>

      {/* Body - improved typography */}
      <div className="prose prose-slate max-w-none">
        {answer.body.split('\n\n').map((paragraph, i) => {
          // Handle markdown-style headers
          if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
            return (
              <h4 key={i} className="text-[15px] font-medium text-slate-900 mt-4 mb-2">
                {paragraph.replace(/\*\*/g, '')}
              </h4>
            );
          }

          // Handle lists
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

          // Regular paragraph
          return (
            <p key={i} className="text-[15px] text-slate-700 leading-relaxed my-3">
              {paragraph}
            </p>
          );
        })}
      </div>
    </motion.div>
  );
}
