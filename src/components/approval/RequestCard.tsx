// RequestCard - Display a single approval request
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Clock,
  Coins,
  User,
  Calendar,
} from 'lucide-react';
import { RequestStatusBadge } from './RequestStatusBadge';
import type { UpgradeRequest } from '../../types/requests';
import { getRequestTypeDisplay } from '../../types/requests';
import { formatCredits } from '../../types/subscription';

interface RequestCardProps {
  request: UpgradeRequest;
  onClick?: () => void;
  showRequester?: boolean;
  delay?: number;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function RequestCard({
  request,
  onClick,
  showRequester = false,
  delay = 0,
}: RequestCardProps) {
  const typeInfo = getRequestTypeDisplay(request.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className={`
        group p-4 rounded-[1.25rem]
        bg-white/80 backdrop-blur-xl
        border border-white/60
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        ring-1 ring-black/[0.02]
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-200/60 transition-all duration-200' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          {/* Type badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
              {typeInfo.label}
            </span>
            <RequestStatusBadge status={request.status} />
          </div>

          {/* Title */}
          <h4 className="text-[15px] font-medium text-[#1d1d1f] mb-1 truncate">
            {request.title}
          </h4>

          {/* Description */}
          {request.description && (
            <p className="text-[13px] text-slate-500 line-clamp-2 mb-3">
              {request.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-[12px] text-slate-400">
            {showRequester && (
              <span className="flex items-center gap-1">
                <User size={12} strokeWidth={1.5} />
                {request.requesterName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Coins size={12} strokeWidth={1.5} />
              {formatCredits(request.estimatedCredits)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} strokeWidth={1.5} />
              {formatRelativeTime(request.createdAt)}
            </span>
          </div>
        </div>

        {/* Right action */}
        {onClick && (
          <div className="flex items-center">
            <ChevronRight
              size={18}
              strokeWidth={1.5}
              className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all"
            />
          </div>
        )}
      </div>

      {/* Expiration warning for pending requests */}
      {request.status === 'pending' && (request as UpgradeRequest & { expiresAt?: string }).expiresAt && (
        <div className="mt-3 pt-3 border-t border-slate-100/60">
          <ExpirationIndicator expiresAt={(request as UpgradeRequest & { expiresAt?: string }).expiresAt!} />
        </div>
      )}
    </motion.div>
  );
}

function ExpirationIndicator({ expiresAt }: { expiresAt: string }) {
  const expDate = new Date(expiresAt);
  const now = new Date();
  const hoursLeft = Math.max(0, (expDate.getTime() - now.getTime()) / (60 * 60 * 1000));
  const isUrgent = hoursLeft < 4;

  return (
    <div className={`
      flex items-center gap-1.5 text-[12px]
      ${isUrgent ? 'text-orange-600' : 'text-slate-400'}
    `}>
      <Clock size={12} strokeWidth={1.5} className={isUrgent ? 'animate-pulse' : ''} />
      {isUrgent ? (
        <span className="font-medium">
          {hoursLeft < 1 ? 'Expires soon' : `${Math.ceil(hoursLeft)}h until escalation`}
        </span>
      ) : (
        <span>
          Expires {expDate.toLocaleDateString()} at {expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}
