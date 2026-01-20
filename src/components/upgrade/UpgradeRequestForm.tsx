// UpgradeRequestForm - Modal form for submitting upgrade requests
// Supports L2b (report upgrade) and L3 (expert) requests

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  Phone,
  FileText,
  Users,
  Briefcase,
  HelpCircle,
  Coins,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  type RequestType,
  type RequestContext,
  getRequestTypeDisplay,
  getApprovalLevel,
  getApprovalLevelDisplay,
  APPROVAL_THRESHOLDS,
} from '../../types/requests';
import { CREDIT_COSTS, formatCredits, type CompanySubscription } from '../../types/subscription';
import type { LucideIcon } from 'lucide-react';

// Request type icons
const REQUEST_ICONS: Record<RequestType, LucideIcon> = {
  analyst_qa: HelpCircle,
  analyst_call: Phone,
  report_upgrade: FileText,
  expert_consult: Users,
  expert_deepdive: Briefcase,
  bespoke_project: Sparkles,
};

interface UpgradeRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpgradeRequestData) => Promise<void>;
  context?: RequestContext;
  defaultType?: RequestType;
  subscription: CompanySubscription;
}

interface UpgradeRequestData {
  type: RequestType;
  title: string;
  description: string;
  context?: RequestContext;
  estimatedCredits: number;
}

export function UpgradeRequestForm({
  isOpen,
  onClose,
  onSubmit,
  context,
  defaultType = 'report_upgrade',
  subscription,
}: UpgradeRequestFormProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [selectedType, setSelectedType] = useState<RequestType>(defaultType);
  const [title, setTitle] = useState(context?.reportTitle || '');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState<'type' | 'details' | 'confirm'>('type');

  // Focus management: store previous focus and restore on close
  useEffect(() => {
    if (isOpen) {
      // Store currently focused element before opening
      previousActiveElement.current = document.activeElement as HTMLElement;
      setSelectedType(defaultType);
      setTitle(context?.reportTitle || '');
      setDescription('');
      setStep('type');
      setIsSubmitting(false);
      setSubmitError(null);
      // Focus close button when modal opens
      closeButtonRef.current?.focus();
    } else {
      // Restore focus when modal closes
      previousActiveElement.current?.focus();
    }
  }, [isOpen, context, defaultType]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const typeInfo = getRequestTypeDisplay(selectedType);
  const cost = CREDIT_COSTS[selectedType];
  const approvalLevel = getApprovalLevel(cost?.typical || 0);
  const hasEnoughCredits = subscription.remainingCredits >= (cost?.typical || 0);

  const handleSubmit = async () => {
    if (!hasEnoughCredits) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        type: selectedType,
        title,
        description,
        context,
        estimatedCredits: cost?.typical || 0,
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit request:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestTypes: RequestType[] = [
    'report_upgrade',
    'analyst_qa',
    'analyst_call',
    'expert_consult',
    'expert_deepdive',
    'bespoke_project',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] mx-auto max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100">
                  <Star className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 id="upgrade-modal-title" className="text-lg font-semibold text-primary">Request Upgrade</h2>
                  <p className="text-xs text-secondary">
                    {step === 'type' && 'Choose upgrade type'}
                    {step === 'details' && 'Add details'}
                    {step === 'confirm' && 'Review & submit'}
                  </p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close upgrade request"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress indicator */}
            <div className="px-6 py-3 bg-slate-50 flex items-center gap-2">
              <StepIndicator active={step === 'type'} completed={step !== 'type'} label="Type" />
              <div className="flex-1 h-px bg-slate-200" />
              <StepIndicator active={step === 'details'} completed={step === 'confirm'} label="Details" />
              <div className="flex-1 h-px bg-slate-200" />
              <StepIndicator active={step === 'confirm'} completed={false} label="Submit" />
            </div>

            {/* Content */}
            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
              {/* Step 1: Select Type */}
              {step === 'type' && (
                <div className="space-y-3">
                  {requestTypes.map((type) => {
                    const info = getRequestTypeDisplay(type);
                    const typeCost = CREDIT_COSTS[type];
                    const Icon = REQUEST_ICONS[type];
                    const isSelected = selectedType === type;

                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`
                          w-full p-4 rounded-xl text-left transition-all duration-150
                          ${isSelected
                            ? 'bg-violet-50 border-2 border-violet-300 ring-2 ring-violet-100'
                            : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            p-2 rounded-lg
                            ${isSelected ? 'bg-violet-100' : 'bg-white'}
                          `}>
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-violet-600' : 'text-slate-500'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`font-medium ${isSelected ? 'text-violet-700' : 'text-primary'}`}>
                                {info.label}
                              </span>
                              <span className={`
                                text-sm font-medium tabular-nums
                                ${isSelected ? 'text-violet-600' : 'text-slate-500'}
                              `}>
                                {formatCredits(typeCost?.typical || 0)}
                              </span>
                            </div>
                            <p className="text-sm text-secondary mt-0.5">{info.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 2: Details */}
              {step === 'details' && (
                <div className="space-y-4">
                  {/* Context preview */}
                  {context?.reportTitle && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Upgrading report</p>
                      <p className="text-sm font-medium text-primary">{context.reportTitle}</p>
                    </div>
                  )}

                  {/* Title input */}
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">
                      Request Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Q2 Steel Pricing Analysis"
                      className="
                        w-full px-4 py-2.5 rounded-lg
                        bg-white border border-slate-200
                        text-primary placeholder:text-slate-400
                        focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300
                        transition-all
                      "
                    />
                  </div>

                  {/* Description input */}
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">
                      Additional Details
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what specific insights you need, any time constraints, or other requirements..."
                      rows={4}
                      className="
                        w-full px-4 py-2.5 rounded-lg
                        bg-white border border-slate-200
                        text-primary placeholder:text-slate-400
                        focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300
                        transition-all resize-none
                      "
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {step === 'confirm' && (
                <div className="space-y-4">
                  {/* Summary card */}
                  <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-violet-100">
                        {(() => {
                          const Icon = REQUEST_ICONS[selectedType];
                          return <Icon className="w-5 h-5 text-violet-600" />;
                        })()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary">{title || typeInfo.label}</h3>
                        <p className="text-sm text-secondary">{typeInfo.description}</p>
                      </div>
                    </div>

                    {description && (
                      <div className="p-3 rounded-lg bg-white/60 mb-4">
                        <p className="text-sm text-secondary">{description}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-3 border-t border-violet-200">
                      <span className="text-sm text-slate-600">Estimated cost</span>
                      <span className="text-lg font-semibold text-violet-700 tabular-nums flex items-center gap-1.5">
                        <Coins className="w-4 h-4" />
                        {formatCredits(cost?.typical || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Credit balance check */}
                  {!hasEnoughCredits ? (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700">Insufficient credits</p>
                        <p className="text-sm text-red-600 mt-0.5">
                          You have {formatCredits(subscription.remainingCredits)} credits. Contact your admin to add more.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-700">Credit balance OK</p>
                        <p className="text-sm text-emerald-600 mt-0.5">
                          Remaining after: {formatCredits(subscription.remainingCredits - (cost?.typical || 0))} credits
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Approval info */}
                  {approvalLevel !== 'auto' && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-700">
                          {getApprovalLevelDisplay(approvalLevel)}
                        </p>
                        <p className="text-sm text-amber-600 mt-0.5">
                          Requests over ${APPROVAL_THRESHOLDS.autoApprove} need approval. We'll notify your approver.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit error */}
                  {submitError && (
                    <div
                      role="alert"
                      aria-live="assertive"
                      className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700">Submission failed</p>
                        <p className="text-sm text-red-600 mt-0.5">{submitError}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              {step !== 'type' ? (
                <button
                  onClick={() => setStep(step === 'confirm' ? 'details' : 'type')}
                  className="text-sm text-secondary hover:text-primary font-medium"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step === 'type' && (
                <button
                  onClick={() => setStep('details')}
                  className="
                    flex items-center gap-2 px-4 py-2 rounded-lg
                    bg-violet-600 hover:bg-violet-700
                    text-white text-sm font-medium
                    transition-colors
                  "
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 'details' && (
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!title.trim()}
                  className="
                    flex items-center gap-2 px-4 py-2 rounded-lg
                    bg-violet-600 hover:bg-violet-700
                    text-white text-sm font-medium
                    transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  Review
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 'confirm' && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !hasEnoughCredits}
                  className="
                    flex items-center gap-2 px-4 py-2 rounded-lg
                    bg-violet-600 hover:bg-violet-700
                    text-white text-sm font-medium
                    transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Step indicator component
function StepIndicator({
  active,
  completed,
  label,
}: {
  active: boolean;
  completed: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`
        w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium
        ${completed
          ? 'bg-violet-500 text-white'
          : active
            ? 'bg-violet-100 text-violet-600 ring-2 ring-violet-200'
            : 'bg-slate-200 text-slate-500'
        }
      `}>
        {completed ? <CheckCircle className="w-3 h-3" /> : null}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-violet-600' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
  );
}
