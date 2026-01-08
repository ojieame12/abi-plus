// Insight Detail Artifact - Clean, focused insight view
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Info,
  Eye,
  Users,
  ArrowRight,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface InsightFactor {
  title: string;
  detail: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface InsightAction {
  label: string;
  action: string;
  primary?: boolean;
}

export interface InsightEntity {
  name: string;
  type: 'supplier' | 'category' | 'market' | 'portfolio';
  category?: string;
  location?: string;
}

export interface InsightMetric {
  label: string;
  previousValue: number;
  currentValue: number;
  level?: 'high' | 'medium-high' | 'medium' | 'low' | 'unrated';
}

export interface InsightDetailData {
  headline: string;
  summary?: string;
  type?: 'risk_alert' | 'market_update' | 'trend_change' | 'opportunity' | 'info';
  entity?: InsightEntity;
  metric?: InsightMetric;
  factors?: InsightFactor[];
  actions?: InsightAction[];
  sources?: string[];
}

interface InsightDetailArtifactProps {
  data: unknown;
  isExpanded?: boolean;
}

// ============================================
// HELPER COMPONENTS
// ============================================

// Type badge - minimal
const TypeBadge = ({ type }: { type: InsightDetailData['type'] }) => {
  const configs: Record<string, { label: string; icon: typeof AlertTriangle; color: string }> = {
    risk_alert: { label: 'Risk Alert', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    market_update: { label: 'Market Update', icon: BarChart3, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    trend_change: { label: 'Trend Change', icon: TrendingUp, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    opportunity: { label: 'Opportunity', icon: Lightbulb, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    info: { label: 'Insight', icon: Info, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  };

  // Default to 'info' if type is unknown or undefined
  const config = configs[type || 'info'] || configs.info;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
      {config.label}
    </span>
  );
};

// Risk level dots
const RiskDots = ({ level }: { level?: string }) => {
  const filled = level === 'high' ? 5 : level === 'medium-high' ? 4 : level === 'medium' ? 3 : level === 'low' ? 2 : 1;
  const color = level === 'high' ? 'bg-rose-500' : level === 'medium-high' ? 'bg-orange-500' : level === 'medium' ? 'bg-amber-500' : level === 'low' ? 'bg-emerald-500' : 'bg-slate-300';
  const label = level === 'high' ? 'High Risk' : level === 'medium-high' ? 'Medium-High' : level === 'medium' ? 'Medium' : level === 'low' ? 'Low Risk' : 'Unrated';

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= filled ? color : 'bg-slate-200'}`} />
        ))}
      </div>
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
};

// Impact icon
const ImpactIcon = ({ impact }: { impact: 'positive' | 'negative' | 'neutral' }) => {
  if (impact === 'negative') return <TrendingDown className="w-4 h-4 text-rose-500" strokeWidth={1.5} />;
  if (impact === 'positive') return <TrendingUp className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />;
  return <Minus className="w-4 h-4 text-slate-400" strokeWidth={1.5} />;
};

// ============================================
// MAIN COMPONENT
// ============================================

export const InsightDetailArtifact = ({ data, isExpanded = false }: InsightDetailArtifactProps) => {
  const insight = data as InsightDetailData;

  // Calculate metric change
  const hasMetric = !!insight.metric;
  const metricChange = hasMetric ? insight.metric!.currentValue - insight.metric!.previousValue : 0;
  const metricChangePercent = hasMetric && insight.metric!.previousValue
    ? Math.round((metricChange / insight.metric!.previousValue) * 100)
    : 0;

  return (
    <div className={`${isExpanded ? 'max-w-xl mx-auto' : ''}`}>
      {/* Type Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <TypeBadge type={insight.type} />
      </motion.div>

      {/* Entity Name - Large & Prominent */}
      {insight.entity && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-normal text-slate-900 mb-1">
            {insight.entity.name}
          </h1>
          <p className="text-sm text-slate-400">
            {[insight.entity.category, insight.entity.location].filter(Boolean).join(' · ') || insight.entity.type}
          </p>
        </motion.div>
      )}

      {/* Hero: Score Change */}
      {hasMetric && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-6 rounded-2xl bg-slate-50/80 border border-slate-100"
        >
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-4xl font-light text-slate-400">{insight.metric!.previousValue}</span>
            <ArrowRight className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
            <span className="text-4xl font-light text-slate-900">{insight.metric!.currentValue}</span>
            {metricChange !== 0 && (
              <span className={`text-lg font-normal ${metricChange > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {metricChange > 0 ? '+' : ''}{metricChangePercent}%
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-3">Risk Score {metricChange > 0 ? 'Increased' : metricChange < 0 ? 'Decreased' : 'Unchanged'}</p>
          <RiskDots level={insight.metric!.level} />
        </motion.div>
      )}

      {/* Summary - Single sentence */}
      {insight.summary && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-[15px] text-slate-600 leading-relaxed mb-8"
        >
          {insight.summary}
        </motion.p>
      )}

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="border-t border-slate-100 my-6"
      />

      {/* Contributing Factors - Clean list */}
      {insight.factors && insight.factors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
            Contributing Factors
          </h3>
          <div className="space-y-4">
            {insight.factors.map((factor, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5">
                  <ImpactIcon impact={factor.impact} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{factor.title}</p>
                  <p className="text-sm text-slate-500">{factor.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      {insight.actions && insight.actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3 mb-8"
        >
          {insight.actions.slice(0, 2).map((action, i) => (
            <button
              key={i}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-normal transition-all
                ${action.primary
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              {action.primary ? <Eye className="w-4 h-4" strokeWidth={1.5} /> : <Users className="w-4 h-4" strokeWidth={1.5} />}
              {action.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Sources - Subtle footer */}
      {insight.sources && insight.sources.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="pt-4 border-t border-slate-100"
        >
          <p className="text-xs text-slate-400">
            Sources: {insight.sources.join(' · ')}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default InsightDetailArtifact;
