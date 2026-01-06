// Insight Banner - Highlights key takeaway from AI response
import type { ResponseInsight } from '../../types/aiResponse';
import { ChevronRight, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface InsightBannerProps {
  insight: ResponseInsight;
  onClick?: () => void;
}

export const InsightBanner = ({ insight, onClick }: InsightBannerProps) => {
  const { headline, explanation, summary, sentiment, icon } = insight;
  const detailText = summary || explanation;

  // All insights use teal base, with icon color varying by sentiment
  const getIconColor = () => {
    switch (sentiment) {
      case 'positive': return 'text-emerald-600 bg-emerald-100';
      case 'negative': return 'text-amber-600 bg-amber-100';
      default: return 'text-teal-600 bg-teal-100';
    }
  };

  // Icon selection
  const IconComponent = (() => {
    switch (icon) {
      case 'trending_up': return TrendingUp;
      case 'trending_down': return TrendingDown;
      case 'alert': return AlertTriangle;
      case 'check': return CheckCircle;
      case 'info':
      default: return Info;
    }
  })();

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left
        bg-teal-50 border border-teal-100
        ${onClick ? 'hover:bg-teal-100/70 hover:shadow-md cursor-pointer' : ''}
        transition-all duration-200 group
      `}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconColor()}`}>
        <IconComponent size={16} strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-900 text-sm">
          {headline}
        </div>
        {detailText && (
          <div className="text-xs text-slate-500 mt-0.5">
            {detailText}
          </div>
        )}
      </div>

      {/* Chevron */}
      {onClick && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-teal-500" strokeWidth={1.5} />
        </div>
      )}
    </button>
  );
};

// Compact version for inline use
export const InsightBadge = ({ insight }: { insight: ResponseInsight }) => {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
      {insight.sentiment === 'positive' ? '↑' : insight.sentiment === 'negative' ? '↓' : '→'}
      {insight.headline}
    </span>
  );
};

export default InsightBanner;
