// UpgradeCTA - Call-to-action buttons for upgrading AI content
// Prompts user to upgrade L1 content to L2b (Decision Grade)

import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Sparkles,
  CheckCircle,
  Star,
  Zap,
  Clock,
  Coins,
} from 'lucide-react';
import { type RequestType, getRequestTypeDisplay, getApprovalLevel, getApprovalLevelDisplay } from '../../types/requests';
import { CREDIT_COSTS, formatCredits } from '../../types/subscription';

interface UpgradeCTAProps {
  requestType: RequestType;
  onUpgrade: () => void;
  variant?: 'default' | 'compact' | 'banner' | 'inline';
  disabled?: boolean;
  className?: string;
}

export function UpgradeCTA({
  requestType,
  onUpgrade,
  variant = 'default',
  disabled = false,
  className = '',
}: UpgradeCTAProps) {
  const typeInfo = getRequestTypeDisplay(requestType);
  const cost = CREDIT_COSTS[requestType];
  const approvalLevel = getApprovalLevel(cost?.typical || 0);

  // Inline variant - just a text link with icon
  if (variant === 'inline') {
    return (
      <button
        onClick={onUpgrade}
        disabled={disabled}
        className={`
          inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-700
          text-sm font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <Sparkles className="w-4 h-4" />
        Upgrade to Decision Grade
        <ArrowUpRight className="w-3.5 h-3.5" />
      </button>
    );
  }

  // Compact variant - small pill button
  if (variant === 'compact') {
    return (
      <motion.button
        onClick={onUpgrade}
        disabled={disabled}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          inline-flex items-center gap-2 px-3.5 py-2 rounded-lg
          bg-gradient-to-r from-violet-500 to-violet-600
          text-white text-sm font-medium
          hover:from-violet-600 hover:to-violet-700
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150
          shadow-sm hover:shadow-md
          ${className}
        `}
      >
        <Star className="w-4 h-4" />
        <span>Upgrade</span>
        <span className="px-1.5 py-0.5 rounded bg-white/20 text-xs tabular-nums">
          {formatCredits(cost?.typical || 0)}
        </span>
      </motion.button>
    );
  }

  // Banner variant - full-width card
  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          p-4 rounded-xl
          bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50
          border border-violet-200
          ${className}
        `}
      >
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-primary mb-1">
              Want decision-grade insights?
            </h4>
            <p className="text-sm text-secondary mb-3">
              Upgrade this AI report with analyst validation, verified data sources, and actionable recommendations.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                24-48 hour turnaround
              </span>
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                {formatCredits(cost?.typical || 0)} credits
              </span>
            </div>
            <button
              onClick={onUpgrade}
              disabled={disabled}
              className="
                inline-flex items-center gap-2 px-4 py-2 rounded-lg
                bg-violet-600 hover:bg-violet-700
                text-white text-sm font-medium
                transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Star className="w-4 h-4" />
              Request Upgrade
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default variant - card with details
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        p-4 rounded-xl bg-white border border-slate-200
        hover:border-violet-200 hover:shadow-md
        transition-all duration-200
        ${className}
      `}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-violet-100">
          <Sparkles className="w-4 h-4 text-violet-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-primary">{typeInfo.label}</h4>
          <p className="text-xs text-secondary mt-0.5">{typeInfo.description}</p>
        </div>
      </div>

      {/* Benefits */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-secondary">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>Analyst-validated data</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-secondary">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>Actionable recommendations</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-secondary">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>Source verification</span>
        </div>
      </div>

      {/* Cost and approval info */}
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
        <span className="flex items-center gap-1">
          <Coins className="w-3.5 h-3.5" />
          {formatCredits(cost?.typical || 0)} credits
        </span>
        {approvalLevel !== 'auto' && (
          <span className="flex items-center gap-1 text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            {getApprovalLevelDisplay(approvalLevel)}
          </span>
        )}
      </div>

      {/* Action button */}
      <motion.button
        onClick={onUpgrade}
        disabled={disabled}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="
          w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
          bg-violet-600 hover:bg-violet-700
          text-white text-sm font-medium
          transition-colors duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <Zap className="w-4 h-4" />
        Request Upgrade
      </motion.button>
    </motion.div>
  );
}

// Quick upgrade button for use in action bars
interface QuickUpgradeButtonProps {
  onClick: () => void;
  credits: number;
  disabled?: boolean;
  className?: string;
}

export function QuickUpgradeButton({
  onClick,
  credits,
  disabled = false,
  className = '',
}: QuickUpgradeButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-lg
        bg-violet-50 hover:bg-violet-100
        border border-violet-200 hover:border-violet-300
        text-violet-700 text-sm font-medium
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <Star className="w-4 h-4 text-violet-500 group-hover:text-violet-600" />
      <span>Upgrade</span>
      <span className="px-1.5 py-0.5 rounded bg-violet-200/60 text-xs tabular-nums">
        {formatCredits(credits)}
      </span>
      <ArrowUpRight className="w-3.5 h-3.5 text-violet-400 group-hover:text-violet-500" />
    </motion.button>
  );
}
