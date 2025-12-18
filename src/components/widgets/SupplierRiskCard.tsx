// Supplier Risk Card - Individual supplier summary widget
import { Supplier } from '../../types/supplier';
import { RiskScoreBadge } from '../risk/RiskScoreBadge';
import { TrendingUp, TrendingDown, Minus, ChevronRight, MapPin, Building } from 'lucide-react';

interface SupplierRiskCardProps {
  supplier: Supplier;
  onClick?: () => void;
  showActions?: boolean;
  onFindAlternatives?: () => void;
  onViewDetails?: () => void;
}

export const SupplierRiskCard = ({
  supplier,
  onClick,
  showActions = true,
  onFindAlternatives,
  onViewDetails,
}: SupplierRiskCardProps) => {
  const TrendIcon = supplier.srs.trend === 'worsening'
    ? TrendingUp
    : supplier.srs.trend === 'improving'
      ? TrendingDown
      : Minus;

  const trendColor = supplier.srs.trend === 'worsening'
    ? 'text-red-500'
    : supplier.srs.trend === 'improving'
      ? 'text-green-500'
      : 'text-gray-400';

  const trendLabel = supplier.srs.trend === 'worsening'
    ? 'Risk Increasing'
    : supplier.srs.trend === 'improving'
      ? 'Risk Decreasing'
      : 'Stable';

  return (
    <div
      className={`bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02] ${onClick ? 'cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300' : ''
        }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-normal text-primary truncate">{supplier.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted mt-1">
            <Building size={14} strokeWidth={1.5} />
            <span className="truncate">{supplier.category}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted mt-0.5">
            <MapPin size={14} strokeWidth={1.5} />
            <span>{supplier.location.city}, {supplier.location.country}</span>
          </div>
        </div>
        {onClick && (
          <ChevronRight size={20} strokeWidth={1.5} className="text-slate-400 shrink-0" />
        )}
      </div>

      {/* Score Section */}
      <div className="flex items-center justify-between py-3 border-y border-slate-100">
        <div className="text-center">
          <div className="text-3xl font-light text-primary">
            {supplier.srs.score || '—'}
          </div>
          <RiskScoreBadge
            score={supplier.srs.score}
            level={supplier.srs.level}
            size="sm"
            showEmoji={false}
          />
        </div>
        <div className="text-right">
          <div className="text-lg font-light text-primary">{supplier.spendFormatted}</div>
          <div className="text-xs text-muted">Your Spend</div>
        </div>
      </div>

      {/* Trend & Meta */}
      <div className="flex items-center justify-between mt-3 text-sm">
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon size={16} strokeWidth={1.5} />
          <span>{trendLabel}</span>
        </div>
        <span className="text-muted">Updated: {supplier.srs.lastUpdated}</span>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails?.(); }}
            className="flex-1 py-2 px-3 text-sm font-normal text-violet-600 bg-violet-50/50 rounded-xl hover:bg-violet-100/50 transition-colors"
          >
            View Details
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onFindAlternatives?.(); }}
            className="flex-1 py-2 px-3 text-sm font-normal text-slate-600 bg-slate-50/60 rounded-xl hover:bg-slate-100/50 transition-colors"
          >
            Find Alternatives
          </button>
        </div>
      )}
    </div>
  );
};

// Mini version for lists
export const SupplierRiskCardMini = ({
  supplier,
  onClick,
}: {
  supplier: Supplier;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-3 bg-slate-50/60 rounded-2xl hover:bg-slate-100/50 transition-colors text-left"
  >
    <div className="min-w-0">
      <div className="font-normal text-primary truncate">{supplier.name}</div>
      <div className="text-xs text-muted">{supplier.category} · {supplier.location.country}</div>
    </div>
    <div className="text-right shrink-0 ml-3">
      <div className={`font-light ${supplier.srs.level === 'high' ? 'text-red-600' :
          supplier.srs.level === 'medium-high' ? 'text-orange-600' :
            supplier.srs.level === 'medium' ? 'text-yellow-600' :
              supplier.srs.level === 'low' ? 'text-green-600' : 'text-gray-400'
        }`}>
        {supplier.srs.score || '—'}
      </div>
      <div className="text-xs text-muted">{supplier.spendFormatted}</div>
    </div>
  </button>
);

export default SupplierRiskCard;
