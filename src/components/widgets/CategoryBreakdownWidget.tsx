import { ChevronRight } from 'lucide-react';
import type { CategoryBreakdownData } from '../../types/widgets';

interface CategoryBreakdownWidgetProps {
  data: CategoryBreakdownData;
  size?: 'M' | 'L';
  onCategoryClick?: (categoryName: string) => void;
}

const riskColors = {
  low: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
  medium: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' },
  'medium-high': { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600' },
  high: { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600' },
};

export const CategoryBreakdownWidget = ({ data, size = 'M', onCategoryClick }: CategoryBreakdownWidgetProps) => {
  const { categories, sortBy } = data;

  // Sort categories
  const sortedCategories = [...categories].sort((a, b) => {
    if (sortBy === 'spend') return b.totalSpend - a.totalSpend;
    if (sortBy === 'risk') return b.avgRiskScore - a.avgRiskScore;
    return b.supplierCount - a.supplierCount;
  });

  const displayCategories = size === 'L' ? sortedCategories : sortedCategories.slice(0, 5);
  const maxSpend = Math.max(...categories.map(c => c.totalSpend));

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[1.25rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02] overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-normal text-slate-900">Category Breakdown</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {categories.length} categories · Sorted by {sortBy}
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 pb-4 space-y-3">
        {displayCategories.map((category, i) => {
          const colors = riskColors[category.riskLevel as keyof typeof riskColors] || riskColors.medium;
          const spendPercent = (category.totalSpend / maxSpend) * 100;

          return (
            <button
              key={i}
              onClick={() => onCategoryClick?.(category.name)}
              className="w-full text-left group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-slate-700 group-hover:text-violet-600 transition-colors">
                    {category.name}
                  </span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded ${colors.light} ${colors.text}`}>
                    {category.avgRiskScore}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-slate-500">
                    {category.supplierCount} suppliers
                  </span>
                  <span className="text-[12px] text-slate-700">
                    {category.spendFormatted}
                  </span>
                </div>
              </div>

              {/* Spend bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
                  style={{ width: `${spendPercent}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      {categories.length > displayCategories.length && (
        <div className="px-5 py-3 bg-slate-50/40 border-t border-slate-100/60">
          <button className="flex items-center gap-1 text-[12px] text-violet-600 hover:text-violet-700 transition-colors">
            View all {categories.length} categories
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
};
