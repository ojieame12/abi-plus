// CreditDrawer - Detailed subscription panel that slides out from the right
// Shows credit balance, slot usage, recent transactions, and tier info

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
} from 'lucide-react';
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

// Loading skeleton component
function CreditDrawerSkeleton() {
  return (
    <div className="px-6 py-5 space-y-6">
      {/* Credit balance skeleton */}
      <div className="p-5 rounded-2xl bg-slate-50">
        <SkeletonLoader width={100} height={14} className="mb-2" />
        <SkeletonLoader width={150} height={32} className="mb-2" />
        <SkeletonLoader width={120} height={14} className="mb-4" />
        <SkeletonLoader width="100%" height={10} rounded="full" />
      </div>

      {/* Slot summary skeleton */}
      <div className="p-5 rounded-xl bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <SkeletonLoader width={140} height={16} />
          <SkeletonLoader width={80} height={16} />
        </div>
        <SkeletonLoader width="100%" height={8} rounded="full" className="mb-3" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map(i => (
            <SkeletonLoader key={i} width={80} height={24} rounded="lg" />
          ))}
        </div>
      </div>

      {/* Transactions skeleton */}
      <div>
        <SkeletonLoader width={120} height={16} className="mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3">
              <SkeletonLoader width={40} height={40} rounded="lg" />
              <div className="flex-1">
                <SkeletonLoader width={160} height={14} className="mb-1" />
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

// Error state component
function CreditDrawerError({ error, onRetry }: { error: string | null; onRetry?: () => void }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
        <X className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-primary mb-2">Failed to load</h3>
      <p className="text-sm text-secondary mb-4">{error || 'Unable to load subscription data'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium text-primary transition-colors"
        >
          Try again
        </button>
      )}
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

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="credit-drawer-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors.light}`}>
                  <Coins className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                  <h2 id="credit-drawer-title" className="text-lg font-semibold text-primary">Subscription</h2>
                  <p className="text-xs text-secondary">{subscription.tierConfig.name} Plan</p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close subscription drawer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Loading state */}
              {isLoading && <CreditDrawerSkeleton />}

              {/* Error state */}
              {!isLoading && error && <CreditDrawerError error={error} onRetry={onRetry} />}

              {/* Normal content */}
              {!isLoading && !error && (
                <>
              {/* Credit Balance Card */}
              <div className="px-6 py-5">
                <div className={`p-5 rounded-2xl ${colors.light}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Available Credits</p>
                      <p className={`text-3xl font-bold ${colors.text} tabular-nums`}>
                        {formatCredits(subscription.remainingCredits)}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        of {formatCredits(subscription.totalCredits)} total
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full ${colors.bg} text-white text-sm font-medium`}>
                      {creditPercentage}% left
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="h-2.5 bg-white/80 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${creditPercentage}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={`h-full ${colors.bg} rounded-full`}
                      />
                    </div>
                  </div>

                  {/* Renewal info */}
                  <div className="flex items-center gap-2 mt-4 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>{subscription.daysRemaining} days until renewal</span>
                  </div>
                </div>
              </div>

              {/* Slot Usage - Using SlotAllowanceCard component */}
              {slotSummary && (
                <div className="px-6 pb-5">
                  <SlotAllowanceCard
                    slotSummary={slotSummary}
                    variant="default"
                    onManageCategories={onManageCategories}
                    showCategories={true}
                    maxCategoriesToShow={6}
                  />
                </div>
              )}

              {/* Credit Costs Reference */}
              <div className="px-6 pb-5">
                <h3 className="text-sm font-medium text-primary mb-3">Credit Costs</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(CREDIT_COSTS).slice(0, 4).map(([key, cost]) => (
                    <div
                      key={key}
                      className="px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <p className="text-xs text-slate-500 truncate">{cost.label}</p>
                      <p className="text-sm font-medium text-primary tabular-nums mt-0.5">
                        {formatCredits(cost.typical)} credits
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="px-6 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-primary">Recent Activity</h3>
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
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className={`p-2 rounded-lg ${isCredit ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                            <Icon className={`w-4 h-4 ${isCredit ? 'text-emerald-500' : 'text-slate-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-primary truncate">{txn.description}</p>
                            <p className="text-xs text-slate-400">
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
                              isCredit ? 'text-emerald-600' : 'text-primary'
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
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={onContactSales}
                className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Add More Credits
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">
                Contact your account manager for top-ups
              </p>
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
          <span className="font-semibold text-primary tabular-nums">
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
