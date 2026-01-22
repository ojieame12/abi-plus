// UpcomingEngagementsDrawer - View all upcoming engagements
// Matches CreditDrawer floating card aesthetic

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Video,
  MessageCircle,
  FileText,
  Clock,
} from 'lucide-react';
import type { ExpertEngagement } from '../../types/expert';

// Shared shadow for floating card aesthetic
const cardShadow = '0 4px 20px -8px rgba(148, 163, 184, 0.15)';

interface UpcomingEngagementsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  engagements: ExpertEngagement[];
  onJoinCall: (engagement: ExpertEngagement) => void;
  onReschedule: (engagement: ExpertEngagement) => void;
  onViewDetails: (engagement: ExpertEngagement) => void;
}

// Group engagements by date
function groupByDate(engagements: ExpertEngagement[]) {
  const groups: { [key: string]: ExpertEngagement[] } = {};
  const today = new Date().toDateString();
  const tomorrow = new Date(Date.now() + 86400000).toDateString();

  engagements.forEach((engagement) => {
    if (!engagement.scheduledAt) return;
    const date = new Date(engagement.scheduledAt);
    const dateString = date.toDateString();

    let key: string;
    if (dateString === today) {
      key = 'Today';
    } else if (dateString === tomorrow) {
      key = 'Tomorrow';
    } else {
      key = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(engagement);
  });

  return groups;
}

// Get icon based on engagement type
function getEngagementIcon(type: ExpertEngagement['type']) {
  switch (type) {
    case 'consultation':
      return { Icon: Video, color: 'text-emerald-500', bg: 'bg-emerald-50' };
    case 'deep_dive':
      return { Icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'quick_question':
      return { Icon: MessageCircle, color: 'text-violet-500', bg: 'bg-violet-50' };
    default:
      return { Icon: Calendar, color: 'text-slate-500', bg: 'bg-slate-50' };
  }
}

// Individual engagement card
function EngagementCard({
  engagement,
  isToday,
  onJoinCall,
  onReschedule,
  onViewDetails,
}: {
  engagement: ExpertEngagement;
  isToday: boolean;
  onJoinCall: (engagement: ExpertEngagement) => void;
  onReschedule: (engagement: ExpertEngagement) => void;
  onViewDetails: (engagement: ExpertEngagement) => void;
}) {
  const { Icon, color, bg } = getEngagementIcon(engagement.type);
  const time = engagement.scheduledAt
    ? new Date(engagement.scheduledAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : 'TBD';

  const isUpcoming = engagement.scheduledAt
    ? new Date(engagement.scheduledAt).getTime() - Date.now() < 30 * 60 * 1000
    : false;

  return (
    <div
      className={`p-4 rounded-[20px] bg-white border ${
        isToday && isUpcoming ? 'border-violet-200' : 'border-slate-100/60'
      }`}
      style={{ boxShadow: cardShadow }}
    >
      <div className="flex items-start gap-4">
        {/* Time Column */}
        <div className="text-center min-w-[56px] pt-1">
          <p className={`text-lg font-medium tabular-nums ${
            isToday && isUpcoming ? 'text-violet-600' : 'text-slate-700'
          }`}>
            {time.split(' ')[0]}
          </p>
          <p className="text-[10px] text-slate-400 uppercase">{time.split(' ')[1]}</p>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <div className={`p-2 rounded-xl ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-slate-700 truncate">{engagement.title}</h4>
              <p className="text-xs text-slate-400">
                {engagement.clientName} • {engagement.clientCompany}
              </p>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 mb-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {engagement.duration || 30} min
            </span>
            <span className="text-emerald-500 font-medium">${engagement.credits}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isToday && engagement.meetingUrl && (
              <button
                onClick={() => onJoinCall(engagement)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  isUpcoming
                    ? 'bg-violet-600 text-white hover:bg-violet-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isUpcoming ? 'Join Now' : 'Join'}
              </button>
            )}
            <button
              onClick={() => onViewDetails(engagement)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Details
            </button>
            <button
              onClick={() => onReschedule(engagement)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-100 transition-colors"
            >
              Reschedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UpcomingEngagementsDrawer({
  isOpen,
  onClose,
  engagements,
  onJoinCall,
  onReschedule,
  onViewDetails,
}: UpcomingEngagementsDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const grouped = groupByDate(engagements);
  const dateKeys = Object.keys(grouped);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#fafafa] shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="engagements-drawer-title"
          >
            {/* Header - Gradient hero style */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-slate-50 to-teal-50" />
              <div className="relative px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white shadow-sm border border-white/60">
                      <Calendar className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 id="engagements-drawer-title" className="text-lg font-medium text-slate-700">
                          Upcoming
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                          {engagements.length}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Your scheduled engagements</p>
                    </div>
                  </div>
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    aria-label="Close engagements drawer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white/60 hover:bg-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {engagements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-base font-medium text-slate-600 mb-1">No upcoming engagements</h3>
                  <p className="text-sm text-slate-400">
                    Your scheduled calls and sessions will appear here.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-5">
                  {dateKeys.map((dateKey) => (
                    <div key={dateKey}>
                      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3 px-1">
                        {dateKey}
                      </h3>
                      <div className="space-y-3">
                        {grouped[dateKey].map((engagement, index) => (
                          <motion.div
                            key={engagement.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <EngagementCard
                              engagement={engagement}
                              isToday={dateKey === 'Today'}
                              onJoinCall={onJoinCall}
                              onReschedule={onReschedule}
                              onViewDetails={onViewDetails}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Open Full Calendar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default UpcomingEngagementsDrawer;
