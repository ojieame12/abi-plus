import { BadgeDisplay } from './BadgeDisplay';
import type { UserBadgeWithDetails, BadgeTier } from '../../types/community';

interface UserBadgesProps {
  badges: UserBadgeWithDetails[];
  maxDisplay?: number;
  groupByTier?: boolean;
}

const TIER_ORDER: BadgeTier[] = ['gold', 'silver', 'bronze'];

export function UserBadges({
  badges,
  maxDisplay,
  groupByTier = false,
}: UserBadgesProps) {
  if (badges.length === 0) {
    return (
      <p className="text-sm text-slate-400">No badges earned yet</p>
    );
  }

  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
  const remaining = badges.length - displayBadges.length;

  if (groupByTier) {
    // Group badges by tier
    const grouped = TIER_ORDER.reduce((acc, tier) => {
      acc[tier] = displayBadges.filter(ub => ub.badge.tier === tier);
      return acc;
    }, {} as Record<BadgeTier, UserBadgeWithDetails[]>);

    return (
      <div className="space-y-3">
        {TIER_ORDER.map(tier => {
          const tierBadges = grouped[tier];
          if (tierBadges.length === 0) return null;

          return (
            <div key={tier}>
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                {tier}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {tierBadges.map(ub => (
                  <BadgeDisplay key={ub.badge.id} badge={ub.badge} size="sm" />
                ))}
              </div>
            </div>
          );
        })}
        {remaining > 0 && (
          <p className="text-xs text-slate-400">
            +{remaining} more badges
          </p>
        )}
      </div>
    );
  }

  // Flat list
  return (
    <div className="flex flex-wrap gap-1.5">
      {displayBadges.map(ub => (
        <BadgeDisplay key={ub.badge.id} badge={ub.badge} size="sm" />
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2 py-1 text-xs text-slate-400">
          +{remaining} more
        </span>
      )}
    </div>
  );
}
