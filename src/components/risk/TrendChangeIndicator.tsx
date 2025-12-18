import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

interface TrendChangeIndicatorProps {
    previousScore: number;
    currentScore: number;
    previousLevel?: string;
    currentLevel?: string;
    changeDate: string;
    variant?: 'inline' | 'card' | 'alert';
}

export const TrendChangeIndicator = ({
    previousScore,
    currentScore,
    previousLevel,
    currentLevel,
    changeDate,
    variant = 'inline',
}: TrendChangeIndicatorProps) => {
    const change = currentScore - previousScore;
    const isWorsening = change > 0; // Higher score = worse
    const isImproving = change < 0;
    const isStable = change === 0;

    const getChangeConfig = () => {
        if (isWorsening) {
            return {
                icon: TrendingUp,
                color: 'text-red-600',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                label: 'Increased',
            };
        }
        if (isImproving) {
            return {
                icon: TrendingDown,
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                label: 'Decreased',
            };
        }
        return {
            icon: Minus,
            color: 'text-slate-500',
            bgColor: 'bg-slate-50',
            borderColor: 'border-slate-200',
            label: 'Stable',
        };
    };

    const config = getChangeConfig();
    const Icon = config.icon;

    if (variant === 'inline') {
        return (
            <div className="flex items-center gap-2 text-[13px]">
                <span className="text-slate-500 font-normal">{previousScore}</span>
                <span className="text-slate-300">→</span>
                <span className="font-normal text-[#1d1d1f]">{currentScore}</span>
                <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-normal ${
                    change > 0 ? 'bg-red-50 text-red-700' :
                    change < 0 ? 'bg-green-50 text-green-700' :
                    'bg-slate-50 text-slate-600'
                }`}>
                    <Icon size={10} strokeWidth={1.5} />
                    {change > 0 ? '+' : ''}{change}
                </span>
            </div>
        );
    }

    if (variant === 'alert') {
        return (
            <div className="p-4 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <div className="font-normal text-[#1d1d1f] text-sm">
                            Risk Score {config.label}
                        </div>
                        <div className="flex items-center gap-2 text-[13px] mt-1">
                            <span className="text-slate-500">{previousScore}</span>
                            <span className="text-slate-300">→</span>
                            <span className="font-normal text-[#1d1d1f]">{currentScore}</span>
                            <span className={config.color}>
                                ({change > 0 ? '+' : ''}{change} points)
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-2 font-normal">
                            Changed: {changeDate}
                        </div>
                    </div>
                    <div className={`w-10 h-10 rounded-2xl ${config.bgColor} flex items-center justify-center shrink-0`}>
                        <Icon size={16} strokeWidth={1.5} className={config.color} />
                    </div>
                </div>
            </div>
        );
    }

    // Card variant
    return (
        <div className="p-5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] uppercase tracking-wider font-normal text-[#86868b]">Risk Score Trend</span>
                <Icon size={16} strokeWidth={1.5} className={config.color} />
            </div>
            <div className="flex items-baseline gap-3">
                <span className="text-3xl font-light text-[#1d1d1f] tracking-tight">{currentScore}</span>
                <span className={`text-sm font-normal ${config.color} px-2 py-0.5 rounded-md ${config.bgColor}`}>
                    {change > 0 ? '+' : ''}{change}
                </span>
            </div>
            <div className="text-[13px] text-slate-500 mt-2">
                from {previousScore}
            </div>
            {(previousLevel && currentLevel) && (
                <div className="text-[13px] text-[#1d1d1f] mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                    <span className="capitalize text-slate-500">{previousLevel}</span>
                    <span className="text-slate-300">→</span>
                    <span className="font-medium capitalize">{currentLevel}</span>
                </div>
            )}
            <div className="text-[11px] text-slate-400 mt-2 font-normal">
                Updated {changeDate}
            </div>
        </div>
    );
};

// Mini change alert for lists
interface RiskChangeAlertProps {
    supplierName: string;
    previousScore: number;
    currentScore: number;
    currentLevel: string;
    changeDate: string;
    onClick?: () => void;
}

export const RiskChangeAlert = ({
    supplierName,
    previousScore,
    currentScore,
    currentLevel,
    changeDate,
    onClick,
}: RiskChangeAlertProps) => {
    const change = currentScore - previousScore;
    const isWorsening = change > 0;
    const Icon = isWorsening ? TrendingUp : TrendingDown;
    const iconBg = isWorsening ? 'bg-red-50' : 'bg-green-50';
    const iconColor = isWorsening ? 'text-red-600' : 'text-green-600';

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between gap-4 p-4 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all text-left group ring-1 ring-black/[0.02]"
        >
            <div className="flex-1 min-w-0">
                <div className="font-normal text-[#1d1d1f] truncate text-sm">{supplierName}</div>
                <div className="text-[13px] text-slate-500 mt-0.5">
                    SRS: <span className="font-normal text-slate-700">{previousScore}</span> → <span className="font-normal text-[#1d1d1f]">{currentScore}</span>
                    <span className={`ml-2 text-[11px] font-normal px-1.5 py-0.5 rounded ${iconBg} ${iconColor}`}>
                        {change > 0 ? '+' : ''}{change}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-[11px] font-normal text-slate-400 shrink-0">
                    {changeDate}
                </div>
                <div className={`w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon size={18} strokeWidth={1.5} className={iconColor} />
                </div>
            </div>
        </button>
    );
};
