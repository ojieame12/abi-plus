// Alternatives Preview Card Widget
// Quick preview of alternative suppliers

import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import type { RiskLevel } from '../../types/supplier';

// ============================================
// TYPES
// ============================================

export interface AlternativeSupplier {
  id: string;
  name: string;
  score: number;
  level: RiskLevel;
  category: string;
  matchScore: number; // % match to current supplier (0-100)
}

export interface AlternativesPreviewCardProps {
  currentSupplier: string;
  currentScore: number;
  alternatives: AlternativeSupplier[];
  onViewAll?: () => void;
  onSelect?: (id: string) => void;
  delay?: number;
}

// ============================================
// CONSTANTS
// ============================================

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'medium-high': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  unrated: { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400' },
};

// ============================================
// HELPER COMPONENTS
// ============================================

const MatchBadge = ({ score }: { score: number }) => {
  // Color based on match score
  const color = score >= 90
    ? 'bg-emerald-50 text-emerald-700'
    : score >= 75
    ? 'bg-blue-50 text-blue-700'
    : 'bg-slate-50 text-slate-600';

  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${color}`}>
      {score}% match
    </span>
  );
};

const ScoreComparison = ({
  alternativeScore,
  currentScore
}: {
  alternativeScore: number;
  currentScore: number;
}) => {
  const diff = currentScore - alternativeScore;
  const isBetter = diff > 0;
  const isWorse = diff < 0;

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium text-slate-900">{alternativeScore}</span>
      {diff !== 0 && (
        <span className={`text-[10px] font-medium ${isBetter ? 'text-emerald-600' : isWorse ? 'text-red-600' : 'text-slate-400'}`}>
          {isBetter ? `−${diff}` : `+${Math.abs(diff)}`}
        </span>
      )}
    </div>
  );
};

const AlternativeItem = ({
  alternative,
  currentScore,
  index,
  delay = 0,
  onSelect,
}: {
  alternative: AlternativeSupplier;
  currentScore: number;
  index: number;
  delay?: number;
  onSelect?: (id: string) => void;
}) => {
  const colors = RISK_COLORS[alternative.level];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: delay + 0.15 + index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onClick={() => onSelect?.(alternative.id)}
      className={`group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-all ${onSelect ? 'cursor-pointer' : ''}`}
    >
      {/* Risk Indicator */}
      <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-slate-900 truncate">
            {alternative.name}
          </span>
          <MatchBadge score={alternative.matchScore} />
        </div>
        <span className="text-xs text-slate-500">{alternative.category}</span>
      </div>

      {/* Score */}
      <ScoreComparison
        alternativeScore={alternative.score}
        currentScore={currentScore}
      />

      {/* Arrow on hover */}
      {onSelect && (
        <ChevronRight
          size={16}
          className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const AlternativesPreviewCard = ({
  currentSupplier,
  currentScore,
  alternatives,
  onViewAll,
  onSelect,
  delay = 0,
}: AlternativesPreviewCardProps) => {
  // Show max 3 alternatives in preview
  const displayedAlternatives = alternatives.slice(0, 3);
  const hasMore = alternatives.length > 3;

  // Find best alternative (lowest risk score)
  const bestAlternative = [...alternatives].sort((a, b) => a.score - b.score)[0];
  const potentialImprovement = bestAlternative
    ? Math.max(0, currentScore - bestAlternative.score)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-violet-500" />
            <span className="text-xs font-normal text-slate-400 uppercase tracking-wider">
              Alternatives
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Replacing</span>
            <span className="font-medium text-slate-900">{currentSupplier}</span>
            <ArrowRight size={14} className="text-slate-400" />
          </div>
        </div>

        {/* Potential Improvement Badge */}
        {potentialImprovement > 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + 0.3 }}
            className="px-2.5 py-1 bg-emerald-50 rounded-lg"
          >
            <span className="text-xs font-medium text-emerald-700">
              Up to −{potentialImprovement} risk
            </span>
          </motion.div>
        )}
      </div>

      {/* Alternatives List */}
      <div className="space-y-1 -mx-2">
        {displayedAlternatives.length > 0 ? (
          displayedAlternatives.map((alternative, index) => (
            <AlternativeItem
              key={alternative.id}
              alternative={alternative}
              currentScore={currentScore}
              index={index}
              delay={delay}
              onSelect={onSelect}
            />
          ))
        ) : (
          <div className="text-center py-6 text-sm text-slate-400">
            No alternatives found
          </div>
        )}
      </div>

      {/* Footer Action */}
      {(hasMore || onViewAll) && (
        <motion.button
          whileHover={{ x: 4 }}
          onClick={onViewAll}
          className="w-full mt-3 pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
        >
          Find More Alternatives {hasMore && `(${alternatives.length} total)`}
          <ChevronRight size={16} />
        </motion.button>
      )}
    </motion.div>
  );
};

export default AlternativesPreviewCard;
