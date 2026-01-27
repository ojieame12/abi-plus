// PipelineSteps — Horizontal 4-step pipeline indicator + PhaseList
// Shared by ResearchCommandCenter and DeepResearchProgressArtifact

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { CommandCenterStage, StagePhase } from '../../types/deepResearch';

// ============================================
// TYPES
// ============================================

export interface PipelineStepsProps {
  currentStage: CommandCenterStage;
  completedStages: CommandCenterStage[];
  phases: StagePhase[];
}

// ============================================
// CONSTANTS
// ============================================

const VISIBLE_STAGES: { key: CommandCenterStage; label: string }[] = [
  { key: 'plan', label: 'Plan' },
  { key: 'research', label: 'Research' },
  { key: 'synthesis', label: 'Synthesis' },
  { key: 'delivery', label: 'Delivery' },
];

// ============================================
// PIPELINE STEPS — horizontal indicator
// ============================================

export const PipelineSteps: React.FC<PipelineStepsProps> = ({
  currentStage,
  completedStages,
  phases,
}) => {
  const getStepStatus = (stageKey: CommandCenterStage): 'pending' | 'active' | 'complete' => {
    if (completedStages.includes(stageKey)) return 'complete';
    if (currentStage === stageKey) return 'active';
    return 'pending';
  };

  // Find active-stage detail from phases
  const activePhase = phases.find(p => p.status === 'active');
  const activeDetail = activePhase?.detail || activePhase?.label;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-0" data-testid="pipeline-steps">
        {VISIBLE_STAGES.map((stage, idx) => {
          const status = getStepStatus(stage.key);
          const isLast = idx === VISIBLE_STAGES.length - 1;

          return (
            <React.Fragment key={stage.key}>
              {/* Step circle + label */}
              <div className="flex flex-col items-center" data-testid={`pipeline-step-${stage.key}`}>
                {status === 'complete' ? (
                  <div
                    className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                    data-testid={`step-complete-${stage.key}`}
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                ) : status === 'active' ? (
                  <motion.div
                    className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center pipeline-step-active"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    data-testid={`step-active-${stage.key}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </motion.div>
                ) : (
                  <div
                    className="w-5 h-5 rounded-full border-2 border-slate-200 bg-white"
                    data-testid={`step-pending-${stage.key}`}
                  />
                )}
                <span
                  className={`text-[10px] mt-1 font-medium ${
                    status === 'complete'
                      ? 'text-emerald-600'
                      : status === 'active'
                        ? 'text-violet-600'
                        : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-1.5 h-[2px] mt-[-10px] relative">
                  <div className="absolute inset-0 bg-slate-100 rounded-full" />
                  {(status === 'complete' || status === 'active') && (
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-violet-400 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: status === 'complete' ? '100%' : '50%' }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Active phase detail below the steps */}
      {activeDetail && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-slate-400 text-center truncate"
        >
          {activeDetail}
        </motion.p>
      )}
    </div>
  );
};

// ============================================
// PHASE LIST — vertical list of sub-phases
// ============================================

export interface PhaseListProps {
  phases: StagePhase[];
}

export const PhaseList: React.FC<PhaseListProps> = ({ phases }) => {
  if (phases.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 px-5 py-3" data-testid="phase-list">
      {phases.map((phase, idx) => (
        <motion.div
          key={phase.id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.06 }}
          className="flex items-center gap-2.5"
        >
          {/* Status circle */}
          {phase.status === 'complete' ? (
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
          ) : phase.status === 'active' ? (
            <motion.div
              className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </motion.div>
          ) : phase.status === 'error' ? (
            <div className="w-4 h-4 rounded-full bg-red-400 flex-shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 bg-white flex-shrink-0" />
          )}

          {/* Label */}
          <span
            className={`text-[12px] ${
              phase.status === 'complete'
                ? 'text-slate-600'
                : phase.status === 'active'
                  ? 'text-slate-800 font-medium'
                  : phase.status === 'error'
                    ? 'text-red-600'
                    : 'text-slate-400'
            }`}
          >
            {phase.label}
          </span>

          {/* Detail text */}
          {phase.detail && (phase.status === 'active' || phase.status === 'complete') && (
            <span className="text-[10px] text-slate-400 truncate">
              — {phase.detail}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default PipelineSteps;
