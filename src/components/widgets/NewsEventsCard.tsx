// News Events Card Widget
// Shows recent news/events affecting a supplier or portfolio

import { motion } from 'framer-motion';
import {
  Newspaper,
  AlertTriangle,
  Scale,
  TrendingDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type EventType = 'news' | 'alert' | 'regulatory' | 'financial';
export type EventSentiment = 'positive' | 'negative' | 'neutral';
export type EventImpact = 'high' | 'medium' | 'low';

export interface NewsEvent {
  id: string;
  date: string;
  headline: string;
  source: string;
  type: EventType;
  sentiment: EventSentiment;
  impact?: EventImpact;
  url?: string;
}

export interface NewsEventsCardProps {
  title?: string;
  events: NewsEvent[];
  maxItems?: number;
  onViewAll?: () => void;
  onEventClick?: (event: NewsEvent) => void;
  delay?: number;
}

// ============================================
// CONSTANTS
// ============================================

const TYPE_CONFIG: Record<EventType, { icon: typeof Newspaper; label: string; color: string }> = {
  news: { icon: Newspaper, label: 'News', color: 'bg-blue-50 text-blue-600' },
  alert: { icon: AlertTriangle, label: 'Alert', color: 'bg-amber-50 text-amber-600' },
  regulatory: { icon: Scale, label: 'Regulatory', color: 'bg-violet-50 text-violet-600' },
  financial: { icon: TrendingDown, label: 'Financial', color: 'bg-slate-50 text-slate-600' },
};

const SENTIMENT_COLORS: Record<EventSentiment, string> = {
  positive: 'bg-emerald-500',
  negative: 'bg-red-500',
  neutral: 'bg-slate-400',
};

const IMPACT_STYLES: Record<EventImpact, { ring: string; dot: string }> = {
  high: { ring: 'ring-red-200', dot: 'bg-red-500' },
  medium: { ring: 'ring-amber-200', dot: 'bg-amber-500' },
  low: { ring: 'ring-slate-200', dot: 'bg-slate-400' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ============================================
// HELPER COMPONENTS
// ============================================

const EventItem = ({
  event,
  index,
  delay = 0,
  onClick
}: {
  event: NewsEvent;
  index: number;
  delay?: number;
  onClick?: () => void;
}) => {
  const typeConfig = TYPE_CONFIG[event.type];
  const TypeIcon = typeConfig.icon;
  const impactStyle = event.impact ? IMPACT_STYLES[event.impact] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: delay + 0.1 + index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onClick={onClick}
      className={`group p-3 rounded-xl hover:bg-slate-50/80 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Sentiment Indicator with Impact Ring */}
        <div className={`relative mt-1 ${impactStyle ? `ring-2 ${impactStyle.ring}` : ''} rounded-full`}>
          <div className={`w-2 h-2 rounded-full ${SENTIMENT_COLORS[event.sentiment]}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Type Badge & Date */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${typeConfig.color}`}>
              <TypeIcon size={10} />
              {typeConfig.label}
            </span>
            <span className="text-xs text-slate-400">{formatDate(event.date)}</span>
            {event.impact && (
              <span className={`w-1.5 h-1.5 rounded-full ${impactStyle?.dot}`} title={`${event.impact} impact`} />
            )}
          </div>

          {/* Headline */}
          <p className="text-sm text-slate-700 line-clamp-2 group-hover:text-slate-900 transition-colors">
            {event.headline}
          </p>

          {/* Source */}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-slate-400">{event.source}</span>
            {event.url && (
              <ExternalLink size={10} className="text-slate-300" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const NewsEventsCard = ({
  title = 'Recent Events',
  events,
  maxItems = 5,
  onViewAll,
  onEventClick,
  delay = 0,
}: NewsEventsCardProps) => {
  const displayedEvents = events.slice(0, maxItems);
  const hasMore = events.length > maxItems;

  // Count by sentiment
  const negativeCount = events.filter(e => e.sentiment === 'negative').length;
  const positiveCount = events.filter(e => e.sentiment === 'positive').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-normal text-slate-400 uppercase tracking-wider">
          {title}
        </div>
        <div className="flex items-center gap-3 text-xs">
          {negativeCount > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {negativeCount} negative
            </span>
          )}
          {positiveCount > 0 && (
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {positiveCount} positive
            </span>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-1 -mx-2">
        {displayedEvents.length > 0 ? (
          displayedEvents.map((event, index) => (
            <EventItem
              key={event.id}
              event={event}
              index={index}
              delay={delay}
              onClick={onEventClick ? () => onEventClick(event) : undefined}
            />
          ))
        ) : (
          <div className="text-center py-6 text-sm text-slate-400">
            No recent events
          </div>
        )}
      </div>

      {/* Footer - View All */}
      {hasMore && onViewAll && (
        <motion.button
          whileHover={{ x: 4 }}
          onClick={onViewAll}
          className="w-full mt-3 pt-3 border-t border-slate-100 flex items-center justify-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
        >
          View All Events ({events.length})
          <ChevronRight size={16} />
        </motion.button>
      )}
    </motion.div>
  );
};

export default NewsEventsCard;
