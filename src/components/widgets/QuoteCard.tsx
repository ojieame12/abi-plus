// QuoteCard - Beautiful highlight card for key insights
import { motion } from 'framer-motion';
import { Quote, Sparkles, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';

interface QuoteCardProps {
  quote: string;
  source?: string;
  attribution?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'insight';
  highlight?: string; // Word or phrase to highlight
  delay?: number;
}

const sentimentStyles = {
  positive: {
    bg: 'bg-gradient-to-br from-emerald-50/80 to-teal-50/60',
    border: 'border-emerald-200/40',
    accent: 'bg-emerald-500',
    icon: TrendingUp,
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  negative: {
    bg: 'bg-gradient-to-br from-red-50/80 to-orange-50/60',
    border: 'border-red-200/40',
    accent: 'bg-red-500',
    icon: TrendingDown,
    iconBg: 'bg-red-100 text-red-600',
  },
  neutral: {
    bg: 'bg-gradient-to-br from-slate-50/80 to-gray-50/60',
    border: 'border-slate-200/40',
    accent: 'bg-slate-400',
    icon: Quote,
    iconBg: 'bg-slate-100 text-slate-500',
  },
  insight: {
    bg: 'bg-gradient-to-br from-violet-50/80 to-purple-50/60',
    border: 'border-violet-200/40',
    accent: 'bg-violet-500',
    icon: Lightbulb,
    iconBg: 'bg-violet-100 text-violet-600',
  },
};

export const QuoteCard = ({
  quote,
  source,
  attribution,
  sentiment = 'neutral',
  highlight,
  delay = 0,
}: QuoteCardProps) => {
  const styles = sentimentStyles[sentiment];
  const Icon = styles.icon;

  // Highlight specific word/phrase if provided
  const renderQuote = () => {
    if (!highlight) return quote;

    const parts = quote.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span key={i} className="font-medium text-slate-900 bg-yellow-200/50 px-0.5 rounded">
          {part}
        </span>
      ) : part
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        ${styles.bg}
        rounded-[1.25rem] border ${styles.border}
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        ring-1 ring-black/[0.02]
        backdrop-blur-sm
        overflow-hidden
        relative
      `}
    >
      {/* Accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.accent}`} />

      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          {/* Quote icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + 0.1, duration: 0.3 }}
            className={`
              w-9 h-9 rounded-xl ${styles.iconBg}
              flex items-center justify-center flex-shrink-0
            `}
          >
            <Icon size={18} strokeWidth={1.5} />
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.15 }}
              className="text-[15px] text-slate-700 leading-relaxed font-normal"
            >
              "{renderQuote()}"
            </motion.p>

            {(source || attribution) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.25 }}
                className="mt-2 flex items-center gap-2 text-xs text-slate-500"
              >
                {source && <span className="font-medium">{source}</span>}
                {source && attribution && <span>·</span>}
                {attribution && <span>{attribution}</span>}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Compact inline quote
export const InlineQuote = ({
  text,
  sentiment = 'neutral',
}: { text: string; sentiment?: QuoteCardProps['sentiment'] }) => {
  const styles = sentimentStyles[sentiment || 'neutral'];

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3 py-1.5
      ${styles.bg} rounded-lg border ${styles.border}
      text-sm text-slate-700
    `}>
      <Sparkles size={12} className="text-amber-500" />
      "{text}"
    </span>
  );
};
