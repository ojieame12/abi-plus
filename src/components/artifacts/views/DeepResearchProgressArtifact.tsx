import { motion } from 'framer-motion';
import {
  Brain,
  FileSearch,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Database,
  DollarSign,
  AlertTriangle,
  Zap,
  Globe,
  Layers,
} from 'lucide-react';
import type {
  DeepResearchPhase,
  ProcessingState,
  ProcessingStep,
  StudyType,
  CommandCenterProgress,
  AgentCategory,
  ResearchAgent,
} from '../../../types/deepResearch';
import { normalizeStage } from '../../../types/deepResearch';
import { PipelineSteps, PhaseList } from '../../chat/PipelineSteps';
import { computeProgress } from '../../../utils/deepResearchProgress';

// ============================================
// TYPES
// ============================================

interface DeepResearchProgressArtifactProps {
  jobId: string;
  query: string;
  studyType: StudyType;
  phase: DeepResearchPhase;
  processing?: ProcessingState;
  commandCenterProgress?: CommandCenterProgress;
  onCancel?: () => void;
}

// ============================================
// AGENT CATEGORY CONFIG
// ============================================

const AGENT_CATEGORY_CONFIG: Record<AgentCategory, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  activeColor: string;
}> = {
  market_dynamics:          { icon: TrendingUp,    color: 'text-blue-600',    bgColor: 'bg-blue-500',    activeColor: 'bg-blue-50 border-blue-200' },
  supplier_landscape:       { icon: Database,      color: 'text-purple-600',  bgColor: 'bg-purple-500',  activeColor: 'bg-purple-50 border-purple-200' },
  pricing_trends:           { icon: DollarSign,    color: 'text-emerald-600', bgColor: 'bg-emerald-500', activeColor: 'bg-emerald-50 border-emerald-200' },
  risk_factors:             { icon: AlertTriangle, color: 'text-red-600',     bgColor: 'bg-red-500',     activeColor: 'bg-red-50 border-red-200' },
  regulatory:               { icon: FileText,      color: 'text-amber-600',   bgColor: 'bg-amber-500',   activeColor: 'bg-amber-50 border-amber-200' },
  competitive_intelligence: { icon: Search,        color: 'text-indigo-600',  bgColor: 'bg-indigo-500',  activeColor: 'bg-indigo-50 border-indigo-200' },
  technology_trends:        { icon: Zap,           color: 'text-cyan-600',    bgColor: 'bg-cyan-500',    activeColor: 'bg-cyan-50 border-cyan-200' },
  general:                  { icon: Globe,         color: 'text-orange-600',  bgColor: 'bg-orange-500',  activeColor: 'bg-orange-50 border-orange-200' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
};

const getStudyTypeLabel = (type: StudyType): string => {
  const labels: Record<StudyType, string> = {
    sourcing_study: 'Sourcing Study',
    cost_model: 'Cost Model Analysis',
    market_analysis: 'Market Analysis',
    supplier_assessment: 'Supplier Assessment',
    risk_assessment: 'Risk Assessment',
    custom: 'Custom Research',
  };
  return labels[type] || 'Research';
};

// ============================================
// AGENT ITEM COMPONENT
// ============================================

const AgentItem = ({ agent, index }: { agent: ResearchAgent; index: number }) => {
  const catConfig = AGENT_CATEGORY_CONFIG[agent.category] || AGENT_CATEGORY_CONFIG.general;
  const Icon = catConfig.icon;
  const isActive = agent.status === 'researching';
  const isComplete = agent.status === 'complete';
  const isError = agent.status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex items-center gap-3 p-4 rounded-xl transition-all border ${
        isActive
          ? catConfig.activeColor
          : isComplete
            ? 'bg-emerald-50/50 border-emerald-100'
            : isError
              ? 'bg-red-50/50 border-red-100'
              : 'bg-slate-50/50 border-transparent'
      }`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isComplete
            ? 'bg-emerald-500'
            : isError
              ? 'bg-red-400'
              : isActive
                ? catConfig.bgColor
                : 'bg-slate-200'
        }`}
      >
        {isComplete ? (
          <CheckCircle2 className="w-5 h-5 text-white" />
        ) : isError ? (
          <AlertCircle className="w-5 h-5 text-white" />
        ) : isActive ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Icon className="w-5 h-5 text-white" />
          </motion.div>
        ) : (
          <Icon className={`w-5 h-5 text-slate-400`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            isComplete
              ? 'text-emerald-700'
              : isError
                ? 'text-red-700'
                : isActive
                  ? catConfig.color
                  : 'text-slate-500'
          }`}
        >
          {agent.name}
        </p>
        <p
          className={`text-xs mt-0.5 truncate ${
            isComplete
              ? 'text-emerald-600/70'
              : isActive
                ? 'text-slate-500'
                : 'text-slate-400'
          }`}
        >
          {agent.query}
        </p>
      </div>

      {/* Status indicator */}
      {isActive && (
        <motion.div
          className={`w-2 h-2 rounded-full ${catConfig.bgColor}`}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Sources found */}
      {isComplete && agent.uniqueSourcesFound > 0 && (
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {agent.uniqueSourcesFound} sources
        </span>
      )}

      {/* Error */}
      {isError && (
        <span className="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded-full">
          failed
        </span>
      )}

      {/* Duration */}
      {(isComplete || isError) && agent.completedAt && agent.startedAt && (
        <span className={`text-xs ${isError ? 'text-red-500' : 'text-emerald-600'}`}>
          {formatTime(agent.completedAt - agent.startedAt)}
        </span>
      )}
    </motion.div>
  );
};

// ============================================
// LEGACY STEP COMPONENT (for backward compatibility)
// ============================================

const renderStepIcon = (stepId: string, className: string) => {
  const iconProps = { className };
  switch (stepId) {
    case 'decompose':
    case 'synthesize':
      return <Brain {...iconProps} />;
    case 'beroe':
      return <FileSearch {...iconProps} />;
    case 'web':
      return <Search {...iconProps} />;
    case 'internal':
    case 'report':
    default:
      return <FileText {...iconProps} />;
  }
};

const LegacyStepItem = ({ step, index, isActive, isComplete }: { step: ProcessingStep; index: number; isActive: boolean; isComplete: boolean }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
      isActive ? 'bg-violet-50 border border-violet-200' : isComplete ? 'bg-emerald-50/50 border border-emerald-100' : 'bg-slate-50/50 border border-transparent'
    }`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isComplete ? 'bg-emerald-500' : isActive ? 'bg-violet-500' : 'bg-slate-200'}`}>
      {isComplete ? <CheckCircle2 className="w-5 h-5 text-white" /> : isActive ? (
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
          {renderStepIcon(step.id, "w-5 h-5 text-white")}
        </motion.div>
      ) : renderStepIcon(step.id, "w-5 h-5 text-slate-400")}
    </div>
    <div className="flex-1">
      <p className={`text-sm font-medium ${isComplete ? 'text-emerald-700' : isActive ? 'text-violet-700' : 'text-slate-500'}`}>{step.label}</p>
      {step.description && <p className={`text-xs mt-0.5 ${isComplete ? 'text-emerald-600/70' : isActive ? 'text-violet-600/70' : 'text-slate-400'}`}>{step.description}</p>}
    </div>
    {isActive && <motion.div className="w-2 h-2 rounded-full bg-violet-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />}
    {step.sourcesFound !== undefined && step.sourcesFound > 0 && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{step.sourcesFound} found</span>}
    {isComplete && step.completedAt && step.startedAt && <span className="text-xs text-emerald-600">{formatTime(step.completedAt - step.startedAt)}</span>}
  </motion.div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export const DeepResearchProgressArtifact = ({
  jobId,
  query,
  studyType,
  phase,
  processing,
  commandCenterProgress,
}: DeepResearchProgressArtifactProps) => {
  const isError = phase === 'error';
  const useNewUI = !!commandCenterProgress;

  // New agent-based progress
  if (useNewUI) {
    const cc = commandCenterProgress!;
    const effectiveStage = normalizeStage(cc.stage);
    const progressPercent = computeProgress(cc);
    const completedAgents = cc.agents.filter(a => a.status === 'complete').length;

    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-blue-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <motion.div
                  animate={{ rotate: isError ? 0 : 360 }}
                  transition={{ duration: 2, repeat: isError ? 0 : Infinity, ease: 'linear' }}
                >
                  {isError ? (
                    <AlertCircle className="w-6 h-6 text-white" />
                  ) : (
                    <Brain className="w-6 h-6 text-white" />
                  )}
                </motion.div>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">
                  {isError ? 'Research Error' : getStudyTypeLabel(studyType)}
                </h3>
                <p className="text-sm text-slate-500">Deep Research</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-4 h-4" />
                <span>{formatTime(cc.elapsedMs)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Layers className="w-4 h-4" />
                <span>{cc.totalSources} sources</span>
              </div>
              {cc.agents.length > 0 && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <FileText className="w-4 h-4" />
                  <span>{completedAgents}/{cc.agents.length} agents</span>
                </div>
              )}
            </div>
          </div>

          {/* PipelineSteps in header */}
          <div className="mt-3">
            <PipelineSteps
              currentStage={effectiveStage}
              completedStages={cc.completedStages ?? []}
              phases={cc.phases ?? []}
            />
          </div>
        </div>

        {/* Query */}
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-sm text-slate-600 line-clamp-2">
            <span className="text-slate-400">Researching: </span>
            {query}
          </p>
        </div>

        {/* Agent list */}
        <div className="flex-1 overflow-auto p-5">
          {/* Plan stage: phase list */}
          {effectiveStage === 'plan' && cc.agents.length === 0 && (
            <PhaseList phases={cc.phases ?? []} />
          )}

          {cc.agents.length > 0 && (
            <div className="space-y-3">
              {cc.agents.map((agent, index) => (
                <AgentItem key={agent.id} agent={agent} index={index} />
              ))}
            </div>
          )}

          {/* Synthesis section */}
          {effectiveStage === 'synthesis' && (
            <div className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-200"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Brain className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-700">Generating Report</p>
                  <p className="text-xs text-indigo-600/70">
                    {cc.synthesis?.currentSectionTitle || 'Synthesizing all findings...'}
                  </p>
                </div>
                {cc.synthesis && (
                  <span className="text-xs text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {cc.synthesis.sectionsComplete}/{cc.synthesis.totalSections}
                  </span>
                )}
              </motion.div>
            </div>
          )}

          {/* Delivery stage: phase list */}
          {effectiveStage === 'delivery' && (
            <div className="mt-4">
              <PhaseList phases={cc.phases ?? []} />
            </div>
          )}

          {/* Insights from research */}
          {cc.insightStream.length > 0 && (
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Research Findings
              </h4>
              <ul className="space-y-2">
                {cc.insightStream.slice(-8).map((insight, index) => (
                  <motion.li
                    key={insight.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                    <span className="line-clamp-2">{insight.text}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {cc.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {cc.tags.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-5 py-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                isError
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-violet-500 to-blue-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Job ID: {jobId.slice(0, 12)}...
          </p>
        </div>
      </div>
    );
  }

  // Legacy processing steps UI (fallback)
  if (!processing) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <p className="text-sm text-slate-400">Initializing research...</p>
      </div>
    );
  }

  const { steps, currentStepIndex, elapsedTime, sourcesCollected, intermediateFindings } = processing;
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-blue-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <motion.div
                animate={{ rotate: isError ? 0 : 360 }}
                transition={{ duration: 2, repeat: isError ? 0 : Infinity, ease: 'linear' }}
              >
                {isError ? (
                  <AlertCircle className="w-6 h-6 text-white" />
                ) : (
                  <Brain className="w-6 h-6 text-white" />
                )}
              </motion.div>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">
                {isError ? 'Research Error' : 'Deep Research in Progress'}
              </h3>
              <p className="text-sm text-slate-500">{getStudyTypeLabel(studyType)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-4 h-4" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <FileText className="w-4 h-4" />
              <span>{sourcesCollected} sources</span>
            </div>
          </div>
        </div>
      </div>

      {/* Query */}
      <div className="px-5 py-3 border-b border-slate-100">
        <p className="text-sm text-slate-600 line-clamp-2">
          <span className="text-slate-400">Researching: </span>
          {query}
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-auto p-5">
        <div className="space-y-3">
          {steps.map((step, index) => (
            <LegacyStepItem
              key={step.id}
              step={step}
              index={index}
              isActive={index === currentStepIndex && !isError}
              isComplete={step.status === 'complete'}
            />
          ))}
        </div>

        {intermediateFindings && intermediateFindings.length > 0 && (
          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Preliminary Findings</h4>
            <ul className="space-y-2">
              {intermediateFindings.map((finding, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                  {finding}
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-5 py-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>Progress</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${isError ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-blue-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Job ID: {jobId.slice(0, 12)}...
        </p>
      </div>
    </div>
  );
};

export default DeepResearchProgressArtifact;
