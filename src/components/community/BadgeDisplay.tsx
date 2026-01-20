import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Badge, BadgeTier } from '../../types/community';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

const TIER_STYLES: Record<BadgeTier, { bg: string; text: string; border: string }> = {
  bronze: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  silver: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
  },
  gold: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
  },
};

const SIZE_STYLES = {
  sm: {
    container: 'px-2 py-1 gap-1',
    icon: 12,
    text: 'text-xs',
  },
  md: {
    container: 'px-2.5 py-1.5 gap-1.5',
    icon: 14,
    text: 'text-sm',
  },
  lg: {
    container: 'px-3 py-2 gap-2',
    icon: 16,
    text: 'text-base',
  },
};

export function BadgeDisplay({
  badge,
  size = 'sm',
  showDescription = false,
}: BadgeDisplayProps) {
  const tierStyle = TIER_STYLES[badge.tier];
  const sizeStyle = SIZE_STYLES[size];

  // Get icon component dynamically
  const IconComponent =
    (LucideIcons as unknown as Record<string, LucideIcon>)[badge.icon] || LucideIcons.Award;

  return (
    <div
      className={`
        inline-flex items-center rounded-lg border
        ${tierStyle.bg} ${tierStyle.border}
        ${sizeStyle.container}
      `}
      title={badge.description}
    >
      <IconComponent size={sizeStyle.icon} className={tierStyle.text} />
      <span className={`font-medium ${tierStyle.text} ${sizeStyle.text}`}>
        {badge.name}
      </span>
      {showDescription && (
        <span className={`text-slate-500 ${sizeStyle.text}`}>
          - {badge.description}
        </span>
      )}
    </div>
  );
}
