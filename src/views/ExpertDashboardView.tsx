// ExpertDashboardView - "Uber driver" view for external experts
// Shows upcoming engagements, earnings, reviews, and performance metrics

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
} from 'lucide-react';
import { MOCK_EXPERT_DASHBOARD, MOCK_WEEKLY_EARNINGS } from '../services/mockExpert';
import type { Expert, ExpertEngagement, ExpertReview, ExpertEarnings } from '../types/expert';
import { ArrowLeft } from 'lucide-react';

interface ExpertDashboardViewProps {
  expertId?: string;
  onBack?: () => void;
}

export function ExpertDashboardView({ onBack }: ExpertDashboardViewProps) {
  // In real app, this would fetch data based on expertId
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

  return (
    <div className="flex flex-col h-full w-full relative z-10 overflow-auto bg-slate-50/50">
      <div className="flex-1 px-6 py-8">
        <div className="max-w-[1000px] mx-auto">
          {/* Header */}
          <ExpertHeader expert={expert} pendingRequests={pendingRequests} onBack={onBack} />

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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
              label="Avg Rating"
              value={earnings.averageRating.toFixed(1)}
              icon={Star}
              color="amber"
              suffix={`/ ${earnings.totalRatings} reviews`}
            />
          </motion.div>

          {/* Lifetime Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl border border-violet-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Lifetime Earnings</p>
                  <p className="text-xl font-medium text-slate-900">${lifetimeEarnings.toLocaleString()}</p>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Total Engagements</p>
                  <p className="text-xl font-medium text-slate-900">{lifetimeEngagements}</p>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Acceptance Rate</p>
                  <p className="text-xl font-medium text-emerald-600">{acceptanceRate}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Member since</p>
                <p className="text-sm font-medium text-slate-600">
                  {new Date(expert.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Upcoming Calls */}
            <div className="col-span-2 space-y-6">
              {/* Upcoming Engagements */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Upcoming Engagements
                  </h2>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {upcomingCalls.map((engagement, index) => (
                    <EngagementCard key={engagement.id} engagement={engagement} index={index} />
                  ))}
                  {upcomingCalls.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No upcoming engagements</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Earnings Chart */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    Earnings Breakdown
                  </h2>
                  <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600">
                    <option>This Month</option>
                    <option>Last Month</option>
                    <option>Last 3 Months</option>
                  </select>
                </div>
                <EarningsChart earnings={earnings} weeklyData={MOCK_WEEKLY_EARNINGS} />
              </motion.div>

              {/* Call History */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-slate-500" />
                    Call History
                  </h2>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {pastEngagements.slice(0, 4).map((engagement, index) => (
                    <CompletedEngagementCard key={engagement.id} engagement={engagement} index={index} />
                  ))}
                  {pastEngagements.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Phone className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No completed engagements yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Reviews & Quick Actions */}
            <div className="space-y-6">
              {/* Pending Requests Alert */}
              {pendingRequests > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="bg-amber-50 rounded-xl p-4 border border-amber-200"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        {pendingRequests} pending request{pendingRequests > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Review and accept new consultation requests
                      </p>
                      <button className="mt-2 text-xs font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1">
                        View requests <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Recent Reviews */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-medium text-slate-900 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    Recent Reviews
                  </h2>
                </div>
                <div className="space-y-4">
                  {recentReviews.slice(0, 3).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
              >
                <h3 className="text-sm font-medium text-slate-500 mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <QuickLinkButton icon={Calendar} label="Manage Availability" />
                  <QuickLinkButton icon={FileText} label="View Past Engagements" />
                  <QuickLinkButton icon={DollarSign} label="Earnings History" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Expert header with profile info
function ExpertHeader({ expert, onBack }: { expert: Expert; pendingRequests?: number; onBack?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-8"
    >
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {expert.photo ? (
          <img
            src={expert.photo}
            alt={expert.name}
            className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-md"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center ring-4 ring-white shadow-md">
            <span className="text-xl font-medium text-violet-600">
              {expert.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-medium text-slate-900">{expert.name}</h1>
          <p className="text-sm text-slate-500">{expert.title}</p>
          <div className="flex items-center gap-3 mt-1">
            {expert.isTopVoice && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                <Star className="w-3 h-3" /> Top Voice
              </span>
            )}
            {expert.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle className="w-3.5 h-3.5" /> Verified
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`
          px-4 py-2 rounded-full text-sm font-medium
          ${expert.availability === 'available'
            ? 'bg-emerald-100 text-emerald-700'
            : expert.availability === 'busy'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-100 text-slate-600'
          }
        `}>
          {expert.availability === 'available' ? 'Available' :
           expert.availability === 'busy' ? 'Busy' : 'Offline'}
        </div>
      </div>
    </motion.div>
  );
}

// Stat card component
function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color,
  suffix,
}: {
  label: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'emerald' | 'blue' | 'violet' | 'amber';
  suffix?: string;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-medium text-slate-900">{value}</span>
        {change !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${
            change >= 0 ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </span>
        )}
        {suffix && (
          <span className="text-xs text-slate-400">{suffix}</span>
        )}
      </div>
    </div>
  );
}

// Engagement card component
function EngagementCard({ engagement, index }: { engagement: ExpertEngagement; index: number }) {
  // Guard against undefined scheduledAt
  const date = engagement.scheduledAt ? new Date(engagement.scheduledAt) : null;
  const isToday = date ? date.toDateString() === new Date().toDateString() : false;

  const typeIcons: Record<string, typeof Phone> = {
    consultation: Phone,
    deep_dive: Briefcase,
    bespoke_project: FileText,
  };
  const Icon = typeIcons[engagement.type] || Phone;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        flex items-center gap-4 p-4 rounded-xl border transition-colors
        ${isToday
          ? 'bg-blue-50/50 border-blue-200'
          : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
        }
      `}
    >
      {/* Time */}
      <div className="text-center min-w-[60px]">
        <p className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
          {!date ? 'TBD' : isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        <p className="text-lg font-medium text-slate-900">
          {date ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '--:--'}
        </p>
      </div>

      {/* Divider */}
      <div className="w-px h-12 bg-slate-200" />

      {/* Details */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`w-4 h-4 ${isToday ? 'text-blue-500' : 'text-slate-400'}`} />
          <span className="text-sm font-medium text-slate-900">{engagement.title}</span>
        </div>
        <p className="text-xs text-slate-500">
          {engagement.clientName} • {engagement.clientCompany}
        </p>
      </div>

      {/* Credits */}
      <div className="text-right">
        <p className="text-sm font-medium text-emerald-600">
          ${engagement.credits.toLocaleString()}
        </p>
        <p className="text-xs text-slate-400 capitalize">{engagement.type.replace('_', ' ')}</p>
      </div>

      {/* Join button */}
      {isToday && engagement.meetingUrl && (
        <a
          href={engagement.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          Join
        </a>
      )}
    </motion.div>
  );
}

// Completed engagement card (for call history)
function CompletedEngagementCard({ engagement, index }: { engagement: ExpertEngagement; index: number }) {
  const completedDate = engagement.completedAt ? new Date(engagement.completedAt) : null;

  const typeIcons: Record<string, typeof Phone> = {
    consultation: Phone,
    deep_dive: Briefcase,
    bespoke_project: FileText,
  };
  const Icon = typeIcons[engagement.type] || Phone;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-colors"
    >
      {/* Client avatar */}
      <div className="flex-shrink-0">
        {engagement.clientAvatar ? (
          <img
            src={engagement.clientAvatar}
            alt={engagement.clientName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm text-slate-500">
            {engagement.clientName[0]}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-medium text-slate-900 truncate">{engagement.title}</span>
        </div>
        <p className="text-xs text-slate-500">
          {engagement.clientName} • {completedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Rating */}
      {engagement.rating && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span className="text-xs font-medium text-amber-700">{engagement.rating}</span>
        </div>
      )}

      {/* Earnings */}
      <div className="text-right">
        <p className="text-sm font-medium text-emerald-600">
          +${(engagement.earnings || 0).toLocaleString()}
        </p>
        <p className="text-[10px] text-slate-400">
          {engagement.duration ? `${Math.round(engagement.duration / 60)}h` : '--'}
        </p>
      </div>
    </motion.div>
  );
}

// Review card component
function ReviewCard({ review }: { review: ExpertReview }) {
  return (
    <div className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 mb-2">
        {review.clientAvatar ? (
          <img
            src={review.clientAvatar}
            alt={review.clientName}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">
            {review.clientName[0]}
          </div>
        )}
        <span className="text-sm font-medium text-slate-700">{review.clientName}</span>
        <div className="flex items-center gap-0.5 ml-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-600 line-clamp-2">{review.review}</p>
      <p className="text-[10px] text-slate-400 mt-1">
        {new Date(review.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </p>
    </div>
  );
}

// Earnings chart component
function EarningsChart({
  earnings,
  weeklyData,
}: {
  earnings: ExpertEarnings;
  weeklyData: { week: string; earnings: number }[];
}) {
  const maxEarnings = Math.max(...weeklyData.map(d => d.earnings));

  return (
    <div>
      {/* Simple bar chart */}
      <div className="flex items-end gap-3 h-32 mb-4">
        {weeklyData.map((data, index) => {
          const height = (data.earnings / maxEarnings) * 100;
          return (
            <div key={data.week} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md"
              />
              <span className="text-xs text-slate-500">{data.week}</span>
            </div>
          );
        })}
      </div>

      {/* Breakdown by type */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-500 mb-1">Consultations</p>
          <p className="text-sm font-medium text-slate-900">
            ${earnings.consultations.earnings.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">{earnings.consultations.count} calls</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Deep Dives</p>
          <p className="text-sm font-medium text-slate-900">
            ${earnings.deepDives.earnings.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">{earnings.deepDives.count} sessions</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Bespoke</p>
          <p className="text-sm font-medium text-slate-900">
            ${earnings.bespokeProjects.earnings.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">{earnings.bespokeProjects.count} projects</p>
        </div>
      </div>
    </div>
  );
}

// Quick link button
function QuickLinkButton({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group">
      <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
      <span className="text-sm text-slate-600 group-hover:text-slate-900">{label}</span>
      <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-slate-400" />
    </button>
  );
}

export default ExpertDashboardView;
