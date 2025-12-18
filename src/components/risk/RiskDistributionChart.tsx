interface RiskDistribution {
    high: number;
    mediumHigh: number;
    medium: number;
    low: number;
    unrated: number;
}

interface RiskDistributionChartProps {
    distribution: RiskDistribution;
    totalSuppliers: number;
    onSegmentClick?: (level: keyof RiskDistribution) => void;
    showPercentages?: boolean;
    compact?: boolean;
}

const segments: { key: keyof RiskDistribution; label: string; color: string; dotColor: string }[] = [
    { key: 'high', label: 'High Risk', color: 'bg-rose-500', dotColor: 'bg-rose-500' },
    { key: 'mediumHigh', label: 'Med-High', color: 'bg-orange-500', dotColor: 'bg-orange-500' },
    { key: 'medium', label: 'Medium', color: 'bg-amber-500', dotColor: 'bg-amber-500' },
    { key: 'low', label: 'Low Risk', color: 'bg-emerald-500', dotColor: 'bg-emerald-500' },
    { key: 'unrated', label: 'Unrated', color: 'bg-slate-300', dotColor: 'bg-slate-300' },
];

export const RiskDistributionChart = ({
    distribution,
    totalSuppliers,
    onSegmentClick,
    showPercentages = true,
    compact = false,
}: RiskDistributionChartProps) => {
    const maxCount = Math.max(...Object.values(distribution), 1);

    return (
        <div className={`${compact ? 'space-y-3' : 'space-y-4'}`}>
            {segments.map(({ key, label, color, dotColor }) => {
                const count = distribution[key];
                const percentage = totalSuppliers > 0 ? Math.round((count / totalSuppliers) * 100) : 0;
                // Min width 1% so it's visible if count > 0
                const barWidth = maxCount > 0 ? Math.max((count / maxCount) * 100, count > 0 ? 2 : 0) : 0;

                return (
                    <button
                        key={key}
                        onClick={() => onSegmentClick?.(key)}
                        disabled={!onSegmentClick || count === 0}
                        className={`w-full group ${onSegmentClick && count > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                        <div className={`flex items-center justify-between ${compact ? 'mb-1.5' : 'mb-2'}`}>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${dotColor} ${count === 0 ? 'opacity-50' : ''}`} />
                                <span className={`text-sm font-normal ${count > 0 ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {label}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`font-normal tabular-nums ${count > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                                    {count}
                                </span>
                                {showPercentages && (
                                    <span className="text-xs font-medium text-slate-400 w-9 text-right tabular-nums">
                                        {percentage}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={`w-full bg-slate-50 rounded-full overflow-hidden ${compact ? 'h-1.5' : 'h-2'}`}>
                            <div
                                className={`h-full ${color} rounded-full transition-all duration-500 ease-out ${
                                    onSegmentClick && count > 0 ? 'group-hover:opacity-80 group-hover:scale-[1.02]' : ''
                                }`}
                                style={{ width: `${barWidth}%` }}
                            />
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

// Compact inline version for widgets
export const RiskDistributionInline = ({
    distribution,
    totalSuppliers,
}: {
    distribution: RiskDistribution;
    totalSuppliers: number;
}) => {
    return (
        <div className="flex items-center gap-3">
            {segments.map(({ key, label, dotColor }) => {
                const count = distribution[key];
                if (count === 0) return null;

                return (
                    <div key={key} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span className="text-sm font-normal text-slate-700">{count}</span>
                    </div>
                );
            })}
            <span className="text-sm text-slate-400 font-normal">of {totalSuppliers}</span>
        </div>
    );
};
