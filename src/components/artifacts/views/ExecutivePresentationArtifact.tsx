// Executive Presentation Artifact
// Presentation-ready view for stakeholder communication with key metrics and insights

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  Lightbulb,
  Target,
  ArrowRight,
  BarChart3,
  Calendar,
  Users,
} from 'lucide-react';
import { ArtifactSection, ArtifactFooter } from '../primitives';
import type { PriceChange } from '../../../types/inflation';

// ============================================
// TYPES
// ============================================

export interface KeyMetric {
  label: string;
  value: string;
  change?: PriceChange;
  status: 'positive' | 'negative' | 'neutral';
  icon?: string;
}

export interface Highlight {
  type: 'concern' | 'opportunity' | 'action';
  text: string;
}

export interface TalkingPoint {
  topic: string;
  points: string[];
}

export interface ExecutivePresentationArtifactProps {
  title?: string;
  period?: string;
  summary?: string;
  keyMetrics?: KeyMetric[];
  highlights?: Highlight[];
  talkingPoints?: TalkingPoint[];
  outlook?: string;
  nextSteps?: string[];
  shareableUrl?: string;
  onExport?: () => void;
  onShare?: () => void;
  onClose?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const METRIC_STATUS_STYLES = {
  positive: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
  negative: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700' },
  neutral: { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-700' },
};

const HIGHLIGHT_STYLES = {
  concern: {
    bg: 'bg-red-50',
    border: 'border-red-100',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    label: 'Concern',
  },
  opportunity: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    icon: Lightbulb,
    iconColor: 'text-emerald-500',
    label: 'Opportunity',
  },
  action: {
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    icon: Target,
    iconColor: 'text-violet-500',
    label: 'Action',
  },
};

// ============================================
// HELPER COMPONENTS
// ============================================

const PresentationHeader = ({
  title,
  period,
  summary,
}: {
  title: string;
  period: string;
  summary?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center pb-5 border-b border-slate-100"
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <Calendar size={14} className="text-slate-400" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {period}
        </span>
      </div>
      <h2 className="text-xl font-medium text-slate-800 mb-3">{title}</h2>
      {summary && (
        <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
          {summary}
        </p>
      )}
    </motion.div>
  );
};

const MetricCard = ({
  metric,
  index,
}: {
  metric: KeyMetric;
  index: number;
}) => {
  const style = METRIC_STATUS_STYLES[metric.status];
  const hasChange = metric.change && metric.change.percent !== 0;
  const isUp = metric.change?.direction === 'up';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className={`p-4 rounded-xl border ${style.bg} ${style.border}`}
    >
      <p className="text-xs text-slate-500 mb-1">{metric.label}</p>
      <div className="flex items-end justify-between">
        <p className={`text-2xl font-light ${style.text}`}>{metric.value}</p>
        {hasChange && (
          <div className={`flex items-center gap-1 text-sm ${
            isUp ? 'text-red-600' : 'text-emerald-600'
          }`}>
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="font-medium">
              {isUp ? '+' : ''}{metric.change!.percent}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const HighlightCard = ({
  highlight,
  index,
}: {
  highlight: Highlight;
  index: number;
}) => {
  const style = HIGHLIGHT_STYLES[highlight.type];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.04 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${style.bg} ${style.border}`}
    >
      <div className={`w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shrink-0`}>
        <Icon size={16} className={style.iconColor} />
      </div>
      <div className="flex-1">
        <span className={`text-xs font-medium ${style.iconColor} uppercase tracking-wide`}>
          {style.label}
        </span>
        <p className="text-sm text-slate-700 mt-1">{highlight.text}</p>
      </div>
    </motion.div>
  );
};

const TalkingPointsSection = ({ points }: { points: TalkingPoint[] }) => {
  if (!points || points.length === 0) return null;

  return (
    <ArtifactSection
      title="Talking Points"
      badge={points.length}
      icon={<Users size={14} className="text-slate-400" />}
      defaultOpen={true}
    >
      <div className="space-y-4">
        {points.map((topic, i) => (
          <motion.div
            key={topic.topic}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-medium text-slate-800">{topic.topic}</h4>
            <ul className="space-y-1.5 pl-4">
              {topic.points.map((point, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <ArrowRight size={12} className="text-violet-400 mt-1 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </ArtifactSection>
  );
};

const OutlookSection = ({ outlook }: { outlook: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gradient-to-br from-violet-50 to-slate-50 rounded-xl border border-violet-100/60"
    >
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 size={16} className="text-violet-500" />
        <span className="text-sm font-medium text-violet-700">Outlook</span>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{outlook}</p>
    </motion.div>
  );
};

const NextStepsSection = ({ steps }: { steps: string[] }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <ArtifactSection
      title="Next Steps"
      badge={steps.length}
      icon={<Target size={14} className="text-violet-500" />}
      defaultOpen={true}
    >
      <div className="space-y-2">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.04 }}
            className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
          >
            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-violet-600">{i + 1}</span>
            </div>
            <p className="text-sm text-slate-700 pt-0.5">{step}</p>
          </motion.div>
        ))}
      </div>
    </ArtifactSection>
  );
};

const ShareableLink = ({ url }: { url: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 bg-slate-50 rounded-xl border border-slate-100"
    >
      <div className="flex items-center gap-2 mb-2">
        <Share2 size={14} className="text-slate-400" />
        <span className="text-xs font-medium text-slate-500">Shareable Link</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={url}
          readOnly
          className="flex-1 text-sm text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 outline-none"
        />
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const ExecutivePresentationArtifact = ({
  title = 'Executive Brief',
  period = 'Current Period',
  summary,
  keyMetrics = [],
  highlights = [],
  talkingPoints = [],
  outlook,
  nextSteps = [],
  shareableUrl,
  onExport,
  onShare,
}: ExecutivePresentationArtifactProps) => {
  // Group highlights by type
  const concerns = highlights.filter(h => h.type === 'concern');
  const opportunities = highlights.filter(h => h.type === 'opportunity');
  const actions = highlights.filter(h => h.type === 'action');

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Header */}
        <PresentationHeader title={title} period={period} summary={summary} />

        {/* Key Metrics */}
        {keyMetrics.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {keyMetrics.slice(0, 4).map((metric, i) => (
              <MetricCard key={metric.label} metric={metric} index={i} />
            ))}
          </div>
        )}

        {/* Additional Metrics (if more than 4) */}
        {keyMetrics.length > 4 && (
          <ArtifactSection title="Additional Metrics" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              {keyMetrics.slice(4).map((metric, i) => (
                <MetricCard key={metric.label} metric={metric} index={i} />
              ))}
            </div>
          </ArtifactSection>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <ArtifactSection
            title="Key Highlights"
            badge={highlights.length}
            defaultOpen={true}
          >
            <div className="space-y-2">
              {/* Show concerns first, then opportunities, then actions */}
              {[...concerns, ...opportunities, ...actions].map((highlight, i) => (
                <HighlightCard key={i} highlight={highlight} index={i} />
              ))}
            </div>
          </ArtifactSection>
        )}

        {/* Talking Points */}
        <TalkingPointsSection points={talkingPoints} />

        {/* Outlook */}
        {outlook && <OutlookSection outlook={outlook} />}

        {/* Next Steps */}
        <NextStepsSection steps={nextSteps} />

        {/* Shareable Link */}
        {shareableUrl && <ShareableLink url={shareableUrl} />}
      </div>

      {/* Footer */}
      <ArtifactFooter
        primaryAction={{
          id: 'export',
          label: 'Export Presentation',
          variant: 'primary',
          onClick: () => onExport?.(),
          icon: <Download size={16} />,
        }}
        secondaryActions={onShare ? [
          {
            id: 'share',
            label: 'Share',
            variant: 'secondary',
            onClick: onShare,
            icon: <Share2 size={16} />,
          },
        ] : undefined}
      />
    </div>
  );
};

export default ExecutivePresentationArtifact;
