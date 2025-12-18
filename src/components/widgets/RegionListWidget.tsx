import { MapPin, ChevronRight } from 'lucide-react';
import type { RegionListData } from '../../types/widgets';

interface RegionListWidgetProps {
  data: RegionListData;
  size?: 'S' | 'M';
  onRegionClick?: (regionCode: string) => void;
}

const getRiskColor = (score: number) => {
  if (score >= 70) return { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600' };
  if (score >= 50) return { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600' };
  if (score >= 30) return { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' };
  return { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' };
};

export const RegionListWidget = ({ data, size = 'M', onRegionClick }: RegionListWidgetProps) => {
  const { regions, totalSuppliers } = data;

  // Compact size - horizontal badges
  if (size === 'S') {
    return (
      <div className="flex flex-wrap gap-2">
        {regions.slice(0, 5).map((region, i) => {
          const colors = getRiskColor(region.avgRiskScore);
          return (
            <button
              key={i}
              onClick={() => onRegionClick?.(region.code)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/80 backdrop-blur-xl rounded-lg border border-white/60 shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.06)] transition-all group"
            >
              {region.flag && <span className="text-[14px]">{region.flag}</span>}
              <span className="text-[12px] text-slate-600 group-hover:text-violet-600 transition-colors">
                {region.name}
              </span>
              <span className={`text-[11px] px-1 py-0.5 rounded ${colors.light} ${colors.text}`}>
                {region.supplierCount}
              </span>
            </button>
          );
        })}
        {regions.length > 5 && (
          <span className="inline-flex items-center px-2 py-1.5 text-[11px] text-slate-400">
            +{regions.length - 5} more
          </span>
        )}
      </div>
    );
  }

  // Standard size - vertical list
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[1.25rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02] overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
            <MapPin size={16} strokeWidth={1.5} className="text-slate-500" />
          </div>
          <div>
            <h3 className="text-[14px] font-normal text-slate-900">Regions</h3>
            <p className="text-[11px] text-slate-500">{totalSuppliers} suppliers</p>
          </div>
        </div>
      </div>

      {/* Regions */}
      <div className="px-4 pb-3 space-y-1">
        {regions.slice(0, 6).map((region, i) => {
          const colors = getRiskColor(region.avgRiskScore);
          const percent = (region.supplierCount / totalSuppliers) * 100;

          return (
            <button
              key={i}
              onClick={() => onRegionClick?.(region.code)}
              className="w-full flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-slate-50/50 transition-colors group"
            >
              {region.flag && <span className="text-[16px]">{region.flag}</span>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-slate-700 group-hover:text-violet-600 transition-colors">
                    {region.name}
                  </span>
                  <span className="text-[12px] text-slate-500">
                    {region.supplierCount}
                  </span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bg} rounded-full`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <ChevronRight size={14} strokeWidth={1.5} className="text-slate-300 group-hover:text-violet-400 transition-colors" />
            </button>
          );
        })}
      </div>

      {regions.length > 6 && (
        <div className="px-4 py-2.5 bg-slate-50/40 border-t border-slate-100/60">
          <button className="flex items-center gap-1 text-[12px] text-violet-600 hover:text-violet-700 transition-colors">
            View all {regions.length} regions
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
};
