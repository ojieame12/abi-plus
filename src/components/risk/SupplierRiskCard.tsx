import { ChevronRight, AlertTriangle } from 'lucide-react';
import { RiskScoreBadge } from './RiskScoreBadge';

interface Supplier {
    id: string;
    name: string;
    duns?: string;
    category: string;
    location: string;
    spend: number;
    spendFormatted: string;
    criticality?: 'high' | 'medium' | 'low';
    srs: {
        score: number | null;
        level: 'high' | 'medium-high' | 'medium' | 'low' | 'unrated';
        trend: 'improving' | 'worsening' | 'stable';
        lastUpdated: string;
    };
    alert?: string;
}

interface SupplierRiskCardProps {
    supplier: Supplier;
    onClick?: () => void;
    onViewDetails?: () => void;
    onFindAlternatives?: () => void;
    variant?: 'standard' | 'compact' | 'alert';
}

export const SupplierRiskCard = ({
    supplier,
    onClick,
    onViewDetails,
    onFindAlternatives,
    variant = 'standard',
}: SupplierRiskCardProps) => {
    if (variant === 'compact') {
        return (
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between p-3.5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 text-left ring-1 ring-black/[0.02]"
            >
                <div className="flex-1 min-w-0">
                    <div className="font-normal text-slate-900 truncate">{supplier.name}</div>
                    <div className="text-xs text-slate-500 truncate">
                        {supplier.category} · {supplier.location}
                    </div>
                </div>
                <div className="flex items-center gap-3 ml-3">
                    <RiskScoreBadge
                        score={supplier.srs.score}
                        level={supplier.srs.level}
                        size="sm"
                        showLabel={false}
                    />
                    <ChevronRight size={16} strokeWidth={1.5} className="text-slate-400" />
                </div>
            </button>
        );
    }

    if (variant === 'alert') {
        return (
            <div className="p-4 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-normal text-slate-900">{supplier.name}</span>
                            <RiskScoreBadge
                                score={supplier.srs.score}
                                level={supplier.srs.level}
                                size="sm"
                            />
                        </div>
                        {supplier.alert && (
                            <p className="text-sm text-slate-600 mb-2">{supplier.alert}</p>
                        )}
                        <div className="text-xs text-slate-500">
                            Spend: {supplier.spendFormatted} · {supplier.location}
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} strokeWidth={1.5} className="text-amber-600" />
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100/60">
                    <button
                        onClick={onViewDetails}
                        className="flex-1 py-2 text-sm font-normal text-violet-600 hover:bg-violet-50/50 rounded-lg transition-colors"
                    >
                        View Supplier
                    </button>
                    <button
                        onClick={onFindAlternatives}
                        className="flex-1 py-2 text-sm font-normal text-slate-600 hover:bg-slate-50/50 rounded-lg transition-colors"
                    >
                        Find Alternatives
                    </button>
                </div>
            </div>
        );
    }

    // Standard variant
    return (
        <div className="p-5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group ring-1 ring-black/[0.02]">
            <div className="flex items-start justify-between mb-5">
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                        <h4 className="text-2xl font-light text-[#1d1d1f] tracking-tight truncate group-hover:text-violet-600 transition-colors">
                            {supplier.name}
                        </h4>
                        {onClick && (
                            <button onClick={onClick} className="text-slate-300 hover:text-slate-500 transition-colors">
                                <ChevronRight size={20} strokeWidth={1.5} />
                            </button>
                        )}
                    </div>
                    {supplier.duns && (
                        <div className="text-[11px] font-mono text-slate-400 mt-1">DUNS: {supplier.duns}</div>
                    )}
                    <div className="text-[13px] text-slate-500 mt-1 font-normal">
                        {supplier.category} · {supplier.location}
                    </div>
                </div>
                <div className="shrink-0 pt-1">
                    <RiskScoreBadge
                        score={supplier.srs.score}
                        level={supplier.srs.level}
                        trend={supplier.srs.trend}
                        size="md"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 py-5 border-t border-slate-50">
                <div>
                    <div className="text-[11px] uppercase tracking-widest font-normal text-slate-400 mb-1">Spend</div>
                    <div className="text-lg font-light text-[#1d1d1f] tracking-tight">{supplier.spendFormatted}</div>
                </div>
                <div>
                    <div className="text-[11px] uppercase tracking-widest font-normal text-slate-400 mb-1">Criticality</div>
                    <div className="text-lg font-light text-[#1d1d1f] tracking-tight capitalize">
                        {supplier.criticality || '—'}
                    </div>
                </div>
                <div>
                    <div className="text-[11px] uppercase tracking-widest font-normal text-slate-400 mb-1">Updated</div>
                    <div className="text-[13px] text-slate-500 mt-1 font-normal">{supplier.srs.lastUpdated}</div>
                </div>
            </div>

            {supplier.alert && (
                <div className="mt-2 mb-4 p-3.5 bg-amber-50/50 border border-amber-100/40 rounded-2xl flex items-start gap-2.5">
                    <AlertTriangle size={15} strokeWidth={1.5} className="text-amber-600 mt-0.5 shrink-0" />
                    <span className="text-[13px] font-normal text-amber-900/80 leading-relaxed">{supplier.alert}</span>
                </div>
            )}

            <div className="flex items-center gap-3 pt-2">
                <button
                    onClick={onViewDetails}
                    className="flex-1 py-2.5 text-[13px] font-normal text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-all shadow-sm"
                >
                    View Details
                </button>
                <button
                    onClick={onFindAlternatives}
                    className="flex-1 py-2.5 text-[13px] font-normal text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                >
                    Find Alternatives
                </button>
            </div>
        </div>
    );
};