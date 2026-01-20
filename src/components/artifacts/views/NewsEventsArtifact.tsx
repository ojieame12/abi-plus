// News Events Artifact
// Full news feed with filters

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper,
  AlertTriangle,
  Scale,
  TrendingDown,
  Search,
  Calendar,
  Bell,
  Download,
  ExternalLink,
} from 'lucide-react';
import { ArtifactFooter, TextInput } from '../primitives';

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
  summary?: string;
  source: string;
  url?: string;
  type: EventType;
  sentiment: EventSentiment;
  impact?: EventImpact;
  supplierName?: string;
  supplierId?: string;
}

export interface NewsEventsArtifactProps {
  title?: string;
  context?: {
    type: 'supplier' | 'portfolio';
    name?: string;
    id?: string;
  };
  events: NewsEvent[];
  onSetAlert?: () => void;
  onExport?: () => void;
  onEventClick?: (event: NewsEvent) => void;
  onClose?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const TYPE_CONFIG: Record<EventType, { icon: typeof Newspaper; label: string; color: string }> = {
  news: { icon: Newspaper, label: 'News', color: 'bg-blue-50 text-blue-600 ring-blue-200' },
  alert: { icon: AlertTriangle, label: 'Alert', color: 'bg-amber-50 text-amber-600 ring-amber-200' },
  regulatory: { icon: Scale, label: 'Regulatory', color: 'bg-violet-50 text-violet-600 ring-violet-200' },
  financial: { icon: TrendingDown, label: 'Financial', color: 'bg-slate-50 text-slate-600 ring-slate-200' },
};

const SENTIMENT_STYLES: Record<EventSentiment, { color: string; bg: string; label: string }> = {
  positive: { color: 'text-emerald-700', bg: 'bg-emerald-500', label: 'Positive' },
  negative: { color: 'text-red-700', bg: 'bg-red-500', label: 'Negative' },
  neutral: { color: 'text-slate-600', bg: 'bg-slate-400', label: 'Neutral' },
};

const IMPACT_STYLES: Record<EventImpact, { ring: string; dot: string; label: string }> = {
  high: { ring: 'ring-red-200', dot: 'bg-red-500', label: 'High Impact' },
  medium: { ring: 'ring-amber-200', dot: 'bg-amber-500', label: 'Medium Impact' },
  low: { ring: 'ring-slate-200', dot: 'bg-slate-400', label: 'Low Impact' },
};

type TabType = 'all' | 'news' | 'alert' | 'regulatory' | 'financial';
type DateRange = 'all' | '7d' | '30d' | '90d';

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatRelativeDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateStr);
};

const groupEventsByDate = (events: NewsEvent[]) => {
  const groups: Record<string, NewsEvent[]> = {};

  events.forEach(event => {
    const date = new Date(event.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
  });

  return Object.entries(groups).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================

const SentimentStats = ({ events }: { events: NewsEvent[] }) => {
  const stats = {
    positive: events.filter(e => e.sentiment === 'positive').length,
    negative: events.filter(e => e.sentiment === 'negative').length,
    neutral: events.filter(e => e.sentiment === 'neutral').length,
  };

  return (
    <div className="flex items-center gap-4">
      {Object.entries(stats).map(([sentiment, count]) => {
        const style = SENTIMENT_STYLES[sentiment as EventSentiment];
        return (
          <div key={sentiment} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${style.bg}`} />
            <span className={`text-xs ${style.color}`}>
              {count} {style.label.toLowerCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const EventCard = ({
  event,
  onClick,
  index,
}: {
  event: NewsEvent;
  onClick?: () => void;
  index: number;
}) => {
  const typeConfig = TYPE_CONFIG[event.type];
  const TypeIcon = typeConfig.icon;
  const sentimentStyle = SENTIMENT_STYLES[event.sentiment];
  const impactStyle = event.impact ? IMPACT_STYLES[event.impact] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      onClick={onClick}
      className={`group p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-all ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Sentiment Indicator */}
        <div className={`relative mt-1 ${impactStyle ? `ring-2 ${impactStyle.ring}` : ''} rounded-full p-0.5`}>
          <div className={`w-2.5 h-2.5 rounded-full ${sentimentStyle.bg}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Type Badge & Date */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ring-1 ${typeConfig.color}`}>
              <TypeIcon size={10} />
              {typeConfig.label}
            </span>
            {event.impact && (
              <span className={`w-1.5 h-1.5 rounded-full ${impactStyle?.dot}`} title={impactStyle?.label} />
            )}
            <span className="text-xs text-slate-400">{formatRelativeDate(event.date)}</span>
          </div>

          {/* Headline */}
          <h4 className="text-sm font-medium text-slate-800 group-hover:text-slate-900 mb-1">
            {event.headline}
          </h4>

          {/* Summary */}
          {event.summary && (
            <p className="text-xs text-slate-500 line-clamp-2 mb-2">
              {event.summary}
            </p>
          )}

          {/* Source & Supplier */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{event.source}</span>
            {event.url && <ExternalLink size={10} className="text-slate-300" />}
            {event.supplierName && (
              <>
                <span>•</span>
                <span className="text-violet-500">{event.supplierName}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DateGroup = ({
  date,
  events,
  onEventClick,
  startIndex,
}: {
  date: string;
  events: NewsEvent[];
  onEventClick?: (event: NewsEvent) => void;
  startIndex: number;
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 py-2">
        <Calendar size={12} className="text-slate-400" />
        <span className="text-xs font-medium text-slate-500">
          {formatDate(date)}
        </span>
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-xs text-slate-400">{events.length} events</span>
      </div>
      {events.map((event, i) => (
        <EventCard
          key={event.id}
          event={event}
          onClick={onEventClick ? () => onEventClick(event) : undefined}
          index={startIndex + i}
        />
      ))}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const NewsEventsArtifact = ({
  context,
  events,
  onSetAlert,
  onExport,
  onEventClick,
}: NewsEventsArtifactProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');

  // Filter events
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Type filter
    if (activeTab !== 'all') {
      result = result.filter(e => e.type === activeTab);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.headline.toLowerCase().includes(query) ||
        e.summary?.toLowerCase().includes(query) ||
        e.source.toLowerCase().includes(query) ||
        e.supplierName?.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      result = result.filter(e => new Date(e.date) >= cutoff);
    }

    // Sort by date
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [events, activeTab, searchQuery, dateRange]);

  const groupedEvents = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);

  // Calculate tab counts
  const tabCounts = useMemo(() => ({
    all: events.length,
    news: events.filter(e => e.type === 'news').length,
    alert: events.filter(e => e.type === 'alert').length,
    regulatory: events.filter(e => e.type === 'regulatory').length,
    financial: events.filter(e => e.type === 'financial').length,
  }), [events]);

  let eventIndex = 0;

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-4">
        {/* Context Banner */}
        {context && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <Newspaper size={20} className="text-slate-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {context.type === 'supplier' ? `Events for ${context.name}` : 'Portfolio Events'}
                </p>
                <p className="text-xs text-slate-500">{events.length} total events</p>
              </div>
            </div>
            <SentimentStats events={events} />
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
          {(['all', 'news', 'alert', 'regulatory', 'financial'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tabCounts[tab]})
            </button>
          ))}
        </div>

        {/* Search & Date Range */}
        <div className="flex gap-3">
          <div className="flex-1">
            <TextInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              icon={<Search size={16} />}
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
            {(['all', '7d', '30d', '90d'] as DateRange[]).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  dateRange === range
                    ? 'bg-white text-slate-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {range === 'all' ? 'All' : range}
              </button>
            ))}
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {groupedEvents.length > 0 ? (
            groupedEvents.map(([date, dateEvents]) => {
              const component = (
                <DateGroup
                  key={date}
                  date={date}
                  events={dateEvents}
                  onEventClick={onEventClick}
                  startIndex={eventIndex}
                />
              );
              eventIndex += dateEvents.length;
              return component;
            })
          ) : (
            <div className="text-center py-12 text-sm text-slate-400">
              No events match your filters
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <ArtifactFooter
        primaryAction={{
          id: 'alert',
          label: 'Set Alert',
          variant: 'primary',
          onClick: () => onSetAlert?.(),
          icon: <Bell size={16} />,
        }}
        secondaryAction={{
          id: 'export',
          label: 'Export',
          variant: 'secondary',
          onClick: () => onExport?.(),
          icon: <Download size={16} />,
        }}
      />
    </div>
  );
};

export default NewsEventsArtifact;
