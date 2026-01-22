// DeeperAnalysisArtifact - Polished progressive disclosure panel for value ladder options
// Shows three cards: Upgrade Report, Ask Analyst, Expert Deep-Dive

import { motion } from 'framer-motion';
import type { ValueLadder } from '../../../types/aiResponse';

interface DeeperAnalysisArtifactProps {
  queryText?: string;
  category?: string;
  valueLadder: ValueLadder;
  isManaged: boolean;
  credits: {
    upgrade: number;
    analyst: number;
    expert: number;
  };
  onRequestUpgrade?: () => void;
  onMessageAnalyst?: () => void;
  onRequestExpert?: () => void;
}

// Credit badge with coins icon on right
const CreditBadge = ({ credits }: { credits: number }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50/80 border border-violet-100/50">
    <span className="text-sm text-slate-600">{credits.toLocaleString()}</span>
    <img src="/Coins 1 - Iconly Pro.svg" alt="" className="w-4 h-4" />
  </div>
);

// Managed category badge with grater icon
const ManagedBadge = ({ category }: { category: string }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50/80 border border-teal-100/50">
    <img src="/Grater - Iconly Pro.svg" alt="" className="w-4 h-4" />
    <span className="text-sm text-teal-700">{category} is managed</span>
  </div>
);

// Feature item with check badge
const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2">
    <img src="/Check badge - Iconly Pro.svg" alt="" className="w-5 h-5 flex-shrink-0" />
    <span className="text-sm text-slate-600">{text}</span>
  </div>
);

// Default analyst when none provided
const DEFAULT_ANALYST = {
  name: 'Dr. James Morrison',
  specialty: 'Metals & Mining',
  photo: '/analyst-avatar.jpg',
  availability: 'available' as const,
  responseTime: '~4 hours',
};

// Default expert when none provided
const DEFAULT_EXPERT = {
  id: 'expert-001',
  name: 'Sarah Mitchell',
  title: 'Director of Metals Research',
  formerCompany: 'ArcelorMittal',
  expertise: 'Steel Markets',
  isTopVoice: true,
};

export const DeeperAnalysisArtifact = ({
  category = 'Steel',
  valueLadder,
  isManaged,
  credits,
  onRequestUpgrade,
  onMessageAnalyst,
  onRequestExpert,
}: DeeperAnalysisArtifactProps) => {
  // Use provided data or fallbacks
  const analyst = valueLadder.analystConnect?.analyst || DEFAULT_ANALYST;
  const expert = valueLadder.expertDeepDive?.matchedExpert || DEFAULT_EXPERT;

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.25, ease: 'easeOut' },
    }),
  };

  return (
    <div className="p-4 space-y-4 bg-[#fafafa] min-h-full">
      {/* Card 1: Upgrade Report */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="bg-white rounded-3xl border border-slate-100/80 p-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <img src="/Container.svg" alt="" className="w-6 h-6" />
          </div>
          <CreditBadge credits={credits.upgrade} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-slate-900 mb-1">
          Upgrade Report
        </h3>
        <p className="text-sm text-slate-500 mb-5">
          Decision Grade {category} Market Analysis
        </p>

        {/* Features in 2-column grid */}
        <div className="bg-slate-50/50 rounded-xl p-4 mb-5">
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <FeatureItem text="24-48 hour delivery" />
            <FeatureItem text="Supplier benchmarks" />
            <FeatureItem text="5-year forecast" />
            <FeatureItem text="Negotiation points" />
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onRequestUpgrade}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white text-sm font-medium transition-all"
        >
          Request Upgrade
        </button>
      </motion.div>

      {/* Card 2: Ask Analyst */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="bg-white rounded-3xl border border-slate-100/80 p-5"
      >
        {/* Header with avatar and managed badge */}
        <div className="flex items-start justify-between mb-4">
          {analyst.photo ? (
            <img
              src={analyst.photo}
              alt={analyst.name}
              className="w-11 h-11 rounded-full object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <span className="text-base font-medium text-slate-500">
                {analyst.name?.charAt(0) || 'A'}
              </span>
            </div>
          )}
          {isManaged && <ManagedBadge category={category} />}
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-slate-900 mb-0.5">
          Ask Analyst
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {analyst.name}
        </p>

        {/* Features in 2-column grid */}
        <div className="bg-slate-50/50 rounded-xl p-4 mb-5">
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <FeatureItem text={analyst.specialty} />
            <FeatureItem text={isManaged ? 'No credit cost' : `${credits.analyst.toLocaleString()} credits`} />
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onMessageAnalyst}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
        >
          Message Analyst
        </button>
      </motion.div>

      {/* Card 3: Expert Deep-Dive */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="bg-white rounded-3xl border border-slate-100/80 p-5"
      >
        {/* Header with phone icon and credit badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <img src="/Calling - Iconly Pro.svg" alt="" className="w-6 h-6" />
          </div>
          <CreditBadge credits={credits.expert} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-slate-900 mb-0.5">
          Expert Deep-Dive
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {expert.name} {expert.formerCompany && (
            <span className="block">Former: {expert.formerCompany}</span>
          )}
          {expert.title && (
            <span className="block">{expert.title}</span>
          )}
        </p>

        {/* Features in 2-column grid */}
        <div className="bg-slate-50/50 rounded-xl p-4 mb-5">
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <FeatureItem text="2-hour strategy session" />
            <FeatureItem text="Schedule 48 hours" />
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onRequestExpert}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
        >
          Request Upgrade
        </button>
      </motion.div>
    </div>
  );
};

export default DeeperAnalysisArtifact;
