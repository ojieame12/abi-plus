import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import type { SupplierMiniData } from '../../types/widgets';

interface SupplierMiniCardProps {
  data: SupplierMiniData;
  onClick?: () => void;
}

const riskColors = {
  low: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  'medium-high': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  high: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
};

const trendConfig = {
  improving: { icon: TrendingDown, color: 'text-emerald-500' },
  stable: { icon: Minus, color: 'text-slate-400' },
  worsening: { icon: TrendingUp, color: 'text-rose-500' },
};

export const SupplierMiniCard = ({ data, onClick }: SupplierMiniCardProps) => {
  const { supplierName, riskScore, riskLevel, trend, category } = data;
  const colors = riskColors[riskLevel];
  const trendInfo = trendConfig[trend];
  const TrendIcon = trendInfo.icon;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2.5 px-3 py-2 bg-white/80 backdrop-blur-xl rounded-xl border border-white/60 shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.06)] transition-all group"
    >
      {/* Score badge */}
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${colors.bg} ${colors.border} border`}>
        <span className={`text-[13px] font-normal ${colors.text}`}>{riskScore}</span>
      </div>

      {/* Name & Category */}
      <div className="text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] text-slate-700 group-hover:text-violet-600 transition-colors">
            {supplierName}
          </span>
          <TrendIcon size={12} strokeWidth={1.5} className={trendInfo.color} />
        </div>
        {category && (
          <span className="text-[11px] text-slate-400">{category}</span>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight size={14} strokeWidth={1.5} className="text-slate-300 group-hover:text-violet-400 transition-colors" />
    </button>
  );
};
