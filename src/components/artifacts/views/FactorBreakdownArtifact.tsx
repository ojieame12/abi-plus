// Factor Breakdown Artifact
// Full factor analysis with history and drill-down

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Lock,
  ExternalLink,
  Download,
  Info,
  Clock,
} from 'lucide-react';
import { ArtifactSection, ArtifactFooter } from '../primitives';
import type { RiskLevel } from '../../../types/supplier';

// ============================================
// TYPES
// ============================================

export interface FactorData {
  id: string;
  name: string;
  score: number | null;
  previousScore?: number | null;
  weight: number;
  tier: 'tier1' | 'tier2' | 'tier3';
  trend?: 'up' | 'down' | 'stable';
  description?: string;
}

export interface HistoryPoint {
  date: string;
  score: number;
}

export interface ContributingEvent {
  id: string;
  date: string;
  title: string;
  impact: 'positive' | 'negative' | 'neutral';
  factor?: string;
}

export interface FactorBreakdownArtifactProps {
  supplierName: string;
  supplierId?: string;
  overallScore: number;
  previousScore?: number;
  level: RiskLevel;
  trend?: 'improving' | 'stable' | 'worsening';
  lastUpdated?: string;
  factors: FactorData[];
  scoreHistory?: HistoryPoint[];
  contributingEvents?: ContributingEvent[];
  onViewDashboard?: () => void;
  onExport?: () => void;
  onClose?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; bar: string; border: string }> = {
  high: { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-500', border: 'border-red-200' },
  'medium-high': { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500', border: 'border-orange-200' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500', border: 'border-amber-200' },
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', border: 'border-emerald-200' },
  unrated: { bg: 'bg-slate-50', text: 'text-slate-500', bar: 'bg-slate-400', border: 'border-slate-200' },
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
  high: 'High Risk',
  'medium-high': 'Medium-High',
  medium: 'Medium',
  low: 'Low Risk',
  unrated: 'Unrated',
};

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  tier1: { label: 'Public', color: 'bg-emerald-50 text-emerald-700' },
  tier2: { label: 'Conditional', color: 'bg-violet-50 text-violet-700' },
  tier3: { label: 'Restricted', color: 'bg-slate-100 text-slate-500' },
};

// ============================================
// HELPER COMPONENTS
// ============================================

const TrendIcon = ({ trend, size = 14 }: { trend?: 'up' | 'down' | 'stable'; size?: number }) => {
  if (trend === 'up') return <TrendingUp size={size} className="text-red-500" />;
  if (trend === 'down') return <TrendingDown size={size} className="text-emerald-500" />;
  return <Minus size={size} className="text-slate-400" />;
};

const ScoreChange = ({ current, previous }: { current: number; previous?: number }) => {
  if (!previous) return null;
  const change = current - previous;
  if (change === 0) return null;

  const isWorse = change > 0;
  return (
    <span className={`text-xs font-medium ${isWorse ? 'text-red-600' : 'text-emerald-600'}`}>
      {isWorse ? '+' : ''}{change}
    </span>
  );
};

const MiniSparkline = ({ data, color = '#8b5cf6' }: { data: number[]; color?: string }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 60;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const FactorRow = ({ factor, index }: { factor: FactorData; index: number }) => {
  const isRestricted = factor.tier === 'tier3';
  const tierStyle = TIER_LABELS[factor.tier];
  const barWidth = factor.score !== null ? Math.min(100, Math.max(0, factor.score)) : 0;

  const getBarColor = (score: number | null) => {
    if (score === null) return 'bg-slate-200';
    if (score >= 75) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.04 }}
      className="p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{factor.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${tierStyle.color}`}>
            {tierStyle.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isRestricted ? (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Lock size={12} />
              <span className="text-xs">View in Dashboard</span>
            </div>
          ) : factor.score !== null ? (
            <>
              <TrendIcon trend={factor.trend} size={12} />
              <span className="text-sm font-medium text-slate-900">{factor.score}</span>
              <ScoreChange current={factor.score} previous={factor.previousScore ?? undefined} />
            </>
          ) : (
            <span className="text-xs text-slate-400">N/A</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        {isRestricted ? (
          <div className="h-full w-full bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.04)_4px,rgba(0,0,0,0.04)_8px)]" />
        ) : (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.04 }}
            className={`h-full ${getBarColor(factor.score)} rounded-full`}
          />
        )}
      </div>

      {factor.description && !isRestricted && (
        <p className="mt-2 text-xs text-slate-500">{factor.description}</p>
      )}

      {/* Weight indicator */}
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
        <span>Weight: {(factor.weight * 100).toFixed(0)}%</span>
      </div>
    </motion.div>
  );
};

const EventItem = ({ event, index }: { event: ContributingEvent; index: number }) => {
  const impactColors = {
    positive: 'bg-emerald-500',
    negative: 'bg-red-500',
    neutral: 'bg-slate-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100"
    >
      <div className={`w-2 h-2 mt-1.5 rounded-full ${impactColors[event.impact]}`} />
      <div className="flex-1">
        <p className="text-sm text-slate-700">{event.title}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
          <Clock size={10} />
          <span>{new Date(event.date).toLocaleDateString()}</span>
          {event.factor && (
            <>
              <span>•</span>
              <span>{event.factor}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const FactorBreakdownArtifact = ({
  supplierName,
  overallScore,
  previousScore,
  level,
  trend = 'stable',
  lastUpdated,
  factors = [],
  scoreHistory,
  contributingEvents,
  onViewDashboard,
  onExport,
}: FactorBreakdownArtifactProps) => {
  const colors = RISK_COLORS[level];

  // Format lastUpdated safely
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString()
    : 'Recently';
  const [activeTab, setActiveTab] = useState<'all' | 'tier1' | 'tier2' | 'tier3'>('all');

  // Group factors by tier
  const tier1Factors = factors.filter(f => f.tier === 'tier1');
  const tier2Factors = factors.filter(f => f.tier === 'tier2');
  const tier3Factors = factors.filter(f => f.tier === 'tier3');

  // Filter factors based on active tab
  const displayedFactors = activeTab === 'all'
    ? factors
    : factors.filter(f => f.tier === activeTab);

  // Sort: tier1 first, then tier2, then tier3
  const sortedFactors = [...displayedFactors].sort((a, b) => {
    const tierOrder = { tier1: 0, tier2: 1, tier3: 2 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Supplier Context Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl ${colors.bg} border ${colors.border}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">{supplierName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Last updated: {formattedDate}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-light ${colors.text}`}>{overallScore}</span>
                <ScoreChange current={overallScore} previous={previousScore} />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-xs font-medium ${colors.text}`}>{LEVEL_LABELS[level]}</span>
                <TrendIcon
                  trend={trend === 'worsening' ? 'up' : trend === 'improving' ? 'down' : 'stable'}
                  size={12}
                />
              </div>
            </div>
          </div>

          {/* Mini trend chart */}
          {scoreHistory && scoreHistory.length > 1 && (
            <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center justify-between">
              <span className="text-xs text-slate-500">90-day trend</span>
              <MiniSparkline
                data={scoreHistory.map(h => h.score)}
                color={level === 'high' || level === 'medium-high' ? '#ef4444' : '#22c55e'}
              />
            </div>
          )}
        </motion.div>

        {/* Factor Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          {[
            { id: 'all', label: 'All Factors', count: factors.length },
            { id: 'tier1', label: 'Public', count: tier1Factors.length },
            { id: 'tier2', label: 'Conditional', count: tier2Factors.length },
            { id: 'tier3', label: 'Restricted', count: tier3Factors.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Score Breakdown Section */}
        <ArtifactSection
          title="Score Breakdown"
          badge={sortedFactors.length}
          collapsible={false}
        >
          <div className="space-y-2">
            {sortedFactors.map((factor, index) => (
              <FactorRow key={factor.id} factor={factor} index={index} />
            ))}
          </div>
        </ArtifactSection>

        {/* Tier 3 Notice */}
        {tier3Factors.length > 0 && activeTab !== 'tier3' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100"
          >
            <Info size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-slate-600">
                {tier3Factors.length} factor{tier3Factors.length > 1 ? 's are' : ' is'} restricted (Financial, Cybersecurity, etc.)
              </p>
              <button
                onClick={onViewDashboard}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium mt-1 inline-flex items-center gap-1"
              >
                View full details in dashboard
                <ExternalLink size={10} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Contributing Events */}
        {contributingEvents && contributingEvents.length > 0 && (
          <ArtifactSection
            title="Contributing Events"
            badge={contributingEvents.length}
            defaultOpen={false}
          >
            <div className="space-y-2">
              {contributingEvents.slice(0, 5).map((event, index) => (
                <EventItem key={event.id} event={event} index={index} />
              ))}
            </div>
          </ArtifactSection>
        )}
      </div>

      {/* Footer */}
      <ArtifactFooter
        primaryAction={{
          id: 'dashboard',
          label: 'View in Dashboard',
          variant: 'primary',
          onClick: () => onViewDashboard?.(),
          icon: <ExternalLink size={16} />,
        }}
        secondaryAction={{
          id: 'export',
          label: 'Export Report',
          variant: 'secondary',
          onClick: () => onExport?.(),
          icon: <Download size={16} />,
        }}
      />
    </div>
  );
};

export default FactorBreakdownArtifact;
