// CreditDrawer - Detailed subscription panel that slides out from the right
// Redesigned with Expert Dashboard floating card aesthetic

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Coins,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Phone,
  FileText,
  Users,
  Briefcase,
  HelpCircle,
  Zap,
} from 'lucide-react';

// Shared shadow for floating card aesthetic
const cardShadow = '0 4px 20px -8px rgba(148, 163, 184, 0.15)';
import {
  type CompanySubscription,
  type CreditTransaction,
  getCreditStatus,
  formatCredits,
  CREDIT_COSTS,
} from '../../types/subscription';
import type { CategorySlotSummary } from '../../types/managedCategories';
import { SlotAllowanceCard } from './SlotAllowanceCard';
import { SkeletonLoader } from '../ui/SkeletonLoader';

import type { LucideIcon } from 'lucide-react';

// Transaction type icons
const TRANSACTION_ICONS: Record<string, LucideIcon> = {
  allocation: Sparkles,
  analyst_qa: HelpCircle,
  analyst_call: Phone,
  report_upgrade: FileText,
  expert_consult: Users,
  expert_deepdive: Briefcase,
  bespoke_project: Briefcase,
  refund: TrendingUp,
  adjustment: Coins,
};

interface CreditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: CompanySubscription;
  slotSummary?: CategorySlotSummary;
  transactions?: CreditTransaction[];
  isLoading?: boolean;
  error?: string | null;
  onViewAllTransactions?: () => void;
  onManageCategories?: () => void;
  onContactSales?: () => void;
  onRetry?: () => void;
}

// Loading skeleton component - Floating card style
function CreditDrawerSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Credit balance skeleton */}
      <div
        className="p-5 rounded-[20px] bg-white border border-slate-100/60"
        style={{ boxShadow: cardShadow }}
      >
        <SkeletonLoader width={100} height={12} className="mb-3" />
        <SkeletonLoader width={150} height={32} className="mb-2" />
        <SkeletonLoader width={120} height={14} className="mb-5" />
        <SkeletonLoader width="100%" height={8} rounded="full" />
        <div className="mt-4 pt-4 border-t border-slate-100/60">
          <SkeletonLoader width={160} height={14} />
        </div>
      </div>

      {/* Slot summary skeleton */}
      <div
        className="p-5 rounded-[20px] bg-white border border-slate-100/60"
        style={{ boxShadow: cardShadow }}
      >
        <div className="flex items-center justify-between mb-4">
          <SkeletonLoader width={100} height={12} />
          <SkeletonLoader width={80} height={14} />
        </div>
        <SkeletonLoader width="100%" height={8} rounded="full" className="mb-4" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map(i => (
            <SkeletonLoader key={i} width={80} height={28} rounded="xl" />
          ))}
        </div>
      </div>

      {/* Transactions skeleton */}
      <div
        className="p-5 rounded-[20px] bg-white border border-slate-100/60"
        style={{ boxShadow: cardShadow }}
      >
        <SkeletonLoader width={100} height={12} className="mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3">
              <SkeletonLoader width={44} height={44} rounded="xl" />
              <div className="flex-1">
                <SkeletonLoader width={160} height={14} className="mb-2" />
                <SkeletonLoader width={80} height={12} />
              </div>
              <SkeletonLoader width={60} height={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Error state component - Floating card style
function CreditDrawerError({ error, onRetry }: { error: string | null; onRetry?: () => void }) {
  return (
    <div className="p-4">
      <div
        className="px-6 py-10 rounded-[20px] bg-white border border-slate-100/60 text-center"
        style={{ boxShadow: cardShadow }}
      >
        <div
          className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center"
        >
          <X className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-base font-medium text-slate-600 mb-2">Failed to load</h3>
        <p className="text-sm text-slate-400 mb-5">{error || 'Unable to load subscription data'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-600 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function CreditDrawer({
  isOpen,
  onClose,
  subscription,
  slotSummary,
  transactions = [],
  isLoading = false,
  error = null,
  onViewAllTransactions,
  onManageCategories,
  onContactSales,
  onRetry,
}: CreditDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const creditStatus = getCreditStatus(subscription.remainingCredits, subscription.totalCredits);
  const creditPercentage = Math.round((subscription.remainingCredits / subscription.totalCredits) * 100);

  // Focus management: store previous focus, restore on close, handle Escape
  useEffect(() => {
    if (isOpen) {
      // Store currently focused element before opening
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus close button when drawer opens
      closeButtonRef.current?.focus();

      // Handle Escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else {
      // Restore focus when drawer closes
      previousActiveElement.current?.focus();
    }
  }, [isOpen, onClose]);

  const statusColors = {
    healthy: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
    warning: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' },
    critical: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' },
  };
  const colors = statusColors[creditStatus];

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

          {/* Drawer - Redesigned with bg-[#fafafa] and floating card aesthetic */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#fafafa] shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="credit-drawer-title"
          >
            {/* Header - Gradient hero style */}
            <div className="relative overflow-hidden">
              <div className={`absolute inset-0 ${
                creditStatus === 'healthy'
                  ? 'bg-gradient-to-br from-emerald-100 via-slate-50 to-teal-50'
                  : creditStatus === 'warning'
                  ? 'bg-gradient-to-br from-amber-100 via-slate-50 to-orange-50'
                  : 'bg-gradient-to-br from-red-100 via-slate-50 to-pink-50'
              }`} />
              <div className="relative px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-white shadow-sm border border-white/60`}>
                      <Coins className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <h2 id="credit-drawer-title" className="text-lg font-medium text-slate-700">Subscription</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{subscription.tierConfig.name} Plan</p>
                    </div>
                  </div>
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    aria-label="Close subscription drawer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white/60 hover:bg-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Loading state */}
              {isLoading && <CreditDrawerSkeleton />}

              {/* Error state */}
              {!isLoading && error && <CreditDrawerError error={error} onRetry={onRetry} />}

              {/* Normal content */}
              {!isLoading && !error && (
                <div className="p-4 space-y-4">
              {/* Credit Balance Card - Floating card style */}
              <div
                className="p-5 rounded-[20px] bg-white border border-slate-100/60"
                style={{ boxShadow: cardShadow }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1.5">Available Credits</p>
                    <p className={`text-3xl font-light ${colors.text} tabular-nums`}>
                      {formatCredits(subscription.remainingCredits)}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      of {formatCredits(subscription.totalCredits)} total
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full ${colors.bg} text-white text-xs font-medium`}>
                    {creditPercentage}%
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${creditPercentage}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className={`h-full ${colors.bg} rounded-full`}
                    />
                  </div>
                </div>

                {/* Renewal info */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100/60">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">{subscription.daysRemaining} days until renewal</span>
                </div>
              </div>

              {/* Slot Usage - Using SlotAllowanceCard component */}
              {slotSummary && (
                <div
                  className="rounded-[20px] bg-white border border-slate-100/60 overflow-hidden"
                  style={{ boxShadow: cardShadow }}
                >
                  <SlotAllowanceCard
                    slotSummary={slotSummary}
                    variant="default"
                    onManageCategories={onManageCategories}
                    showCategories={true}
                    maxCategoriesToShow={6}
                  />
                </div>
              )}

              {/* Credit Costs Reference - Floating card style */}
              <div
                className="p-5 rounded-[20px] bg-white border border-slate-100/60"
                style={{ boxShadow: cardShadow }}
              >
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">Credit Costs</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(CREDIT_COSTS).slice(0, 4).map(([key, cost]) => (
                    <div
                      key={key}
                      className="px-3.5 py-3 rounded-xl bg-slate-50/80 border border-slate-100/60"
                    >
                      <p className="text-xs text-slate-500 truncate">{cost.label}</p>
                      <p className="text-sm font-medium text-slate-700 tabular-nums mt-1">
                        {formatCredits(cost.typical)} credits
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions - Floating card style */}
              <div
                className="p-5 rounded-[20px] bg-white border border-slate-100/60"
                style={{ boxShadow: cardShadow }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Recent Activity</h3>
                  {transactions.length > 0 && (
                    <button
                      onClick={onViewAllTransactions}
                      className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                    >
                      View all
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {transactions.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">
                      No recent transactions
                    </p>
                  ) : (
                    transactions.slice(0, 5).map((txn) => {
                      const Icon = TRANSACTION_ICONS[txn.type] || Coins;
                      const isCredit = txn.amount > 0;
                      return (
                        <div
                          key={txn.id}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-colors"
                        >
                          <div className={`p-2.5 rounded-xl ${isCredit ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                            <Icon className={`w-4 h-4 ${isCredit ? 'text-emerald-500' : 'text-slate-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-600 truncate">{txn.description}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(txn.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-right">
                            {isCredit ? (
                              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className={`text-sm font-medium tabular-nums ${
                              isCredit ? 'text-emerald-600' : 'text-slate-600'
                            }`}>
                              {isCredit ? '+' : ''}{formatCredits(txn.amount)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
                </div>
              )}
            </div>

            {/* Footer - Floating card style */}
            <div className="p-4">
              <div
                className="px-5 py-4 rounded-2xl bg-white border border-slate-100/60"
                style={{ boxShadow: cardShadow }}
              >
                <button
                  onClick={onContactSales}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Zap className="w-4 h-4" />
                  Add More Credits
                </button>
                <p className="text-xs text-slate-400 text-center mt-3">
                  Contact your account manager for top-ups
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Compact credit summary for inline use
interface CreditSummaryProps {
  subscription: CompanySubscription;
  className?: string;
}

export function CreditSummary({ subscription, className = '' }: CreditSummaryProps) {
  const status = getCreditStatus(subscription.remainingCredits, subscription.totalCredits);
  const percentage = Math.round((subscription.remainingCredits / subscription.totalCredits) * 100);

  const statusColors = {
    healthy: 'text-emerald-600 bg-emerald-50',
    warning: 'text-amber-600 bg-amber-50',
    critical: 'text-red-600 bg-red-50',
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Coins className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-secondary">
          <span className="font-medium text-primary tabular-nums">
            {formatCredits(subscription.remainingCredits)}
          </span>
          {' credits remaining'}
        </span>
      </div>
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {percentage}%
      </span>
    </div>
  );
}
