// Research Command Center
// Per-stage card: bare icon, phase timeline (grey dots → purple checks), edge-to-edge progress bar
// Stages: plan → research → synthesis → delivery → complete

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import type {
  ResearchCommandCenterProps,
} from '../../types/deepResearch';
import { normalizeStage } from '../../types/deepResearch';
import type { CommandCenterStage } from '../../types/deepResearch';
import { computeProgress } from '../../utils/deepResearchProgress';

// ============================================
// INLINE SVG ICONS — bare, no containers
// ============================================

/** Plan stage: magnifying glass */
const PlanIcon = () => (
  <svg width="22" height="22" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.2059 11.3143L9.71264 8.82002C10.4602 7.84587 10.8092 6.62384 10.6889 5.40182C10.5686 4.1798 9.9879 3.04931 9.06471 2.23967C8.14152 1.43002 6.94493 1.00185 5.71766 1.04202C4.49039 1.08218 3.32435 1.58768 2.45607 2.45595C1.5878 3.32423 1.08231 4.49027 1.04214 5.71754C1.00198 6.9448 1.43014 8.1414 2.23979 9.06459C3.04943 9.98778 4.17993 10.5684 5.40194 10.6888C6.62396 10.8091 7.84599 10.4601 8.82014 9.71252L11.3155 12.2084C11.3741 12.267 11.4436 12.3135 11.5202 12.3452C11.5968 12.3769 11.6788 12.3932 11.7617 12.3932C11.8446 12.3932 11.9267 12.3769 12.0032 12.3452C12.0798 12.3135 12.1494 12.267 12.208 12.2084C12.2666 12.1498 12.3131 12.0802 12.3448 12.0036C12.3765 11.9271 12.3928 11.845 12.3928 11.7621C12.3928 11.6792 12.3765 11.5972 12.3448 11.5206C12.3131 11.444 12.2666 11.3745 12.208 11.3159L12.2059 11.3143ZM2.31014 5.88002C2.31014 5.17394 2.51952 4.48372 2.9118 3.89664C3.30407 3.30955 3.86163 2.85198 4.51396 2.58177C5.1663 2.31157 5.8841 2.24087 6.57662 2.37862C7.26913 2.51637 7.90524 2.85638 8.40451 3.35565C8.90379 3.85492 9.2438 4.49104 9.38155 5.18355C9.5193 5.87606 9.4486 6.59387 9.17839 7.2462C8.90819 7.89853 8.45061 8.45609 7.86353 8.84837C7.27645 9.24064 6.58622 9.45002 5.88014 9.45002C4.93362 9.44905 4.02614 9.07261 3.35685 8.40332C2.68755 7.73402 2.31112 6.82655 2.31014 5.88002Z" fill="#5D6A89"/>
  </svg>
);

/** Research stage: open book */
const ResearchStageIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.0244 5.29102V15.6395" stroke="#5D6A89" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.2098 5.44277V8.4031L15.7177 8.07647C15.2554 7.76999 14.6546 7.76999 14.1923 8.07647L13.7002 8.4031V3.95599" stroke="#5D6A89" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.0693 12.8634L16.0361 12.0832" stroke="#5D6A89" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.80954 8.81343L5.84277 8.0332M7.80954 12.8608L5.84277 12.0806" stroke="#5D6A89" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.9248 9.83213V5.17833C2.9248 3.94363 4.00539 2.99703 5.23221 3.131C7.22262 3.34904 8.94245 4.16255 9.97927 4.76414C10.6281 5.1398 11.4215 5.1398 12.0703 4.76414C13.1071 4.16255 14.8269 3.34904 16.8174 3.131C18.0451 2.99703 19.1248 3.94363 19.1248 5.17833V14.4858C19.1248 15.5822 18.2613 16.4579 17.1677 16.5367C15.0293 16.6908 13.1676 17.5657 12.0703 18.2014C11.4215 18.5771 10.6281 18.5771 9.97927 18.2014C8.88202 17.5657 7.02034 16.6908 4.88194 16.5367C3.78822 16.4579 2.9248 15.5822 2.9248 14.4858V13.6888" stroke="#5D6A89" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/** Synthesis stage: intersecting circles */
const SynthesisIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.24414 1.15344C6.2303 0.901477 7.2664 0.919945 8.24316 1.20618C9.21999 1.49247 10.1017 2.03688 10.7959 2.78137C11.49 3.52584 11.9711 4.44324 12.1885 5.43762L12.209 5.53137L12.3037 5.55188C13.298 5.76929 14.2156 6.25037 14.96 6.94446C15.7044 7.63859 16.2479 8.52046 16.5342 9.49719C16.8205 10.474 16.8389 11.51 16.5869 12.4962C16.3349 13.4824 15.8223 14.3829 15.1025 15.1027C14.3828 15.8224 13.4823 16.3351 12.4961 16.587C11.5099 16.839 10.4739 16.8206 9.49707 16.5343C8.52034 16.248 7.63847 15.7045 6.94434 14.9601C6.25025 14.2157 5.76917 13.2981 5.55176 12.3038L5.53125 12.2091L5.4375 12.1886L5.06836 12.0948C4.21636 11.8477 3.43268 11.4034 2.78125 10.796C2.03676 10.1018 1.49235 9.22011 1.20605 8.24329C0.919823 7.26652 0.901355 6.23043 1.15332 5.24426C1.40532 4.25811 1.91895 3.35852 2.63867 2.63879C3.3584 1.91907 4.25799 1.40545 5.24414 1.15344ZM12.3008 7.14758C12.1828 8.47465 11.6022 9.7182 10.6602 10.6603C9.71808 11.6024 8.47452 12.1829 7.14746 12.3009L6.95605 12.3185L7.01855 12.5001C7.31267 13.3451 7.86289 14.0779 8.5918 14.5968C9.22946 15.0506 9.97683 15.3215 10.7529 15.3829L11.0879 15.3956C12.1057 15.3948 13.0903 15.0336 13.8672 14.3761C14.6441 13.7186 15.1629 12.8075 15.332 11.8038C15.5011 10.8002 15.3095 9.76946 14.791 8.89368C14.2725 8.01792 13.4612 7.35307 12.5 7.01868L12.3184 6.95618L12.3008 7.14758ZM7.49414 8.71594C7.08312 9.33475 6.83975 10.05 6.78906 10.7911L6.76172 11.1906L7.00977 10.9425C7.73022 10.8827 8.42402 10.6432 9.02637 10.2423L9.17969 10.1407L9.0498 10.0118L7.72461 8.6925L7.59473 8.5636L7.49414 8.71594ZM7.61426 2.45422C6.90285 2.29064 6.16158 2.31136 5.45996 2.51282C4.7583 2.71435 4.11877 3.09038 3.60254 3.60657C3.08629 4.12282 2.70936 4.76227 2.50781 5.46399C2.30636 6.16557 2.28665 6.90691 2.4502 7.61829C2.6138 8.32977 2.95559 8.98819 3.44336 9.53137C3.93118 10.0746 4.54936 10.4849 5.23926 10.7238L5.32812 10.755L5.39453 10.6886L5.39648 10.6857L5.43457 10.6476L5.43945 10.5929C5.55791 9.26684 6.13878 8.02463 7.08008 7.08313C8.02166 6.14155 9.26451 5.55997 10.5908 5.44153L10.7822 5.42493L10.7197 5.24329C10.4808 4.55339 10.0705 3.9352 9.52734 3.44739C8.98416 2.95962 8.32574 2.61783 7.61426 2.45422ZM10.7891 6.79114C10.0477 6.84243 9.33251 7.08638 8.71387 7.49817L8.56152 7.59973L8.69043 7.72864L10.0117 9.05188L10.1416 9.18176L10.2422 9.02844C10.6426 8.42561 10.8814 7.7315 10.9404 7.01086L11.1895 6.76379L10.7891 6.79114Z" fill="#5D6A89" stroke="white" strokeWidth="0.3"/>
  </svg>
);

/** Delivery stage: sparkle stars */
const DeliveryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.89596 5.43578C7.74782 4.99028 7.33064 4.69073 6.86226 4.69073C6.39388 4.69073 5.9767 4.99028 5.82856 5.43578L5.08461 7.66981C4.97568 7.99549 4.7208 8.25037 4.39511 8.3593L2.16106 9.10325C1.71556 9.25138 1.41602 9.66856 1.41602 10.1369C1.41602 10.6053 1.71556 11.0225 2.16106 11.1706L4.39511 11.9157C4.7208 12.0235 4.97568 12.2784 5.08461 12.6041L5.82856 14.8381C5.9767 15.2836 6.39388 15.5831 6.86226 15.5831C7.33064 15.5831 7.74782 15.2836 7.89596 14.8381L8.63992 12.6041C8.74884 12.2784 9.00373 12.0235 9.32941 11.9157L11.5635 11.1706C12.009 11.0225 12.3085 10.6053 12.3085 10.1369C12.3085 9.66856 12.009 9.25138 11.5635 9.10325L9.32941 8.3593C9.00373 8.25037 8.74884 7.99549 8.63992 7.66981L7.89596 5.43578Z" fill="#5D6A89"/>
    <path d="M13.433 1.9892C13.3661 1.65591 13.0741 1.41663 12.7344 1.41663C12.3947 1.41663 12.1027 1.65591 12.0357 1.9892L11.8663 2.83808C11.81 3.12009 11.5892 3.34086 11.3072 3.39712L10.4583 3.56661C10.125 3.63356 9.88574 3.92554 9.88574 4.26523C9.88574 4.60493 10.125 4.89691 10.4583 4.96386L11.3072 5.13335C11.5892 5.18961 11.81 5.41037 11.8663 5.69239L12.0357 6.54127C12.1027 6.87456 12.3947 7.11384 12.7344 7.11384C13.0741 7.11384 13.3661 6.87456 13.433 6.54127L13.6025 5.69239C13.6588 5.41037 13.8795 5.18961 14.1615 5.13335L15.0104 4.96386C15.3437 4.89691 15.583 4.60493 15.583 4.26523C15.583 3.92554 15.3437 3.63356 15.0104 3.56661L14.1615 3.39712C13.8795 3.34086 13.6588 3.12009 13.6025 2.83808L13.433 1.9892Z" fill="#394765"/>
  </svg>
);

/** Phase complete indicator: purple circle with white checkmark */
const PhaseCheck = () => (
  <svg width="14" height="14" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.16797 0.280273C4.76296 0.280273 6.05565 1.57298 6.05566 3.16797C6.05566 4.76297 4.76297 6.05566 3.16797 6.05566C1.57298 6.05565 0.280273 4.76296 0.280273 3.16797C0.28029 1.573 1.573 0.28029 3.16797 0.280273ZM4.83398 1.89844C4.56999 1.63444 4.14192 1.63444 3.87793 1.89844L2.77148 3.00391L2.45801 2.69043C2.19401 2.42644 1.76595 2.42644 1.50195 2.69043C1.2382 2.95444 1.23804 3.38257 1.50195 3.64648L2.29395 4.43848C2.55788 4.70218 2.98606 4.70216 3.25 4.43848L4.83398 2.85449C5.09791 2.59057 5.09777 2.16245 4.83398 1.89844Z" fill="#682AF9" stroke="#682AF9" strokeWidth="0.56"/>
  </svg>
);

/** Active phase indicator: purple check circle with spinning arc */
const PhaseActive = () => (
  <div className="relative w-[14px] h-[14px] flex items-center justify-center">
    <PhaseCheck />
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      className="absolute inset-[-3px]"
      animate={{ rotate: 360 }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        cx="10"
        cy="10"
        r="8.5"
        fill="none"
        stroke="#682AF9"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="14 40"
      />
    </motion.svg>
  </div>
);

/** Sources icon: stacked layers */
const SourcesIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.33337L1.33337 4.66671L8 8.00004L14.6667 4.66671L8 1.33337Z" stroke="#8A94A8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.33337 11.3334L8 14.6667L14.6667 11.3334" stroke="#8A94A8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.33337 8.00004L8 11.3334L14.6667 8.00004" stroke="#8A94A8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================
// STAGE CONFIG
// ============================================

const STAGE_ICONS: Record<CommandCenterStage, React.FC> = {
  plan: PlanIcon,
  research: ResearchStageIcon,
  synthesis: SynthesisIcon,
  delivery: DeliveryIcon,
  complete: DeliveryIcon,
};

const STAGE_TITLES: Record<CommandCenterStage, string> = {
  plan: 'Query Decomposition',
  research: 'Conducting Research',
  synthesis: 'Synthesizing and Understanding Findings',
  delivery: 'Writing Report and Delivery',
  complete: 'Complete',
};

const STAGE_SUBTITLES: Record<CommandCenterStage, string> = {
  plan: 'Planning Breaking down research requirements...',
  research: 'Setting up parallel subagents and defining sources',
  synthesis: 'Session Writing',
  delivery: 'Session Writing',
  complete: '',
};

// ============================================
// ELAPSED TIME HELPERS
// ============================================

const formatElapsed = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

// ============================================
// DISPLAY PHASE HELPERS
// ============================================

type DisplayPhase = {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
};

const getDisplayPhases = (
  stage: CommandCenterStage,
  progress: ResearchCommandCenterProps['progress'],
): DisplayPhase[] => {
  // During research, show agents as phase items
  if (stage === 'research' && progress.agents.length > 0) {
    return progress.agents.map(a => ({
      id: a.id,
      label: a.name,
      status:
        a.status === 'complete' || a.status === 'error'
          ? ('complete' as const)
          : a.status === 'researching'
            ? ('active' as const)
            : ('pending' as const),
    }));
  }
  // For other stages, use the phases array
  return (progress.phases ?? []).map(p => ({
    id: p.id,
    label: p.label,
    status:
      p.status === 'complete'
        ? ('complete' as const)
        : p.status === 'active'
          ? ('active' as const)
          : ('pending' as const),
  }));
};

/** Cycles through live activity messages from agents, insights, and phase details */
const useActivityStream = (
  stage: CommandCenterStage,
  progress: ResearchCommandCenterProps['progress'],
): string => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const messagesRef = useRef<string[]>([]);
  const fallback = STAGE_SUBTITLES[stage] || '';

  // Rebuild live messages from all available progress data
  const messages: string[] = [];

  // Active phase details (e.g. "5 agents queued")
  for (const phase of progress.phases ?? []) {
    if (phase.status === 'active' && phase.detail) messages.push(phase.detail);
  }

  // Active agents
  for (const agent of progress.agents) {
    if (agent.status === 'researching') messages.push(`Researching: ${agent.name}`);
  }

  // Recent insights (newest first, cap at 5)
  const recent = progress.insightStream.slice(-5).reverse();
  for (const ins of recent) {
    const prefix = ins.sourceLabel ? `${ins.sourceLabel}: ` : '';
    messages.push(`${prefix}${ins.text}`);
  }

  // Synthesis section progress
  if (stage === 'synthesis' && progress.synthesis?.currentSectionTitle) {
    messages.push(`Writing: ${progress.synthesis.currentSectionTitle}`);
  }

  // Visualization extraction progress
  if (stage === 'synthesis') {
    const visualsPhase = progress.phases?.find(p => p.id === 'synthesis.visuals');
    if (visualsPhase?.status === 'active') {
      messages.push('Extracting charts & data visualizations...');
    } else if (visualsPhase?.status === 'complete') {
      messages.push('Charts & visualizations ready');
    }
  }

  // Global source counter
  if (progress.totalSources > 0) {
    messages.push(`${progress.totalSources} unique sources collected`);
  }

  messagesRef.current = messages;

  // Reset on stage change
  useEffect(() => { setCurrentIndex(0); }, [stage]);

  // Continuous 3s cycle
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex(prev => {
        const len = messagesRef.current.length;
        return len === 0 ? 0 : (prev + 1) % len;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  if (messages.length === 0) return fallback;
  return messages[currentIndex % messages.length] || fallback;
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
  const { agents } = progress;
  const effectiveStage = normalizeStage(progress.stage);
  const progressPct = computeProgress(progress);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(true);

  const StageIcon = STAGE_ICONS[effectiveStage] || PlanIcon;
  const stageTitle = STAGE_TITLES[effectiveStage] || 'Researching';
  const activityText = useActivityStream(effectiveStage, progress);
  const phaseItems = getDisplayPhases(effectiveStage, progress);

  // ── COMPLETE STATE ──
  if (status === 'complete') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#E8ECF1] bg-white overflow-hidden"
        style={{ boxShadow: '0 2px 12px -4px rgba(0, 0, 0, 0.06)' }}
      >
        {/* Header */}
        <div className="px-5 pt-3.5 pb-3">
          <div className="flex items-center">
            {/* Bare icon + title */}
            <div className="flex items-center flex-1 min-w-0 mr-4">
              <div className="flex-shrink-0 mr-2.5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 21C16.5228 21 21 16.5228 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21Z" fill="#682AF9" fillOpacity="0.1" stroke="#682AF9" strokeWidth="1.5"/>
                    <path d="M7.5 11L10 13.5L14.5 8.5" stroke="#682AF9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-normal text-[#1A1F36] leading-5">
                  Deep Research Complete
                </h3>
                <p className="text-[13px] text-[#7C83A1] leading-[18px] mt-px">
                  {progress.totalSources} sources &middot; {agents.length} agents &middot; {formatElapsed(Math.floor((Date.now() - progress.startedAt) / 1000))}
                </p>
              </div>
            </div>

            {/* View Report button */}
            <motion.button
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              onClick={onViewReport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#682AF9] text-[13px] font-normal text-[#682AF9] hover:bg-[#682AF9]/5 transition-colors flex-shrink-0"
            >
              View Report
              <ExternalLink className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Summary in inner card */}
        {report?.summary && (
          <>
            <div className="mx-5 h-px bg-[#E8ECF1]" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="px-4 pt-3 pb-4"
            >
              <div className="bg-[#F7F8FB] rounded-xl px-4 py-3">
                <p className="text-[13px] text-[#5D6A89] leading-relaxed line-clamp-2">
                  {report.summary}
                </p>
              </div>
            </motion.div>
          </>
        )}

        {/* Bottom accent bar — 100% complete */}
        <div className="h-1.5 bg-[#E8ECF1]">
          <motion.div
            className="h-full bg-[#682AF9] w-full"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    );
  }

  // ── ERROR STATE ──
  if (status === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#E8ECF1] bg-white overflow-hidden"
        style={{ boxShadow: '0 2px 12px -4px rgba(0, 0, 0, 0.06)' }}
      >
        <div className="px-5 pt-3.5 pb-3">
          <div className="flex items-center">
            <div className="flex items-center flex-1 min-w-0 mr-4">
              <div className="flex-shrink-0 mr-2.5">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 21C16.5228 21 21 16.5228 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21Z" fill="#EF4444" fillOpacity="0.1" stroke="#EF4444" strokeWidth="1.5"/>
                  <path d="M11 7V12" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="11" cy="15" r="0.8" fill="#EF4444"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-normal text-[#1A1F36] leading-5">
                  Research Failed
                </h3>
                <p className="text-[13px] text-[#7C83A1] leading-[18px] mt-px truncate">
                  {error || 'An unexpected error occurred'}
                </p>
              </div>
            </div>

            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#682AF9] text-[13px] font-normal text-[#682AF9] hover:bg-[#682AF9]/5 transition-colors flex-shrink-0"
              >
                Try Again
              </button>
            )}
          </div>
        </div>

        {/* Red accent bar */}
        <div className="h-1.5 bg-[#E8ECF1]">
          <div className="h-full bg-[#EF4444] w-full" />
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
        className="rounded-2xl border border-[#E8ECF1] bg-white overflow-hidden"
        style={{ boxShadow: '0 2px 12px -4px rgba(0, 0, 0, 0.06)' }}
      >
        <div className="px-5 pt-3.5 pb-3">
          <div className="flex items-center">
            <div className="flex items-center flex-1 min-w-0 mr-4">
              <div className="flex-shrink-0 mr-2.5">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 21C16.5228 21 21 16.5228 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21Z" fill="#94A3B8" fillOpacity="0.1" stroke="#94A3B8" strokeWidth="1.5"/>
                  <path d="M8.5 8.5L13.5 13.5M13.5 8.5L8.5 13.5" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-normal text-[#1A1F36] leading-5">
                  Research Cancelled
                </h3>
                <p className="text-[13px] text-[#7C83A1] leading-[18px] mt-px">
                  Partial findings from {progress.totalSources} sources
                </p>
              </div>
            </div>

            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#682AF9] text-[13px] font-normal text-[#682AF9] hover:bg-[#682AF9]/5 transition-colors flex-shrink-0"
              >
                Start New Research
              </button>
            )}
          </div>
        </div>

        {/* Muted accent bar */}
        <div className="h-1.5 bg-[#E8ECF1]">
          <div className="h-full bg-[#94A3B8] w-full" />
        </div>
      </motion.div>
    );
  }

  // ── RESEARCHING STATE — Per-stage card ──
  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#E8ECF1] bg-white overflow-hidden"
      style={{ boxShadow: '0 2px 12px -4px rgba(0, 0, 0, 0.06)' }}
    >
      {/* ─── Header: icon │ title/subtitle │ sources │ chevron ─── */}
      <div className="px-5 pt-3.5 pb-3">
        <div className="flex items-center">
          {/* Icon + text — crossfade on stage change */}
          <AnimatePresence mode="wait">
            <motion.div
              key={effectiveStage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex items-center flex-1 min-w-0 mr-4"
            >
              {/* Icon — breathing pulse while active */}
              <div className="flex-shrink-0 mr-2.5">
                <motion.div
                  animate={{ scale: [0.82, 1, 0.82] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <StageIcon />
                </motion.div>
              </div>

              {/* Title + activity stream */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-normal text-[#1A1F36] leading-5">
                  {stageTitle}
                </h3>
                <div className="h-[18px] mt-px overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activityText}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="text-[13px] text-[#7C83A1] leading-[18px] truncate absolute inset-x-0"
                    >
                      {activityText}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Source counter */}
          <div className="flex items-center gap-1.5 mr-3 flex-shrink-0">
            <SourcesIcon />
            <span className="text-[12px] font-normal text-[#8A94A8]">
              {progress.totalSources} Source{progress.totalSources !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Chevron toggle */}
          <button
            onClick={() => setExpanded(prev => !prev)}
            className="w-7 h-7 rounded-md border border-[#682AF9] flex items-center justify-center flex-shrink-0 hover:bg-[#682AF9]/5 transition-colors"
          >
            <motion.div
              animate={{ rotate: expanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5 text-[#682AF9]" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* ─── Separator ─── */}
      <div className="mx-5 h-px bg-[#E8ECF1]" />

      {/* ─── Phase list: grey dots → spinning arc → purple checkmarks ─── */}
      <AnimatePresence initial={false}>
        {expanded && phaseItems.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-3 pb-4">
              <div className="bg-[#F7F8FB] rounded-xl px-5 py-4">
                <div className="relative">
                  {/* Dotted connector line */}
                  {phaseItems.length > 1 && (
                    <div
                      className="absolute border-l-[2px] border-dotted border-[#C4C9D4]"
                      style={{
                        left: '6px',
                        top: '7px',
                        height: 'calc(100% - 14px)',
                      }}
                    />
                  )}

                  <div className="flex flex-col gap-5">
                    {phaseItems.map((item, index) => {
                      const isDone = item.status === 'complete';
                      const isActive = item.status === 'active';

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.06, duration: 0.3 }}
                          layout
                          className="flex items-center gap-3"
                        >
                          {/* Circle indicator — dot → spinning arc → check */}
                          <div className="relative z-10 flex-shrink-0 w-[14px] h-[14px] flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-[#F7F8FB]" />
                            <AnimatePresence mode="wait">
                              {isDone ? (
                                <motion.div
                                  key="check"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                  className="relative z-10"
                                >
                                  <PhaseCheck />
                                </motion.div>
                              ) : isActive ? (
                                <motion.div
                                  key="active"
                                  initial={{ scale: 0.6, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="relative z-10"
                                >
                                  <PhaseActive />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="pending"
                                  initial={{ scale: 0.6, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="relative z-10"
                                >
                                  <div className="w-2 h-2 rounded-full bg-[#B0B7CC]" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Label — 3-state color: completed=purple, active=dark bold, pending=light grey */}
                          <motion.span
                            className={`text-[15px] leading-5 ${isActive ? 'font-medium' : ''}`}
                            animate={{
                              color: isDone ? '#682AF9' : isActive ? '#1A1F36' : '#A0A8BE',
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            {item.label}
                          </motion.span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Progress bar — bottom, edge-to-edge ─── */}
      <div className="h-1.5 bg-[#E8ECF1]">
        <motion.div
          className="h-full bg-[#682AF9] rounded-r-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
};

export default ResearchCommandCenter;
