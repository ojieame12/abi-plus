// Confidence Badge Component
// Shows "Decision Grade" for high confidence Beroe sources
// or "Web Research" for web-only responses

import { CheckCircle, Globe } from 'lucide-react';
import type { SourceConfidenceInfo } from '../../types/aiResponse';

interface ConfidenceBadgeProps {
  confidence: SourceConfidenceInfo;
  size?: 'sm' | 'md';
  className?: string;
}

export const ConfidenceBadge = ({
  confidence,
  size = 'sm',
  className = '',
}: ConfidenceBadgeProps) => {
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-2.5 py-1 text-sm gap-1.5';

  const iconSize = size === 'sm' ? 12 : 14;

  // HIGH confidence - Decision Grade Intelligence
  if (confidence.level === 'high') {
    return (
      <div
        className={`
          inline-flex items-center ${sizeClasses}
          bg-emerald-50 text-emerald-700
          rounded-full font-medium
          border border-emerald-100
          ${className}
        `}
      >
        <CheckCircle size={iconSize} className="text-emerald-500" />
        <span>Decision Grade</span>
      </div>
    );
  }

  // WEB_ONLY - Web Research
  if (confidence.level === 'web_only') {
    return (
      <div
        className={`
          inline-flex items-center ${sizeClasses}
          bg-slate-100 text-slate-600
          rounded-full font-medium
          border border-slate-200
          ${className}
        `}
      >
        <Globe size={iconSize} className="text-slate-500" />
        <span>Web Research</span>
      </div>
    );
  }

  // MEDIUM or LOW - no badge, just show sources
  // The WidgetFooter will show the "Expand to Web" suggestion instead
  return null;
};

export default ConfidenceBadge;
