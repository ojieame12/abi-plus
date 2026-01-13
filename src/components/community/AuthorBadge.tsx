import { formatDistanceToNow } from 'date-fns';
import type { UserProfile } from '../../types/community';
import { AvatarWithBadge, InlineReputationBadge } from './ReputationBadge';

interface AuthorBadgeProps {
  author?: UserProfile;
  timestamp: string;
  showReputation?: boolean;
  showAvatar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AuthorBadge({
  author,
  timestamp,
  showReputation = false,
  showAvatar = true,
  size = 'md',
}: AuthorBadgeProps) {
  const displayName = author?.displayName || 'Anonymous';
  const reputation = author?.reputation ?? 0;

  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: false });

  // Size variants for text
  const sizeClasses = {
    sm: {
      name: 'text-xs',
      meta: 'text-xs',
    },
    md: {
      name: 'text-sm font-medium',
      meta: 'text-xs',
    },
    lg: {
      name: 'text-base font-medium',
      meta: 'text-sm',
    },
  };

  const classes = sizeClasses[size];

  // Map to AvatarWithBadge sizes
  const avatarSize = size === 'lg' ? 'md' : 'sm';

  return (
    <div className="flex items-center gap-2.5">
      {/* Avatar with tier badge */}
      {showAvatar && (
        <AvatarWithBadge
          avatarUrl={author?.avatarUrl}
          displayName={displayName}
          reputation={reputation}
          size={avatarSize}
        />
      )}

      {/* Info */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`${classes.name} text-slate-800`}>
            {displayName}
          </span>
          {showReputation && reputation > 0 && (
            <InlineReputationBadge reputation={reputation} />
          )}
        </div>
        <span className={`${classes.meta} text-slate-400`}>
          {timeAgo} ago
        </span>
      </div>
    </div>
  );
}
