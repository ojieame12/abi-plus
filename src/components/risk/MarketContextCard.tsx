import { Newspaper, AlertTriangle, TrendingUp, Globe, ExternalLink, type LucideIcon } from 'lucide-react';

interface MarketContextCardProps {
    sector: string;
    riskLevel: 'elevated' | 'moderate' | 'low';
    keyFactors: string[];
    exposedSuppliers: number;
    totalSpend: string;
    onViewReport?: () => void;
    onViewSuppliers?: () => void;
}

export const MarketContextCard = ({
    sector,
    riskLevel,
    keyFactors,
    exposedSuppliers,
    totalSpend,
    onViewReport,
    onViewSuppliers,
}: MarketContextCardProps) => {
    const getRiskConfig = (): { icon: LucideIcon; color: string; bg: string; badge: string } => {
        switch (riskLevel) {
            case 'elevated':
                return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' };
            case 'moderate':
                return { icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700' };
            case 'low':
                return { icon: Globe, color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' };
        }
    };

    const config = getRiskConfig();

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
            <div className="p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex-1">
                        <div className="font-normal text-slate-900">Market Context</div>
                        <div className="text-sm text-slate-500">{sector}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-normal capitalize ${config.badge}`}>
                            {riskLevel} Risk
                        </span>
                        <div className={`w-10 h-10 rounded-2xl ${config.bg} flex items-center justify-center`}>
                            <Newspaper size={20} strokeWidth={1.5} className={config.color} />
                        </div>
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="text-sm font-normal text-slate-600">Key Factors:</div>
                    <ul className="space-y-1.5">
                        {keyFactors.map((factor, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <span className="text-slate-400 mt-1">•</span>
                                <span>{factor}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex items-center gap-4 py-3 border-t border-slate-100">
                    <div>
                        <div className="text-xs text-slate-400">Your Exposure</div>
                        <div className="font-normal text-slate-900">{exposedSuppliers} suppliers</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">Combined Spend</div>
                        <div className="font-normal text-slate-900">{totalSpend}</div>
                    </div>
                </div>
            </div>

            <div className="flex border-t border-slate-100/60 divide-x divide-slate-100/60 bg-slate-50/20">
                <button
                    onClick={onViewReport}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-normal text-violet-600 hover:bg-violet-50/50 transition-colors"
                >
                    View Sector Report
                    <ExternalLink size={14} strokeWidth={1.5} />
                </button>
                <button
                    onClick={onViewSuppliers}
                    className="flex-1 py-3 text-sm font-normal text-slate-600 hover:bg-slate-50/50 transition-colors"
                >
                    See Affected Suppliers
                </button>
            </div>
        </div>
    );
};

// Compact inline version
export const MarketContextInline = ({
    sector,
    riskLevel,
    summary,
}: {
    sector: string;
    riskLevel: 'elevated' | 'moderate' | 'low';
    summary: string;
}) => {
    const color = riskLevel === 'elevated' ? 'text-amber-600' : riskLevel === 'moderate' ? 'text-yellow-600' : 'text-green-600';
    const bg = riskLevel === 'elevated' ? 'bg-amber-50' : riskLevel === 'moderate' ? 'bg-yellow-50' : 'bg-green-50';

    return (
        <div className={`p-3.5 rounded-2xl ${bg}`}>
            <div className="flex items-center gap-2 mb-1">
                <Globe size={14} strokeWidth={1.5} className={color} />
                <span className={`text-sm font-medium ${color}`}>{sector}</span>
            </div>
            <p className="text-sm text-slate-700">{summary}</p>
        </div>
    );
};