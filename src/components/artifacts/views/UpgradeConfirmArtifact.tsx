// UpgradeConfirmArtifact - Confirmation view for decision-grade report upgrade
// Soft, polished design with credit summary and optional context

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Calendar, Mail } from 'lucide-react';

interface UpgradeConfirmArtifactProps {
  category: string;
  credits: number;
  balanceAfter: number;
  onConfirm: (context?: string) => void;
  onBack: () => void;
}

// Feature item with check badge
const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2.5 py-1">
    <img src="/Check badge - Iconly Pro.svg" alt="" className="w-5 h-5 flex-shrink-0" />
    <span className="text-sm text-slate-600">{text}</span>
  </div>
);

// Credit badge
const CreditBadge = ({ credits }: { credits: number }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-base text-slate-700">{credits.toLocaleString()} credits</span>
    <img src="/Coins 1 - Iconly Pro.svg" alt="" className="w-4 h-4" />
  </div>
);

export const UpgradeConfirmArtifact = ({
  category,
  credits,
  balanceAfter,
  onConfirm,
  onBack,
}: UpgradeConfirmArtifactProps) => {
  const [context, setContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    onConfirm(context || undefined);
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
          <h3 className="text-lg font-medium text-slate-900 mb-2">Request Submitted</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-[280px]">
            Your Decision Grade {category} Market Analysis will be delivered within 24-48 hours.
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
          <img src="/Container.svg" alt="" className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">Decision Grade Report</h3>
        <p className="text-sm text-slate-500">{category} Market Analysis</p>
      </div>

      {/* What you'll receive */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-5 mb-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">What you'll receive</h4>
        <div className="space-y-0.5">
          <FeatureItem text="Executive summary" />
          <FeatureItem text="5-year price forecast" />
          <FeatureItem text="Supplier benchmarks" />
          <FeatureItem text="Negotiation talking points" />
          <FeatureItem text="Risk assessment" />
        </div>
      </div>

      {/* Delivery info */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-5 mb-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Delivery</h4>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-sm text-slate-600">24-48 hours</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
              <Mail className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-sm text-slate-600">Delivered to your inbox</span>
          </div>
        </div>
      </div>

      {/* Optional context */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-5 mb-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Add context (optional)</h4>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Any specific areas to focus on..."
          className="w-full h-24 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
        />
      </div>

      {/* Credit summary */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-500">Cost</span>
          <CreditBadge credits={credits} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Balance after</span>
          <span className="text-sm text-slate-600">{balanceAfter.toLocaleString()} credits</span>
        </div>
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={isSubmitting}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 disabled:opacity-70 text-white text-sm font-medium transition-all"
      >
        {isSubmitting ? 'Submitting...' : 'Confirm Request'}
      </button>
    </div>
  );
};

export default UpgradeConfirmArtifact;
