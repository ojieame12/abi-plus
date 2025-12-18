import { BarChart3, AlertTriangle, Info } from 'lucide-react';

interface BenchmarkData {
    metric: string;
    yours: number | string;
    industry: number | string;
    status: 'better' | 'worse' | 'similar';
    unit?: string;
}

interface BenchmarkCardProps {
    title?: string;
    benchmarks: BenchmarkData[];
    insight?: string;
    onAction?: () => void;
    actionLabel?: string;
}

export const BenchmarkCard = ({
    title = 'Industry Benchmark',
    benchmarks,
    insight,
    onAction,
    actionLabel,
}: BenchmarkCardProps) => {
    const getStatusConfig = (status: 'better' | 'worse' | 'similar') => {
        switch (status) {
            case 'better':
                return { color: 'text-green-600', bg: 'bg-green-50' };
            case 'worse':
                return { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle };
            case 'similar':
                return { color: 'text-slate-600', bg: 'bg-slate-50' };
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[1.25rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02]">
            <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-5">
                    <span className="text-xs font-normal text-[#1d1d1f] uppercase tracking-wider">{title}</span>
                    <BarChart3 size={16} strokeWidth={1.5} className="text-slate-400" />
                </div>

                {/* Comparison Table */}
                <div className="space-y-1">
                    {/* Header Row */}
                    <div className="grid grid-cols-3 gap-4 text-[10px] uppercase tracking-widest font-normal text-slate-400 pb-2 border-b border-slate-100/60">
                        <div>Metric</div>
                        <div className="text-center">You</div>
                        <div className="text-center">Industry</div>
                    </div>

                    {/* Data Rows */}
                    {benchmarks.map((benchmark, i) => {
                        const config = getStatusConfig(benchmark.status);
                        return (
                            <div key={i} className="grid grid-cols-3 gap-4 items-center py-2.5 border-b border-slate-50 last:border-0">
                                <div className="text-[13px] font-normal text-slate-700">{benchmark.metric}</div>
                                <div className={`text-center text-[13px] font-normal ${config.color}`}>
                                    {benchmark.yours}{benchmark.unit}
                                    {benchmark.status === 'worse' && (
                                        <AlertTriangle size={12} strokeWidth={1.5} className="inline ml-1.5 -mt-0.5 opacity-80" />
                                    )}
                                </div>
                                <div className="text-center text-[13px] text-slate-500 font-normal">
                                    {benchmark.industry}{benchmark.unit}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Insight */}
                {insight && (
                    <div className="mt-5 p-3.5 bg-violet-50/50 border border-violet-100/60 rounded-2xl flex items-start gap-2.5">
                        <Info size={14} strokeWidth={1.5} className="text-violet-600 mt-0.5 shrink-0" />
                        <span className="text-[12px] text-violet-900 leading-relaxed font-normal">{insight}</span>
                    </div>
                )}
            </div>

            {/* Action */}
            {onAction && actionLabel && (
                <div className="px-5 py-3.5 bg-slate-50/20 border-t border-slate-100/60">
                    <button
                        onClick={onAction}
                        className="w-full text-center text-[13px] font-normal text-violet-700 hover:text-violet-900 transition-colors"
                    >
                        {actionLabel}
                    </button>
                </div>
            )}
        </div>
    );
};

// Simple comparison row for inline use
export const BenchmarkRow = ({
    label,
    yours,
    industry,
    unit = '',
}: {
    label: string;
    yours: number | string;
    industry: number | string;
    unit?: string;
}) => {
    const yoursNum = typeof yours === 'number' ? yours : parseFloat(yours);
    const industryNum = typeof industry === 'number' ? industry : parseFloat(industry);
    const isWorse = !isNaN(yoursNum) && !isNaN(industryNum) && yoursNum > industryNum;

    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-600">{label}</span>
            <div className="flex items-center gap-4">
                <span className={`font-normal ${isWorse ? 'text-red-600' : 'text-slate-900'}`}>
                    {yours}{unit}
                </span>
                <span className="text-slate-400">vs</span>
                <span className="text-sm text-slate-500">{industry}{unit}</span>
            </div>
        </div>
    );
};
