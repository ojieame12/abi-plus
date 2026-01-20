// SlotAllowanceCard - Display managed category slot usage
// Shows how many L2a category slots are used vs available

import { motion } from 'framer-motion';
import {
  Grid3X3,
  ChevronRight,
  Plus,
  CheckCircle,
  AlertCircle,
  Box,
  Package,
  Truck,
  Monitor,
  Beaker,
  Zap,
  Wrench,
  Megaphone,
  Users,
  Building,
  Plane,
  Car,
  Briefcase,
  Folder,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActivatedCategory, CategorySlotSummary } from '../../types/managedCategories';
import {
  getSlotUsageStatus,
  getCategoryDomainColor,
} from '../../types/managedCategories';

// Icon mapping for domains
const DOMAIN_ICONS: Record<string, LucideIcon> = {
  Box,
  Package,
  Truck,
  Monitor,
  Beaker,
  Zap,
  Wrench,
  Megaphone,
  Users,
  Building,
  Plane,
  Car,
  Briefcase,
  Folder,
};

function getDomainIcon(iconName: string): LucideIcon {
  return DOMAIN_ICONS[iconName] || Folder;
}

// Status configurations
const STATUS_STYLES = {
  healthy: {
    bg: 'bg-teal-500',
    light: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-700',
  },
  warning: {
    bg: 'bg-amber-500',
    light: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
  full: {
    bg: 'bg-red-500',
    light: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
  },
};

// Card variants
type CardVariant = 'default' | 'compact' | 'detailed';

interface SlotAllowanceCardProps {
  slotSummary: CategorySlotSummary;
  variant?: CardVariant;
  onManageCategories?: () => void;
  onAddCategory?: () => void;
  onCategoryClick?: (category: ActivatedCategory) => void;
  showCategories?: boolean;
  maxCategoriesToShow?: number;
  className?: string;
}

export function SlotAllowanceCard({
  slotSummary,
  variant = 'default',
  onManageCategories,
  onAddCategory,
  onCategoryClick,
  showCategories = true,
  maxCategoriesToShow = 6,
  className = '',
}: SlotAllowanceCardProps) {
  const { totalSlots, usedSlots, remainingSlots, activatedCategories } = slotSummary;
  const status = getSlotUsageStatus(usedSlots, totalSlots);
  const styles = STATUS_STYLES[status];
  const percentage = Math.round((usedSlots / totalSlots) * 100);

  // Group categories by domain for display
  const categoriesByDomain = activatedCategories.reduce((acc, cat) => {
    const domain = cat.category.domain;
    if (!acc[domain]) {
      acc[domain] = [];
    }
    acc[domain].push(cat);
    return acc;
  }, {} as Record<string, ActivatedCategory[]>);

  // Compact variant - minimal pill display
  if (variant === 'compact') {
    return (
      <button
        onClick={onManageCategories}
        className={`
          group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
          bg-slate-50 border border-slate-200 hover:border-slate-300
          transition-all duration-150
          ${className}
        `}
      >
        <Grid3X3 className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-primary tabular-nums">
          {usedSlots}/{totalSlots}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${styles.badge}`}>
          {remainingSlots} left
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 -mr-1 transition-opacity" />
      </button>
    );
  }

  // Detailed variant - full card with category breakdown
  if (variant === 'detailed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${styles.light}`}>
                <Grid3X3 className={`w-5 h-5 ${styles.text}`} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary">Managed Categories</h3>
                <p className="text-xs text-secondary">L2a analyst-validated coverage</p>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${styles.badge}`}>
              {remainingSlots} slots available
            </div>
          </div>

          {/* Progress section */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-primary tabular-nums">{usedSlots}</span>
              <span className="text-sm text-secondary">of {totalSlots} slots used</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`h-full ${styles.bg} rounded-full`}
              />
            </div>
            {status === 'warning' && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                <AlertCircle className="w-3.5 h-3.5" />
                Running low on slots. Consider upgrading your plan.
              </p>
            )}
            {status === 'full' && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-2">
                <AlertCircle className="w-3.5 h-3.5" />
                All slots used. Upgrade to add more categories.
              </p>
            )}
          </div>
        </div>

        {/* Category breakdown by domain */}
        {showCategories && Object.keys(categoriesByDomain).length > 0 && (
          <div className="px-6 py-4">
            <p className="text-xs font-medium text-secondary uppercase tracking-wider mb-3">
              Active Categories by Domain
            </p>
            <div className="space-y-3">
              {Object.entries(categoriesByDomain)
                .slice(0, 5)
                .map(([domain, cats]) => {
                  const domainColor = getCategoryDomainColor(domain);
                  const [textColor, bgColor] = domainColor.split(' ');
                  return (
                    <div key={domain} className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${bgColor}`}>
                        <Box className={`w-4 h-4 ${textColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary">{domain}</p>
                        <p className="text-xs text-secondary truncate">
                          {cats.map(c => c.category.name).join(', ')}
                        </p>
                      </div>
                      <span className="text-sm text-secondary tabular-nums">{cats.length}</span>
                    </div>
                  );
                })}
              {Object.keys(categoriesByDomain).length > 5 && (
                <p className="text-xs text-slate-400 pl-10">
                  +{Object.keys(categoriesByDomain).length - 5} more domains
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={onManageCategories}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-sm font-medium text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Grid3X3 className="w-4 h-4" />
            Manage Categories
          </button>
          {remainingSlots > 0 && (
            <button
              onClick={onAddCategory}
              className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Default variant - balanced card
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-xl bg-slate-50 border border-slate-100 ${className}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-primary">Managed Categories</span>
        </div>
        <span className="text-sm text-secondary">
          <span className="font-semibold text-primary tabular-nums">{usedSlots}</span>
          {' / '}{totalSlots} slots
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`h-full rounded-full ${
            status === 'full' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-500' : 'bg-teal-500'
          }`}
        />
      </div>

      {/* Category chips */}
      {showCategories && activatedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {activatedCategories.slice(0, maxCategoriesToShow).map((cat) => {
            const domainColor = getCategoryDomainColor(cat.category.domain);
            const [textColor, bgColor] = domainColor.split(' ');
            const IconComponent = getDomainIcon(cat.category.domain === 'Metals' ? 'Box' : 'Package');

            return (
              <button
                key={cat.id}
                onClick={() => onCategoryClick?.(cat)}
                className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-lg
                  ${bgColor} ${textColor} text-xs font-medium
                  hover:opacity-80 transition-opacity
                `}
              >
                <IconComponent className="w-3 h-3" />
                {cat.category.name}
              </button>
            );
          })}
          {activatedCategories.length > maxCategoriesToShow && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium">
              +{activatedCategories.length - maxCategoriesToShow} more
            </span>
          )}
        </div>
      )}

      {/* Action link */}
      <button
        onClick={onManageCategories}
        className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
      >
        Manage categories
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// Inline slot indicator for use in headers/text
interface InlineSlotIndicatorProps {
  used: number;
  total: number;
  className?: string;
}

export function InlineSlotIndicator({ used, total, className = '' }: InlineSlotIndicatorProps) {
  const status = getSlotUsageStatus(used, total);
  const styles = STATUS_STYLES[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
        bg-slate-100 text-sm
        ${className}
      `}
    >
      <Grid3X3 className="w-3.5 h-3.5 text-slate-500" />
      <span className="font-medium text-primary tabular-nums">{used}/{total}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${styles.bg}`} />
    </span>
  );
}

// Mini slot card for dashboard widgets
interface MiniSlotCardProps {
  slotSummary: CategorySlotSummary;
  onClick?: () => void;
  className?: string;
}

export function MiniSlotCard({ slotSummary, onClick, className = '' }: MiniSlotCardProps) {
  const { totalSlots, usedSlots, remainingSlots } = slotSummary;
  const status = getSlotUsageStatus(usedSlots, totalSlots);
  const percentage = Math.round((usedSlots / totalSlots) * 100);

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl bg-white border border-slate-100
        hover:border-slate-200 hover:shadow-sm
        transition-all duration-150 text-left
        ${className}
      `}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-teal-50">
          <Grid3X3 className="w-4 h-4 text-teal-600" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-secondary">Category Slots</p>
          <p className="text-lg font-semibold text-primary tabular-nums">
            {usedSlots} <span className="text-sm font-normal text-secondary">/ {totalSlots}</span>
          </p>
        </div>
        {status === 'healthy' && <CheckCircle className="w-5 h-5 text-teal-500" />}
        {status === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500" />}
        {status === 'full' && <AlertCircle className="w-5 h-5 text-red-500" />}
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            status === 'full' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-500' : 'bg-teal-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-secondary mt-2">
        {remainingSlots > 0
          ? `${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} available`
          : 'No slots available'
        }
      </p>
    </button>
  );
}
