// JustificationCard - Price increase validation widget
import { motion } from 'framer-motion';
import { Scale, CheckCircle, AlertCircle, XCircle, HelpCircle, ChevronRight, Shield } from 'lucide-react';
import type { JustificationCardData, JustificationVerdict } from '../../../types/inflation';

interface JustificationCardProps extends JustificationCardData {
  onViewDetails?: () => void;
  delay?: number;
  beroeSourceCount?: number;
  hideFooter?: boolean;
}

const verdictStyles: Record<JustificationVerdict, {
  bg: string;
  border: string;
  text: string;
  icon: typeof CheckCircle;
  iconColor: string;
}> = {
  justified: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
  },
  partially_justified: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: AlertCircle,
    iconColor: 'text-amber-500',
  },
  questionable: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  insufficient_data: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    icon: HelpCircle,
    iconColor: 'text-slate-500',
  },
};

const leverageStyles: Record<string, { bg: string; text: string }> = {
  strong: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  moderate: { bg: 'bg-amber-100', text: 'text-amber-700' },
  weak: { bg: 'bg-red-100', text: 'text-red-700' },
};

export const JustificationCard = ({
  supplierName,
  commodity,
  requestedIncrease,
  marketBenchmark,
  verdict,
  verdictLabel,
  keyPoints,
  negotiationLeverage,
  onViewDetails,
  delay = 0,
  beroeSourceCount = 0,
  hideFooter = false,
}: JustificationCardProps) => {
  const style = verdictStyles[verdict];
  const VerdictIcon = style.icon;
  const leverageStyle = leverageStyles[negotiationLeverage];
  const variance = requestedIncrease - marketBenchmark;

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
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <Scale size={20} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Price Justification</p>
              <p className="text-lg font-medium text-slate-900">{supplierName}</p>
            </div>
          </div>
        </div>

        <p className="mt-1 text-xs text-slate-400">{commodity}</p>
      </div>

      {/* Verdict Banner */}
      <div className="px-5 pb-4">
        <div className={`p-3 rounded-xl border ${style.bg} ${style.border}`}>
          <div className="flex items-center gap-2">
            <VerdictIcon size={18} className={style.iconColor} strokeWidth={1.5} />
            <span className={`text-sm font-medium ${style.text}`}>{verdictLabel}</span>
          </div>
        </div>
      </div>

      {/* Price Comparison */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-slate-50 rounded-xl text-center">
            <p className="text-xs text-slate-500 mb-1">Requested</p>
            <p className="text-lg font-medium text-slate-900">+{requestedIncrease}%</p>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl text-center">
            <p className="text-xs text-slate-500 mb-1">Market Avg</p>
            <p className="text-lg font-medium text-slate-700">+{marketBenchmark}%</p>
          </div>
          <div className={`
            p-2.5 rounded-xl text-center
            ${variance > 0 ? 'bg-red-50' : 'bg-emerald-50'}
          `}>
            <p className="text-xs text-slate-500 mb-1">Variance</p>
            <p className={`text-lg font-medium ${variance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Key Points */}
      <div className="px-5 pb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Key Findings
        </p>
        <div className="space-y-2">
          {keyPoints.slice(0, 3).map((point, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 + i * 0.05 }}
              className="flex items-start gap-2"
            >
              <div className={`
                w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5
                ${point.supports ? 'bg-red-100' : 'bg-emerald-100'}
              `}>
                {point.supports ? (
                  <span className="text-[10px] text-red-600">S</span>
                ) : (
                  <span className="text-[10px] text-emerald-600">B</span>
                )}
              </div>
              <p className="text-sm text-slate-600">{point.point}</p>
            </motion.div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-slate-400">S = Supports supplier, B = Supports buyer</p>
      </div>

      {/* Negotiation Leverage */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-slate-500" strokeWidth={1.5} />
            <span className="text-sm text-slate-600">Negotiation Leverage</span>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-lg ${leverageStyle.bg} ${leverageStyle.text} capitalize`}>
            {negotiationLeverage}
          </span>
        </div>
      </div>

      {/* Data Attribution Footer - hidden when WidgetRenderer handles it */}
      {!hideFooter && (beroeSourceCount > 0 || onViewDetails) && (
        <div className={`flex items-center px-5 py-3 border-t border-slate-100/60 bg-slate-50/30 ${beroeSourceCount > 0 ? 'justify-between' : 'justify-end'}`}>
          {beroeSourceCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                <span className="text-[8px] font-medium text-white">B</span>
              </div>
              <span>{beroeSourceCount} Beroe Data Sources</span>
            </div>
          )}
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors group"
            >
              <span>View Details</span>
              <ChevronRight
                size={16}
                strokeWidth={1.5}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default JustificationCard;
