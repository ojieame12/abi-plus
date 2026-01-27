// Research Command Center
// Visual timeline with agent dots, fade cycling, and real-time insights
// Stages: plan → research (agent timeline) → synthesis → delivery → complete

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Database,
  Globe,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  FileText,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Zap,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import type {
  ResearchCommandCenterProps,
  ResearchInsight,
  AgentCategory,
  ResearchAgent,
} from '../../types/deepResearch';
import { normalizeStage } from '../../types/deepResearch';
import { PipelineSteps, PhaseList } from './PipelineSteps';
import { computeProgress } from '../../utils/deepResearchProgress';

// ============================================
// AGENT CATEGORY CONFIG
// ============================================

const AGENT_CATEGORY_CONFIG: Record<AgentCategory, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  ringColor: string;
  glowColor: string;
}> = {
  market_dynamics:          { icon: TrendingUp,    color: 'text-blue-500',    bgColor: 'bg-blue-500',    ringColor: 'ring-blue-200',    glowColor: 'shadow-blue-400/30' },
  supplier_landscape:       { icon: Database,      color: 'text-purple-500',  bgColor: 'bg-purple-500',  ringColor: 'ring-purple-200',  glowColor: 'shadow-purple-400/30' },
  pricing_trends:           { icon: DollarSign,    color: 'text-emerald-500', bgColor: 'bg-emerald-500', ringColor: 'ring-emerald-200', glowColor: 'shadow-emerald-400/30' },
  risk_factors:             { icon: AlertTriangle, color: 'text-rose-500',    bgColor: 'bg-rose-500',    ringColor: 'ring-rose-200',    glowColor: 'shadow-rose-400/30' },
  regulatory:               { icon: FileText,      color: 'text-amber-500',   bgColor: 'bg-amber-500',   ringColor: 'ring-amber-200',   glowColor: 'shadow-amber-400/30' },
  competitive_intelligence: { icon: Search,        color: 'text-indigo-500',  bgColor: 'bg-indigo-500',  ringColor: 'ring-indigo-200',  glowColor: 'shadow-indigo-400/30' },
  technology_trends:        { icon: Zap,           color: 'text-cyan-500',    bgColor: 'bg-cyan-500',    ringColor: 'ring-cyan-200',    glowColor: 'shadow-cyan-400/30' },
  general:                  { icon: Globe,         color: 'text-orange-500',  bgColor: 'bg-orange-500',  ringColor: 'ring-orange-200',  glowColor: 'shadow-orange-400/30' },
};

// ============================================
// ELAPSED TIME HOOK
// ============================================

const useElapsed = (startedAt: number, active: boolean) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, active]);
  return elapsed;
};

const formatElapsed = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

// ============================================
// TIMELINE DOT — single agent node
// ============================================

interface TimelineDotProps {
  agent: ResearchAgent;
  index: number;
  isActive: boolean;
  isLast: boolean;
}

const TimelineDot: React.FC<TimelineDotProps> = ({ agent, index, isActive, isLast }) => {
  const config = AGENT_CATEGORY_CONFIG[agent.category] || AGENT_CATEGORY_CONFIG.general;
  const Icon = config.icon;

  const isDone = agent.status === 'complete';
  const isError = agent.status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="flex items-start gap-3 relative"
    >
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-[13px] top-[28px] w-[2px] h-[calc(100%+4px)]">
          <motion.div
            className={isDone ? 'bg-slate-200' : 'bg-slate-100'}
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ delay: index * 0.08 + 0.2, duration: 0.4 }}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* Dot */}
      <div className="relative z-10 flex-shrink-0">
        {isDone ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center"
          >
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </motion.div>
        ) : isError ? (
          <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-red-500" strokeWidth={3} />
          </div>
        ) : isActive ? (
          <div className="relative">
            {/* Pulsing ring */}
            <motion.div
              className={`absolute inset-[-3px] rounded-full ${config.ringColor} ring-2 ring-current opacity-40`}
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className={`w-7 h-7 rounded-full ${config.bgColor} flex items-center justify-center shadow-lg ${config.glowColor}`}
            >
              <Icon className="w-3.5 h-3.5 text-white" />
            </motion.div>
          </div>
        ) : (
          /* Queued */
          <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
          </div>
        )}
      </div>

      {/* Label & detail */}
      <div className="flex-1 min-w-0 pb-5">
        <div className="flex items-center gap-2">
          <span className={`text-[13px] font-medium ${
            isDone ? 'text-slate-600' :
            isActive ? 'text-slate-900' :
            isError ? 'text-red-600' :
            'text-slate-400'
          }`}>
            {agent.name}
          </span>
          {isDone && agent.sourcesFound > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full"
            >
              {agent.uniqueSourcesFound} sources
            </motion.span>
          )}
          {isError && (
            <span className="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
              failed
            </span>
          )}
        </div>
        {isActive && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-slate-400 mt-0.5 truncate"
          >
            {agent.query}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// INSIGHT STREAM — single rotating insight
// ============================================

interface InsightStreamProps {
  insights: ResearchInsight[];
}

const InsightStream: React.FC<InsightStreamProps> = ({ insights }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (insights.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % insights.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [insights.length]);

  if (insights.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50/80">
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-slate-300"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-[11px] text-slate-400 italic">Scanning sources...</span>
      </div>
    );
  }

  return (
    <div className="relative h-8 overflow-hidden rounded-xl bg-slate-50/80 px-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 flex items-center gap-2 px-3"
        >
          <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />
          <p className="text-[11px] text-slate-600 truncate leading-tight">
            {insights[currentIndex]?.text}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const ResearchCommandCenter: React.FC<ResearchCommandCenterProps> = ({
  query,
  status,
  progress,
  report,
  error,
  onCancel,
  onViewReport,
  onRetry,
}) => {
  const { agents, synthesis } = progress;
  const effectiveStage = normalizeStage(progress.stage);
  const elapsed = useElapsed(progress.startedAt, status === 'researching');
  const progressPct = computeProgress(progress);
  const completedAgents = agents.filter(a => a.status === 'complete').length;
  const containerRef = useRef<HTMLDivElement>(null);

  // ── COMPLETE STATE ──
  if (status === 'complete') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 p-5 overflow-hidden"
        style={{ boxShadow: '0 4px 24px -6px rgba(16, 185, 129, 0.10)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
              </motion.div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800">Deep Research Complete</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {progress.totalSources} sources collected &middot; {agents.length} agents &middot; {formatElapsed(Math.floor((Date.now() - progress.startedAt) / 1000))}
              </p>
            </div>
          </div>
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={onViewReport}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-normal rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30"
          >
            View Full Report
            <ExternalLink className="w-4 h-4" />
          </motion.button>
        </div>

        {report?.summary && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-sm text-slate-600 leading-relaxed line-clamp-2 pl-[52px]"
          >
            {report.summary}
          </motion.p>
        )}
      </motion.div>
    );
  }

  // ── ERROR STATE ──
  if (status === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-5"
        style={{ boxShadow: '0 4px 24px -6px rgba(239, 68, 68, 0.08)' }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-700">Research Failed</h3>
            <p className="text-xs text-slate-500 mt-1">{error || 'An unexpected error occurred'}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-normal"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── CANCELLED STATE ──
  if (status === 'cancelled') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-100 bg-white p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <X className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-slate-700">Research Cancelled</h3>
            <p className="text-xs text-slate-500 mt-1">
              Partial findings from {progress.totalSources} sources
            </p>
            {onRetry && (
              <button onClick={onRetry} className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-normal">
                Start New Research
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── RESEARCHING STATE — Timeline card ──
  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-100/80 bg-white overflow-hidden"
      style={{ boxShadow: '0 4px 32px -8px rgba(148, 163, 184, 0.12)' }}
    >
      {/* ─── Header with PipelineSteps ─── */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <PipelineSteps
          currentStage={effectiveStage}
          completedStages={progress.completedStages ?? []}
          phases={progress.phases ?? []}
        />
        <div className="flex items-center gap-3">
          {/* Elapsed time */}
          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
            {formatElapsed(elapsed)}
          </span>
          <button
            onClick={onCancel}
            className="p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Progress bar — thin, gradient ─── */}
      <div className="px-5">
        <div className="h-[3px] bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* ─── Plan stage: phase list (replaces skeleton bars) ─── */}
      {effectiveStage === 'plan' && agents.length === 0 && (
        <PhaseList phases={progress.phases ?? []} />
      )}

      {/* ─── Agent Timeline ─── */}
      {agents.length > 0 && (effectiveStage === 'research' || effectiveStage === 'synthesis' || effectiveStage === 'delivery' || effectiveStage === 'complete') && (
        <div className="px-5 pt-4 pb-1">
          {agents.map((agent, index) => (
            <TimelineDot
              key={agent.id}
              agent={agent}
              index={index}
              isActive={agent.status === 'researching'}
              isLast={index === agents.length - 1}
            />
          ))}
        </div>
      )}

      {/* ─── Synthesis section indicator ─── */}
      {effectiveStage === 'synthesis' && synthesis && (
        <div className="px-5 pb-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100/50">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-indigo-700 truncate">
                {synthesis.currentSectionTitle || 'Synthesizing...'}
              </p>
              <div className="mt-1.5 h-1 bg-indigo-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-400 rounded-full"
                  animate={{ width: `${(synthesis.sectionsComplete / Math.max(synthesis.totalSections, 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            <span className="text-[10px] text-indigo-400 font-mono tabular-nums flex-shrink-0">
              {synthesis.sectionsComplete}/{synthesis.totalSections}
            </span>
          </div>
        </div>
      )}

      {/* ─── Delivery stage: phase list ─── */}
      {effectiveStage === 'delivery' && (
        <PhaseList phases={progress.phases ?? []} />
      )}

      {/* ─── Insight stream ─── */}
      <div className="px-5 pb-3">
        <InsightStream insights={progress.insightStream} />
      </div>

      {/* ─── Footer: metrics + tags ─── */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {progress.totalSources > 0 && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {progress.totalSources} collected
            </span>
          )}
          {agents.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-100 text-[8px] font-medium text-slate-500">
                {completedAgents}
              </span>
              /{agents.length} agents
            </span>
          )}
        </div>

        {/* Tags (compact) */}
        {progress.tags.length > 0 && (
          <div className="flex items-center gap-1">
            {progress.tags.slice(0, 3).map((tag, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="px-2 py-0.5 text-[10px] rounded-full bg-slate-50 text-slate-500 border border-slate-100"
              >
                {tag}
              </motion.span>
            ))}
            {progress.tags.length > 3 && (
              <span className="text-[10px] text-slate-300">+{progress.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ResearchCommandCenter;
