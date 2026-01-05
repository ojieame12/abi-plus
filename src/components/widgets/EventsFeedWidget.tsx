// EventsFeedWidget - Beautiful events/news feed for suppliers
import { motion } from 'framer-motion';
import { Newspaper, AlertTriangle, TrendingUp, TrendingDown, Bell, ExternalLink, Clock, ChevronRight } from 'lucide-react';

interface FeedEvent {
  id: string;
  type: 'news' | 'risk_change' | 'alert' | 'update';
  title: string;
  summary?: string;
  source?: string;
  sourceUrl?: string;
  timestamp: string;
  impact?: 'positive' | 'negative' | 'neutral';
  supplier?: string;
}

interface EventsFeedWidgetProps {
  title?: string;
  events: FeedEvent[];
  maxItems?: number;
  onViewAll?: () => void;
  onEventClick?: (event: FeedEvent) => void;
  delay?: number;
}

const eventTypeStyles = {
  news: {
    icon: Newspaper,
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    border: 'border-blue-100/60',
  },
  risk_change: {
    icon: TrendingUp,
    bg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    border: 'border-amber-100/60',
  },
  alert: {
    icon: AlertTriangle,
    bg: 'bg-red-50',
    iconColor: 'text-red-500',
    border: 'border-red-100/60',
  },
  update: {
    icon: Bell,
    bg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    border: 'border-violet-100/60',
  },
};

const impactStyles = {
  positive: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  negative: { bg: 'bg-red-100', text: 'text-red-700' },
  neutral: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export const EventsFeedWidget = ({
  title = 'Recent Events',
  events,
  maxItems = 5,
  onViewAll,
  onEventClick,
  delay = 0,
}: EventsFeedWidgetProps) => {
  const displayEvents = events.slice(0, maxItems);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="
        bg-white/80
        rounded-[1.25rem] border border-slate-100/60
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        ring-1 ring-black/[0.02]
        backdrop-blur-sm
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
            <Newspaper size={16} strokeWidth={1.5} />
          </div>
          <h4 className="text-[15px] font-medium text-slate-900">{title}</h4>
        </div>
        <span className="text-xs text-slate-400">{events.length} events</span>
      </div>

      {/* Events */}
      <div className="px-2 pb-2">
        {displayEvents.map((event, i) => {
          const typeStyle = eventTypeStyles[event.type];
          const Icon = typeStyle.icon;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 + i * 0.05 }}
              onClick={() => onEventClick?.(event)}
              className={`
                p-3 mx-1 my-1 rounded-xl
                border ${typeStyle.border}
                ${typeStyle.bg}
                ${onEventClick ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''}
                group
              `}
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div className={`
                  w-8 h-8 rounded-lg bg-white/60
                  flex items-center justify-center flex-shrink-0
                  ${typeStyle.iconColor}
                `}>
                  <Icon size={16} strokeWidth={1.5} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-sm font-medium text-slate-800 line-clamp-2">
                      {event.title}
                    </h5>
                    {event.impact && (
                      <span className={`
                        px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0
                        ${impactStyles[event.impact].bg}
                        ${impactStyles[event.impact].text}
                      `}>
                        {event.impact === 'positive' ? '↑' : event.impact === 'negative' ? '↓' : '—'}
                      </span>
                    )}
                  </div>

                  {event.summary && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {event.summary}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={10} strokeWidth={1.5} />
                      {event.timestamp}
                    </div>

                    {/* Source */}
                    {event.source && (
                      <>
                        <span className="text-slate-300">·</span>
                        {event.sourceUrl ? (
                          <a
                            href={event.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="
                              flex items-center gap-1 text-xs text-blue-600
                              hover:text-blue-700 transition-colors
                            "
                          >
                            {event.source}
                            <ExternalLink size={10} strokeWidth={1.5} />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">{event.source}</span>
                        )}
                      </>
                    )}

                    {/* Supplier tag */}
                    {event.supplier && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500">{event.supplier}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Hover indicator */}
                {onEventClick && (
                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-slate-400 transition-colors flex-shrink-0 mt-1"
                    strokeWidth={1.5}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* View all */}
      {onViewAll && events.length > maxItems && (
        <div className="px-4 py-3 border-t border-slate-100/60 bg-slate-50/30">
          <button
            onClick={onViewAll}
            className="
              w-full flex items-center justify-center gap-1.5
              text-sm font-medium text-slate-600
              hover:text-slate-900 transition-colors
              group
            "
          >
            View all {events.length} events
            <ChevronRight
              size={16}
              strokeWidth={1.5}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        </div>
      )}
    </motion.div>
  );
};
