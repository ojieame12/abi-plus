import { AlertTriangle, TrendingUp, Newspaper, Zap, ChevronRight } from 'lucide-react';
import type { EventTimelineData } from '../../types/widgets';

interface EventTimelineWidgetProps {
  data: EventTimelineData;
  size?: 'M' | 'L';
  onEventClick?: (eventId: string) => void;
}

const eventConfig = {
  risk_change: { icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
  news: { icon: Newspaper, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
  alert: { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
  action: { icon: Zap, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100' },
};

const severityDot = {
  info: 'bg-blue-400',
  warning: 'bg-amber-400',
  critical: 'bg-rose-500',
};

export const EventTimelineWidget = ({ data, size = 'M', onEventClick }: EventTimelineWidgetProps) => {
  const { events, timeRange } = data;
  const displayEvents = size === 'L' ? events : events.slice(0, 4);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[1.25rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02] overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-normal text-slate-900">Recent Events</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {timeRange.start} - {timeRange.end}
            </p>
          </div>
          <span className="text-[12px] px-2 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
            {events.length} events
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 pb-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[17px] top-2 bottom-2 w-px bg-slate-100" />

          {/* Events */}
          <div className="space-y-4">
            {displayEvents.map((event, i) => {
              const config = eventConfig[event.type];
              const Icon = config.icon;

              return (
                <div
                  key={event.id}
                  className="relative flex gap-4 group cursor-pointer"
                  onClick={() => onEventClick?.(event.id)}
                >
                  {/* Icon */}
                  <div className={`relative z-10 w-9 h-9 rounded-2xl ${config.bg} ${config.border} border flex items-center justify-center flex-shrink-0`}>
                    <Icon size={16} strokeWidth={1.5} className={config.color} />
                    {event.severity && (
                      <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${severityDot[event.severity]} ring-2 ring-white`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] text-slate-800 group-hover:text-violet-600 transition-colors truncate">
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        {event.supplierName && (
                          <span className="inline-block text-[11px] text-slate-500 mt-1 px-1.5 py-0.5 bg-slate-50 rounded">
                            {event.supplierName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap flex-shrink-0">
                        {formatDate(event.date)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      {events.length > displayEvents.length && (
        <div className="px-5 py-3 bg-slate-50/40 border-t border-slate-100/60">
          <button className="flex items-center gap-1 text-[12px] text-violet-600 hover:text-violet-700 transition-colors">
            View all {events.length} events
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
};
