/**
 * DeepResearchInterstitial
 *
 * Inline card component shown when a query scores >= 0.75 for deep research intent.
 * Displays detected signals, credit cost, time estimate, and action buttons.
 */

import { Brain, Sparkles, Clock, Coins, X, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DeepResearchScore } from '../../services/deepResearchScoring';
import { getStudyTypeLabel, getStudyTypeDescription } from '../../services/deepResearchScoring';

interface DeepResearchInterstitialProps {
  /** The scoring result from scoreDeepResearchIntent */
  scoreResult: DeepResearchScore;
  /** The original query text */
  query: string;
  /** Available credits for the user */
  creditsAvailable: number;
  /** Called when user clicks "Start Deep Research" */
  onConfirm: () => void;
  /** Called when user clicks "Just answer normally" */
  onSkip: () => void;
  /** Optional: show loading state on confirm button */
  isLoading?: boolean;
}

export const DeepResearchInterstitial = ({
  scoreResult,
  query,
  creditsAvailable,
  onConfirm,
  onSkip,
  isLoading = false,
}: DeepResearchInterstitialProps) => {
  const {
    inferredStudyType,
    matchedSignals,
    estimatedCredits,
    estimatedTime,
  } = scoreResult;

  const hasEnoughCredits = creditsAvailable >= estimatedCredits;
  const topSignals = matchedSignals
    .filter(s => s.category === 'high' || s.category === 'medium')
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="bg-gradient-to-br from-violet-50 via-white to-indigo-50 border border-violet-200 rounded-2xl p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            This looks like a deep research request
            <Sparkles className="w-4 h-4 text-amber-500" />
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {getStudyTypeDescription(inferredStudyType)}
          </p>
        </div>
        <button
          onClick={onSkip}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Detected signals */}
      {topSignals.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Detected Signals
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topSignals.map((signal, idx) => (
              <span
                key={idx}
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  signal.category === 'high'
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {signal.pattern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Query preview */}
      <div className="mb-4 p-3 bg-white/60 border border-slate-100 rounded-xl">
        <p className="text-xs font-medium text-slate-500 mb-1">Your query</p>
        <p className="text-sm text-slate-700 line-clamp-2">{query}</p>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4 py-2 px-3 bg-white/40 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Study Type</p>
            <p className="text-sm font-medium text-slate-700">{getStudyTypeLabel(inferredStudyType)}</p>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Credits</p>
            <p className="text-sm font-medium text-slate-700">
              {estimatedCredits.toLocaleString()}
              <span className="text-slate-400 font-normal"> / {creditsAvailable.toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Est. Time</p>
            <p className="text-sm font-medium text-slate-700">{estimatedTime}</p>
          </div>
        </div>
      </div>

      {/* Insufficient credits warning */}
      {!hasEnoughCredits && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            <strong>Not enough credits.</strong> You need {estimatedCredits.toLocaleString()} credits but only have {creditsAvailable.toLocaleString()}.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onConfirm}
          disabled={!hasEnoughCredits || isLoading}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            hasEnoughCredits && !isLoading
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm hover:shadow'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Start Deep Research
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <button
          onClick={onSkip}
          disabled={isLoading}
          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Just answer normally
        </button>
      </div>

      {/* Footer note */}
      <p className="mt-3 text-xs text-slate-400 text-center">
        Deep Research provides comprehensive, multi-source analysis with citations
      </p>
    </motion.div>
  );
};

export default DeepResearchInterstitial;
