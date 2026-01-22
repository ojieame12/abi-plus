// PastEngagementsDrawer - View all past completed engagements
// Matches CreditDrawer floating card aesthetic

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  History,
  Video,
  FileText,
  Briefcase,
  Star,
  Clock,
  Calendar,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react';
import type { ExpertEngagement, EngagementType } from '../../types/expert';

// Shared shadow for floating card aesthetic
const cardShadow = '0 4px 20px -8px rgba(148, 163, 184, 0.15)';

type FilterType = 'all' | EngagementType;

interface PastEngagementsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  engagements: ExpertEngagement[];
  onViewDetails?: (engagement: ExpertEngagement) => void;
}

// Get engagement type display
function getEngagementTypeInfo(type: ExpertEngagement['type']) {
  switch (type) {
    case 'consultation':
      return { Icon: Video, label: 'Consultation', color: 'text-emerald-500', bg: 'bg-emerald-50', bgDark: 'bg-emerald-100' };
    case 'deep_dive':
      return { Icon: FileText, label: 'Deep Dive', color: 'text-blue-500', bg: 'bg-blue-50', bgDark: 'bg-blue-100' };
    case 'bespoke_project':
      return { Icon: Briefcase, label: 'Bespoke', color: 'text-violet-500', bg: 'bg-violet-50', bgDark: 'bg-violet-100' };
    default:
      return { Icon: Video, label: 'Session', color: 'text-slate-500', bg: 'bg-slate-50', bgDark: 'bg-slate-100' };
  }
}

// Format duration
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Group engagements by month
function groupByMonth(engagements: ExpertEngagement[]) {
  const groups: { [key: string]: ExpertEngagement[] } = {};

  engagements.forEach((engagement) => {
    const date = new Date(engagement.completedAt || engagement.scheduledAt || '');
    const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey].push(engagement);
  });

  return groups;
}

// Engagement card
function EngagementCard({
  engagement,
  onViewDetails,
}: {
  engagement: ExpertEngagement;
  onViewDetails?: (engagement: ExpertEngagement) => void;
}) {
  const { Icon, label, color, bg, bgDark } = getEngagementTypeInfo(engagement.type);
  const completedDate = engagement.completedAt
    ? new Date(engagement.completedAt)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-[20px] bg-white border border-slate-100/60"
      style={{ boxShadow: cardShadow }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</span>
            {engagement.status === 'cancelled' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                Cancelled
              </span>
            )}
            {engagement.status === 'no_show' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-500">
                No Show
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium text-slate-700 line-clamp-1">{engagement.title}</h4>
        </div>
        {completedDate && (
          <span className="text-[10px] text-slate-400 flex-shrink-0">
            {completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Client info */}
      <div className="flex items-center gap-2 mb-3">
        {engagement.clientAvatar ? (
          <img
            src={engagement.clientAvatar}
            alt={engagement.clientName}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-medium">
            {engagement.clientName[0]}
          </div>
        )}
        <span className="text-xs text-slate-600">{engagement.clientName}</span>
        <span className="text-slate-200">•</span>
        <span className="text-xs text-slate-400">{engagement.clientCompany}</span>
      </div>

      {/* Description */}
      {engagement.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {engagement.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100/60">
        <div className="flex items-center gap-4">
          {/* Duration */}
          {engagement.duration && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {formatDuration(engagement.duration)}
            </div>
          )}

          {/* Earnings */}
          {engagement.earnings && engagement.status === 'completed' && (
            <span className="text-sm font-medium text-emerald-600">
              +${engagement.earnings.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Rating */}
          {engagement.rating && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-medium text-amber-600">{engagement.rating}</span>
            </div>
          )}

          {/* View button */}
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(engagement)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-violet-600 hover:bg-violet-50 transition-colors"
            >
              Details
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function PastEngagementsDrawer({
  isOpen,
  onClose,
  engagements,
  onViewDetails,
}: PastEngagementsDrawerProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Filter engagements
  const filteredEngagements = engagements.filter((e) => {
    const matchesType = filterType === 'all' || e.type === filterType;
    const matchesSearch =
      searchQuery === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.clientCompany.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const grouped = groupByMonth(filteredEngagements);
  const monthKeys = Object.keys(grouped);

  // Stats
  const totalEngagements = engagements.length;
  const totalEarnings = engagements
    .filter(e => e.status === 'completed')
    .reduce((sum, e) => sum + (e.earnings || 0), 0);
  const avgRating = engagements
    .filter(e => e.rating)
    .reduce((sum, e, _, arr) => sum + (e.rating || 0) / arr.length, 0);

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

  const filterOptions: { value: FilterType; label: string; Icon: typeof Video }[] = [
    { value: 'all', label: 'All', Icon: History },
    { value: 'consultation', label: 'Consultations', Icon: Video },
    { value: 'deep_dive', label: 'Deep Dives', Icon: FileText },
    { value: 'bespoke_project', label: 'Bespoke', Icon: Briefcase },
  ];

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
            aria-labelledby="past-engagements-drawer-title"
          >
            {/* Header - Gradient hero style */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-slate-50 to-indigo-50" />
              <div className="relative px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white shadow-sm border border-white/60">
                      <History className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 id="past-engagements-drawer-title" className="text-lg font-medium text-slate-700">
                          Past Engagements
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                          {totalEngagements}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Your completed sessions</p>
                    </div>
                  </div>
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    aria-label="Close past engagements drawer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white/60 hover:bg-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="px-4 py-3 border-b border-slate-100/60 bg-white/50">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-lg font-medium text-slate-700">${totalEarnings.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total Earned</p>
                </div>
                <div className="w-px h-8 bg-slate-200/60" />
                <div className="text-center">
                  <p className="text-lg font-medium text-slate-700">{totalEngagements}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Sessions</p>
                </div>
                <div className="w-px h-8 bg-slate-200/60" />
                <div className="text-center">
                  <p className="text-lg font-medium text-slate-700 flex items-center justify-center gap-0.5">
                    {avgRating.toFixed(1)}
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Avg Rating</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-slate-100/60 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search engagements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-100 text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {filterOptions.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => setFilterType(value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      filterType === value
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {filteredEngagements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-base font-medium text-slate-600 mb-1">No engagements found</h3>
                  <p className="text-sm text-slate-400">
                    {searchQuery
                      ? 'Try adjusting your search or filters'
                      : 'Your completed sessions will appear here'}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-5">
                  {monthKeys.map((monthKey) => (
                    <div key={monthKey}>
                      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3 px-1">
                        {monthKey}
                      </h3>
                      <div className="space-y-3">
                        {grouped[monthKey].map((engagement, index) => (
                          <motion.div
                            key={engagement.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <EngagementCard
                              engagement={engagement}
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
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Showing {filteredEngagements.length} of {totalEngagements} engagements
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default PastEngagementsDrawer;
