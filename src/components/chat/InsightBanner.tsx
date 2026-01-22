// Insight Banner - Highlights key takeaway from AI response
import type { ResponseInsight } from '../../types/aiResponse';
import { InsightHeader } from '../ui/InsightHeader';

interface InsightBannerProps {
  insight: ResponseInsight;
  onClick?: () => void;
}

export const InsightBanner = ({ insight, onClick }: InsightBannerProps) => {
  const { headline, explanation, summary } = insight;
  const detailText = summary || explanation;

  return (
    <InsightHeader
      headline={headline}
      description={detailText}
      variant="banner"
      onClick={onClick}
    />
  );
};

// Compact version for inline use
export const InsightBadge = ({ insight }: { insight: ResponseInsight }) => {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-normal bg-teal-100 text-teal-700">
      {insight.sentiment === 'positive' ? '↑' : insight.sentiment === 'negative' ? '↓' : '→'}
      {insight.headline}
    </span>
  );
};

export default InsightBanner;
