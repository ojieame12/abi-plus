// EarningsHistoryDrawer - Detailed earnings history for experts
// Matches CreditDrawer floating card aesthetic

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Video,
  FileText,
  Briefcase,
  Download,
  ChevronDown,
  Filter,
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
import type { ExpertEarnings, ExpertEngagement } from '../../types/expert';

// Shared shadow for floating card aesthetic
const cardShadow = '0 4px 20px -8px rgba(148, 163, 184, 0.15)';

type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

interface EarningsHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  earnings: ExpertEarnings;
  engagements: ExpertEngagement[];
  weeklyData?: { week: string; earnings: number }[];
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Get engagement type display
function getEngagementTypeInfo(type: ExpertEngagement['type']) {
  switch (type) {
    case 'consultation':
      return { Icon: Video, label: 'Consultation', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    case 'deep_dive':
      return { Icon: FileText, label: 'Deep Dive', color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'bespoke_project':
      return { Icon: Briefcase, label: 'Bespoke', color: 'text-violet-500', bg: 'bg-violet-50' };
    default:
      return { Icon: Video, label: 'Session', color: 'text-slate-500', bg: 'bg-slate-50' };
  }
}

export function EarningsHistoryDrawer({
  isOpen,
  onClose,
  earnings,
  engagements,
  weeklyData,
}: EarningsHistoryDrawerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Filter completed engagements with earnings
  const earningsTransactions = engagements
    .filter(e => e.status === 'completed' && e.earnings)
    .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime());

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

  const periodLabels: Record<TimePeriod, string> = {
    week: 'This Week',
    month: 'This Month',
    quarter: 'This Quarter',
    year: 'This Year',
  };

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
            aria-labelledby="earnings-drawer-title"
          >
            {/* Header - Gradient hero style */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-slate-50 to-teal-50" />
              <div className="relative px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white shadow-sm border border-white/60">
                      <DollarSign className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h2 id="earnings-drawer-title" className="text-lg font-medium text-slate-700">
                        Earnings History
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Track your income over time</p>
                    </div>
                  </div>
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    aria-label="Close earnings drawer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white/60 hover:bg-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Period Selector */}
              <div
                className="p-4 rounded-[20px] bg-white border border-slate-100/60"
                style={{ boxShadow: cardShadow }}
              >
                <div className="flex items-center gap-2">
                  {(['week', 'month', 'quarter', 'year'] as TimePeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                        selectedPeriod === period
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {periodLabels[period]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div
                className="p-5 rounded-[20px] bg-white border border-slate-100/60"
                style={{ boxShadow: cardShadow }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Total Earnings</p>
                    <p className="text-2xl font-medium text-slate-700">
                      {formatCurrency(earnings.totalEarnings)}
                    </p>
                  </div>
                  {earnings.earningsChange !== undefined && (
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
                      earnings.earningsChange >= 0
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {earnings.earningsChange >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {Math.abs(earnings.earningsChange)}%
                    </div>
                  )}
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50/80">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Sessions</p>
                    <p className="text-base font-medium text-slate-600">{earnings.totalEngagements}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50/80">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Hours</p>
                    <p className="text-base font-medium text-slate-600">{earnings.totalHours}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50/80">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Avg/Hour</p>
                    <p className="text-base font-medium text-slate-600">
                      {earnings.totalHours > 0
                        ? formatCurrency(Math.round(earnings.totalEarnings / earnings.totalHours))
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Earnings Chart */}
              {weeklyData && weeklyData.length > 0 && (
                <div
                  className="p-5 rounded-[20px] bg-white border border-slate-100/60"
                  style={{ boxShadow: cardShadow }}
                >
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
                    Earnings Trend
                  </h3>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="earningsHistoryGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="week"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          width={35}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: cardShadow,
                            padding: '8px 12px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [formatCurrency(value), 'Earnings']}
                        />
                        <Area
                          type="monotone"
                          dataKey="earnings"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#earningsHistoryGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Breakdown by Type */}
              <div
                className="p-5 rounded-[20px] bg-white border border-slate-100/60"
                style={{ boxShadow: cardShadow }}
              >
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
                  By Engagement Type
                </h3>
                <div className="space-y-3">
                  {/* Consultations */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Video className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">Consultations</p>
                      <p className="text-[10px] text-slate-400">{earnings.consultations.count} sessions</p>
                    </div>
                    <p className="text-sm font-medium text-emerald-600">
                      {formatCurrency(earnings.consultations.earnings)}
                    </p>
                  </div>

                  {/* Deep Dives */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">Deep Dives</p>
                      <p className="text-[10px] text-slate-400">{earnings.deepDives.count} sessions</p>
                    </div>
                    <p className="text-sm font-medium text-blue-600">
                      {formatCurrency(earnings.deepDives.earnings)}
                    </p>
                  </div>

                  {/* Bespoke */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50/50">
                    <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">Bespoke Projects</p>
                      <p className="text-[10px] text-slate-400">{earnings.bespokeProjects.count} projects</p>
                    </div>
                    <p className="text-sm font-medium text-violet-600">
                      {formatCurrency(earnings.bespokeProjects.earnings)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div
                className="p-5 rounded-[20px] bg-white border border-slate-100/60"
                style={{ boxShadow: cardShadow }}
              >
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
                  Recent Transactions
                </h3>
                <div className="space-y-2">
                  {earningsTransactions.slice(0, 6).map((engagement) => {
                    const { Icon, label, color, bg } = getEngagementTypeInfo(engagement.type);
                    const completedDate = engagement.completedAt
                      ? new Date(engagement.completedAt)
                      : null;

                    return (
                      <div
                        key={engagement.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-600 truncate">{engagement.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {engagement.clientName} •{' '}
                            {completedDate?.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-emerald-600">
                          +{formatCurrency(engagement.earnings || 0)}
                        </p>
                      </div>
                    );
                  })}

                  {earningsTransactions.length === 0 && (
                    <div className="text-center py-6">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                      <p className="text-sm text-slate-400">No earnings yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Export Earnings Report
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default EarningsHistoryDrawer;
