// RequestStatusBadge - Visual indicator for approval request status
import {
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  AlertTriangle,
  FileEdit,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { RequestStatus } from '../../types/requests';

interface RequestStatusBadgeProps {
  status: RequestStatus;
  size?: 'S' | 'M';
  showLabel?: boolean;
}

const statusConfig: Record<RequestStatus, {
  label: string;
  icon: typeof Clock;
  color: string;
  bg: string;
  border: string;
  dot: string;
}> = {
  draft: {
    label: 'Draft',
    icon: FileEdit,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  pending: {
    label: 'Pending',
    icon: Loader2,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    dot: 'bg-amber-500',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    dot: 'bg-emerald-500',
  },
  denied: {
    label: 'Denied',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    dot: 'bg-red-500',
  },
  cancelled: {
    label: 'Cancelled',
    icon: Ban,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  expired: {
    label: 'Expired',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    dot: 'bg-orange-500',
  },
  fulfilled: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    dot: 'bg-emerald-500',
  },
};

export function RequestStatusBadge({
  status,
  size = 'S',
  showLabel = true,
}: RequestStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isPending = status === 'pending';

  // Compact dot style
  if (size === 'S') {
    return (
      <span className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
        ${config.bg} ${config.border} border
      `}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${isPending ? 'animate-pulse' : ''}`} />
        {showLabel && (
          <span className={`text-[12px] font-medium ${config.color}`}>
            {config.label}
          </span>
        )}
      </span>
    );
  }

  // Medium size with icon
  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-2 rounded-xl
      ${config.bg} ${config.border} border
    `}>
      <div className="w-6 h-6 rounded-lg bg-white/60 flex items-center justify-center">
        <Icon
          size={14}
          strokeWidth={1.5}
          className={`${config.color} ${isPending ? 'animate-spin' : ''}`}
        />
      </div>
      {showLabel && (
        <span className={`text-[13px] font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
