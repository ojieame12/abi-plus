// Insight Banner - Highlights key takeaway from AI response
import type { ResponseInsight } from '../../types/aiResponse';

interface InsightBannerProps {
  insight: ResponseInsight;
}

export const InsightBanner = ({ insight }: InsightBannerProps) => {
  const { headline, explanation, sentiment, icon } = insight;

  // Sentiment-based styling
  const sentimentStyles = {
    positive: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      headline: 'text-green-900',
      text: 'text-green-700',
    },
    negative: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      headline: 'text-red-900',
      text: 'text-red-700',
    },
    neutral: {
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      icon: 'text-violet-600',
      headline: 'text-violet-900',
      text: 'text-violet-700',
    },
  };

  const styles = sentimentStyles[sentiment];

  // Icon selection
  const renderIcon = () => {
    switch (icon) {
      case 'trending_up':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'trending_down':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case 'alert':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'check':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl ${styles.bg} border ${styles.border}`}>
      <div className={`flex-shrink-0 ${styles.icon}`}>
        {renderIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-normal ${styles.headline}`}>
          {headline}
        </div>
        <div className={`text-sm mt-0.5 ${styles.text}`}>
          {explanation}
        </div>
      </div>
    </div>
  );
};

// Compact version for inline use
export const InsightBadge = ({ insight }: { insight: ResponseInsight }) => {
  const bgColor = insight.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
    insight.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
    'bg-violet-100 text-violet-700';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
      {insight.sentiment === 'positive' ? '↑' : insight.sentiment === 'negative' ? '↓' : '→'}
      {insight.headline}
    </span>
  );
};

export default InsightBanner;
