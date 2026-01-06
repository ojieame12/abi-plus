// Supplier Table Widget - List of suppliers with key metrics
import type { SupplierTableData } from '../../types/widgets';
import { ChevronRight } from 'lucide-react';

interface SupplierRow {
  id: string;
  name: string;
  riskScore: number;
  riskLevel: string;
  trend: string;
  category: string;
  country: string;
  spend: string;
}

interface Props {
  data: SupplierTableData;
  onViewAll?: () => void;
  onRowClick?: (supplier: SupplierRow) => void;
  onViewDetails?: () => void;
  beroeSourceCount?: number;
}

export const SupplierTableWidget = ({ data, onViewAll, onRowClick, onViewDetails, beroeSourceCount = 3 }: Props) => {
  // Defensive: ensure data exists
  if (!data || !data.suppliers) {
    return (
      <div className="p-4 bg-slate-50 rounded-xl text-center text-sm text-slate-500">
        No supplier data available
      </div>
    );
  }

  const { suppliers = [], totalCount = 0, filters = {} } = data;

  // Risk level colors
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium-high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'worsening': return { icon: '↑', color: 'text-red-500' };
      case 'improving': return { icon: '↓', color: 'text-green-500' };
      default: return { icon: '→', color: 'text-slate-400' };
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-normal text-slate-900">Suppliers</h3>
          <p className="text-sm text-slate-500">
            Showing {suppliers.length} of {totalCount} suppliers
          </p>
        </div>
        {filters && Object.keys(filters).length > 0 && (
          <div className="flex gap-2">
            {Object.entries(filters).map(([key, value]) => (
              <span
                key={key}
                className="px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded-full"
              >
                {key}: {value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th className="px-5 py-3">Supplier</th>
              <th className="px-5 py-3 text-center">Risk Score</th>
              <th className="px-5 py-3 text-center">Trend</th>
              <th className="px-5 py-3 text-right">Spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((supplier) => {
              const trendInfo = getTrendIcon(supplier.trend);
              return (
                <tr
                  key={supplier.id}
                  onClick={() => onRowClick?.(supplier)}
                  className="hover:bg-slate-100/50 active:bg-slate-100 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4">
                    <div className="font-normal text-slate-900">{supplier.name}</div>
                    <div className="text-xs text-slate-500">
                      {supplier.category} · {supplier.country}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-normal text-slate-900">
                        {supplier.riskScore}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRiskColor(supplier.riskLevel)}`}>
                        {supplier.riskLevel}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-lg ${trendInfo.color}`}>
                      {trendInfo.icon}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-normal text-slate-900">{supplier.spend}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {totalCount > suppliers.length && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onViewAll}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            View all {totalCount} suppliers →
          </button>
        </div>
      )}

      {/* Data Attribution Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">B</span>
          </div>
          <span>{beroeSourceCount} Beroe Data Sources</span>
        </div>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors group"
          >
            <span>View Details</span>
            <ChevronRight
              size={16}
              strokeWidth={1.5}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default SupplierTableWidget;
