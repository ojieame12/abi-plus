// ExecutiveSummaryCard - Beautiful executive summary for sharing
import { motion } from 'framer-motion';
import { FileText, Share2, Download, Copy, Check, ChevronRight, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface KeyPoint {
  text: string;
  type?: 'metric' | 'concern' | 'positive' | 'action';
  value?: string;
}

interface ExecutiveSummaryCardProps {
  title?: string;
  period?: string;
  keyPoints: KeyPoint[];
  metrics?: Array<{
    label: string;
    value: string;
    change?: { value: number; direction: 'up' | 'down' };
  }>;
  focusAreas?: string[];
  onShare?: () => void;
  onDownload?: () => void;
  onCopy?: () => void;
  delay?: number;
}

const pointTypeStyles = {
  metric: { icon: null, color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  concern: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
  positive: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  action: { icon: ChevronRight, color: 'text-violet-600', bg: 'bg-violet-50', dot: 'bg-violet-500' },
};

export const ExecutiveSummaryCard = ({
  title = 'Executive Summary',
  period,
  keyPoints,
  metrics,
  focusAreas,
  onShare,
  onDownload,
  onCopy,
  delay = 0,
}: ExecutiveSummaryCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="
        bg-gradient-to-br from-white/90 to-slate-50/80
        rounded-[1.25rem] border border-slate-100/60
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        ring-1 ring-black/[0.02]
        backdrop-blur-sm
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-100/60">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <FileText size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-[15px] font-medium text-slate-900">{title}</h4>
              {period && (
                <p className="text-sm text-slate-500">{period}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {onCopy && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {copied ? (
                  <Check size={16} className="text-emerald-500" strokeWidth={1.5} />
                ) : (
                  <Copy size={16} className="text-slate-400" strokeWidth={1.5} />
                )}
              </motion.button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Share2 size={16} className="text-slate-400" strokeWidth={1.5} />
              </button>
            )}
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Download size={16} className="text-slate-400" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics row */}
      {metrics && metrics.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100/60 bg-slate-50/30">
          <div className="flex items-center gap-6">
            {metrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.1 + i * 0.05 }}
                className="flex-1"
              >
                <p className="text-xs text-slate-500 mb-0.5">{metric.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-light text-slate-900">{metric.value}</span>
                  {metric.change && (
                    <span className={`
                      flex items-center gap-0.5 text-xs
                      ${metric.change.direction === 'up' ? 'text-emerald-600' : 'text-red-600'}
                    `}>
                      {metric.change.direction === 'up' ? (
                        <TrendingUp size={10} strokeWidth={1.5} />
                      ) : (
                        <TrendingDown size={10} strokeWidth={1.5} />
                      )}
                      {Math.abs(metric.change.value)}%
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Key points */}
      <div className="p-4">
        <p className="text-xs text-slate-500 font-medium mb-3">Key Points</p>
        <div className="space-y-2">
          {keyPoints.map((point, i) => {
            const style = pointTypeStyles[point.type || 'metric'];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.15 + i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${style.dot} mt-2 flex-shrink-0`} />
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    {point.text}
                    {point.value && (
                      <span className={`font-medium ml-1 ${style.color}`}>
                        {point.value}
                      </span>
                    )}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Focus areas */}
      {focusAreas && focusAreas.length > 0 && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100/60">
            <p className="text-xs text-amber-700 font-medium mb-2">Recommended Focus</p>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map((area, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + 0.3 + i * 0.03 }}
                  className="
                    px-2.5 py-1 rounded-lg
                    bg-white/70 border border-amber-200/60
                    text-xs text-amber-800
                  "
                >
                  {area}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100/60 bg-slate-50/30">
        <p className="text-xs text-slate-400 text-center">
          Generated by Abi+ Risk Intelligence
        </p>
      </div>
    </motion.div>
  );
};
