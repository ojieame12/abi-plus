import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RiskScoreBadge } from './RiskScoreBadge';

interface Supplier {
    id: string;
    name: string;
    category?: string;
    srs: {
        score: number | null;
        level: 'high' | 'medium-high' | 'medium' | 'low' | 'unrated';
        trend?: 'improving' | 'worsening' | 'stable';
    };
    spend?: string;
    location?: string;
}

interface SupplierMiniTableProps {
    suppliers: Supplier[];
    totalCount?: number;
    onRowClick?: (supplier: Supplier) => void;
    onViewAll?: () => void;
    showTrend?: boolean;
    showSpend?: boolean;
    maxRows?: number;
}

export const SupplierMiniTable = ({
    suppliers,
    totalCount,
    onRowClick,
    onViewAll,
    showTrend = true,
    showSpend = true,
    maxRows = 5,
}: SupplierMiniTableProps) => {
    const displayedSuppliers = suppliers.slice(0, maxRows);
    const hasMore = totalCount ? totalCount > displayedSuppliers.length : suppliers.length > maxRows;

    const getTrendIcon = (trend?: 'improving' | 'worsening' | 'stable') => {
        if (!trend) return null;
        switch (trend) {
            case 'improving':
                return <TrendingDown size={14} className="text-green-500" />;
            case 'worsening':
                return <TrendingUp size={14} className="text-red-500" />;
            case 'stable':
                return <Minus size={14} className="text-slate-400" />;
        }
    };

    return (
        <div className="bg-white border border-slate-200/60 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 bg-white border-b border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span className="flex-1">Supplier</span>
                    <span className="w-20 text-right">SRS</span>
                    {showSpend && <span className="w-24 text-right">Spend</span>}
                    {showTrend && <span className="w-12 text-center">Trend</span>}
                </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-50">
                {displayedSuppliers.map((supplier) => (
                    <button
                        key={supplier.id}
                        onClick={() => onRowClick?.(supplier)}
                        disabled={!onRowClick}
                        className={`w-full flex items-center px-5 py-4 text-left ${
                            onRowClick ? 'hover:bg-slate-50/50 cursor-pointer' : ''
                        } transition-colors group`}
                    >
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="font-medium text-slate-900 truncate tracking-tight group-hover:text-violet-700 transition-colors">
                                {supplier.name}
                            </div>
                            {supplier.category && (
                                <div className="text-xs text-slate-500 truncate mt-0.5">{supplier.category}</div>
                            )}
                        </div>
                        <div className="w-20 flex justify-end">
                            <RiskScoreBadge
                                score={supplier.srs.score}
                                level={supplier.srs.level}
                                size="sm"
                                showLabel={false}
                            />
                        </div>
                        {showSpend && (
                            <div className="w-24 text-right text-sm text-slate-600 font-medium tabular-nums">
                                {supplier.spend || '—'}
                            </div>
                        )}
                        {showTrend && (
                            <div className="w-12 flex justify-center">
                                {getTrendIcon(supplier.srs.trend)}
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Footer */}
            {(hasMore || onViewAll) && (
                <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/30">
                    <button
                        onClick={onViewAll}
                        className="w-full flex items-center justify-between text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors"
                    >
                        <span>
                            Showing {displayedSuppliers.length} of {totalCount || suppliers.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <span>View All</span>
                            <ChevronRight size={16} />
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};

// Simplified list version for very compact spaces
export const SupplierRiskList = ({
    suppliers,
    onItemClick,
}: {
    suppliers: Supplier[];
    onItemClick?: (supplier: Supplier) => void;
}) => {
    return (
        <div className="space-y-2">
            {suppliers.map((supplier) => (
                <button
                    key={supplier.id}
                    onClick={() => onItemClick?.(supplier)}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${
                            supplier.srs.level === 'high' ? 'bg-red-500' :
                            supplier.srs.level === 'medium-high' ? 'bg-orange-500' :
                            supplier.srs.level === 'medium' ? 'bg-yellow-500' :
                            supplier.srs.level === 'low' ? 'bg-green-500' :
                            'bg-slate-400'
                        }`} />
                        <span className="text-sm font-medium text-slate-900 truncate">
                            {supplier.name}
                        </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 ml-2">
                        {supplier.srs.score ?? '—'}
                    </span>
                </button>
            ))}
        </div>
    );
};
