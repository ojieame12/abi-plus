import { ChevronRight } from 'lucide-react';
import { RiskDistributionChart } from './RiskDistributionChart';

interface RiskDistribution {
    high: number;
    mediumHigh: number;
    medium: number;
    low: number;
    unrated: number;
}

interface PortfolioOverviewCardProps {
    totalSuppliers: number;
    totalSpend: string;
    distribution: RiskDistribution;
    highRiskCount: number;
    unratedCount: number;
    onSegmentClick?: (level: keyof RiskDistribution) => void;
    onViewDetails?: () => void;
    onExpandClick?: () => void;
    variant?: 'standard' | 'compact' | 'expanded';
}

export const PortfolioOverviewCard = ({
    totalSuppliers,
    totalSpend,
    distribution,
    highRiskCount,
    unratedCount,
    onSegmentClick,
    onViewDetails,
    onExpandClick,
    variant = 'standard',
}: PortfolioOverviewCardProps) => {
    if (variant === 'compact') {
        return (
            <div className="p-4 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-normal text-slate-900">Risk Overview</span>
                    {onExpandClick && (
                        <button
                            onClick={onExpandClick}
                            className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                        >
                            Expand <ChevronRight size={14} strokeWidth={1.5} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-6 mb-3">
                    <div>
                        <div className="text-2xl font-light text-slate-900">{totalSuppliers}</div>
                        <div className="text-xs text-slate-500">Suppliers</div>
                    </div>
                    <div>
                        <div className="text-2xl font-light text-red-600">{highRiskCount}</div>
                        <div className="text-xs text-slate-500">High Risk</div>
                    </div>
                    <div>
                        <div className="text-2xl font-light text-slate-400">{unratedCount}</div>
                        <div className="text-xs text-slate-500">Unrated</div>
                    </div>
                </div>

                <RiskDistributionChart
                    distribution={distribution}
                    totalSuppliers={totalSuppliers}
                    onSegmentClick={onSegmentClick}
                    showPercentages={false}
                    compact
                />
            </div>
        );
    }

    // Standard variant
    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden ring-1 ring-black/[0.02]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-lg font-normal text-slate-900 tracking-tight">Your Risk Overview</span>
                {onExpandClick && (
                    <button
                        onClick={onExpandClick}
                        className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1 transition-colors"
                    >
                        Expand <ChevronRight size={14} strokeWidth={1.5} />
                    </button>
                )}
            </div>

            <div className="p-6">
                {/* Summary Metrics */}
                <div className="flex justify-between divide-x divide-slate-100 mb-8">
                    <div className="flex-1 text-center pr-4">
                        <div className="text-3xl font-light text-slate-900 tracking-tight">{totalSuppliers}</div>
                        <div className="text-[11px] uppercase tracking-wider font-normal text-slate-400 mt-1">Suppliers</div>
                    </div>
                    <div className="flex-1 text-center px-4">
                        <div className="text-3xl font-light text-slate-900 tracking-tight">{totalSpend}</div>
                        <div className="text-[11px] uppercase tracking-wider font-normal text-slate-400 mt-1">Total Spend</div>
                    </div>
                    <div className="flex-1 text-center px-4">
                        <div className="text-3xl font-light text-rose-600 tracking-tight">{highRiskCount}</div>
                        <div className="text-[11px] uppercase tracking-wider font-normal text-slate-400 mt-1">High Risk</div>
                    </div>
                    <div className="flex-1 text-center pl-4">
                        <div className="text-3xl font-light text-slate-400 tracking-tight">{unratedCount}</div>
                        <div className="text-[11px] uppercase tracking-wider font-normal text-slate-400 mt-1">Unrated</div>
                    </div>
                </div>

                {/* Distribution Chart */}
                <RiskDistributionChart
                    distribution={distribution}
                    totalSuppliers={totalSuppliers}
                    onSegmentClick={onSegmentClick}
                />
            </div>

            {/* Footer */}
            {onViewDetails && (
                <div className="px-6 py-4 border-t border-slate-50">
                    <button
                        onClick={onViewDetails}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all border border-dashed border-slate-200 hover:border-slate-300"
                    >
                        View Full Details
                        <ChevronRight size={16} strokeWidth={1.5} />
                    </button>
                </div>
            )}
        </div>
    );
};

// Minimal summary for conversation
export const PortfolioSummaryInline = ({
    totalSuppliers,
    highRiskCount,
    highestRiskSupplier,
    highestRiskScore,
}: {
    totalSuppliers: number;
    highRiskCount: number;
    highestRiskSupplier?: string;
    highestRiskScore?: number;
}) => {
    return (
        <div className="p-3.5 bg-slate-50/60 rounded-2xl">
            <div className="text-sm text-slate-700">
                You're monitoring <strong>{totalSuppliers} suppliers</strong>.
                {highRiskCount > 0 ? (
                    <>
                        {' '}<strong className="text-red-600">{highRiskCount}</strong> are high risk.
                        {highestRiskSupplier && (
                            <> Highest risk: <strong>{highestRiskSupplier}</strong> (SRS: {highestRiskScore}).</>
                        )}
                    </>
                ) : (
                    <> None are currently high risk.</>
                )}
            </div>
        </div>
    );
};