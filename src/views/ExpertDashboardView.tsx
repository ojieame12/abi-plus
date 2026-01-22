// ExpertDashboardView - Expert portal with clean floating card design
// Soft shadows, light typography, clear visual hierarchy

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Calendar,
  Clock,
  Star,
  DollarSign,
  Video,
  FileText,
  Briefcase,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Settings,
  Bell,
  MoreHorizontal,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MOCK_EXPERT_DASHBOARD, MOCK_WEEKLY_EARNINGS } from '../services/mockExpert';
import type { Expert, ExpertEngagement, ExpertReview, ExpertEarnings } from '../types/expert';
import { PendingRequestsDrawer, type PendingRequest } from '../components/experts/PendingRequestsDrawer';
import { AvailabilityDrawer } from '../components/experts/AvailabilityDrawer';
import { UpcomingEngagementsDrawer } from '../components/experts/UpcomingEngagementsDrawer';
import { EarningsHistoryDrawer } from '../components/experts/EarningsHistoryDrawer';
import { PastEngagementsDrawer } from '../components/experts/PastEngagementsDrawer';

// Design system constants
const cardShadow = '0 8px 40px -12px rgba(148, 163, 184, 0.15)';

interface ExpertDashboardViewProps {
  expertId?: string;
  onBack?: () => void;
}

// Mock pending requests data
const MOCK_PENDING_REQUESTS: PendingRequest[] = [
  {
    id: 'req-1',
    type: 'consultation',
    clientName: 'Jennifer Walsh',
    clientCompany: 'Acme Corp',
    clientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    title: 'Steel Procurement Strategy Session',
    description: 'Looking to discuss our Q2 steel procurement approach and get insights on price forecasting for the Asian markets.',
    credits: 300,
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    urgency: 'urgent',
    preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-2',
    type: 'deep_dive',
    clientName: 'Robert Chen',
    clientCompany: 'Global Manufacturing',
    title: 'Aluminum Supply Chain Analysis',
    description: 'Need a comprehensive analysis of aluminum supply chain risks for our Southeast Asian operations.',
    credits: 450,
    submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-3',
    type: 'quick_question',
    clientName: 'Sarah Martinez',
    clientCompany: 'Tech Industries',
    clientAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    title: 'Copper Price Outlook',
    description: 'Quick question about expected copper prices for the next quarter.',
    credits: 50,
    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function ExpertDashboardView({ onBack }: ExpertDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'engagements' | 'earnings'>('overview');

  // Drawer states
  const [isPendingRequestsOpen, setIsPendingRequestsOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(false);
  const [isEarningsHistoryOpen, setIsEarningsHistoryOpen] = useState(false);
  const [isPastEngagementsOpen, setIsPastEngagementsOpen] = useState(false);
  const [pendingRequestsList, setPendingRequestsList] = useState<PendingRequest[]>(MOCK_PENDING_REQUESTS);

  const dashboard = MOCK_EXPERT_DASHBOARD;
  const {
    expert,
    earnings,
    upcomingCalls,
    pastEngagements,
    recentReviews,
    pendingRequests,
    lifetimeEarnings,
    lifetimeEngagements,
    acceptanceRate,
  } = dashboard;

  // Availability settings
  const [availabilitySettings, setAvailabilitySettings] = useState({
    status: expert.availability as 'available' | 'busy' | 'offline',
    autoReplyEnabled: true,
    autoReplyMessage: "Thanks for reaching out! I typically respond within 24 hours.",
    workingHours: { start: '09:00', end: '18:00' },
    timezone: 'America/New_York (EST)',
    vacationMode: false,
  });

  // Handlers
  const handleAcceptRequest = (id: string) => {
    setPendingRequestsList(prev => prev.filter(r => r.id !== id));
    // TODO: API call to accept
  };

  const handleDeclineRequest = (id: string) => {
    setPendingRequestsList(prev => prev.filter(r => r.id !== id));
    // TODO: API call to decline
  };

  const handleViewRequestDetails = (request: PendingRequest) => {
    console.log('View request details:', request);
    // TODO: Open request detail view
  };

  const handleJoinCall = (engagement: ExpertEngagement) => {
    if (engagement.meetingUrl) {
      window.open(engagement.meetingUrl, '_blank');
    }
  };

  const handleReschedule = (engagement: ExpertEngagement) => {
    console.log('Reschedule:', engagement);
    // TODO: Open reschedule modal
  };

  const handleViewEngagementDetails = (engagement: ExpertEngagement) => {
    console.log('View engagement details:', engagement);
    // TODO: Open engagement detail view
  };

  return (
    <div className="flex flex-col h-full w-full relative z-10 overflow-auto bg-[#fafafa]">
      <div className="flex-1 px-6 py-6">
        <div className="max-w-[900px] mx-auto">

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-6"
          >
            {/* Back button */}
            {onBack && (
              <button
                onClick={onBack}
                className="absolute -left-12 top-4 w-9 h-9 rounded-full flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 transition-all"
                style={{ boxShadow: cardShadow }}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {/* Hero Card */}
            <div
              className="rounded-[24px] bg-white border border-slate-100/60 overflow-hidden"
              style={{ boxShadow: cardShadow }}
            >
              {/* Gradient Header with Avatar */}
              <div className="relative h-32 bg-gradient-to-br from-violet-100 via-slate-50 to-pink-50">
                {/* Header Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                    <Bell className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {/* Avatar positioned at bottom, overlapping */}
                <div className="absolute -bottom-10 left-6">
                  <div
                    className="w-20 h-20 rounded-full bg-white p-1"
                    style={{ boxShadow: '0 4px 20px -4px rgba(148, 163, 184, 0.25)' }}
                  >
                    {expert.photo ? (
                      <img
                        src={expert.photo}
                        alt={expert.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-violet-100 flex items-center justify-center">
                        <span className="text-xl font-medium text-violet-600">
                          {expert.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="absolute -bottom-5 right-6">
                  <button
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      expert.availability === 'available'
                        ? 'bg-emerald-100 text-emerald-700'
                        : expert.availability === 'busy'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
                      expert.availability === 'available'
                        ? 'bg-emerald-500'
                        : expert.availability === 'busy'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`} />
                    {expert.availability === 'available' ? 'Available' :
                     expert.availability === 'busy' ? 'Busy' : 'Offline'}
                  </button>
                </div>
              </div>

              {/* Profile Section - with top padding for avatar overlap */}
              <div className="px-6 pt-14 pb-6">

                {/* Name & Badges */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-medium text-slate-800">{expert.name}</h1>
                    {expert.isTopVoice && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-600 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5" fill="currentColor" />
                        Top Voice
                      </span>
                    )}
                    {expert.isVerified && (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{expert.title}</p>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-6 pt-4 border-t border-slate-100/60">
                  <div className="text-center">
                    <div className="text-lg font-medium text-slate-700">${lifetimeEarnings.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Lifetime</div>
                  </div>
                  <div className="w-px h-8 bg-slate-100" />
                  <div className="text-center">
                    <div className="text-lg font-medium text-slate-700">{lifetimeEngagements}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Engagements</div>
                  </div>
                  <div className="w-px h-8 bg-slate-100" />
                  <div className="text-center">
                    <div className="text-lg font-medium text-slate-700">{acceptanceRate}%</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Acceptance</div>
                  </div>
                  <div className="w-px h-8 bg-slate-100" />
                  <div className="text-center">
                    <div className="text-lg font-medium text-slate-700 flex items-center justify-center gap-0.5">
                      {earnings.averageRating.toFixed(1)}
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pending Requests Alert */}
          {pendingRequestsList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 p-4 rounded-[20px] bg-amber-50 border border-amber-100/60 flex items-center gap-4"
              style={{ boxShadow: '0 4px 24px -8px rgba(251, 191, 36, 0.15)' }}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">
                  {pendingRequestsList.length} pending request{pendingRequestsList.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-slate-500">New consultation requests awaiting review</p>
              </div>
              <button
                onClick={() => setIsPendingRequestsOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors"
              >
                Review
              </button>
            </motion.div>
          )}

          {/* This Month Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-4 gap-4 mb-6"
          >
            <StatCard
              label="This Month"
              value={`$${earnings.totalEarnings.toLocaleString()}`}
              change={earnings.earningsChange}
              icon={DollarSign}
              color="emerald"
            />
            <StatCard
              label="Engagements"
              value={earnings.totalEngagements.toString()}
              change={earnings.engagementsChange}
              icon={Video}
              color="blue"
            />
            <StatCard
              label="Hours Logged"
              value={earnings.totalHours.toString()}
              icon={Clock}
              color="violet"
            />
            <StatCard
              label="Reviews"
              value={earnings.totalRatings.toString()}
              icon={Star}
              color="amber"
            />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-3 gap-5">
            {/* Left Column */}
            <div className="col-span-2 space-y-5">
              {/* Upcoming Engagements */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-[20px] bg-white border border-slate-100/60 overflow-hidden"
                style={{ boxShadow: cardShadow }}
              >
                <div className="px-5 py-4 border-b border-slate-100/60 flex items-center justify-between">
                  <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Upcoming
                  </h2>
                  <button
                    onClick={() => setIsUpcomingOpen(true)}
                    className="text-xs text-violet-500 hover:text-violet-600 font-medium flex items-center gap-1"
                  >
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {upcomingCalls.slice(0, 3).map((engagement, index) => (
                    <EngagementCard key={engagement.id} engagement={engagement} index={index} />
                  ))}
                  {upcomingCalls.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                      <p className="text-sm text-slate-400">No upcoming engagements</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Earnings Chart */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-[20px] bg-white border border-slate-100/60 overflow-hidden"
                style={{ boxShadow: cardShadow }}
              >
                <div className="px-5 py-4 border-b border-slate-100/60 flex items-center justify-between">
                  <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Earnings
                  </h2>
                  <select className="text-xs border-0 bg-transparent text-slate-500 focus:outline-none cursor-pointer">
                    <option>This Month</option>
                    <option>Last Month</option>
                    <option>Last 3 Months</option>
                  </select>
                </div>
                <div className="p-5">
                  <EarningsChart earnings={earnings} weeklyData={MOCK_WEEKLY_EARNINGS} />
                </div>
              </motion.div>

              {/* Call History */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-[20px] bg-white border border-slate-100/60 overflow-hidden"
                style={{ boxShadow: cardShadow }}
              >
                <div className="px-5 py-4 border-b border-slate-100/60 flex items-center justify-between">
                  <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Recent History
                  </h2>
                  <button
                    onClick={() => setIsPastEngagementsOpen(true)}
                    className="text-xs text-violet-500 hover:text-violet-600 font-medium flex items-center gap-1"
                  >
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  {pastEngagements.slice(0, 4).map((engagement, index) => (
                    <CompletedEngagementCard key={engagement.id} engagement={engagement} index={index} />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Recent Reviews */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-[20px] bg-white border border-slate-100/60 overflow-hidden"
                style={{ boxShadow: cardShadow }}
              >
                <div className="px-5 py-4 border-b border-slate-100/60">
                  <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Recent Reviews
                  </h2>
                </div>
                <div className="p-4 space-y-4">
                  {recentReviews.slice(0, 3).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-[20px] bg-white border border-slate-100/60 overflow-hidden"
                style={{ boxShadow: cardShadow }}
              >
                <div className="px-5 py-4 border-b border-slate-100/60">
                  <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Quick Actions
                  </h2>
                </div>
                <div className="p-3 space-y-1">
                  <QuickLinkButton icon={Calendar} label="Manage Availability" onClick={() => setIsAvailabilityOpen(true)} />
                  <QuickLinkButton icon={FileText} label="Past Engagements" onClick={() => setIsPastEngagementsOpen(true)} />
                  <QuickLinkButton icon={DollarSign} label="Earnings History" onClick={() => setIsEarningsHistoryOpen(true)} />
                  <QuickLinkButton icon={Settings} label="Profile Settings" onClick={() => console.log('Open Profile Settings')} />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawers */}
      <PendingRequestsDrawer
        isOpen={isPendingRequestsOpen}
        onClose={() => setIsPendingRequestsOpen(false)}
        requests={pendingRequestsList}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
        onViewDetails={handleViewRequestDetails}
      />

      <AvailabilityDrawer
        isOpen={isAvailabilityOpen}
        onClose={() => setIsAvailabilityOpen(false)}
        currentSettings={availabilitySettings}
        onSave={setAvailabilitySettings}
      />

      <UpcomingEngagementsDrawer
        isOpen={isUpcomingOpen}
        onClose={() => setIsUpcomingOpen(false)}
        engagements={upcomingCalls}
        onJoinCall={handleJoinCall}
        onReschedule={handleReschedule}
        onViewDetails={handleViewEngagementDetails}
      />

      <EarningsHistoryDrawer
        isOpen={isEarningsHistoryOpen}
        onClose={() => setIsEarningsHistoryOpen(false)}
        earnings={earnings}
        engagements={pastEngagements}
        weeklyData={MOCK_WEEKLY_EARNINGS}
      />

      <PastEngagementsDrawer
        isOpen={isPastEngagementsOpen}
        onClose={() => setIsPastEngagementsOpen(false)}
        engagements={pastEngagements}
        onViewDetails={handleViewEngagementDetails}
      />
    </div>
  );
}

// Stat card with floating design
function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'emerald' | 'blue' | 'violet' | 'amber';
}) {
  const iconBg = {
    emerald: 'bg-emerald-50',
    blue: 'bg-blue-50',
    violet: 'bg-violet-50',
    amber: 'bg-amber-50',
  };
  const iconColor = {
    emerald: 'text-emerald-500',
    blue: 'text-blue-500',
    violet: 'text-violet-500',
    amber: 'text-amber-500',
  };

  return (
    <div
      className="rounded-[20px] bg-white border border-slate-100/60 p-4"
      style={{ boxShadow: cardShadow }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-xl ${iconBg[color]} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor[color]}`} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-medium text-slate-700">{value}</span>
        {change !== undefined && (
          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${
            change >= 0 ? 'text-emerald-500' : 'text-red-400'
          }`}>
            {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

// Engagement card
function EngagementCard({ engagement, index }: { engagement: ExpertEngagement; index: number }) {
  const date = engagement.scheduledAt ? new Date(engagement.scheduledAt) : null;
  const isToday = date ? date.toDateString() === new Date().toDateString() : false;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${
        isToday
          ? 'bg-violet-50/80 border border-violet-100/60'
          : 'bg-slate-50/80 hover:bg-slate-100/80'
      }`}
    >
      {/* Time */}
      <div className="text-center min-w-[50px]">
        <p className={`text-[10px] font-medium uppercase ${isToday ? 'text-violet-500' : 'text-slate-400'}`}>
          {!date ? 'TBD' : isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        <p className={`text-base font-medium ${isToday ? 'text-violet-700' : 'text-slate-600'}`}>
          {date ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '--:--'}
        </p>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{engagement.title}</p>
        <p className="text-xs text-slate-400">
          {engagement.clientName} • {engagement.clientCompany}
        </p>
      </div>

      {/* Amount & Action */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-emerald-600">${engagement.credits}</p>
        </div>
        {isToday && engagement.meetingUrl && (
          <a
            href={engagement.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors"
          >
            Join
          </a>
        )}
      </div>
    </motion.div>
  );
}

// Completed engagement card
function CompletedEngagementCard({ engagement, index }: { engagement: ExpertEngagement; index: number }) {
  const completedDate = engagement.completedAt ? new Date(engagement.completedAt) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-colors"
    >
      {/* Client avatar */}
      {engagement.clientAvatar ? (
        <img
          src={engagement.clientAvatar}
          alt={engagement.clientName}
          className="w-9 h-9 rounded-full object-cover"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">
          {engagement.clientName[0]}
        </div>
      )}

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-600 truncate">{engagement.title}</p>
        <p className="text-[10px] text-slate-400">
          {engagement.clientName} • {completedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Rating & Earnings */}
      <div className="flex items-center gap-3">
        {engagement.rating && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-medium text-amber-600">{engagement.rating}</span>
          </div>
        )}
        <span className="text-xs font-medium text-emerald-500">+${engagement.earnings || 0}</span>
      </div>
    </motion.div>
  );
}

// Review card
function ReviewCard({ review }: { review: ExpertReview }) {
  return (
    <div className="pb-4 border-b border-slate-100/60 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 mb-2">
        {review.clientAvatar ? (
          <img
            src={review.clientAvatar}
            alt={review.clientName}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
            {review.clientName[0]}
          </div>
        )}
        <span className="text-xs font-medium text-slate-600 flex-1">{review.clientName}</span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-none'}`}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{review.review}</p>
      <p className="text-[10px] text-slate-300 mt-2">
        {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </p>
    </div>
  );
}

// Earnings chart with Recharts
function EarningsChart({
  earnings,
  weeklyData,
}: {
  earnings: ExpertEarnings;
  weeklyData: { week: string; earnings: number }[];
}) {
  return (
    <div>
      {/* Area chart */}
      <div className="h-40 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              width={45}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 8px 40px -12px rgba(148, 163, 184, 0.25)',
                padding: '8px 12px',
              }}
              labelStyle={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Earnings']}
            />
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#earningsGradient)"
              dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
              activeDot={{ fill: '#10b981', strokeWidth: 2, stroke: '#fff', r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-4 pt-4 mt-2 border-t border-slate-100/60">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Consultations</p>
          <p className="text-sm font-medium text-slate-600">${earnings.consultations.earnings.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Deep Dives</p>
          <p className="text-sm font-medium text-slate-600">${earnings.deepDives.earnings.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Bespoke</p>
          <p className="text-sm font-medium text-slate-600">${earnings.bespokeProjects.earnings.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

// Quick link button
function QuickLinkButton({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
    >
      <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center transition-colors">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <span className="text-sm text-slate-500 group-hover:text-slate-700 flex-1">{label}</span>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </button>
  );
}

export default ExpertDashboardView;
