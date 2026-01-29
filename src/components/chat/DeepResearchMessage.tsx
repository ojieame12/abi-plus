import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  Clock,
  Check,
  Search,
  FileSearch,
  Brain,
  Download,
  Coins,
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
      inline-flex items-center gap-1.5 px-3 py-[7px] rounded-full text-[13px] font-normal
      transition-all duration-150 select-none
      ${selected
        ? 'bg-[#682AF9]/10 text-[#682AF9] ring-1 ring-[#682AF9]/25'
        : 'bg-[#F7F8FB] text-[#5D6A89] hover:bg-[#ECEEF4]'
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
      <div className="mx-5 mb-4 rounded-xl bg-[#F7F8FB] px-4 py-3.5">
        <div className="flex items-center gap-2 mb-2">
          <img src="/Abi.svg" alt="" className="w-3.5 h-3.5 opacity-50" />
          <span className="text-[11px] font-normal text-[#7C83A1] uppercase tracking-widest">Research Brief</span>
        </div>
        <p className="text-[13px] text-[#5D6A89] leading-relaxed">
          {fragments.join('  ·  ')}
        </p>
        <div className="flex items-center gap-3 mt-2.5 text-[12px] text-[#A0A8BE]">
          <span>{estimatedCredits} credits</span>
          <span className="text-[#C4C9D4]">|</span>
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
    <div
      className="rounded-2xl bg-white overflow-hidden"
      style={{ boxShadow: '0 4px 24px -6px rgba(0, 0, 0, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.03)' }}
    >
      {/* ── Header ── */}
      <div className="px-6 pt-3.5 pb-3">
        <div className="flex items-center">
          <div className="flex items-center flex-1 min-w-0 mr-4">
            {/* Brain icon */}
            <div className="flex-shrink-0 mr-2.5">
              <Brain className="w-[22px] h-[22px] text-[#5D6A89]" strokeWidth={1.4} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-medium text-[#1A1F36] leading-5">
                Deep Research
              </h3>
              <p className="text-[13px] text-[#7C83A1] leading-[18px] mt-0.5">
                Tailor your analysis
              </p>
            </div>
          </div>
          {/* Completion indicator */}
          <div className="flex items-center gap-1.5">
            {questions.map((q) => (
              <motion.div
                key={q.id}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  isAnswered(q, answers[q.id]) ? 'bg-[#682AF9]' : 'bg-[#C4C9D4]'
                }`}
                animate={isAnswered(q, answers[q.id]) ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Separator ── */}
      <div className="mx-6 h-px bg-[#E8ECF1]" />

      {/* ── Questions — flat, all visible ── */}
      <div className="px-6 pt-4 pb-2 space-y-4">
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.25 }}
            className={index < questions.length - 1 ? 'pb-4 border-b border-[#E8ECF1]/60' : ''}
          >
            {/* Label row */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[14px] font-medium text-[#1A1F36]">
                {question.question}
              </span>
              {!question.required && (
                <span className="text-[11px] text-[#A0A8BE]">optional</span>
              )}
            </div>

            {/* Prefilled hint */}
            {question.prefilledFrom && (
              <p className="text-[11px] text-[#7C83A1] mb-2 -mt-0.5">
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
                className="w-full px-3 py-2 rounded-lg bg-[#F7F8FB] border border-[#E8ECF1] text-[13px] text-[#1A1F36] placeholder:text-[#A0A8BE] focus:outline-none focus:ring-2 focus:ring-[#682AF9]/15 focus:border-[#682AF9]/30 transition-shadow"
              />
            )}

            {/* Number */}
            {question.type === 'number' && (
              <input
                type="number"
                value={(answers[question.id] as string) || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder || 'Enter a number...'}
                className="w-full px-3 py-2 rounded-lg bg-[#F7F8FB] border border-[#E8ECF1] text-[13px] text-[#1A1F36] placeholder:text-[#A0A8BE] focus:outline-none focus:ring-2 focus:ring-[#682AF9]/15 focus:border-[#682AF9]/30 transition-shadow"
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
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F8FB] border border-[#E8ECF1] text-[13px] text-[#1A1F36] focus:outline-none focus:ring-2 focus:ring-[#682AF9]/15 focus:border-[#682AF9]/30 transition-shadow"
                />
                <input
                  type="date"
                  value={(Array.isArray(answers[question.id]) ? (answers[question.id] as string[])[1] : '') || ''}
                  onChange={(e) => {
                    const current = Array.isArray(answers[question.id]) ? (answers[question.id] as string[]) : ['', ''];
                    handleAnswerChange(question.id, [current[0] || '', e.target.value]);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F8FB] border border-[#E8ECF1] text-[13px] text-[#1A1F36] focus:outline-none focus:ring-2 focus:ring-[#682AF9]/15 focus:border-[#682AF9]/30 transition-shadow"
                />
              </div>
            )}

            {/* Help text — below options */}
            {question.helpText && (
              <p className="text-[11px] text-[#7C83A1] mt-1.5">{question.helpText}</p>
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
      <div className="mx-6 h-px bg-[#E8ECF1]" />
      <div className="px-6 py-3.5">
        {!hasEnoughCredits && (
          <p className="text-[12px] text-[#EF4444] mb-2.5">
            Insufficient credits ({creditsAvailable} available)
          </p>
        )}
        {canSkip && skipReason && (
          <p className="text-[12px] text-[#7C83A1] mb-2.5">{skipReason}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!isComplete || !hasEnoughCredits}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all
            ${isComplete && hasEnoughCredits
              ? 'bg-[#682AF9] text-white hover:bg-[#5a23d6] active:scale-[0.98]'
              : 'bg-[#F7F8FB] text-[#A0A8BE] cursor-not-allowed'
            }
          `}
        >
          Begin Research
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
            isComplete && hasEnoughCredits
              ? 'bg-white/20 text-white/90'
              : 'bg-slate-200/60 text-[#A0A8BE]'
          }`}>
            <Coins className="w-3 h-3" />
            {estimatedCredits}
          </span>
        </button>
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
    <div
      className="rounded-2xl border border-[#E8ECF1] bg-white overflow-hidden"
      style={{ boxShadow: '0 2px 12px -4px rgba(0, 0, 0, 0.06)' }}
    >
      {/* Header */}
      <div className="px-5 pt-3.5 pb-3">
        <div className="flex items-center">
          <div className="flex items-center flex-1 min-w-0 mr-4">
            <div className="flex-shrink-0 mr-2.5">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 21C16.5228 21 21 16.5228 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21Z" fill="#682AF9" fillOpacity="0.1" stroke="#682AF9" strokeWidth="1.5"/>
                <path d="M7.5 11L10 13.5L14.5 8.5" stroke="#682AF9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-normal text-[#1A1F36] leading-5">
                Research Complete
              </h3>
              <p className="text-[13px] text-[#7C83A1] leading-[18px] mt-px">
                Your report is ready
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-5 h-px bg-[#E8ECF1]" />

      {/* Report Preview */}
      <div className="px-4 pt-3 pb-4">
        <div className="bg-[#F7F8FB] rounded-xl px-4 py-3.5">
          <h4 className="text-[14px] font-normal text-[#1A1F36] mb-1.5 line-clamp-1">{title}</h4>
          <p className="text-[13px] text-[#5D6A89] leading-relaxed line-clamp-2 mb-3">{summary}</p>

          {/* Stats row — compact inline */}
          <div className="flex items-center gap-3 text-[12px] text-[#7C83A1]">
            <span>{sectionsCount} sections</span>
            <span className="text-[#C4C9D4]">&middot;</span>
            <span>{citedSourcesCount} cited</span>
            <span className="text-[#C4C9D4]">&middot;</span>
            <span>{formatTime(processingTime)}</span>
            <span className="text-[#C4C9D4]">&middot;</span>
            <span>{creditsUsed} credits</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 mt-3">
          <button
            onClick={onViewReport}
            className="flex-1 px-4 py-2 rounded-lg text-[13px] font-normal bg-[#682AF9] text-white hover:bg-[#5a23d6] transition-colors"
          >
            View Full Report
          </button>
          {onDownloadReport && (
            <button
              onClick={onDownloadReport}
              className="px-4 py-2 rounded-lg text-[13px] font-normal border border-[#E8ECF1] text-[#5D6A89] hover:bg-[#F7F8FB] transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
          )}
        </div>
      </div>

      {/* Bottom accent bar — complete */}
      <div className="h-1.5 bg-[#E8ECF1]">
        <div className="h-full bg-[#682AF9] w-full" />
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
  <div
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
              {message}
            </p>
          </div>
        </div>

        {canRetry && onRetry && (
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
        <div
          className="rounded-2xl border border-[#E8ECF1] bg-white overflow-hidden"
          style={{ boxShadow: '0 2px 12px -4px rgba(0, 0, 0, 0.06)' }}
        >
          <div className="px-5 pt-3.5 pb-3">
            <div className="flex items-center">
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex-shrink-0 mr-2.5">
                  <motion.div
                    animate={{ scale: [0.82, 1, 0.82] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 2C8.5 2 6.5 4 6.5 6.5C6.5 7.5 5.5 8.5 4.5 9C3 9.7 2 11 2 12.5C2 14.5 3.5 16 5.5 16H6.5M11 2C13.5 2 15.5 4 15.5 6.5C15.5 7.5 16.5 8.5 17.5 9C19 9.7 20 11 20 12.5C20 14.5 18.5 16 16.5 16H15.5M11 2V20M8 18L11 20L14 18" stroke="#5D6A89" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-normal text-[#1A1F36] leading-5">
                    Preparing Research
                  </h3>
                  <p className="text-[13px] text-[#7C83A1] leading-[18px] mt-px">
                    Starting deep analysis...
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Indeterminate progress */}
          <div className="h-1.5 bg-[#E8ECF1] overflow-hidden">
            <motion.div
              className="h-full bg-[#682AF9] w-1/3 rounded-r-full"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
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
