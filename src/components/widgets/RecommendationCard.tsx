// RecommendationCard - AI recommendation with confidence and reasoning
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, ChevronRight, AlertTriangle, Zap, Target } from 'lucide-react';

interface RecommendationCardProps {
  title: string;
  recommendation: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string[];
  type?: 'action' | 'insight' | 'warning' | 'opportunity';
  actions?: Array<{
    label: string;
    primary?: boolean;
    onClick?: () => void;
  }>;
  meta?: {
    basedOn?: string;
    updatedAt?: string;
  };
  delay?: number;
}

const confidenceStyles = {
  high: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    label: 'High confidence',
    dots: 3,
  },
  medium: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'Medium confidence',
    dots: 2,
  },
  low: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    label: 'Low confidence',
    dots: 1,
  },
};

const typeStyles = {
  action: {
    icon: Zap,
    bg: 'bg-gradient-to-br from-blue-50/80 to-indigo-50/60',
    iconBg: 'bg-blue-100 text-blue-600',
    border: 'border-blue-100/60',
  },
  insight: {
    icon: Sparkles,
    bg: 'bg-gradient-to-br from-violet-50/80 to-purple-50/60',
    iconBg: 'bg-violet-100 text-violet-600',
    border: 'border-violet-100/60',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-gradient-to-br from-amber-50/80 to-orange-50/60',
    iconBg: 'bg-amber-100 text-amber-600',
    border: 'border-amber-100/60',
  },
  opportunity: {
    icon: Target,
    bg: 'bg-gradient-to-br from-emerald-50/80 to-teal-50/60',
    iconBg: 'bg-emerald-100 text-emerald-600',
    border: 'border-emerald-100/60',
  },
};

const ConfidenceDots = ({ level }: { level: 'high' | 'medium' | 'low' }) => {
  const { dots, bg } = confidenceStyles[level];
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= dots ? bg : 'bg-slate-200'}`}
        />
      ))}
    </div>
  );
};

export const RecommendationCard = ({
  title,
  recommendation,
  confidence,
  reasoning,
  type = 'insight',
  actions,
  meta,
  delay = 0,
}: RecommendationCardProps) => {
  const typeStyle = typeStyles[type];
  const confStyle = confidenceStyles[confidence];
  const Icon = typeStyle.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        ${typeStyle.bg}
        rounded-[1.25rem] border ${typeStyle.border}
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        ring-1 ring-black/[0.02]
        backdrop-blur-sm
        overflow-hidden
      `}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: delay + 0.1, duration: 0.3 }}
              className={`
                w-10 h-10 rounded-xl ${typeStyle.iconBg}
                flex items-center justify-center flex-shrink-0
              `}
            >
              <Icon size={20} strokeWidth={1.5} />
            </motion.div>

            {/* Title + Confidence */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-[15px] font-medium text-slate-900">
                  {title}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceDots level={confidence} />
                <span className={`text-xs ${confStyle.text}`}>
                  {confStyle.label}
                </span>
              </div>
            </div>
          </div>

          {/* AI badge */}
          <div className="flex items-center gap-1 px-2 py-1 bg-white/60 rounded-lg border border-white/80">
            <Sparkles size={12} className="text-violet-500" />
            <span className="text-xs text-slate-500">AI</span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="px-4 pb-3">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.15 }}
          className="text-sm text-slate-700 leading-relaxed"
        >
          {recommendation}
        </motion.p>
      </div>

      {/* Reasoning */}
      {reasoning && reasoning.length > 0 && (
        <div className="px-4 pb-3">
          <div className="p-3 bg-white/50 rounded-xl border border-white/60">
            <p className="text-xs text-slate-500 mb-2 font-medium">Why this recommendation:</p>
            <ul className="space-y-1.5">
              {reasoning.map((reason, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.2 + i * 0.05 }}
                  className="flex items-start gap-2 text-xs text-slate-600"
                >
                  <CheckCircle size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  {reason}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {actions.map((action, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.3 + i * 0.05 }}
                onClick={action.onClick}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5
                  rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${action.primary
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                    : 'bg-white/70 text-slate-700 hover:bg-white border border-slate-200/60'
                  }
                  group
                `}
              >
                {action.label}
                <ChevronRight
                  size={14}
                  strokeWidth={1.5}
                  className="opacity-60 group-hover:translate-x-0.5 transition-transform"
                />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Meta footer */}
      {meta && (
        <div className="px-4 py-2.5 border-t border-white/40 bg-white/30">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {meta.basedOn && (
              <span>Based on {meta.basedOn}</span>
            )}
            {meta.basedOn && meta.updatedAt && <span>·</span>}
            {meta.updatedAt && (
              <span>Updated {meta.updatedAt}</span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
