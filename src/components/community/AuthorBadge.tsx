import { formatDistanceToNow } from 'date-fns';
import type { UserProfile } from '../../types/community';

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
  const initial = displayName.charAt(0).toUpperCase();

  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: false });

  // Size variants
  const sizeClasses = {
    sm: {
      avatar: 'w-6 h-6 text-[10px]',
      name: 'text-xs',
      meta: 'text-xs',
    },
    md: {
      avatar: 'w-9 h-9 text-sm',
      name: 'text-sm font-medium',
      meta: 'text-xs',
    },
    lg: {
      avatar: 'w-11 h-11 text-base',
      name: 'text-base font-medium',
      meta: 'text-sm',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex items-center gap-2.5">
      {/* Avatar */}
      {showAvatar && (
        <div
          className={`${classes.avatar} rounded-full flex items-center justify-center font-medium
                     bg-slate-200 text-slate-600 flex-shrink-0 overflow-hidden`}
        >
          {author?.avatarUrl ? (
            <img
              src={author.avatarUrl}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col">
        <span className={`${classes.name} text-slate-800`}>
          {displayName}
          {showReputation && author?.reputation !== undefined && (
            <span className="text-slate-400 font-normal ml-1">
              ({author.reputation.toLocaleString()})
            </span>
          )}
        </span>
        <span className={`${classes.meta} text-slate-400`}>
          {timeAgo} ago
        </span>
      </div>
    </div>
  );
}
