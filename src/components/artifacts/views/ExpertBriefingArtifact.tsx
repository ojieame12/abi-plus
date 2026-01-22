// ExpertBriefingArtifact - Briefing form for expert deep-dive request
// Soft, polished design with session details and scheduling preference

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';

interface Expert {
  id: string;
  name: string;
  title: string;
  formerCompany?: string;
  expertise?: string;
  isTopVoice?: boolean;
}

interface ExpertBriefingArtifactProps {
  expert: Expert;
  category: string;
  credits: number;
  balanceAfter: number;
  requiresApproval?: boolean;
  onSubmit: (briefing: string, scheduling: string) => void;
  onBack: () => void;
}

// Feature item with check badge
const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2.5 py-1">
    <img src="/Check badge - Iconly Pro.svg" alt="" className="w-5 h-5 flex-shrink-0" />
    <span className="text-sm text-slate-600">{text}</span>
  </div>
);

// Scheduling options
const SCHEDULING_OPTIONS = [
  { id: 'this_week', label: 'This week' },
  { id: 'next_week', label: 'Next week' },
  { id: 'flexible', label: 'Flexible' },
];

export const ExpertBriefingArtifact = ({
  expert,
  category,
  credits,
  balanceAfter,
  requiresApproval = false,
  onSubmit,
  onBack,
}: ExpertBriefingArtifactProps) => {
  const [briefing, setBriefing] = useState('');
  const [scheduling, setScheduling] = useState('flexible');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!briefing.trim()) return;
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    onSubmit(briefing, scheduling);
    setIsSuccess(true);
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center bg-[#fafafa]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5"
        >
          <Check className="w-8 h-8 text-emerald-500" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {requiresApproval ? 'Request Submitted for Approval' : 'Request Submitted'}
          </h3>
          <p className="text-sm text-slate-500 mb-2 max-w-[280px]">
            {requiresApproval
              ? 'Your expert deep-dive request has been sent to your manager for approval.'
              : `We'll connect you with ${expert.name} within 48 hours.`}
          </p>
          <p className="text-sm text-slate-400 mb-6">
            You'll receive a calendar invite once scheduled.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            Back to Chat
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#fafafa] min-h-full">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-5 mb-4">
        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
          <img src="/Calling - Iconly Pro.svg" alt="" className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">Expert Deep-Dive</h3>
        <p className="text-sm text-slate-500">2-hour strategy session</p>
      </div>

      {/* Expert card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-5 mb-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Matched Expert</h4>
        <div className="flex items-start justify-between">
          <div>
            <h5 className="text-base font-medium text-slate-900">{expert.name}</h5>
            {expert.formerCompany && (
              <p className="text-sm text-slate-500">Former: {expert.formerCompany}</p>
            )}
            <p className="text-sm text-slate-400">{expert.title}</p>
          </div>
          {expert.isTopVoice && (
            <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
              TOP VOICE
            </span>
          )}
        </div>
      </div>

      {/* Session includes */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-5 mb-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Session includes</h4>
        <div className="space-y-0.5">
          <FeatureItem text="2-hour video call" />
          <FeatureItem text="Pre-session briefing doc" />
          <FeatureItem text="Follow-up summary report" />
          <FeatureItem text="30-day email access" />
        </div>
      </div>

      {/* Briefing input */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-5 mb-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Briefing for expert</h4>
        <textarea
          value={briefing}
          onChange={(e) => setBriefing(e.target.value)}
          placeholder={`Describe what you'd like to discuss about ${category}...`}
          className="w-full h-28 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
        />
      </div>

      {/* Scheduling preference */}
      <div className="mb-5">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Preferred scheduling</h4>
        <div className="flex gap-2">
          {SCHEDULING_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setScheduling(option.id)}
              className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                scheduling === option.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Credit summary */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-500">Cost</span>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-medium text-slate-700">{credits.toLocaleString()} credits</span>
            <img src="/Coins 1 - Iconly Pro.svg" alt="" className="w-4 h-4" />
          </div>
        </div>
        {requiresApproval ? (
          <div className="flex items-center gap-2 text-amber-600">
            <span className="text-sm">Requires manager approval</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Balance after</span>
            <span className="text-sm text-slate-600">{balanceAfter.toLocaleString()} credits</span>
          </div>
        )}
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !briefing.trim()}
        className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 text-white text-sm font-medium transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Request Introduction'}
      </button>
    </div>
  );
};

export default ExpertBriefingArtifact;
