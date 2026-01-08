// ExecutiveBriefCard - Shareable executive summary widget
import { motion } from 'framer-motion';
import { FileText, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, Share2, Copy, ChevronRight } from 'lucide-react';
import type { ExecutiveBriefCardData } from '../../../types/inflation';

interface ExecutiveBriefCardProps extends ExecutiveBriefCardData {
  onShare?: () => void;
  onCopy?: () => void;
  onViewDetails?: () => void;
  delay?: number;
  hideFooter?: boolean;
}

const highlightIcons: Record<string, typeof AlertTriangle> = {
  concern: AlertTriangle,
  opportunity: Lightbulb,
  action: Target,
};

const highlightStyles: Record<string, { bg: string; text: string; iconColor: string }> = {
  concern: { bg: 'bg-red-50', text: 'text-red-700', iconColor: 'text-red-500' },
  opportunity: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconColor: 'text-emerald-500' },
  action: { bg: 'bg-blue-50', text: 'text-blue-700', iconColor: 'text-blue-500' },
};

const statusColors: Record<string, string> = {
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  neutral: 'text-slate-600',
};

export const ExecutiveBriefCard = ({
  title,
  period,
  summary,
  keyMetrics,
  highlights,
  outlook,
  onShare,
  onCopy,
  onViewDetails,
  delay = 0,
  hideFooter = false,
}: ExecutiveBriefCardProps) => {
  // When hideFooter is true, WidgetRenderer provides the container
  const containerClasses = hideFooter
    ? ''
    : `
        bg-white/80
        rounded-[1.25rem] border border-slate-100/60
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        ring-1 ring-black/[0.02]
        backdrop-blur-sm
        overflow-hidden
      `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={containerClasses}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <FileText size={20} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-900">{title}</p>
              <p className="text-sm text-slate-500">{period}</p>
            </div>
          </div>

          {/* Share actions */}
          <div className="flex items-center gap-1">
            {onCopy && (
              <button
                onClick={onCopy}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Copy summary"
              >
                <Copy size={16} className="text-slate-500" strokeWidth={1.5} />
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Share brief"
              >
                <Share2 size={16} className="text-slate-500" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 pb-3">
        <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
      </div>

      {/* Key Metrics */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-2 gap-2">
          {keyMetrics.slice(0, 4).map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.1 + i * 0.05 }}
              className="p-2.5 bg-slate-50 rounded-xl"
            >
              <p className="text-xs text-slate-500 mb-1">{metric.label}</p>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-semibold ${statusColors[metric.status]}`}>
                  {metric.value}
                </span>
                {metric.change && (
                  <span className={`
                    flex items-center text-xs
                    ${metric.change.direction === 'up' ? 'text-red-500' : 'text-emerald-500'}
                  `}>
                    {metric.change.direction === 'up' ? (
                      <TrendingUp size={12} strokeWidth={1.5} />
                    ) : (
                      <TrendingDown size={12} strokeWidth={1.5} />
                    )}
                    {Math.abs(metric.change.percent)}%
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div className="px-4 pb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Key Highlights
        </p>
        <div className="space-y-2">
          {highlights.slice(0, 4).map((highlight, i) => {
            const style = highlightStyles[highlight.type];
            const Icon = highlightIcons[highlight.type];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.15 + i * 0.05 }}
                className={`flex items-start gap-2 p-2 rounded-lg ${style.bg}`}
              >
                <Icon size={14} className={`${style.iconColor} mt-0.5 shrink-0`} strokeWidth={1.5} />
                <p className={`text-sm ${style.text}`}>{highlight.text}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Outlook */}
      <div className="px-4 pb-4">
        <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Outlook</p>
          <p className="text-sm text-slate-700 leading-relaxed">{outlook}</p>
        </div>
      </div>

      {/* Action */}
      {onViewDetails && (
        <div className="px-4 py-3 border-t border-slate-100/60 bg-slate-50/30">
          <button
            onClick={onViewDetails}
            className="
              w-full flex items-center justify-center gap-1.5
              text-sm font-medium text-slate-600
              hover:text-slate-900 transition-colors
              group
            "
          >
            View full presentation
            <ChevronRight
              size={16}
              strokeWidth={1.5}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ExecutiveBriefCard;
