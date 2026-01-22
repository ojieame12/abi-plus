// Insight Detail Artifact - Deep analysis view
// This is a REPORT, not a widget. Shows real analysis and explanation.
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, ExternalLink, FileText } from 'lucide-react';
import { InsightHeader } from '../ui/InsightHeader';

// ============================================
// TYPES
// ============================================

export interface InsightSource {
  name: string;
  type?: string;
  url?: string;
  date?: string;
  snippet?: string;
}

export interface InsightDetailData {
  // Header
  headline: string;
  summary?: string;
  type?: 'risk_alert' | 'market_update' | 'trend_change' | 'opportunity' | 'info';
  sentiment?: 'positive' | 'negative' | 'neutral';

  // The actual analysis content - this is the meat
  analysis?: string; // Full written analysis from AI

  // Key data points mentioned in the analysis
  keyMetrics?: Array<{
    label: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down' | 'stable';
  }>;

  // Timeline/context
  timeContext?: {
    period?: string; // e.g., "Q4 2023 - Q1 2024"
    lastUpdated?: string;
    nextReview?: string;
  };

  // Sources with actual citations
  citedSources?: InsightSource[];

  // Legacy support
  factors?: Array<{
    title: string;
    detail: string;
    impact?: 'positive' | 'negative' | 'neutral';
    weight?: number;
  }>;
  actions?: Array<{
    text?: string;
    label?: string;
  }>;
  sources?: string[];
  sourceCount?: number;
}

interface InsightDetailArtifactProps {
  data: unknown;
  isExpanded?: boolean;
}

// ============================================
// HELPER: Build analysis from legacy factors
// ============================================

const buildAnalysisFromFactors = (
  factors: InsightDetailData['factors'],
  headline: string,
  summary?: string
): string => {
  if (!factors || factors.length === 0) {
    return summary || 'Analysis details are being compiled. Check back for updated information.';
  }

  // Build a coherent narrative from the factors
  const parts: string[] = [];

  if (summary) {
    parts.push(summary);
    parts.push('');
  }

  parts.push('Several key factors are contributing to this development:');
  parts.push('');

  factors.forEach((factor, i) => {
    const impactWord = factor.impact === 'negative' ? 'concern' :
                       factor.impact === 'positive' ? 'positive development' : 'factor';
    parts.push(`**${factor.title}** — ${factor.detail} This represents a significant ${impactWord} for affected stakeholders.`);
    if (i < factors.length - 1) parts.push('');
  });

  return parts.join('\n');
};

// ============================================
// SUB-COMPONENTS
// ============================================

// Key metrics bar - horizontal display of important numbers
const KeyMetricsBar = ({ metrics }: { metrics: NonNullable<InsightDetailData['keyMetrics']> }) => {
  if (metrics.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="flex gap-4 mb-6 pb-5 border-b border-slate-100 overflow-x-auto"
    >
      {metrics.map((metric, i) => {
        const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : null;
        const trendColor = metric.trend === 'up' ? 'text-rose-500' : metric.trend === 'down' ? 'text-emerald-500' : 'text-slate-400';

        return (
          <div key={i} className="flex-shrink-0">
            <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">
              {metric.label}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-medium text-slate-900">{metric.value}</span>
              {metric.change && (
                <span className={`flex items-center text-xs font-medium ${trendColor}`}>
                  {TrendIcon && <TrendIcon className="w-3 h-3 mr-0.5" />}
                  {metric.change}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

// Main analysis content - rendered as formatted prose
const AnalysisContent = ({ content }: { content: string }) => {
  // Simple markdown-like rendering for bold text
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-medium text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const paragraphs = content.split('\n\n').filter(p => p.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-6"
    >
      <div className="space-y-4">
        {paragraphs.map((para, i) => {
          // Handle line breaks within paragraphs
          const lines = para.split('\n').filter(l => l.trim());

          return (
            <div key={i} className="text-[14px] text-slate-600 leading-relaxed">
              {lines.map((line, j) => (
                <p key={j} className={j > 0 ? 'mt-2' : ''}>
                  {renderContent(line)}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// Time context badge
const TimeContext = ({ context }: { context: NonNullable<InsightDetailData['timeContext']> }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="flex items-center gap-4 text-xs text-slate-400 mb-4"
    >
      {context.period && (
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{context.period}</span>
        </div>
      )}
      {context.lastUpdated && (
        <div>Updated {context.lastUpdated}</div>
      )}
    </motion.div>
  );
};

// Cited sources section
const SourcesCited = ({ sources }: { sources: InsightSource[] }) => {
  if (sources.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-5"
    >
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
        Sources
      </h3>
      <div className="space-y-2">
        {sources.map((source, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 bg-slate-50/60 rounded-lg border border-slate-100/60"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 truncate">{source.name}</span>
                {source.url && (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              {source.type && (
                <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">
                  {source.type}
                </div>
              )}
              {source.snippet && (
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{source.snippet}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const InsightDetailArtifact = ({ data, isExpanded = false }: InsightDetailArtifactProps) => {
  const insight = data as InsightDetailData;
  const sourceCount = insight.sourceCount || insight.sources?.length || insight.citedSources?.length || 1;

  // Build analysis content - prefer direct analysis, fall back to building from factors
  const analysisContent = insight.analysis || buildAnalysisFromFactors(
    insight.factors,
    insight.headline,
    insight.summary
  );

  // Build cited sources from various source formats
  const citedSources: InsightSource[] = insight.citedSources || [
    { name: 'Beroe Market Intelligence', type: 'Primary Research' },
    { name: 'Industry Price Index', type: 'Data Source' },
  ];

  return (
    <div className={`${isExpanded ? 'max-w-2xl mx-auto' : ''}`}>
      {/* Insight Header Banner - headline only, no description (avoid repetition) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <InsightHeader
          headline={insight.headline}
          variant="panel"
        />
      </motion.div>

      {/* Time Context */}
      {insight.timeContext && <TimeContext context={insight.timeContext} />}

      {/* Key Metrics */}
      {insight.keyMetrics && insight.keyMetrics.length > 0 && (
        <KeyMetricsBar metrics={insight.keyMetrics} />
      )}

      {/* Main Analysis - the actual content */}
      <AnalysisContent content={analysisContent} />

      {/* Sources */}
      <SourcesCited sources={citedSources} />

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between pt-4 border-t border-slate-100"
      >
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-4 h-4 rounded-full border-2 border-teal-500" />
          <span>{sourceCount} Beroe Data Sources</span>
        </div>

        <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <FileText className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </motion.div>
    </div>
  );
};

export default InsightDetailArtifact;
