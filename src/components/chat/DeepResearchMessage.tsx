import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Check,
  Search,
  FileSearch,
  Brain,
  Download,
  Sparkles,
} from 'lucide-react';
import type {
  DeepResearchResponse,
  ClarifyingQuestion,
  IntakeAnswers,
  ProcessingStep
} from '../../types/deepResearch';

// ============================================
// TYPES
// ============================================

interface DeepResearchMessageProps {
  response: DeepResearchResponse;
  onConfirmIntake?: (answers: IntakeAnswers) => void;
  onSkipIntake?: () => void;
  onViewReport?: () => void;
  onDownloadReport?: () => void;
  onRetry?: () => void;
}

// ============================================
// INTAKE PHASE COMPONENT
// ============================================

interface IntakeFormProps {
  questions: ClarifyingQuestion[];
  prefilledAnswers?: Record<string, string | string[]>;
  canSkip?: boolean;
  skipReason?: string;
  estimatedCredits: number;
  estimatedTime: string;
  creditsAvailable: number;
  onConfirm: (answers: IntakeAnswers) => void;
  onSkip?: () => void;
}

// ── Helpers ──

/** Resolve selected values to their display labels */
const getSelectedLabels = (
  question: ClarifyingQuestion,
  answer: string | string[] | undefined
): string[] => {
  if (!answer || !question.options) return [];
  const values = Array.isArray(answer) ? answer : [answer];
  return values
    .map(v => question.options?.find(o => o.value === v)?.label || v)
    .filter(Boolean);
};

/** Check whether a question has been answered */
const isAnswered = (question: ClarifyingQuestion, answer: string | string[] | undefined): boolean => {
  if (!answer) return false;
  if (Array.isArray(answer)) return answer.some(v => v && v.trim());
  return typeof answer === 'string' ? answer.trim().length > 0 : Boolean(answer);
};

// ── Chip component with checkmark ──

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

const Chip = ({ label, selected, onClick }: ChipProps) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.96 }}
    className={`
      inline-flex items-center gap-1.5 px-3 py-[7px] rounded-full text-[13px] font-medium
      transition-colors duration-150 select-none
      ${selected
        ? 'bg-slate-900 text-white'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
      }
    `}
  >
    <AnimatePresence mode="popLayout">
      {selected && (
        <motion.span
          key="check"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 14, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden flex items-center"
        >
          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
        </motion.span>
      )}
    </AnimatePresence>
    {label}
  </motion.button>
);

// ── Research Brief ──

interface ResearchBriefProps {
  questions: ClarifyingQuestion[];
  answers: IntakeAnswers;
  estimatedCredits: number;
  estimatedTime: string;
}

const ResearchBrief = ({ questions, answers, estimatedCredits, estimatedTime }: ResearchBriefProps) => {
  // Build summary fragments from answered questions
  const fragments: string[] = [];
  for (const q of questions) {
    const labels = getSelectedLabels(q, answers[q.id]);
    if (labels.length > 0) {
      fragments.push(labels.join(', '));
    } else if (answers[q.id] && typeof answers[q.id] === 'string' && (answers[q.id] as string).trim()) {
      fragments.push(answers[q.id] as string);
    }
  }

  if (fragments.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mx-5 mb-5 rounded-xl bg-slate-50/80 border border-slate-100 px-4 py-3.5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Research Brief</span>
        </div>
        <p className="text-[13px] text-slate-600 leading-relaxed">
          {fragments.join('  ·  ')}
        </p>
        <div className="flex items-center gap-3 mt-2.5 text-[12px] text-slate-400">
          <span>{estimatedCredits} credits</span>
          <span className="text-slate-200">|</span>
          <span>~{estimatedTime}</span>
        </div>
      </div>
    </motion.div>
  );
};

// ── IntakeForm — flat layout, visible selections, research brief ──

const IntakeForm = ({
  questions,
  prefilledAnswers = {},
  canSkip = false,
  skipReason,
  estimatedCredits,
  estimatedTime,
  creditsAvailable,
  onConfirm,
  onSkip,
}: IntakeFormProps) => {
  const [answers, setAnswers] = useState<IntakeAnswers>(prefilledAnswers);

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    onConfirm(answers);
  };

  const isComplete = questions.every(q => {
    if (!q.required) return true;
    return isAnswered(q, answers[q.id]);
  });

  const hasEnoughCredits = creditsAvailable >= estimatedCredits;
  const answeredCount = questions.filter(q => isAnswered(q, answers[q.id])).length;

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-slate-900 flex items-center justify-center">
            <Brain className="w-[18px] h-[18px] text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-medium text-slate-900">Deep Research</h3>
            <p className="text-[13px] text-slate-400">Tailor your analysis</p>
          </div>
          {/* Completion indicator */}
          <div className="flex items-center gap-1.5">
            {questions.map((q) => (
              <motion.div
                key={q.id}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  isAnswered(q, answers[q.id]) ? 'bg-slate-900' : 'bg-slate-200'
                }`}
                animate={isAnswered(q, answers[q.id]) ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Questions — flat, all visible ── */}
      <div className="px-5 pt-5 pb-2 space-y-5">
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.25 }}
          >
            {/* Label row */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[13px] font-medium text-slate-800">
                {question.question}
              </span>
              {!question.required && (
                <span className="text-[11px] text-slate-300">optional</span>
              )}
            </div>

            {/* Prefilled hint */}
            {question.prefilledFrom && (
              <p className="text-[11px] text-slate-400 mb-2 -mt-0.5">
                Detected from {question.prefilledFrom}
              </p>
            )}

            {/* Select / Multiselect — chips */}
            {(question.type === 'select' || question.type === 'multiselect') && question.options && (
              <div className="flex flex-wrap gap-1.5">
                {question.options.map(option => {
                  const sel = question.type === 'multiselect'
                    ? (answers[question.id] as string[] || []).includes(option.value)
                    : answers[question.id] === option.value;

                  return (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={sel}
                      onClick={() => {
                        if (question.type === 'multiselect') {
                          const current = (answers[question.id] as string[] || []);
                          handleAnswerChange(
                            question.id,
                            sel ? current.filter(v => v !== option.value) : [...current, option.value]
                          );
                        } else {
                          handleAnswerChange(question.id, option.value);
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Text / Category picker */}
            {(question.type === 'text' || question.type === 'category_picker') && (
              <input
                type="text"
                value={(answers[question.id] as string) || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder || (question.type === 'category_picker' ? 'Search categories...' : 'Type your answer...')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-shadow"
              />
            )}

            {/* Number */}
            {question.type === 'number' && (
              <input
                type="number"
                value={(answers[question.id] as string) || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder || 'Enter a number...'}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-shadow"
              />
            )}

            {/* Date range */}
            {question.type === 'date_range' && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={(Array.isArray(answers[question.id]) ? (answers[question.id] as string[])[0] : '') || ''}
                  onChange={(e) => {
                    const current = Array.isArray(answers[question.id]) ? (answers[question.id] as string[]) : ['', ''];
                    handleAnswerChange(question.id, [e.target.value, current[1] || '']);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-shadow"
                />
                <input
                  type="date"
                  value={(Array.isArray(answers[question.id]) ? (answers[question.id] as string[])[1] : '') || ''}
                  onChange={(e) => {
                    const current = Array.isArray(answers[question.id]) ? (answers[question.id] as string[]) : ['', ''];
                    handleAnswerChange(question.id, [current[0] || '', e.target.value]);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-shadow"
                />
              </div>
            )}

            {/* Help text — below options */}
            {question.helpText && (
              <p className="text-[11px] text-slate-400 mt-1.5">{question.helpText}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Research Brief — live summary ── */}
      <AnimatePresence>
        {answeredCount > 0 && (
          <ResearchBrief
            questions={questions}
            answers={answers}
            estimatedCredits={estimatedCredits}
            estimatedTime={estimatedTime}
          />
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <div className="px-5 py-4 border-t border-slate-100">
        {!hasEnoughCredits && (
          <p className="text-[12px] text-red-500 mb-2.5">
            Insufficient credits ({creditsAvailable} available)
          </p>
        )}
        {canSkip && skipReason && (
          <p className="text-[12px] text-emerald-600 mb-2.5">{skipReason}</p>
        )}
        <div className="flex items-center gap-3">
          {canSkip && (
            <button
              onClick={onSkip}
              className="px-4 py-2 text-[13px] text-slate-500 hover:text-slate-700 transition-colors"
            >
              Use defaults
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!isComplete || !hasEnoughCredits}
            className={`
              flex-1 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all
              ${isComplete && hasEnoughCredits
                ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:scale-[0.98]'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }
            `}
          >
            Begin Research
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PROCESSING PHASE COMPONENT
// ============================================

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  currentStepIndex: number;
  elapsedTime: number;
  sourcesCollected: number;
}

const ProcessingStatus = ({
  steps,
  currentStepIndex,
  elapsedTime,
  sourcesCollected,
}: ProcessingStatusProps) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'decompose': return Brain;
      case 'beroe': return FileSearch;
      case 'web': return Search;
      case 'internal': return FileText;
      case 'synthesize': return Brain;
      case 'report': return FileText;
      default: return FileText;
    }
  };

  return (
    <div className="rounded-[20px] border border-slate-100/60 bg-white/80 backdrop-blur-sm shadow-[0_8px_40px_-12px_rgba(148,163,184,0.15)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100/60 bg-gradient-to-r from-violet-50/50 to-blue-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Brain className="w-5 h-5 text-white" />
              </motion.div>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Deep Research in Progress</h3>
              <p className="text-sm text-slate-500">Analyzing multiple sources...</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>{sourcesCollected} sources</span>
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="p-5 space-y-3">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isComplete = step.status === 'complete';
          const StepIcon = getStepIcon(step.id);

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-violet-50 border border-violet-200'
                  : isComplete
                    ? 'bg-emerald-50/50 border border-emerald-100'
                    : 'bg-slate-50/50 border border-transparent'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isComplete
                  ? 'bg-emerald-500'
                  : isActive
                    ? 'bg-violet-500'
                    : 'bg-slate-200'
              }`}>
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : isActive ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <StepIcon className="w-4 h-4 text-white" />
                  </motion.div>
                ) : (
                  <StepIcon className="w-4 h-4 text-slate-400" />
                )}
              </div>

              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isComplete ? 'text-emerald-700' : isActive ? 'text-violet-700' : 'text-slate-500'
                }`}>
                  {step.label}
                </p>
                {step.description && (
                  <p className={`text-xs ${
                    isComplete ? 'text-emerald-600/70' : isActive ? 'text-violet-600/70' : 'text-slate-400'
                  }`}>
                    {step.description}
                  </p>
                )}
              </div>

              {isActive && (
                <motion.div
                  className="w-2 h-2 rounded-full bg-violet-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              {step.sourcesFound !== undefined && step.sourcesFound > 0 && (
                <span className="text-xs text-slate-400">
                  {step.sourcesFound} found
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-5">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPLETE PHASE COMPONENT
// ============================================

interface ReportCompleteProps {
  title: string;
  summary: string;
  sectionsCount: number;
  sourcesCount: number;
  citedSourcesCount: number;
  processingTime: number;
  creditsUsed: number;
  onViewReport: () => void;
  onDownloadReport?: () => void;
}

const ReportComplete = ({
  title,
  summary,
  sectionsCount,
  sourcesCount,
  citedSourcesCount,
  processingTime,
  creditsUsed,
  onViewReport,
  onDownloadReport,
}: ReportCompleteProps) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes} min` : `${seconds} sec`;
  };

  return (
    <div className="rounded-[20px] border border-slate-100/60 bg-white/80 backdrop-blur-sm shadow-[0_8px_40px_-12px_rgba(148,163,184,0.15)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100/60 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">Research Complete</h3>
            <p className="text-sm text-slate-500">Your report is ready</p>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="p-5">
        <h4 className="font-medium text-lg text-slate-900 mb-2">{title}</h4>
        <p className="text-sm text-slate-600 mb-4 line-clamp-3">{summary}</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-50 text-center">
            <p className="text-lg font-medium text-slate-900">{sectionsCount}</p>
            <p className="text-xs text-slate-500">Sections</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-center">
            <p className="text-lg font-medium text-slate-900">{citedSourcesCount}</p>
            <p className="text-xs text-slate-500">Cited</p>
            <p className="text-[10px] text-slate-400">{sourcesCount} collected</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-center">
            <p className="text-lg font-medium text-slate-900">{formatTime(processingTime)}</p>
            <p className="text-xs text-slate-500">Time</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-center">
            <p className="text-lg font-medium text-slate-900">{creditsUsed}</p>
            <p className="text-xs text-slate-500">Credits</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onViewReport}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
          >
            View Full Report
          </button>
          {onDownloadReport && (
            <button
              onClick={onDownloadReport}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// ERROR COMPONENT
// ============================================

interface ErrorStateProps {
  message: string;
  canRetry: boolean;
  onRetry?: () => void;
}

const ErrorState = ({ message, canRetry, onRetry }: ErrorStateProps) => (
  <div className="rounded-[20px] border border-red-100 bg-red-50/50 p-5">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
        <AlertCircle className="w-5 h-5 text-red-500" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-red-800 mb-1">Research Failed</h3>
        <p className="text-sm text-red-600">{message}</p>
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export const DeepResearchMessage = ({
  response,
  onConfirmIntake,
  onSkipIntake,
  onViewReport,
  onDownloadReport,
  onRetry,
}: DeepResearchMessageProps) => {
  const handleConfirmIntake = useCallback((answers: IntakeAnswers) => {
    onConfirmIntake?.(answers);
  }, [onConfirmIntake]);

  // Render based on phase
  switch (response.phase) {
    case 'intake':
      return response.intake ? (
        <IntakeForm
          questions={response.intake.questions}
          prefilledAnswers={response.intake.prefilledAnswers}
          canSkip={response.intake.canSkip}
          skipReason={response.intake.skipReason}
          estimatedCredits={response.intake.estimatedCredits}
          estimatedTime={response.intake.estimatedTime}
          creditsAvailable={response.creditsAvailable}
          onConfirm={handleConfirmIntake}
          onSkip={onSkipIntake}
        />
      ) : null;

    case 'intake_confirmed':
      return (
        <div className="rounded-[20px] border border-violet-100 bg-violet-50/50 p-5">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Brain className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="font-medium text-violet-800">Preparing Research</h3>
              <p className="text-sm text-violet-600">Starting deep analysis...</p>
            </div>
          </div>
        </div>
      );

    case 'processing':
      return response.processing ? (
        <ProcessingStatus
          steps={response.processing.steps}
          currentStepIndex={response.processing.currentStepIndex}
          elapsedTime={response.processing.elapsedTime}
          sourcesCollected={response.processing.sourcesCollected}
        />
      ) : null;

    case 'complete':
      return response.report ? (
        <ReportComplete
          title={response.report.title}
          summary={response.report.summary}
          sectionsCount={response.report.sections.length}
          sourcesCount={response.report.allSources.length}
          citedSourcesCount={Object.keys(response.report.citations || {}).length}
          processingTime={response.report.totalProcessingTime}
          creditsUsed={response.report.creditsUsed}
          onViewReport={onViewReport || (() => {})}
          onDownloadReport={onDownloadReport}
        />
      ) : null;

    case 'error':
      return (
        <ErrorState
          message={response.error?.message || 'An unexpected error occurred'}
          canRetry={response.error?.canRetry || false}
          onRetry={onRetry}
        />
      );

    default:
      return null;
  }
};

export default DeepResearchMessage;
