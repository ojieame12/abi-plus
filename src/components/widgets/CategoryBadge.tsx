import { Folder, ChevronRight } from 'lucide-react';
import type { CategoryBadgeData } from '../../types/widgets';

interface CategoryBadgeProps {
  data: CategoryBadgeData;
  onClick?: () => void;
}

const riskColors = {
  low: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', dot: 'bg-amber-500' },
  'medium-high': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', dot: 'bg-orange-500' },
  high: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', dot: 'bg-rose-500' },
};

export const CategoryBadge = ({ data, onClick }: CategoryBadgeProps) => {
  const { name, supplierCount, riskLevel, spend } = data;
  const colors = riskColors[riskLevel];

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-xl rounded-xl border border-white/60 shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.06)] transition-all group"
    >
      {/* Icon with risk indicator */}
      <div className="relative">
        <div className={`w-7 h-7 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
          <Folder size={14} strokeWidth={1.5} className={colors.text} />
        </div>
        <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${colors.dot} ring-2 ring-white`} />
      </div>

      {/* Content */}
      <div className="text-left">
        <span className="text-[13px] text-slate-700 group-hover:text-violet-600 transition-colors">
          {name}
        </span>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>{supplierCount} suppliers</span>
          {spend && (
            <>
              <span>·</span>
              <span>{spend}</span>
            </>
          )}
        </div>
      </div>

      <ChevronRight size={14} strokeWidth={1.5} className="text-slate-300 group-hover:text-violet-400 transition-colors ml-1" />
    </button>
  );
};
