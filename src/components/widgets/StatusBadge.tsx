import { Check, Clock, AlertTriangle, X, Loader } from 'lucide-react';
import type { StatusBadgeData } from '../../types/widgets';

interface StatusBadgeProps {
  data: StatusBadgeData;
  size?: 'S' | 'M';
}

const statusConfig = {
  active: { icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  inactive: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' },
  pending: { icon: Loader, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500' },
  error: { icon: X, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', dot: 'bg-rose-500' },
  warning: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', dot: 'bg-orange-500' },
};

export const StatusBadge = ({ data, size = 'S' }: StatusBadgeProps) => {
  const { status, label, detail } = data;
  const config = statusConfig[status];
  const Icon = config.icon;

  // Compact dot style
  if (size === 'S' && !detail) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${config.bg} ${config.border} border`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <span className={`text-[12px] ${config.color}`}>{label}</span>
      </span>
    );
  }

  // Standard with icon
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${config.bg} ${config.border} border`}>
      <div className={`w-6 h-6 rounded-lg bg-white/60 flex items-center justify-center`}>
        <Icon
          size={14}
          strokeWidth={1.5}
          className={`${config.color} ${status === 'pending' ? 'animate-spin' : ''}`}
        />
      </div>
      <div>
        <span className={`text-[13px] ${config.color}`}>{label}</span>
        {detail && (
          <p className="text-[11px] text-slate-500">{detail}</p>
        )}
      </div>
    </div>
  );
};
