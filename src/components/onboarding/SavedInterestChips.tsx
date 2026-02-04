// SavedInterestChips — displays saved interests with coverage dots and remove buttons
// Uses the floaty card pattern with spring entrance animation

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Interest } from '../../types/interests';
import type { CoverageLevel } from '../../types/interests';

interface SavedInterestChipsProps {
  interests: Interest[];
  onRemove: (id: string) => void;
}

const COVERAGE_DOT_COLOR: Record<CoverageLevel, string> = {
  decision_grade: 'bg-emerald-500',
  available: 'bg-blue-500',
  partial: 'bg-amber-500',
  web_only: 'bg-slate-400',
};

const COVERAGE_LABEL: Record<CoverageLevel, string> = {
  decision_grade: 'Decision Grade',
  available: 'Available',
  partial: 'Partial',
  web_only: 'Web Only',
};

export function SavedInterestChips({ interests, onRemove }: SavedInterestChipsProps) {
  if (interests.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" data-testid="saved-interest-chips">
      <AnimatePresence>
        {interests.map(interest => {
          const level = interest.coverage?.level ?? 'web_only';
          const displayText = interest.text.length > 60
            ? interest.text.slice(0, 57) + '...'
            : interest.text;

          return (
            <motion.div
              key={interest.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="inline-flex items-center gap-2 px-3 py-2
                bg-white/80 backdrop-blur-sm
                border border-white/60
                shadow-[0_8px_30px_rgb(0,0,0,0.04)]
                ring-1 ring-black/[0.02]
                rounded-xl"
              data-testid={`saved-chip-${interest.id}`}
            >
              {/* Coverage dot */}
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${COVERAGE_DOT_COLOR[level]}`}
                title={COVERAGE_LABEL[level]}
                role="status"
                aria-label={`${COVERAGE_LABEL[level]} coverage`}
              />
              {/* Text */}
              <span className="text-sm font-medium text-slate-700">
                {displayText}
              </span>
              {/* Region pill */}
              {interest.region && (
                <span className="text-[11px] text-slate-400">
                  {interest.region}
                </span>
              )}
              {/* Remove button */}
              <button
                onClick={() => onRemove(interest.id)}
                className="ml-0.5 text-slate-300 hover:text-slate-600 transition-colors flex-shrink-0"
                aria-label={`Remove ${interest.text}`}
                data-testid={`remove-chip-${interest.id}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
