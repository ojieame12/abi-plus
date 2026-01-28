// Deep Research Types
// Supports multi-stage research with clarifying questions, real-time progress, and report generation

import type { Source } from './chat';

// ============================================
// PHASE & STATE TYPES
// ============================================

/** Deep research phases - represents the state machine */
export type DeepResearchPhase =
  | 'intake'           // Showing clarifying questions
  | 'intake_confirmed' // User confirmed, about to start
  | 'processing'       // Research in progress
  | 'complete'         // Report ready
  | 'error';           // Something went wrong

/** Types of deep research studies available */
export type StudyType =
  | 'sourcing_study'      // Comprehensive sourcing analysis
  | 'cost_model'          // Cost breakdown and modeling
  | 'market_analysis'     // Market overview and trends
  | 'supplier_assessment' // Supplier evaluation
  | 'risk_assessment'     // Risk analysis
  | 'custom';             // User-defined research

// ============================================
// INTAKE / CLARIFYING QUESTIONS
// ============================================

/** Type of input for clarifying questions */
export type QuestionInputType =
  | 'select'          // Single selection dropdown
  | 'multiselect'     // Multiple selection
  | 'category_picker' // Category selection with search
  | 'text'            // Free text input
  | 'date_range'      // Date range picker
  | 'number';         // Numeric input

/** A single clarifying question */
export interface ClarifyingQuestion {
  id: string;
  question: string;
  type: QuestionInputType;
  options?: { label: string; value: string }[];
  required: boolean;
  defaultValue?: string | string[];
  placeholder?: string;
  helpText?: string;
  /** If set, indicates this was pre-filled from context (e.g., "chat history") */
  prefilledFrom?: string;
}

/** Intake state - questions and prefilled values */
export interface IntakeState {
  questions: ClarifyingQuestion[];
  prefilledAnswers?: Record<string, string | string[]>;
  canSkip?: boolean;
  /** Why intake can be skipped (shown to user) */
  skipReason?: string;
  estimatedCredits: number;
  estimatedTime: string; // "5-10 minutes"
  studyType?: StudyType; // Type of study being configured
}

/** User's answers to clarifying questions */
export interface IntakeAnswers {
  [questionId: string]: string | string[];
}

// ============================================
// RESEARCH COMMAND CENTER TYPES
// ============================================

/** Canonical pipeline stages */
export type CommandCenterStage = 'plan' | 'research' | 'synthesis' | 'delivery' | 'complete';
/** Legacy stage names (backward-compatible) */
type CommandCenterStageLegacy = 'decomposing' | 'researching' | 'synthesizing';
/** Stage union supporting both new and legacy values */
export type CommandCenterStageAll = CommandCenterStage | CommandCenterStageLegacy;

/** Phase status within a stage */
export type PhaseStatus = 'pending' | 'active' | 'complete' | 'skipped' | 'error';

/** Individual phase within a stage */
export interface StagePhase {
  id: string;        // e.g., 'plan.decomposition'
  label: string;     // e.g., 'Query Decomposition'
  status: PhaseStatus;
  startedAt?: number;
  completedAt?: number;
  detail?: string;
}

/** Phase definitions per stage */
export const STAGE_PHASES: Record<CommandCenterStage, { id: string; label: string }[]> = {
  plan: [
    { id: 'plan.decomposition', label: 'Query Decomposition' },
    { id: 'plan.deduplication', label: 'Deduplication' },
    { id: 'plan.assignment', label: 'Agent Assignment' },
  ],
  research: [
    { id: 'research.internal', label: 'Internal Intelligence' },
    { id: 'research.web', label: 'Web Research' },
    { id: 'research.consolidation', label: 'Source Consolidation' },
  ],
  synthesis: [
    { id: 'synthesis.template', label: 'Template Selection' },
    { id: 'synthesis.writing', label: 'Section Writing' },
    { id: 'synthesis.quality', label: 'Quality Validation' },
    { id: 'synthesis.visuals', label: 'Chart & Data Extraction' },
  ],
  delivery: [
    { id: 'delivery.assembly', label: 'Report Assembly' },
    { id: 'delivery.presentation', label: 'Finalizing' },
    { id: 'delivery.export', label: 'Export Ready' },
  ],
  complete: [],
};

/** Normalize legacy stage names to canonical stages */
export const normalizeStage = (stage: CommandCenterStageAll): CommandCenterStage => {
  switch (stage) {
    case 'decomposing':
      return 'plan';
    case 'researching':
      return 'research';
    case 'synthesizing':
      return 'synthesis';
    default:
      return stage as CommandCenterStage;
  }
};

/** Initialize phases for a stage */
export const initPhases = (stage: CommandCenterStage): StagePhase[] =>
  (STAGE_PHASES[stage] || []).map(phase => ({ ...phase, status: 'pending' as PhaseStatus }));

/** Agent category for research decomposition */
export type AgentCategory =
  | 'market_dynamics' | 'supplier_landscape' | 'pricing_trends'
  | 'risk_factors' | 'regulatory' | 'competitive_intelligence'
  | 'technology_trends' | 'general';

/** Agent execution status */
export type AgentStatus = 'queued' | 'researching' | 'complete' | 'error';

/** A single research agent that runs a Perplexity query */
export interface ResearchAgent {
  id: string;
  name: string;
  query: string;
  category: AgentCategory;
  status: AgentStatus;
  sourcesFound: number;        // Raw count from this agent's Perplexity response
  uniqueSourcesFound: number;  // After global dedupe
  insights: string[];          // Real snippets from Perplexity
  sources: Source[];
  findings: string;            // Raw Perplexity content
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

/** Result of decomposing a query into research agents */
export interface DecomposedQuery {
  agents: Array<{ name: string; query: string; category: AgentCategory }>;
  tags: string[];
}

/** Source type for insights */
export type InsightSourceType = 'beroe' | 'web' | 'internal' | 'synthesis';

/** Individual insight for the ticker */
export interface ResearchInsight {
  id: string;
  text: string;
  source: InsightSourceType;
  sourceLabel?: string; // e.g., "Beroe Intelligence", "Reuters"
  timestamp: number;
}

/** Section-level synthesis progress */
export interface SynthesisProgress {
  currentSection: string;
  currentSectionTitle: string;
  sectionsComplete: number;
  totalSections: number;
}

/** Main progress structure for Research Command Center */
export interface CommandCenterProgress {
  stage: CommandCenterStageAll;
  agents: ResearchAgent[];
  activeAgentId: string | null;
  totalSources: number;        // Global unique count (deduped URLs)
  totalSourcesRaw: number;     // Sum of all agent raw counts
  startedAt: number;
  elapsedMs: number;
  phases: StagePhase[];
  completedStages: CommandCenterStage[];

  // Streaming insights for the ticker
  insightStream: ResearchInsight[];

  // Tags/topics discovered during research
  tags: string[];

  // Synthesis-specific progress (when in synthesis stage)
  synthesis?: SynthesisProgress;
}

/** Props for ResearchCommandCenter component */
export interface ResearchCommandCenterProps {
  jobId: string;
  query: string;
  studyType: StudyType;
  status: 'researching' | 'complete' | 'cancelled' | 'error';
  progress: CommandCenterProgress;
  report?: DeepResearchReport;
  error?: string;
  onCancel: () => void;
  onViewReport: () => void;
  onRetry?: () => void;
}

/** Create initial command center progress */
export const createInitialProgress = (): CommandCenterProgress => ({
  stage: 'plan',
  agents: [],
  activeAgentId: null,
  totalSources: 0,
  totalSourcesRaw: 0,
  startedAt: Date.now(),
  elapsedMs: 0,
  phases: initPhases('plan'),
  completedStages: [],
  insightStream: [],
  tags: [],
});

// ============================================
// PROCESSING / PROGRESS TRACKING (Legacy)
// ============================================

/** Status of a processing step */
export type StepStatus = 'pending' | 'in_progress' | 'complete' | 'error';

/** Individual processing step */
export interface ProcessingStep {
  id: string;
  label: string;
  description?: string;
  status: StepStatus;
  startedAt?: number;
  completedAt?: number;
  substeps?: ProcessingSubstep[];
  sourcesFound?: number;
  error?: string;
}

/** Substep within a processing step */
export interface ProcessingSubstep {
  id: string;
  label: string;
  status: StepStatus;
}

/** Processing state - current progress */
export interface ProcessingState {
  steps: ProcessingStep[];
  currentStepIndex: number;
  elapsedTime: number;       // milliseconds
  sourcesCollected: number;
  tokensUsed?: number;
  intermediateFindings?: string[];  // Key findings as they emerge
}

// ============================================
// REPORT OUTPUT
// ============================================

/** Citation reference in report content */
export interface ReportCitation {
  id: string;              // e.g., "1", "2", "B1", "W1"
  source: Source;
  usedInSections: string[];
}

/** Table of contents entry */
export interface TocEntry {
  id: string;
  title: string;
  level: number;           // 0 = top-level, 1 = child, 2 = grandchild
}

// ── Report Visualization Types ──

type VisualConfidence = 'high' | 'medium' | 'low';
type VisualPlacement = 'before_prose' | 'after_prose';

interface ReportVisualBase {
  id: string;
  title: string;
  sourceIds: string[];          // citation IDs backing the data
  confidence: VisualConfidence;
  placement?: VisualPlacement;
  footnote?: string;
  /** Rendering hint for trend color semantics (used by TrendChartWidget delegation) */
  trendSemantics?: 'up-good' | 'up-bad';
}

export interface LineChartVisual extends ReportVisualBase {
  type: 'line_chart';
  data: {
    unit?: string;
    series: { name: string; points: { x: string; y: number }[]; color?: string }[];
  };
}

export interface BarChartVisual extends ReportVisualBase {
  type: 'bar_chart';
  data: {
    unit?: string;
    horizontal?: boolean;
    categories: string[];
    series: { name: string; values: number[]; color?: string }[];
  };
}

export interface PieChartVisual extends ReportVisualBase {
  type: 'pie_chart';
  data: {
    unit?: string;
    slices: { label: string; value: number; color?: string }[];
  };
}

export interface TableVisual extends ReportVisualBase {
  type: 'table';
  data: {
    headers: string[];
    rows: (string | number)[][];
    columnAlignments?: ('left' | 'center' | 'right')[];
    highlightFirstColumn?: boolean;
  };
}

export interface MetricVisual extends ReportVisualBase {
  type: 'metric';
  data: {
    metrics: {
      label: string;
      value: string;
      subLabel?: string;
      trend?: 'up' | 'down' | 'stable';
      trendValue?: string;
      color?: 'default' | 'success' | 'warning' | 'danger';
    }[];
  };
}

export type ReportVisual = LineChartVisual | BarChartVisual | PieChartVisual | TableVisual | MetricVisual;

/** Section within the final report */
export interface ReportSection {
  id: string;
  title: string;
  content: string;         // Markdown content with [1][2] style citations
  level: number;           // Hierarchy level (0, 1, 2)
  citationIds: string[];   // Citations used in this section
  sources?: Source[];
  visuals?: ReportVisual[];
  /** Slot titles where data extraction was attempted but insufficient data found */
  missingVisuals?: string[];
  children?: ReportSection[];  // Nested subsections
}

/** Report metadata */
export interface ReportMetadata {
  title: string;
  customer?: string;
  region?: string;
  date: string;             // ISO date string
  templateId: string;       // Which template was used
  version: string;          // Report version
}

/** Complete deep research report */
export interface DeepResearchReport {
  id: string;
  title: string;
  subtitle?: string;        // One-line thesis / key takeaway
  keyFinding?: string;      // Most impactful quantitative finding
  reportNumber?: string;    // e.g., "ABI-2026-0142"
  summary: string;          // Executive summary
  studyType: StudyType;

  // Structure
  metadata: ReportMetadata;
  tableOfContents: TocEntry[];
  sections: ReportSection[];

  // Citations & Sources
  citations: Record<string, ReportCitation>;  // id -> citation mapping
  references: ReportCitation[];               // Ordered list for References section
  allSources: Source[];

  generatedAt: string;      // ISO timestamp

  // Metadata
  queryOriginal: string;
  intakeAnswers: IntakeAnswers;
  totalProcessingTime: number;  // milliseconds
  creditsUsed: number;

  // Export options
  pdfUrl?: string;          // Generated PDF URL
  canExport: boolean;

  // Quality metrics
  qualityMetrics?: {
    totalCitations: number;
    sectionsWithCitations: number;
    totalSections: number;
    completenessScore: number;  // 0-100
  };
}

// ============================================
// MAIN RESPONSE STRUCTURE
// ============================================

/** Complete deep research response for chat message */
export interface DeepResearchResponse {
  type: 'deep_research';
  jobId: string;
  query: string;
  studyType: StudyType;
  phase: DeepResearchPhase;

  // Credits info (always present)
  creditsAvailable: number;
  creditsRequired: number;

  // Phase-specific data (only one populated at a time)
  intake?: IntakeState;
  processing?: ProcessingState;
  report?: DeepResearchReport;

  // NEW: Command Center progress (used during processing/complete phases)
  commandCenterProgress?: CommandCenterProgress;

  // Error state
  error?: {
    message: string;
    code?: string;
    canRetry: boolean;
  };
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/** Request to start deep research */
export interface StartDeepResearchRequest {
  query: string;
  studyType?: StudyType;
  category?: string;
  intakeAnswers?: IntakeAnswers;
  skipIntake?: boolean;
}

/** Request to confirm intake and start processing */
export interface ConfirmIntakeRequest {
  jobId: string;
  answers: IntakeAnswers;
}

/** SSE event types for real-time progress */
export type DeepResearchEventType =
  | 'phase_change'
  | 'step_update'
  | 'source_found'
  | 'finding_emerged'
  | 'report_ready'
  | 'error';

/** SSE event payload */
export interface DeepResearchEvent {
  type: DeepResearchEventType;
  jobId: string;
  timestamp: number;
  data: Partial<DeepResearchResponse>;
}

// ============================================
// ARTIFACT TYPES
// ============================================

/** Data for deep research progress artifact */
export interface DeepResearchProgressArtifactData {
  jobId: string;
  phase: DeepResearchPhase;
  processing: ProcessingState;
  studyType: StudyType;
  query: string;
}

/** Data for deep research report artifact */
export interface DeepResearchReportArtifactData {
  jobId: string;
  report: DeepResearchReport;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Generate default clarifying questions based on study type */
export const getDefaultQuestions = (studyType: StudyType): ClarifyingQuestion[] => {
  const baseQuestions: ClarifyingQuestion[] = [
    {
      id: 'region',
      question: 'Which regions should we focus on?',
      type: 'multiselect',
      options: [
        { label: 'North America', value: 'na' },
        { label: 'Europe', value: 'eu' },
        { label: 'Asia Pacific', value: 'apac' },
        { label: 'Latin America', value: 'latam' },
        { label: 'Global', value: 'global' },
      ],
      required: true,
      defaultValue: ['global'],
    },
    {
      id: 'timeframe',
      question: 'What timeframe should the analysis cover?',
      type: 'select',
      options: [
        { label: 'Last 6 months', value: '6m' },
        { label: 'Last 12 months', value: '12m' },
        { label: 'Last 2 years', value: '2y' },
        { label: 'Last 5 years', value: '5y' },
      ],
      required: true,
      defaultValue: '12m',
    },
  ];

  const studySpecificQuestions: Record<StudyType, ClarifyingQuestion[]> = {
    sourcing_study: [
      ...baseQuestions,
      {
        id: 'budget',
        question: 'What is your approximate annual spend in this category?',
        type: 'select',
        options: [
          { label: 'Under $1M', value: 'under_1m' },
          { label: '$1M - $10M', value: '1m_10m' },
          { label: '$10M - $50M', value: '10m_50m' },
          { label: 'Over $50M', value: 'over_50m' },
        ],
        required: false,
      },
    ],
    cost_model: [
      ...baseQuestions,
      {
        id: 'cost_drivers',
        question: 'Which cost drivers are most important to analyze?',
        type: 'multiselect',
        options: [
          { label: 'Raw materials', value: 'raw_materials' },
          { label: 'Labor costs', value: 'labor' },
          { label: 'Energy costs', value: 'energy' },
          { label: 'Logistics', value: 'logistics' },
          { label: 'Packaging', value: 'packaging' },
        ],
        required: true,
        defaultValue: ['raw_materials', 'labor'],
      },
    ],
    market_analysis: baseQuestions,
    supplier_assessment: [
      ...baseQuestions,
      {
        id: 'assessment_criteria',
        question: 'What criteria matter most for supplier evaluation?',
        type: 'multiselect',
        options: [
          { label: 'Financial stability', value: 'financial' },
          { label: 'Quality certifications', value: 'quality' },
          { label: 'Sustainability', value: 'sustainability' },
          { label: 'Geographic coverage', value: 'geography' },
          { label: 'Innovation capability', value: 'innovation' },
        ],
        required: true,
        defaultValue: ['financial', 'quality'],
      },
    ],
    risk_assessment: [
      ...baseQuestions,
      {
        id: 'risk_types',
        question: 'Which risk categories should we prioritize?',
        type: 'multiselect',
        options: [
          { label: 'Supply chain disruption', value: 'supply_chain' },
          { label: 'Price volatility', value: 'price' },
          { label: 'Geopolitical risk', value: 'geopolitical' },
          { label: 'Regulatory/compliance', value: 'regulatory' },
          { label: 'ESG/sustainability', value: 'esg' },
        ],
        required: true,
        defaultValue: ['supply_chain', 'price'],
      },
    ],
    custom: baseQuestions,
  };

  return studySpecificQuestions[studyType] || baseQuestions;
};

/** Get default processing steps for deep research */
export const getDefaultProcessingSteps = (): ProcessingStep[] => [
  {
    id: 'decompose',
    label: 'Analyzing query',
    description: 'Breaking down your question into research components',
    status: 'pending',
  },
  {
    id: 'beroe',
    label: 'Searching Beroe intelligence',
    description: 'Querying internal market data and reports',
    status: 'pending',
  },
  {
    id: 'web',
    label: 'Gathering web sources',
    description: 'Searching recent news, filings, and market data',
    status: 'pending',
  },
  {
    id: 'internal',
    label: 'Analyzing your data',
    description: 'Reviewing spend data and supplier records',
    status: 'pending',
  },
  {
    id: 'synthesize',
    label: 'Synthesizing findings',
    description: 'Combining sources and reasoning through insights',
    status: 'pending',
  },
  {
    id: 'report',
    label: 'Generating report',
    description: 'Creating your comprehensive research report',
    status: 'pending',
  },
];

/** Create initial deep research response */
export const createDeepResearchResponse = (
  jobId: string,
  query: string,
  studyType: StudyType = 'market_analysis',
  creditsAvailable: number = 0,
  creditsRequired: number = 500
): DeepResearchResponse => ({
  type: 'deep_research',
  jobId,
  query,
  studyType,
  phase: 'intake',
  creditsAvailable,
  creditsRequired,
  intake: {
    questions: getDefaultQuestions(studyType),
    estimatedCredits: creditsRequired,
    estimatedTime: '5-10 minutes',
    canSkip: false,
    studyType,
  },
});
