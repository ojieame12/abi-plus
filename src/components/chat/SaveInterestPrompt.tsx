/**
 * InterestTrackingPanel
 *
 * Inline panel for tracking a detected topic as an interest.
 * Expands below the response footer when the Track button is clicked.
 * Light bg panel, pill-shaped inputs, side-by-side region/grade.
 */

import { useState, useEffect } from 'react';
import { X, Loader2, ShieldCheck, AlertTriangle, Globe, ChevronRight, Zap } from 'lucide-react';
import { computeCoverage } from '../../services/interestService';
import type { CoverageLevel, InterestCoverage } from '../../types/interests';

interface InterestTrackingPanelProps {
  detectedTopic: string;
  detectedRegion?: string;
  detectedGrade?: string;
  onTrack: (interest: { text: string; region?: string; grade?: string }) => void;
  onClose: () => void;
  isLoading?: boolean;
  /** Static duplicate flag for initial render (from detected topic) */
  isDuplicate: boolean;
  /** Dynamic duplicate checker — called as user edits the topic name */
  checkDuplicate?: (text: string) => boolean;
  onUpdateExisting?: () => void;
}

const getCoverageIcon = (level: CoverageLevel) => {
  switch (level) {
    case 'decision_grade':
      return <ShieldCheck className="w-3.5 h-3.5" />;
    case 'available':
      return <Zap className="w-3.5 h-3.5" />;
    case 'partial':
      return <AlertTriangle className="w-3.5 h-3.5" />;
    case 'web_only':
      return <Globe className="w-3.5 h-3.5" />;
  }
};

const getCoverageLabel = (level: CoverageLevel) => {
  switch (level) {
    case 'decision_grade':
      return 'Decision Grade';
    case 'available':
      return 'Available';
    case 'partial':
      return 'Partial Coverage';
    case 'web_only':
      return 'Web Only';
  }
};

const getCoverageStyle = (level: CoverageLevel) => {
  switch (level) {
    case 'decision_grade':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'available':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'partial':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'web_only':
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const inputClass = 'bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all';

export const InterestTrackingPanel = ({
  detectedTopic,
  detectedRegion,
  detectedGrade,
  onTrack,
  onClose,
  isLoading = false,
  isDuplicate,
  checkDuplicate,
  onUpdateExisting,
}: InterestTrackingPanelProps) => {
  const [topicName, setTopicName] = useState(detectedTopic);
  const [region, setRegion] = useState(detectedRegion || '');
  const [grade, setGrade] = useState(detectedGrade || '');
  const [coverage, setCoverage] = useState<InterestCoverage | null>(null);

  // Reactive duplicate detection: re-check as user edits the topic
  const isCurrentlyDuplicate = checkDuplicate
    ? checkDuplicate(topicName.trim())
    : isDuplicate;

  useEffect(() => {
    const result = computeCoverage(
      topicName,
      region.trim() || undefined,
      grade.trim() || undefined,
    );
    setCoverage(result);
  }, [topicName, region, grade]);

  const handleSave = () => {
    onTrack({
      text: topicName.trim(),
      region: region.trim() || undefined,
      grade: grade.trim() || undefined,
    });
  };

  // Duplicate state
  if (isCurrentlyDuplicate) {
    return (
      <div
        className="bg-slate-50 rounded-2xl p-6 mt-3"
        data-testid="interest-panel-duplicate"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-normal text-slate-900">Category Already Tracked</h3>
            <p className="text-sm text-slate-400 mt-1">
              You're already following a similar topic, Abi will personalize future responses
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 ml-4"
            data-testid="dismiss-button"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          {onUpdateExisting && (
            <button
              onClick={onUpdateExisting}
              className="flex items-center justify-between min-w-[180px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium transition-colors"
              data-testid="update-existing-button"
            >
              Update
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {coverage?.gapReason && (
            <p className="text-xs text-slate-400">{coverage.gapReason}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-slate-50 rounded-2xl p-6 mt-3"
      data-testid="interest-tracking-panel"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-xl font-normal text-slate-900">Track this Topic</h3>
          <p className="text-sm text-slate-400 mt-1">Abi will personalize future responses</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 ml-4"
          data-testid="dismiss-button"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Category input with inline coverage badge */}
      <div className="flex items-center gap-3 mb-3">
        <input
          type="text"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
          className={`flex-1 ${inputClass}`}
          data-testid="detected-topic"
          placeholder="Category"
        />
        {coverage && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${getCoverageStyle(coverage.level)}`}
            data-testid="coverage-indicator"
          >
            {getCoverageIcon(coverage.level)}
            {getCoverageLabel(coverage.level)}
          </span>
        )}
      </div>

      {/* Region + Grade/Type — side by side */}
      <div className="flex gap-3 mb-5" data-testid="detail-fields">
        <input
          type="text"
          placeholder="Region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className={`flex-1 ${inputClass}`}
          data-testid="region-input"
        />
        <input
          type="text"
          placeholder="Grade/Type"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className={`flex-1 ${inputClass}`}
          data-testid="grade-input"
        />
      </div>

      {/* Actions row: CTA button + gap reason */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isLoading || !topicName.trim()}
          className="flex items-center justify-between min-w-[180px] px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 text-white text-sm font-medium transition-colors"
          data-testid="save-button"
        >
          <span className="flex items-center gap-2">
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Track
          </span>
          <ChevronRight className="w-4 h-4" />
        </button>
        {coverage?.gapReason && (
          <p className="text-xs text-slate-400">{coverage.gapReason}</p>
        )}
      </div>
    </div>
  );
};

/** @deprecated Use InterestTrackingPanel instead */
export const SaveInterestPrompt = InterestTrackingPanel;
