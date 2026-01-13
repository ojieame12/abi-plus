import { motion } from 'framer-motion';

// Reputation tier configuration
export type ReputationTier = 'newcomer' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface TierConfig {
  name: string;
  minRep: number;
  maxRep: number;
  colors: {
    bg: string;
    text: string;
    accent: string;
    icon: string;
    ring: string;
  };
}

// Tier colors matched to actual badge image colors:
// badge-1 = Gold (2 stars), badge-2 = Gold (1 star)
// badge-3 = Purple (2 stars), badge-4 = Purple (1 star tall)
// badge-5 = Bronze/Copper
const TIER_CONFIG: Record<ReputationTier, TierConfig> = {
  newcomer: {
    name: 'Newcomer',
    minRep: 0,
    maxRep: 99,
    colors: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      accent: 'text-slate-400',
      icon: 'text-slate-400',
      ring: 'ring-slate-200',
    },
  },
  bronze: {
    name: 'Bronze',
    minRep: 100,
    maxRep: 499,
    colors: {
      // badge-1 is Gold colored
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      accent: 'text-amber-500',
      icon: 'text-amber-500',
      ring: 'ring-amber-200',
    },
  },
  silver: {
    name: 'Silver',
    minRep: 500,
    maxRep: 999,
    colors: {
      // badge-2 is Gold colored
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      accent: 'text-amber-500',
      icon: 'text-amber-500',
      ring: 'ring-amber-300',
    },
  },
  gold: {
    name: 'Gold',
    minRep: 1000,
    maxRep: 2499,
    colors: {
      // badge-3 is Purple colored
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      accent: 'text-violet-500',
      icon: 'text-violet-500',
      ring: 'ring-violet-300',
    },
  },
  platinum: {
    name: 'Platinum',
    minRep: 2500,
    maxRep: 4999,
    colors: {
      // badge-4 is Purple colored
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      accent: 'text-violet-500',
      icon: 'text-violet-500',
      ring: 'ring-violet-300',
    },
  },
  diamond: {
    name: 'Diamond',
    minRep: 5000,
    maxRep: Infinity,
    colors: {
      // badge-5 is Bronze/Copper colored
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      accent: 'text-orange-500',
      icon: 'text-orange-500',
      ring: 'ring-orange-300',
    },
  },
};

// Get tier from reputation
export function getTierFromReputation(reputation: number): ReputationTier {
  if (reputation >= 5000) return 'diamond';
  if (reputation >= 2500) return 'platinum';
  if (reputation >= 1000) return 'gold';
  if (reputation >= 500) return 'silver';
  if (reputation >= 100) return 'bronze';
  return 'newcomer';
}

// Get tier config
export function getTierConfig(tier: ReputationTier): TierConfig {
  return TIER_CONFIG[tier];
}

// Size variants
type BadgeSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<BadgeSize, { pill: string; icon: string; text: string; label: string }> = {
  sm: {
    pill: 'px-2 py-1 gap-1',
    icon: 'w-3 h-3',
    text: 'text-xs font-semibold',
    label: 'text-[10px]',
  },
  md: {
    pill: 'px-3 py-1.5 gap-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm font-semibold',
    label: 'text-xs',
  },
  lg: {
    pill: 'px-4 py-2 gap-2',
    icon: 'w-5 h-5',
    text: 'text-base font-semibold',
    label: 'text-sm',
  },
};

interface ReputationBadgeProps {
  reputation: number;
  size?: BadgeSize;
  showTierName?: boolean;
  showProgress?: boolean;
  animate?: boolean;
  className?: string;
}

export function ReputationBadge({
  reputation,
  size = 'md',
  showTierName = true,
  showProgress = false,
  animate = true,
  className = '',
}: ReputationBadgeProps) {
  const tier = getTierFromReputation(reputation);
  const config = getTierConfig(tier);
  const sizeClasses = SIZE_CLASSES[size];

  // Calculate progress to next tier
  const progressToNext = tier !== 'diamond'
    ? ((reputation - config.minRep) / (config.maxRep - config.minRep + 1)) * 100
    : 100;

  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate ? {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 },
  } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`inline-flex flex-col items-center ${className}`}
    >
      {/* Main badge pill - number + tier name */}
      <div
        className={`
          inline-flex items-center rounded-full
          ${config.colors.bg} ${sizeClasses.pill}
        `}
      >
        <span className={`${sizeClasses.text} ${config.colors.text} tabular-nums`}>
          {reputation.toLocaleString()}
        </span>
        {showTierName && (
          <span className={`${sizeClasses.label} ${config.colors.accent}`}>
            {config.name}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && tier !== 'diamond' && (
        <div className="w-full mt-1.5">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`h-full ${config.colors.bg.replace('50', '400').replace('100', '400')}`}
              style={{
                backgroundColor: tier === 'gold' || tier === 'bronze' ? '#f59e0b' :
                                 tier === 'platinum' ? '#8b5cf6' :
                                 tier === 'silver' ? '#94a3b8' : '#64748b'
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 text-center">
            {(config.maxRep - reputation + 1).toLocaleString()} to {TIER_CONFIG[getNextTier(tier)].name}
          </p>
        </div>
      )}
    </Wrapper>
  );
}

// Helper to get next tier
function getNextTier(current: ReputationTier): ReputationTier {
  const tiers: ReputationTier[] = ['newcomer', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = tiers.indexOf(current);
  return tiers[Math.min(currentIndex + 1, tiers.length - 1)];
}

// Avatar with integrated badge overlay - uses existing PNG badge assets
interface AvatarWithBadgeProps {
  avatarUrl?: string;
  displayName: string;
  reputation: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AVATAR_SIZES = {
  sm: { avatar: 'w-10 h-10', badge: 'w-5 h-5', ring: 'ring-2', fontSize: '0.875rem' },
  md: { avatar: 'w-16 h-16', badge: 'w-8 h-8', ring: 'ring-4', fontSize: '1.125rem' },
  lg: { avatar: 'w-20 h-20', badge: 'w-8 h-8', ring: 'ring-4', fontSize: '1.25rem' },
};

// Generate avatar color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-pink-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

// Map tier to badge image number (1-5)
function getBadgeNumber(tier: ReputationTier): number {
  switch (tier) {
    case 'diamond': return 5;
    case 'platinum': return 4;
    case 'gold': return 3;
    case 'silver': return 2;
    case 'bronze': return 1;
    default: return 1;
  }
}

export function AvatarWithBadge({
  avatarUrl,
  displayName,
  reputation,
  size = 'md',
  className = '',
}: AvatarWithBadgeProps) {
  const tier = getTierFromReputation(reputation);
  const sizeConfig = AVATAR_SIZES[size];

  const initials = displayName
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Only show badge for users above newcomer (100+ rep)
  const showBadge = tier !== 'newcomer';
  const badgeNumber = getBadgeNumber(tier);

  return (
    <div className={`relative flex-shrink-0 ${sizeConfig.avatar} ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className={`${sizeConfig.avatar} rounded-full object-cover ${sizeConfig.ring} ring-[#FAFAFA]`}
        />
      ) : (
        <div
          className={`${sizeConfig.avatar} rounded-full flex items-center justify-center
                     text-white font-light ${sizeConfig.ring} ring-[#FAFAFA] ${getAvatarColor(displayName)}`}
          style={{ fontSize: sizeConfig.fontSize }}
        >
          {initials}
        </div>
      )}

      {/* PNG Badge overlay - using existing badge assets */}
      {showBadge && (
        <img
          src={`/badges/badge-${badgeNumber}.png`}
          alt={`${tier} badge`}
          className={`absolute -bottom-1 -right-1 ${sizeConfig.badge} object-contain`}
        />
      )}
    </div>
  );
}

// Compact inline badge (for use in text) - just tier color + number
interface InlineBadgeProps {
  reputation: number;
  className?: string;
}

export function InlineReputationBadge({ reputation, className = '' }: InlineBadgeProps) {
  const tier = getTierFromReputation(reputation);
  const config = getTierConfig(tier);

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-xs
        ${config.colors.bg} ${config.colors.text} ${className}
      `}
    >
      <span className="font-medium tabular-nums">{reputation.toLocaleString()}</span>
    </span>
  );
}
