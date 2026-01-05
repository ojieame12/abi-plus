import { formatDistanceToNow } from 'date-fns';
import type { UserProfile } from '../../types/community';

interface AuthorBadgeProps {
  author?: UserProfile;
  timestamp: string;
  showReputation?: boolean;
  showAvatar?: boolean;
}

export function AuthorBadge({
  author,
  timestamp,
  showReputation = false,
  showAvatar = true,
}: AuthorBadgeProps) {
  const displayName = author?.displayName || 'Anonymous';
  const initial = displayName.charAt(0).toUpperCase();

  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: false });

  return (
    <div className="flex items-center gap-2">
      {/* Avatar - neutral slate */}
      {showAvatar && (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium
                     bg-slate-200 text-slate-600"
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

      {/* Info - simplified format */}
      <span className="text-xs text-slate-500">
        <span className="text-slate-700">{displayName}</span>
        {showReputation && author?.reputation !== undefined && (
          <span className="text-slate-400"> ({author.reputation.toLocaleString()})</span>
        )}
        <span className="text-slate-400"> · {timeAgo}</span>
      </span>
    </div>
  );
}
