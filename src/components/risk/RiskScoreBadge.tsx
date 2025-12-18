import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type RiskLevel = 'high' | 'medium-high' | 'medium' | 'low' | 'unrated';
type Trend = 'improving' | 'worsening' | 'stable';
type Size = 'sm' | 'md' | 'lg';

interface RiskScoreBadgeProps {
    score: number | null;
    level?: RiskLevel;
    trend?: Trend;
    size?: Size;
    showLabel?: boolean;
}

const getRiskLevel = (score: number | null): RiskLevel => {
    if (score === null) return 'unrated';
    if (score >= 75) return 'high';
    if (score >= 60) return 'medium-high';
    if (score >= 40) return 'medium';
    return 'low';
};

const getRiskConfig = (level: RiskLevel) => {
    switch (level) {
        case 'high':
            return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', label: 'High Risk' };
        case 'medium-high':
            return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Med-High' };
        case 'medium':
            return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Medium' };
        case 'low':
            return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Low Risk' };
        case 'unrated':
            return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Unrated' };
    }
};

const getSizeConfig = (size: Size) => {
    switch (size) {
        case 'sm':
            return { wrapper: 'px-2 py-0.5 gap-1.5', score: 'text-xs', label: 'text-[10px]', dot: 'w-1.5 h-1.5' };
        case 'md':
            return { wrapper: 'px-2.5 py-1 gap-2', score: 'text-sm', label: 'text-xs', dot: 'w-2 h-2' };
        case 'lg':
            return { wrapper: 'px-3.5 py-1.5 gap-2.5', score: 'text-base', label: 'text-sm', dot: 'w-2.5 h-2.5' };
    }
};

export const RiskScoreBadge = ({
    score,
    level,
    trend,
    size = 'md',
    showLabel = true
}: RiskScoreBadgeProps) => {
    const computedLevel = level || getRiskLevel(score);
    const config = getRiskConfig(computedLevel);
    const sizeConfig = getSizeConfig(size);

    return (
        <div className={`inline-flex items-center ${config.bg} ${config.border} border rounded-full ${sizeConfig.wrapper} shadow-sm`}>
            <span className={`${sizeConfig.dot} rounded-full ${config.dot}`} />
            <span className={`font-normal ${config.text} ${sizeConfig.score} tabular-nums`}>
                {score !== null ? score : '—'}
            </span>
            {showLabel && (
                <span className={`${config.text} ${sizeConfig.label} font-medium opacity-90`}>
                    {config.label}
                </span>
            )}
            {trend && (
                <TrendIcon trend={trend} className={`${config.text} ml-0.5 opacity-80`} size={size === 'sm' ? 12 : 14} />
            )}
        </div>
    );
};

const TrendIcon = ({ trend, className, size }: { trend: Trend; className?: string; size: number }) => {
    switch (trend) {
        case 'improving':
            return <TrendingDown className={className} size={size} />;
        case 'worsening':
            return <TrendingUp className={className} size={size} />;
        case 'stable':
            return <Minus className={className} size={size} />;
    }
};

// Large variant for detail views
interface RiskScoreCircleProps {
    score: number | null;
    level?: RiskLevel;
    trend?: Trend;
    lastUpdated?: string;
}

export const RiskScoreCircle = ({ score, level, trend, lastUpdated }: RiskScoreCircleProps) => {
    const computedLevel = level || getRiskLevel(score);
    const config = getRiskConfig(computedLevel);

    return (
        <div className="flex flex-col items-center">
            <div className={`w-28 h-28 rounded-full ${config.bg} ${config.border} border-4 flex flex-col items-center justify-center shadow-sm relative`}>
                 <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none opacity-20" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" className={config.text} />
                </svg>
                <span className={`text-4xl font-light ${config.text} tracking-tight`}>
                    {score !== null ? score : '—'}
                </span>
                <span className={`text-xs font-medium ${config.text} uppercase tracking-wider mt-1 opacity-80`}>
                    {config.label}
                </span>
            </div>
            {(trend || lastUpdated) && (
                <div className="mt-3 text-center">
                    {trend && (
                        <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600">
                            <TrendIcon trend={trend} className="text-slate-500" size={16} />
                            <span className="capitalize">{trend}</span>
                        </div>
                    )}
                    {lastUpdated && (
                        <div className="text-xs text-slate-400 mt-1">
                            Updated {lastUpdated}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};